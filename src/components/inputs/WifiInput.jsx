import React from 'react';

export default function WifiInput({ ssid, pass, type, hidden, onChange, translations, lang }) {
  const t = translations[lang];
  return (
    <div className="form-grid">
      <div className="input-group col-span-2">
        <label htmlFor="input-wifi-ssid">{t.labelSsid}</label>
        <input
          type="text"
          id="input-wifi-ssid"
          placeholder={t.placeholderSsid}
          value={ssid}
          onChange={(e) => onChange('wifiSsid', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-wifi-pass">{t.labelPass}</label>
        <input
          type="password"
          id="input-wifi-pass"
          placeholder={t.placeholderPass}
          value={pass}
          onChange={(e) => onChange('wifiPass', e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="input-wifi-type">{t.labelSecurity}</label>
        <select
          id="input-wifi-type"
          value={type}
          onChange={(e) => onChange('wifiType', e.target.value)}
        >
          <option value="WPA">{t.securityWpa}</option>
          <option value="WEP">{t.securityWep}</option>
          <option value="nopass">{t.securityOpen}</option>
        </select>
      </div>
      <div className="checkbox-group col-span-2">
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="input-wifi-hidden"
            checked={hidden}
            onChange={(e) => onChange('wifiHidden', e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="checkbox-label">{t.labelHidden}</span>
      </div>
    </div>
  );
}
