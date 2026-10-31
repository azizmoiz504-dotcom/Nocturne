export const dynamic = 'force-static';
export function GET() {
  return Response.json(
    {
      id: '/owner',
      name: 'Fakhri Owner',
      short_name: 'Fakhri Owner',
      description: 'Prices, profit and settings for Fakhri Tools',
      start_url: '/owner',
      scope: '/owner',
      display: 'standalone',
      orientation: 'any',
      background_color: '#f4f5f7',
      theme_color: '#0b2f45',
      icons: [
        { src: '/icons/owner-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/owner-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/owner-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'content-type': 'application/manifest+json' } },
  );
}
