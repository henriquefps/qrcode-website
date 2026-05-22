import React from 'react';

export default function Footer({ lang, translations }) {
  const t = translations[lang];

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p dangerouslySetInnerHTML={{ __html: t.footerCredit }} />
        {/* <p className="tech-stack-info">{t.techStackInfo}</p> */}
        <p className="tech-stack-info flex gap-3 justify-center flex-wrap mt-1">
          <a
            href="https://www.flaticon.com/free-icons/whatsapp"
            title="whatsapp icons"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link text-[0.65rem] opacity-70"
          >
            WhatsApp icon by Freepik — Flaticon
          </a>
          <a
            href="https://www.flaticon.com/free-icons/instagram"
            title="instagram icons"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link text-[0.65rem] opacity-70"
          >
            Instagram icon by cobynecz — Flaticon
          </a>
        </p>
      </div>
    </footer>
  );
}
