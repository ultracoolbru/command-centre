#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring development configuration...');

const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
const backupPath = path.join(__dirname, '..', 'next.config.backup.js');

try {
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, nextConfigPath);
        fs.unlinkSync(backupPath);
        console.log('✅ Restored original next.config.js');
    } else {
        // Restore development config
        const devConfig = `/** @type {import('next').NextConfig} */
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
`;

        fs.writeFileSync(nextConfigPath, devConfig);
        console.log('✅ Development configuration restored');
    }

    console.log('🚀 Ready for development with: npm run dev');

} catch (error) {
    console.error('❌ Failed to restore configuration:', error.message);
    process.exit(1);
}
