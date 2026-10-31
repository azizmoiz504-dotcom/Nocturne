export const dynamic = 'force-static';
export function GET() {
  return Response.json(
    {
      id: '/quote',
      name: 'Fakhri Quote',
      short_name: 'Fakhri Quote',
      description: 'Make customer quotes for Fakhri Tools',
      start_url: '/quote',
      scope: '/quote',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#f4f5f7',
      theme_color: '#b91a20',
      icons: [
        { src: '/icons/quote-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/quote-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/quote-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'content-type': 'application/manifest+json' } },
  );
}
