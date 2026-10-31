import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fakhri Owner',
  manifest: '/owner/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Fakhri Owner', statusBarStyle: 'black' },
  icons: { icon: '/icons/owner-192.png', apple: '/icons/owner-180.png' },
};
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
