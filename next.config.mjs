/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // optimizePackageImports rewrites barrel imports (e.g. `import { Sparkles }
  // from 'lucide-react'`) into deep per-icon imports at build time so only the
  // icons actually used end up in the client bundle. lucide-react ships ~1000
  // icons — we import ~30 — so this is a meaningful win even though
  // tree-shaking already removes most of them at the chunk level.
  experimental: {
    optimizePackageImports: ['lucide-react'],
    scrollRestoration: true,
  },
  // Keep native/Node-only DB + crypto packages out of the bundler so they run
  // as plain Node modules in route handlers / server components.
  serverExternalPackages: ['pg', 'bcryptjs'],
  // Brotli/Gzip on dynamic responses (Vercel CDN already handles static).
  compress: true,
  // Always strip "Powered by Next.js" header (tiny perf, plus avoids leaking
  // framework version).
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 60, 75],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Long-cache the hero photo + any other immutable public assets.
        // Filenames in public/ are user-controlled so this targets only the
        // ones we ship intentionally. Cache for 1 year + immutable.
        source: '/hero.jpg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
