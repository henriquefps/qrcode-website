import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UrlInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="input-url">Website URL</Label>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground select-none">https://</span>
        <Input
          type="text"
          id="input-url"
          placeholder="example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Provide a fully qualified URL for scanners to redirect instantly.
      </p>
    </div>
  );
}
