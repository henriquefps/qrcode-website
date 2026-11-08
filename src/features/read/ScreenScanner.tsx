import { useEffect, useRef, useState } from 'react';
import { MonitorIcon, StopIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { detect, type DetectedCode } from '@/lib/decode';
import { startScanLoop } from '@/lib/scanLoop';
import { timerFrames } from '@/lib/screenCapture';
import { drawHighlights } from './highlight';

interface ScreenScannerProps {
  onDetect: (codes: DetectedCode[]) => void;
}

type ScreenError = 'cancelled' | 'failed';

/**
 * Reads a QR code shown on this computer's screen (another window, a video call, a remote desktop).
 * The capture stays in the browser, is scanned like camera frames and stops on a result, on Stop,
 * when the user ends sharing from the browser bar, and when leaving this source.
 */
export function ScreenScanner({ onDetect }: ScreenScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const onDetectRef = useRef(onDetect);
  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<ScreenError | null>(null);

  // Always release the capture when the stream is replaced or the component unmounts.
  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    const track = stream.getVideoTracks()[0];
    const onEnded = () => setStream(null);
    track?.addEventListener('ended', onEnded);
    if (video) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
    let handover = 0;
    const stop = startScanLoop<HTMLVideoElement>({
      getSource: () => {
        const v = videoRef.current;
        return v && v.readyState >= 2 && v.videoWidth > 0 ? v : null;
      },
      detect,
      onFrame: (codes) => {
        if (overlayRef.current && videoRef.current) drawHighlights(overlayRef.current, videoRef.current, codes);
      },
      onFound: (codes) => {
        handover = window.setTimeout(() => {
          setStream(null);
          onDetectRef.current(codes);
        }, 250);
      },
      ...timerFrames,
    });
    return () => {
      stop();
      window.clearTimeout(handover);
      track?.removeEventListener('ended', onEnded);
      stream.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, [stream]);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const options = {
        video: { frameRate: { ideal: 10 } },
        audio: false,
        // Chromium hints: don't offer this tab itself, allow switching what is shared.
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
      } as DisplayMediaStreamOptions;
      setStream(await navigator.mediaDevices.getDisplayMedia(options));
    } catch (e) {
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? 'cancelled' : 'failed');
    } finally {
      setStarting(false);
    }
  };

  const active = stream !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
        <video ref={videoRef} muted playsInline aria-label="Shared screen preview" className="size-full object-contain" />
        <canvas ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-primary" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
            {error === 'failed' ? <WarningIcon className="size-8 text-destructive" aria-hidden="true" /> : <MonitorIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            <div role={error === 'failed' ? 'alert' : undefined} className="flex max-w-sm flex-col gap-1">
              <p className="text-base font-semibold">{error === 'failed' ? 'Could not capture the screen' : 'Read from your screen'}</p>
              <p className="text-sm text-muted-foreground">
                {error === 'cancelled'
                  ? 'Screen sharing was cancelled. Start again and pick the window that shows the code.'
                  : error === 'failed'
                    ? 'Your browser refused the capture. Check its screen recording permission, or take a screenshot and paste it.'
                    : 'Share the window or screen that shows a QR code. The capture stays on this device and stops as soon as a code is read.'}
              </p>
            </div>
            <Button onClick={() => void start()} disabled={starting}>
              <MonitorIcon data-icon="inline-start" />
              {starting ? 'Waiting for a choice…' : 'Choose screen or window'}
            </Button>
          </div>
        )}
      </div>
      {active && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
            Looking for a QR code… keep it visible on the shared screen.
          </p>
          <Button variant="outline" onClick={() => setStream(null)}>
            <StopIcon data-icon="inline-start" />
            Stop sharing
          </Button>
        </div>
      )}
    </div>
  );
}
