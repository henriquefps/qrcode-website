import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

export default function LivePreview({
  qrData,
  styleConfig,
  lang,
  translations,
  onScanClick,
  onCopyClick
}) {
  const t = translations[lang];
  const containerRef = useRef(null);
  const qrCodeRef = useRef(null);
  const [activeGlow, setActiveGlow] = useState(false);
  const [pngResolution, setPngResolution] = useState('medium');

  // Helper to map styleConfig to qr-code-styling options
  const getQRStylingOptions = () => {
    const dotsOptions = {
      type: styleConfig.dotsType
    };

    if (styleConfig.fgType === 'gradient') {
      dotsOptions.gradient = {
        type: styleConfig.gradientType,
        rotation: (styleConfig.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: styleConfig.dotsColor },
          { offset: 1, color: styleConfig.dotsColorSecondary }
        ]
      };
    } else {
      dotsOptions.color = styleConfig.dotsColor;
      dotsOptions.gradient = null;
    }

    const cornersSquareOptions = {
      type: styleConfig.cornersSquareType,
      color: styleConfig.customCorners ? styleConfig.cornersSquareColor : styleConfig.dotsColor
    };

    const cornersDotOptions = {
      type: styleConfig.cornersDotType,
      color: styleConfig.customCorners ? styleConfig.cornersDotColor : styleConfig.dotsColor
    };

    const bgColor = styleConfig.bgTransparent ? 'transparent' : styleConfig.bgColor;

    return {
      width: 280,
      height: 280,
      type: 'canvas',
      data: qrData || 'https://example.com',
      margin: styleConfig.margin,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: styleConfig.ecLevel
      },
      backgroundOptions: {
        color: bgColor
      },
      dotsOptions: dotsOptions,
      cornersSquareOptions: cornersSquareOptions,
      cornersDotOptions: cornersDotOptions,
      image: styleConfig.logoFile || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: styleConfig.logoScale,
        margin: styleConfig.logoMargin ? 6 : 0
      }
    };
  };

  // Initialize qr-code-styling on mount
  useEffect(() => {
    if (containerRef.current && !qrCodeRef.current) {
      const options = getQRStylingOptions();
      const qrCode = new QRCodeStyling(options);
      containerRef.current.innerHTML = '';
      qrCode.append(containerRef.current);
      qrCodeRef.current = qrCode;
    }
  }, []);

  // Update qr-code-styling when qrData or styleConfig changes
  useEffect(() => {
    if (qrCodeRef.current) {
      const options = getQRStylingOptions();
      qrCodeRef.current.update(options);

      // Trigger purple glow visual feedback
      setActiveGlow(true);
      const timer = setTimeout(() => {
        setActiveGlow(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [qrData, styleConfig]);

  // Handle Downloads
  const downloadPng = async () => {
    if (qrCodeRef.current) {
      let size = 512;
      if (pngResolution === 'small') size = 256;
      else if (pngResolution === 'large') size = 1024;

      // Update resolution temporarily for export
      qrCodeRef.current.update({
        width: size,
        height: size
      });

      // Allow a brief moment for canvas updating
      await new Promise(resolve => setTimeout(resolve, 50));

      try {
        await qrCodeRef.current.download({
          name: 'qrgo-custom-qrcode',
          extension: 'png'
        });
      } catch (err) {
        console.error("Failed to download PNG:", err);
      } finally {
        // Restore screen preview resolution
        qrCodeRef.current.update({
          width: 280,
          height: 280
        });
      }
    }
  };

  const downloadSvg = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({
        name: 'qrgo-custom-qrcode',
        extension: 'svg'
      });
    }
  };

  return (
    <section className="preview-panel">
      <div className="preview-card card sticky-preview">
        <div className="preview-header select-none">
          <h3>{t.liveWorkspaceHeader}</h3>
          <span className="live-indicator">
            <span className="pulse-dot"></span>
            <span>{t.livePreviewIndicator}</span>
          </span>
        </div>

        {/* Canvas container with responsive sizing & ambient glow */}
        <div
          className={`qr-canvas-outer-frame transition-all duration-300 ${
            activeGlow ? 'scale-97 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.45)]' : ''
          }`}
        >
          <div className="qr-canvas-shadow-overlay"></div>
          <div
            ref={containerRef}
            id="canvas-container"
            className="canvas-container flex justify-center items-center"
          >
            {/* QR Code generated here via qr-code-styling */}
          </div>
        </div>

        {/* Visual feedback tip */}
        <div className="scanner-simulation select-none">
          <div className="scan-laser-line"></div>
          <div className="scan-info">
            <svg className="phone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <p>{t.scannerTipText}</p>
          </div>
        </div>

        {/* PNG Resolution Selector */}
        <div className="resolution-selector select-none">
          <span className="resolution-selector-title">{t.downloadResolutionLabel}</span>
          <div className="resolution-options">
            <button
              type="button"
              className={`resolution-btn ${pngResolution === 'small' ? 'active' : ''}`}
              onClick={() => setPngResolution('small')}
            >
              <span>{t.downloadSizeSmall}</span>
              <span className="size-desc">{t.downloadSizeSmallDesc}</span>
            </button>
            <button
              type="button"
              className={`resolution-btn ${pngResolution === 'medium' ? 'active' : ''}`}
              onClick={() => setPngResolution('medium')}
            >
              <span>{t.downloadSizeMedium}</span>
              <span className="size-desc">{t.downloadSizeMediumDesc}</span>
            </button>
            <button
              type="button"
              className={`resolution-btn ${pngResolution === 'large' ? 'active' : ''}`}
              onClick={() => setPngResolution('large')}
            >
              <span>{t.downloadSizeLarge}</span>
              <span className="size-desc">{t.downloadSizeLargeDesc}</span>
            </button>
          </div>
        </div>

        <div className="action-buttons-group select-none">
          <button className="btn btn-primary" id="btn-download-png" onClick={downloadPng} type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{t.btnDownloadPng}</span>
          </button>

          <button className="btn btn-secondary" id="btn-download-svg" onClick={downloadSvg} type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{t.btnDownloadSvg}</span>
          </button>

          <button className="btn btn-secondary" id="btn-scan-qr" onClick={onScanClick} type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <line x1="14" y1="14" x2="14" y2="14.01"></line>
              <line x1="18" y1="14" x2="18" y2="14.01"></line>
              <line x1="14" y1="18" x2="14" y2="18.01"></line>
              <line x1="18" y1="18" x2="18" y2="18.01"></line>
            </svg>
            <span>{t.btnScanQr}</span>
          </button>
        </div>

        <div className="share-row select-none">
          <button className="btn btn-text animate-pulse-slow" id="btn-copy-link" onClick={onCopyClick} type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{t.btnCopyContent}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
