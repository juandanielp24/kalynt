/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@retail/shared', '@retail/ui', '@retail/database'],
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
