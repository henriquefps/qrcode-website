import React from 'react';

export default function TextInput({ value, onChange, translations, lang }) {
  const t = translations[lang];
  return (
    <div className="input-group">
      <label htmlFor="input-text">{t.labelText}</label>
      <textarea
        id="input-text"
        rows="4"
        placeholder={t.placeholderText}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="input-tip">{t.tipText}</span>
    </div>
  );
}
