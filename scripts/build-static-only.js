#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building for static export (Firebase hosting)...');

// Path variables
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
const firebaseConfigPath = path.join(__dirname, '..', 'next.config.firebase.js');
const backupPath = path.join(__dirname, '..', 'next.config.backup.js');
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, '..', 'api.temp.bak');

let needsRestore = false;
let apiMoved = false;

try {
    // Read current config to check if it has static export enabled
    const currentConfig = fs.readFileSync(nextConfigPath, 'utf8');

    if (!currentConfig.includes('output: \'export\'')) {
        console.log('🔄 Switching to Firebase static export config...');

        // Backup current config
        fs.copyFileSync(nextConfigPath, backupPath);

        // Use Firebase config
        if (fs.existsSync(firebaseConfigPath)) {
            fs.copyFileSync(firebaseConfigPath, nextConfigPath);
        } else {
            // Create a minimal static export config
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
};

module.exports = nextConfig;
`;
            fs.writeFileSync(nextConfigPath, firebaseConfig);
        }
        needsRestore = true;
    }

    // Temporarily move API directory to exclude it from static export
    if (fs.existsSync(apiDir)) {
        console.log('📁 Temporarily excluding API routes for static export...');
        try {
            // Use PowerShell to move the directory on Windows
            execSync(`powershell -Command "Move-Item '${apiDir}' '${apiBackupDir}'"`, { stdio: 'pipe' });
            apiMoved = true;
            console.log('📁 API routes temporarily moved');
        } catch (error) {
            console.log('⚠️  Could not move API directory, continuing anyway...');
        }
    }

    // Build the application
    console.log('🏗️ Building application for static export...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('✅ Static build complete! Files are in the "out" directory.');
    console.log('🔥 Ready for Firebase deployment!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   firebase deploy --only hosting');
    console.log('   OR: npm run firebase:deploy');

} catch (buildError) {
    console.error('❌ Build failed:', buildError.message);

    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   - API routes cannot be used with static export');
    console.log('   - Consider using Vercel for full Next.js features: npm run vercel:deploy');
    console.log('   - For Firebase, only static pages and client-side features work');

    // Set flag for cleanup
    const buildFailed = true;
} finally {
    // Always restore API directory
    if (apiMoved && fs.existsSync(apiBackupDir)) {
        try {
            execSync(`powershell -Command "Move-Item '${apiBackupDir}' '${apiDir}'"`, { stdio: 'pipe' });
            console.log('📁 Restored API routes');
        } catch (error) {
            console.log('⚠️  Could not restore API directory automatically');
            console.log(`   Please manually rename '${apiBackupDir}' to '${apiDir}'`);
        }
    }

    // Always restore original config
    if (needsRestore && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, nextConfigPath);
        fs.unlinkSync(backupPath);
        console.log('🔄 Restored original configuration');
    }
}
