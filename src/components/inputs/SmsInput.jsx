import React from 'react';

export default function SmsInput({ phone, body, onChange, translations, lang }) {
  const t = translations[lang];
  return (
    <div className="form-grid">
      <div className="input-group col-span-2">
        <label htmlFor="input-sms-phone">{t.labelSmsPhone}</label>
        <input
          type="tel"
          id="input-sms-phone"
          placeholder={t.placeholderSmsPhone}
          value={phone}
          onChange={(e) => onChange('smsPhone', e.target.value)}
        />
      </div>
      <div className="input-group col-span-2">
        <label htmlFor="input-sms-body">{t.labelSmsBody}</label>
        <textarea
          id="input-sms-body"
          rows="3"
          placeholder={t.placeholderSmsBody}
          value={body}
          onChange={(e) => onChange('smsBody', e.target.value)}
        />
        <span className="input-tip">{t.tipSms}</span>
      </div>
    </div>
  );
}
