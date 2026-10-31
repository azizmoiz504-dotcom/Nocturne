import type { NextConfig } from 'next';

const config: NextConfig = {
  // this app lives in its own folder of a bigger repository
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  // files read at run time on the server (product list for first start, PDF fonts, default logo)
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/products.csv', './fonts/*.ttf', './public/logo.png'],
  },
  serverExternalPackages: ['pdf-lib', '@pdf-lib/fontkit'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};
export default config;
