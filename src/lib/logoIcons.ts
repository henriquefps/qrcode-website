// Logo icons: the curated set shown first in the Logo section, and the ids older presets used.

export interface CuratedIcon {
  id: string;
  label: string;
}

/** Pre-available icons (Lucide: ISC, Simple Icons: CC0 1.0). Their SVG is fetched from Iconify the first time one is chosen. */
export const CURATED_ICONS: readonly CuratedIcon[] = [
  { id: 'lucide:wifi', label: 'Wi-Fi' },
  { id: 'lucide:globe', label: 'Globe' },
  { id: 'lucide:mail', label: 'Email' },
  { id: 'lucide:phone', label: 'Phone' },
  { id: 'lucide:message-square', label: 'Message' },
  { id: 'lucide:map-pin', label: 'Location' },
  { id: 'lucide:calendar', label: 'Calendar' },
  { id: 'lucide:user-round', label: 'Contact' },
  { id: 'simple-icons:whatsapp', label: 'WhatsApp' },
  { id: 'simple-icons:instagram', label: 'Instagram' },
  { id: 'simple-icons:github', label: 'GitHub' },
  { id: 'simple-icons:facebook', label: 'Facebook' },
  { id: 'simple-icons:linkedin', label: 'LinkedIn' },
  { id: 'simple-icons:youtube', label: 'YouTube' },
  { id: 'simple-icons:telegram', label: 'Telegram' },
];

/** Logo ids of presets exported before icons came from Iconify. */
export const LEGACY_LOGO_IDS: Readonly<Record<string, string>> = {
  wifi: 'lucide:wifi',
  web: 'lucide:globe',
  whatsapp: 'simple-icons:whatsapp',
  email: 'lucide:mail',
  github: 'simple-icons:github',
  instagram: 'simple-icons:instagram',
};

/** Icon suggested for a content type. */
export const SUGGESTED_ICON = { wifi: 'lucide:wifi', email: 'lucide:mail', url: 'lucide:globe', whatsapp: 'simple-icons:whatsapp' } as const;

export interface CollectionCredit {
  name: string;
  author: string;
  license: string;
  licenseUrl: string;
  url: string;
}

/** Credits of the curated icons' collections, known without a network request. Other collections come from the Iconify API. */
export const CURATED_CREDITS: Readonly<Record<string, CollectionCredit>> = {
  lucide: { name: 'Lucide', author: 'Lucide Contributors', license: 'ISC', licenseUrl: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE', url: 'https://lucide.dev/' },
  'simple-icons': {
    name: 'Simple Icons',
    author: 'Simple Icons Collaborators',
    license: 'CC0 1.0',
    licenseUrl: 'https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md',
    url: 'https://simpleicons.org/',
  },
};
