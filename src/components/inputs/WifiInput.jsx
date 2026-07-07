import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function WifiInput({ ssid, pass, type, hidden, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="input-wifi-ssid">Network SSID (Name)</Label>
        <Input
          type="text"
          id="input-wifi-ssid"
          placeholder="My Home Network"
          value={ssid}
          onChange={(e) => onChange('wifiSsid', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-wifi-pass">Password</Label>
        <Input
          type="password"
          id="input-wifi-pass"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => onChange('wifiPass', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input-wifi-type">Security Mode</Label>
        <Select
          value={type}
          onValueChange={(val) => onChange('wifiType', val)}
          items={[
            { value: 'WPA', label: 'WPA/WPA2' },
            { value: 'WEP', label: 'WEP' },
            { value: 'nopass', label: 'Unsecured (Open)' }
          ]}
        >
          <SelectTrigger id="input-wifi-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">Unsecured (Open)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch
          id="input-wifi-hidden"
          checked={hidden}
          onCheckedChange={(checked) => onChange('wifiHidden', checked)}
        />
        <Label htmlFor="input-wifi-hidden">This is a hidden network SSID</Label>
      </div>
    </div>
  );
}
