import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerModal({ isOpen, onClose, onScanSuccess, lang, translations }) {
  const t = translations[lang];
  const [resultText, setResultText] = useState('');
  const [isError, setIsError] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset states
    setResultText('');
    setIsError(false);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    let isSubscribed = true;

    // Initialize scanner
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-scanner-viewport');
        scannerRef.current = scanner;

        const handleSuccess = (decodedText) => {
          if (!isSubscribed) return;
          const successMsg = t.scanSuccessMsg || 'QR code detected!';
          setResultText(`${successMsg} → ${decodedText}`);

          // Stop scanner
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { });
          }

          // Trigger parent success handler
          onScanSuccess(decodedText);

          // Close modal after short delay
          setTimeout(() => {
            if (isSubscribed) onClose();
          }, 2200);
        };

        const handleError = () => {
          // ignore per-frame errors
        };

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 220, height: 220 } },
          handleSuccess,
          handleError
        );
      } catch (err) {
        if (isSubscribed) {
          setIsError(true);
          setResultText('Camera not available. Please allow camera access.');
        }
      }
    };

    startScanner();

    return () => {
      isSubscribed = false;
      document.body.style.overflow = '';
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="scanner-modal-overlay flex"
      role="dialog"
      aria-modal="true"
      aria-label="QR Code Scanner"
      onClick={onClose}
    >
      <div
        className="scanner-modal-box select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="scanner-modal-header">
          <h3>{t.scanModalTitle}</h3>
          <button
            className="scanner-close-btn"
            onClick={onClose}
            aria-label="Close scanner"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="scanner-subtitle">{t.scanModalSubtitle}</p>

        <div id="qr-scanner-viewport" className="qr-scanner-viewport relative overflow-hidden bg-slate-900 rounded-lg">
          <div className="scan-frame-corner tl"></div>
          <div className="scan-frame-corner tr"></div>
          <div className="scan-frame-corner bl"></div>
          <div className="scan-frame-corner br"></div>
          <div className="scan-laser"></div>
        </div>

        {resultText && (
          <div
            className="scanner-result-banner flex"
            style={{
              background: isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              borderColor: isError ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
              color: isError ? '#ef4444' : '#10b981'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" className="mr-2 flex-shrink-0">
              {isError ? (
                <>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </>
              ) : (
                <polyline points="20 6 9 17 4 12" />
              )}
            </svg>
            <span>{resultText}</span>
          </div>
        )}

        <p className="scanner-hint">{t.scanModalHint}</p>
      </div>
    </div>
  );
}
