/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@retail/shared', '@retail/ui', '@retail/database'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
