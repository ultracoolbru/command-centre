#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Configuring Next.js for Firebase static export...');

// Backup original next.config.js
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
const backupPath = path.join(__dirname, '..', 'next.config.backup.js');

try {
    // Create backup
    if (fs.existsSync(nextConfigPath)) {
        fs.copyFileSync(nextConfigPath, backupPath);
        console.log('✅ Backed up original next.config.js');
    }

    // Create Firebase-optimized config
    const firebaseConfig = `/** @type {import('next').NextConfig} */
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
  // Disable features that don't work with static export
  // Note: API routes will not work with this configuration
};

module.exports = nextConfig;
`;

    fs.writeFileSync(nextConfigPath, firebaseConfig);
    console.log('✅ Created Firebase-optimized next.config.js');

    // Build the application
    console.log('🏗️ Building application for static export...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('✅ Build complete! Files are in the "out" directory.');
    console.log('⚠️  Note: API routes are disabled in static export mode.');
    console.log('📦 Ready for Firebase deployment with: firebase deploy --only hosting');

} catch (error) {
    console.error('❌ Build failed:', error.message);

    // Restore backup if build fails
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, nextConfigPath);
        fs.unlinkSync(backupPath);
        console.log('🔄 Restored original next.config.js');
    }

    process.exit(1);
}
