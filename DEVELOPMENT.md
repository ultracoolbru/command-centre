# Development Scripts Guide

This document explains all the npm scripts available in your Command Centre project and how to use them effectively.

## 🚀 Quick Start

### Development

```bash
npm run dev          # Start development server
```

### Testing

```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Deployment

```bash
npm run firebase:deploy   # Deploy to Firebase (static)
npm run vercel:deploy     # Deploy to Vercel (full features)
```

## 📋 Complete Scripts Reference

### Core Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts development server on <http://localhost:3000> |
| `npm run build` | Creates production build for SSR deployment |
| `npm start` | Starts production server (requires build first) |
| `npm run preview` | Builds and starts production server in one command |

### Testing Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Runs all tests once |
| `npm run test:watch` | Runs tests in watch mode (re-runs on changes) |
| `npm run test:coverage` | Runs tests and generates coverage report |

### Code Quality Scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Checks code for linting errors |
| `npm run lint:fix` | Automatically fixes linting errors |
| `npm run type-check` | Checks TypeScript types |
| `npm run type-check:watch` | Type checking in watch mode |
| `npm run format` | Formats code using Prettier |
| `npm run format:check` | Checks if code is properly formatted |
| `npm run health` | Runs lint + type-check + tests (full health check) |

### Firebase Deployment Scripts ⚠️ Static Only

> **Important**: Firebase hosting only supports static sites. API routes will be disabled.

| Script | Description |
|--------|-------------|
| `npm run firebase:build` | Builds app for static export (outputs to `out/`) |
| `npm run firebase:deploy` | Builds and deploys to Firebase hosting |
| `npm run firebase:deploy:full` | Deploys all Firebase services |
| `npm run firebase:preview` | Builds and serves locally using Firebase |
| `npm run firebase:emulator` | Starts Firebase emulators |
| `npm run prepare:firebase` | Health check + build for Firebase |
| `npm run quick:firebase` | Quick clean + deploy (skip health checks) |

### Vercel Deployment Scripts ✅ Full Features

> **Recommended**: Vercel supports full Next.js features including API routes.

| Script | Description |
|--------|-------------|
| `npm run vercel:deploy` | Builds and deploys to Vercel production |
| `npm run vercel:preview` | Builds and deploys to Vercel preview |
| `npm run prepare:vercel` | Health check + build for Vercel |
| `npm run quick:vercel` | Quick clean + deploy to Vercel |

### Static Export Scripts

| Script | Description |
|--------|-------------|
| `npm run build:static` | Creates static export with config management |
| `npm run build:static-only` | Static export without permanent config changes |
| `npm run export` | Next.js native export (requires manual config) |
| `npm run serve:out` | Serves the `out/` directory locally |

### Cleaning & Maintenance Scripts

| Script | Description |
|--------|-------------|
| `npm run clean` | Removes build directories (.next, out, dist) |
| `npm run clean:win` | Windows-specific cleaning |
| `npm run clean:all` | Clean build dirs + reinstall dependencies |
| `npm run clean:deps` | Remove node_modules + reinstall |
| `npm run reset` | Complete reset: clean + health check |

### Analysis & Dependency Scripts

| Script | Description |
|--------|-------------|
| `npm run analyze` | Analyze bundle size for SSR build |
| `npm run build:analyze` | Analyze bundle size for static build |
| `npm run deps:update` | Update dependencies and fix security issues |
| `npm run deps:check` | Check for outdated dependencies |

### Configuration Management

| Script | Description |
|--------|-------------|
| `npm run restore:dev` | Restore development config after Firebase build |

## 🔥 Common Workflows

### Deploy to Firebase (Static Only)

```bash
# Full preparation (recommended)
npm run prepare:firebase

# Quick deployment (if everything is working)
npm run quick:firebase

# Manual steps
npm run firebase:build
firebase deploy --only hosting
```

### Deploy to Vercel (Full Features)

```bash
# Full preparation (recommended)
npm run prepare:vercel

# Quick deployment
npm run quick:vercel

# Manual steps
npm run build
vercel --prod
```

### Development Workflow

```bash
# Terminal 1: Development server
npm run dev

# Terminal 2: Test runner
npm run test:watch

# Terminal 3: Type checking
npm run type-check:watch
```

### Clean Start After Issues

```bash
npm run reset
```

### Check Code Quality

```bash
npm run health
```

### Preview Static Build Locally

```bash
npm run firebase:build
npm run serve:out
# Opens on http://localhost:3000
```

## 🏗️ Build Output Directories

| Build Type | Output Directory | Description |
|------------|------------------|-------------|
| Development | `.next/` | Development build cache |
| Production (SSR) | `.next/` | Production build for server deployment |
| Static Export | `out/` | Static files for Firebase/CDN hosting |

## ⚠️ Important Notes

### Firebase vs Vercel

**Firebase Hosting** (Static Only):

- ✅ Fast global CDN
- ✅ Simple deployment
- ❌ No API routes
- ❌ No server-side features
- ❌ No authentication middleware

**Vercel** (Full Features):

- ✅ Full Next.js support
- ✅ API routes work
- ✅ Server-side rendering
- ✅ Authentication middleware
- ✅ Environment variables

### Configuration Files

- `next.config.js` - Main development configuration
- `next.config.firebase.js` - Static export configuration
- Scripts automatically switch between configs as needed

### Post-deployment

Firebase deployments automatically restore your development configuration via the `postfirebase:deploy` hook.

## 🛠️ Troubleshooting

### Build Fails

1. `npm run clean:all` - Clean everything and reinstall
2. `npm run type-check` - Check for TypeScript errors
3. `npm run lint` - Check for linting errors

### Firebase Deployment Issues

1. Check login: `firebase login`
2. Check project: `firebase projects:list`
3. Check `firebase.json` configuration
4. Remember: API routes don't work with Firebase static hosting

### Vercel Deployment Issues

1. Check login: `vercel login`
2. Link project: `vercel link`
3. Check environment variables in Vercel dashboard

### Dependencies Issues

```bash
npm run deps:check    # Check what's outdated
npm run deps:update   # Update and fix security issues
npm run clean:deps    # Nuclear option: reinstall everything
```

## 📊 Script Categories Summary

- **🏃 Quick Commands**: `dev`, `test`, `lint`
- **🏗️ Building**: `build`, `firebase:build`, `build:static`
- **🚀 Deployment**: `firebase:deploy`, `vercel:deploy`
- **🧹 Cleaning**: `clean`, `clean:all`, `reset`
- **🔍 Quality**: `health`, `type-check`, `format`
- **⚡ Quick Actions**: `quick:firebase`, `quick:vercel`
- **🔧 Maintenance**: `deps:update`, `restore:dev`
