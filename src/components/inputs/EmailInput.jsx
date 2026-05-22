import React from 'react';

export default function EmailInput({ to, sub, body, onChange, translations, lang }) {
  const t = translations[lang];
  return (
    <div className="form-grid">
      <div className="input-group col-span-2">
        <label htmlFor="input-email-to">{t.labelEmailTo}</label>
        <input
          type="email"
          id="input-email-to"
          placeholder={t.placeholderEmailTo}
          value={to}
          onChange={(e) => onChange('emailTo', e.target.value)}
        />
      </div>
      <div className="input-group col-span-2">
        <label htmlFor="input-email-sub">{t.labelEmailSub}</label>
        <input
          type="text"
          id="input-email-sub"
          placeholder={t.placeholderEmailSub}
          value={sub}
          onChange={(e) => onChange('emailSub', e.target.value)}
        />
      </div>
      <div className="input-group col-span-2">
        <label htmlFor="input-email-body">{t.labelEmailBody}</label>
        <textarea
          id="input-email-body"
          rows="3"
          placeholder={t.placeholderEmailBody}
          value={body}
          onChange={(e) => onChange('emailBody', e.target.value)}
        />
      </div>
    </div>
  );
}
