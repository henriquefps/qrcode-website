import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TextInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="input-text">Generic Text or Message</Label>
      <Textarea
        id="input-text"
        rows={4}
        placeholder="Type your text or custom message here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Plain text displayed directly to the user upon scanning.
      </p>
    </div>
  );
}
