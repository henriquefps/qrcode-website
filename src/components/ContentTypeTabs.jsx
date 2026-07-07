import React from 'react';
import {
  ChatTextIcon,
  EnvelopeSimpleIcon,
  IdentificationCardIcon,
  LinkSimpleIcon,
  TextTIcon,
  WifiHighIcon
} from '@phosphor-icons/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
  { id: 'url', label: 'URL', Icon: LinkSimpleIcon },
  { id: 'text', label: 'Text', Icon: TextTIcon },
  { id: 'wifi', label: 'Wi-Fi', Icon: WifiHighIcon },
  { id: 'email', label: 'Email', Icon: EnvelopeSimpleIcon },
  { id: 'sms', label: 'SMS', Icon: ChatTextIcon },
  { id: 'vcard', label: 'vCard', Icon: IdentificationCardIcon }
];

export default function ContentTypeTabs({ activeTab, setActiveTab }) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 gap-1 group-data-horizontal/tabs:h-auto sm:grid-cols-6">
        {TABS.map(({ id, label, Icon }) => (
          <TabsTrigger key={id} value={id} className="min-w-0 gap-1.5 px-1 py-2">
            <Icon aria-hidden="true" />
            <span className="truncate">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
