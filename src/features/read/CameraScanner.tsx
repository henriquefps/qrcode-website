import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraIcon, CameraSlashIcon, FlipHorizontalIcon, FlashlightIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detect, type DetectedCode } from '@/lib/decode';
import { startScanLoop, vibrate } from '@/lib/scanLoop';
import { drawHighlights } from './highlight';

type CameraError = 'denied' | 'none' | 'busy' | 'insecure' | 'unsupported' | 'unknown';

const ERROR_TEXT: Record<CameraError, { title: string; hint: string }> = {
  denied: { title: 'Camera access is blocked', hint: 'Allow the camera for this site in your browser settings, then try again. You can also open an image instead.' },
  none: { title: 'No camera found', hint: 'Connect a camera or open an image that contains a QR code.' },
  busy: { title: 'The camera is in use', hint: 'Another app or tab is using the camera. Close it and try again.' },
  insecure: { title: 'The camera needs a secure connection', hint: 'Open this page over HTTPS (or localhost) to use the camera.' },
  unsupported: { title: 'Camera not supported', hint: 'This browser cannot access a camera. Open an image instead.' },
  unknown: { title: 'Could not start the camera', hint: 'Try again, or open an image that contains a QR code.' },
};

function classify(error: unknown): CameraError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'none';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

interface CameraScannerProps {
  onDetect: (codes: DetectedCode[]) => void;
}

/** Live camera scanner. The stream is stopped on unmount, on leaving and when the tab is hidden. */
export function CameraScanner({ onDetect }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const onDetectRef = useRef(onDetect);
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [currentId, setCurrentId] = useState<string>('');
  const [mirror, setMirror] = useState(true);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torch, setTorch] = useState(false);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  // Stream lifecycle: starts when `active` (or the chosen device) changes, always stops in cleanup.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(window.isSecureContext ? 'unsupported' : 'insecure');
        setActive(false);
        return;
      }
      setStarting(true);
      setError(null);
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        const settings = track.getSettings();
        setCurrentId(settings.deviceId ?? '');
        // Webcams (user-facing) are mirrored by default; rear cameras are not.
        setMirror(settings.facingMode !== 'environment' && !/back|rear|environment/i.test(track.label));
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(Boolean(caps.torch));
        setTorch(false);
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'));
      } catch (e) {
        if (!cancelled) {
          setError(classify(e));
          setActive(false);
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
      trackRef.current = null;
    };
  }, [active, deviceId]);

  // Stop the camera as soon as the tab is hidden; the user resumes explicitly.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setActive((was) => {
          if (was) setPaused(true);
          return false;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Scan loop: requestAnimationFrame throttled to ~10 fps.
  useEffect(() => {
    if (!active) return;
    let handover = 0;
    const stop = startScanLoop<HTMLVideoElement>({
      getSource: () => {
        const video = videoRef.current;
        return video && video.readyState >= 2 && video.videoWidth > 0 ? video : null;
      },
      detect,
      onFrame: (codes) => {
        const canvas = overlayRef.current;
        const video = videoRef.current;
        if (canvas && video) drawHighlights(canvas, video, codes);
      },
      onFound: (codes) => {
        vibrate(50);
        // Brief pause so the highlight is visible, then hand over and release the camera.
        handover = window.setTimeout(() => {
          setActive(false);
          onDetectRef.current(codes);
        }, 350);
      },
    });
    return () => {
      stop();
      window.clearTimeout(handover);
    };
  }, [active]);

  const start = useCallback(() => {
    setPaused(false);
    setError(null);
    setActive(true);
  }, []);

  const toggleTorch = async (next: boolean) => {
    setTorch(next);
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
    } catch {
      setTorch(false);
    }
  };

  const errorText = error ? ERROR_TEXT[error] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted sm:aspect-video">
        <div className="absolute inset-0" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
          <video ref={videoRef} muted playsInline aria-label="Camera preview" className="size-full object-contain" />
          <canvas ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-primary" />
        </div>
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
            {errorText ? <WarningIcon className="size-8 text-destructive" aria-hidden="true" /> : <CameraIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            <div role={errorText ? 'alert' : undefined} className="flex max-w-sm flex-col gap-1">
              <p className="text-base font-semibold">{errorText ? errorText.title : paused ? 'Camera paused' : 'Scan with your camera'}</p>
              <p className="text-sm text-muted-foreground">
                {errorText ? errorText.hint : paused ? 'The camera was turned off because this tab was hidden.' : 'Point it at a QR code. Nothing leaves your device.'}
              </p>
            </div>
            {error !== 'insecure' && error !== 'unsupported' && (
              <Button onClick={start} disabled={starting}>
                <CameraIcon data-icon="inline-start" />
                {errorText ? 'Try again' : paused ? 'Resume camera' : 'Start camera'}
              </Button>
            )}
          </div>
        )}
        {active && starting && <p className="absolute inset-x-0 bottom-3 text-center text-sm text-muted-foreground">Starting camera…</p>}
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-2">
          {devices.length > 1 && (
            <Select value={deviceId ?? currentId} onValueChange={setDeviceId}>
              <SelectTrigger aria-label="Camera" className="min-w-0 flex-1 sm:max-w-xs sm:flex-none">
                <SelectValue placeholder="Camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d, i) => (
                  <SelectItem key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Toggle variant="outline" pressed={mirror} onPressedChange={setMirror} aria-label="Mirror preview">
            <FlipHorizontalIcon />
            Mirror
          </Toggle>
          {torchSupported && (
            <Toggle variant="outline" pressed={torch} onPressedChange={(v) => void toggleTorch(v)} aria-label="Torch">
              <FlashlightIcon />
              Torch
            </Toggle>
          )}
          <Button variant="outline" onClick={() => setActive(false)} className="ml-auto">
            <CameraSlashIcon data-icon="inline-start" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}
