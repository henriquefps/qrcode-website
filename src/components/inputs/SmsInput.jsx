import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SmsInput({ phone, body, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-sms-phone">Phone / Mobile Number</Label>
        <Input
          type="tel"
          id="input-sms-phone"
          placeholder="+1234567890"
          value={phone}
          onChange={(e) => onChange('smsPhone', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-sms-body">SMS Body Message (Optional)</Label>
        <Textarea
          id="input-sms-body"
          rows={3}
          placeholder="Hi! Let's connect."
          value={body}
          onChange={(e) => onChange('smsBody', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Scanning will launch the SMS app with this message prefilled.
        </p>
      </div>
    </div>
  );
}
