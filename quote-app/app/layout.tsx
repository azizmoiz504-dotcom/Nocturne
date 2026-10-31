import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fakhri Quote',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#084767' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
