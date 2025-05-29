/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Disabled to allow SSR/ISR and fix dynamic route errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
