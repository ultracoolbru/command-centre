/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/action',
        destination: '/auth/action',
      },
    ];
  },
  // Add any other necessary configurations here
};

module.exports = nextConfig;
