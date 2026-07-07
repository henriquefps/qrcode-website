export const PRESET_LOGOS = {
  wifi: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,

  web: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230d9488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,

  whatsapp: `/whatsapp.png`,

  email: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,

  github: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230f172a"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,

  instagram: `/instagram.png`
};

export function getQRDataString(activeTab, values) {
  switch (activeTab) {
    case 'url': {
      let url = values.url.trim();
      if (url === '') return 'https://example.com';
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
    }

    case 'text':
      return values.text || 'QRGo custom styled QR code!';

    case 'wifi': {
      const { wifiSsid: ssid, wifiPass: pass, wifiType: type, wifiHidden: hidden } = values;
      if (!ssid) {
        return 'WIFI:S:QRGo_Guest;T:WPA;P:;;';
      }
      return `WIFI:S:${ssid};T:${type};P:${pass};H:${hidden ? 'true' : 'false'};;`;
    }

    case 'email': {
      const to = values.emailTo.trim();
      if (!to) return 'mailto:hello@company.com';
      return `mailto:${to}?subject=${encodeURIComponent(values.emailSub)}&body=${encodeURIComponent(values.emailBody)}`;
    }

    case 'sms': {
      const phone = values.smsPhone.trim();
      if (!phone) return 'SMSTO:';
      return `SMSTO:${phone}:${values.smsBody}`;
    }

    case 'vcard': {
      const first = values.vcardFirst.trim();
      const last = values.vcardLast.trim();
      const company = values.vcardCompany.trim();
      const title = values.vcardTitle.trim();
      const cell = values.vcardPhone.trim();
      const mail = values.vcardEmail.trim();
      const website = values.vcardUrl.trim();

      if (!first && !last) {
        return 'BEGIN:VCARD\nVERSION:3.0\nFN:QRGo User\nEND:VCARD';
      }

      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
      vcard += `N:${last};${first};;;\n`;
      vcard += `FN:${first} ${last}\n`;
      if (company) vcard += `ORG:${company}\n`;
      if (title) vcard += `TITLE:${title}\n`;
      if (cell) vcard += `TEL;TYPE=CELL:${cell}\n`;
      if (mail) vcard += `EMAIL;TYPE=WORK,INTERNET:${mail}\n`;
      if (website) vcard += `URL:${website}\n`;
      vcard += 'END:VCARD';
      return vcard;
    }

    default:
      return 'https://example.com';
  }
}
