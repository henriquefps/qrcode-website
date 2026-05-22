import React from 'react';

export default function MobileFABs({ onScanClick, lang, translations }) {
  const t = translations[lang];

  const handleScrollToQR = () => {
    const previewPanel = document.querySelector('.preview-panel');
    if (previewPanel) {
      previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mobile-fab-group select-none" id="mobile-fab-group">
      <button
        className="mobile-fab mobile-fab-scan"
        id="btn-fab-scan"
        onClick={onScanClick}
        aria-label="Scan QR Code"
        title={t.scanModalTitle || 'Scan QR Code'}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <line x1="14" y1="14" x2="14" y2="14.01" />
          <line x1="18" y1="14" x2="18" y2="14.01" />
          <line x1="14" y1="18" x2="14" y2="18.01" />
          <line x1="18" y1="18" x2="18" y2="18.01" />
        </svg>
      </button>

      <button
        className="mobile-fab mobile-fab-qr"
        id="btn-fab-qr"
        onClick={handleScrollToQR}
        aria-label="Scroll to QR Code"
        title="View QR Code"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6H6a2 2 0 0 0-2 2v2" />
          <path d="M16 6h2a2 2 0 0 1 2 2v2" />
          <path d="M8 18H6a2 2 0 0 1-2-2v-2" />
          <path d="M16 18h2a2 2 0 0 0 2-2v-2" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
    </div>
  );
}
