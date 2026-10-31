import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fakhri Quote',
  manifest: '/quote/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Fakhri Quote', statusBarStyle: 'default' },
  icons: { icon: '/icons/quote-192.png', apple: '/icons/quote-180.png' },
};
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
