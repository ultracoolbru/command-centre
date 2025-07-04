/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    images: {
        unoptimized: true
    },
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Disable all server-side features for static export
    experimental: {
        serverActions: false,
    },
    // This configuration is for Firebase static hosting only
    // All server-side features will be disabled
};

module.exports = nextConfig;
