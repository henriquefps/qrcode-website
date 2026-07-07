import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  { key: 'vcardFirst', id: 'input-vcard-first', label: 'First Name', placeholder: 'Jane', type: 'text' },
  { key: 'vcardLast', id: 'input-vcard-last', label: 'Last Name', placeholder: 'Doe', type: 'text' },
  { key: 'vcardCompany', id: 'input-vcard-company', label: 'Company', placeholder: 'My Company', type: 'text' },
  { key: 'vcardTitle', id: 'input-vcard-title', label: 'Job Title', placeholder: 'Solutions Specialist', type: 'text' },
  { key: 'vcardPhone', id: 'input-vcard-phone', label: 'Mobile Phone', placeholder: '+351 912 345 678', type: 'tel' },
  { key: 'vcardEmail', id: 'input-vcard-email', label: 'Work Email', placeholder: 'email@company.com', type: 'email' }
];

export default function VcardInput({ first, last, company, title, phone, email, url, onChange }) {
  const values = {
    vcardFirst: first,
    vcardLast: last,
    vcardCompany: company,
    vcardTitle: title,
    vcardPhone: phone,
    vcardEmail: email
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={field.id}>{field.label}</Label>
          <Input
            type={field.type}
            id={field.id}
            placeholder={field.placeholder}
            value={values[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="input-vcard-url">Website URL</Label>
        <Input
          type="url"
          id="input-vcard-url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => onChange('vcardUrl', e.target.value)}
        />
      </div>
    </div>
  );
}
