import React from 'react';

export default function Header({ lang, setLang, translations }) {
  const t = translations[lang];

  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="logo-area">
          <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <path d="M14 14h3v3h-3z"></path>
          </svg>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="lang-selector-wrapper">
          <select
            id="lang-selector"
            className="lang-select"
            aria-label="Select Language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="pt">🇧🇷 PT</option>
            <option value="es">🇪🇸 ES</option>
          </select>
        </div>
      </div>
      <p className="subtitle">{t.appSubtitle}</p>
    </header>
  );
}
