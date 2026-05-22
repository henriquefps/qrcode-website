import React from 'react';

export default function UrlInput({ value, onChange, translations, lang }) {
  const t = translations[lang];
  return (
    <div className="input-group">
      <label htmlFor="input-url">{t.labelUrl}</label>
      <div className="input-wrapper">
        <span className="input-prefix">https://</span>
        <input
          type="text"
          id="input-url"
          placeholder="example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className="input-tip">{t.tipUrl}</span>
    </div>
  );
}
