import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EmailInput({ to, sub, body, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-email-to">To Email Address</Label>
        <Input
          type="email"
          id="input-email-to"
          placeholder="hello@company.com"
          value={to}
          onChange={(e) => onChange('emailTo', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-email-sub">Subject</Label>
        <Input
          type="text"
          id="input-email-sub"
          placeholder="Email subject"
          value={sub}
          onChange={(e) => onChange('emailSub', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-email-body">Email Body</Label>
        <Textarea
          id="input-email-body"
          rows={3}
          placeholder="Hello, I am interested in custom styled QR Codes..."
          value={body}
          onChange={(e) => onChange('emailBody', e.target.value)}
        />
      </div>
    </div>
  );
}
