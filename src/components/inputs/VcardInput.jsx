import React from 'react';

export default function VcardInput({
  first,
  last,
  company,
  title,
  phone,
  email,
  url,
  onChange,
  translations,
  lang
}) {
  const t = translations[lang];
  return (
    <div className="form-grid">
      <div className="input-group">
        <label htmlFor="input-vcard-first">{t.labelFirst}</label>
        <input
          type="text"
          id="input-vcard-first"
          placeholder={t.placeholderFirst}
          value={first}
          onChange={(e) => onChange('vcardFirst', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-vcard-last">{t.labelLast}</label>
        <input
          type="text"
          id="input-vcard-last"
          placeholder={t.placeholderLast}
          value={last}
          onChange={(e) => onChange('vcardLast', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-vcard-company">{t.labelCompany}</label>
        <input
          type="text"
          id="input-vcard-company"
          placeholder={t.placeholderCompany}
          value={company}
          onChange={(e) => onChange('vcardCompany', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-vcard-title">{t.labelTitle}</label>
        <input
          type="text"
          id="input-vcard-title"
          placeholder={t.placeholderTitle}
          value={title}
          onChange={(e) => onChange('vcardTitle', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-vcard-phone">{t.labelPhone}</label>
        <input
          type="tel"
          id="input-vcard-phone"
          placeholder={t.placeholderPhone}
          value={phone}
          onChange={(e) => onChange('vcardPhone', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-vcard-email">{t.labelEmail}</label>
        <input
          type="email"
          id="input-vcard-email"
          placeholder={t.placeholderEmail}
          value={email}
          onChange={(e) => onChange('vcardEmail', e.target.value)}
        />
      </div>
      <div className="input-group col-span-2">
        <label htmlFor="input-vcard-url">{t.labelVcardUrl}</label>
        <input
          type="url"
          id="input-vcard-url"
          placeholder={t.placeholderVcardUrl}
          value={url}
          onChange={(e) => onChange('vcardUrl', e.target.value)}
        />
      </div>
    </div>
  );
}
