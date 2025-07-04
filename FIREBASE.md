# Firebase Deployment Guide

## 📋 Available Firebase Scripts

Your `package.json` now includes these Firebase-specific scripts that work with the `out/` directory:

### Primary Firebase Scripts

```bash
npm run firebase:build           # Standard build (may fail due to Server Actions)
npm run firebase:deploy          # Full deployment workflow
npm run firebase:build:out       # Build specifically for out/ directory  
npm run firebase:serve:out       # Build and serve locally from out/
```

### Utility Scripts

```bash
npm run firebase:check:out       # Check if out/ directory exists
npm run firebase:clean:deploy    # Clean build and deploy
npm run out:verify               # Verify out/ directory has required files
npm run firebase:info            # Show Firebase limitations
```

### Alternative Approaches

```bash
npm run firebase:force:build     # Attempt static build (experimental)
npm run firebase:simple          # Simple static build approach
```

## ⚠️ Important Limitations

Your Command Centre app uses **Server Actions** and **API routes** which are **NOT compatible** with Firebase static hosting:

### Features That Won't Work on Firebase

- ❌ User authentication flows
- ❌ API routes (`/api/*`)
- ❌ Server Actions (form submissions, data mutations)
- ❌ Server-side rendering
- ❌ Database operations
- ❌ AI features (Gemini API calls)

### Features That Will Work on Firebase

- ✅ Static pages and components
- ✅ Client-side JavaScript
- ✅ CSS and styling
- ✅ Images and assets
- ✅ Client-side routing

## 🔥 Firebase Deployment Workflow

### Option 1: Full Deployment (Recommended for Vercel)

```bash
npm run vercel:deploy
```

### Option 2: Firebase Static Only (Limited Features)

```bash
# Check current status
npm run firebase:info

# Verify setup
npm run firebase:check:out

# Try to build (may fail)
npm run firebase:build:out

# If build succeeds, deploy
firebase deploy --only hosting

# Clean deploy (if needed)
npm run firebase:clean:deploy
```

## 🏗️ Build Output Structure

When builds succeed, files are output to:

```
out/
├── index.html          # Main page
├── _next/              # Next.js assets
│   ├── static/         # Static assets
│   └── ...
├── dashboard/          # Static dashboard pages
└── auth/               # Static auth pages (non-functional)
```

## 🚀 Recommended Approach

### For Full Features (Recommended)

```bash
npm run vercel:deploy
```

- ✅ All features work
- ✅ API routes functional
- ✅ Server Actions work
- ✅ Authentication works
- ✅ AI features work

### For Firebase (Static Only)

Your app would need significant refactoring to work as a static site:

1. Remove all Server Actions
2. Replace API routes with client-side API calls to external services
3. Use client-side authentication (Firebase Auth SDK)
4. Move all server logic to client-side or external APIs

## 🛠️ Troubleshooting

### Build Fails with "Server Actions not supported"

This is expected. Your app uses server-side features incompatible with static export.

**Solutions:**

1. Use Vercel: `npm run vercel:deploy`
2. Refactor app to be purely client-side
3. Use Firebase Functions (complex setup)

### Out Directory Empty

```bash
npm run firebase:check:out
npm run out:verify
```

### Clean Start

```bash
npm run clean:win
npm run firebase:info
```

## 📊 Deployment Comparison

| Platform | Server Actions | API Routes | Authentication | AI Features | Complexity |
|----------|---------------|------------|----------------|-------------|------------|
| **Vercel** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | Low |
| **Firebase Hosting** | ❌ None | ❌ None | ⚠️ Client-only | ❌ None | High |
| **Firebase Functions** | ✅ Custom | ✅ Custom | ✅ Custom | ✅ Custom | Very High |

## 🔧 Firebase Configuration

Your `firebase.json` is correctly configured:

```json
{
  "hosting": {
    "public": "out",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 📝 Summary

- **Firebase scripts are ready** and will output to `out/` directory
- **Your app is NOT compatible** with Firebase static hosting due to Server Actions
- **Vercel is recommended** for full functionality
- **Refactoring required** for Firebase compatibility

### Quick Commands

```bash
# Check what's possible
npm run firebase:info

# Full features (recommended)
npm run vercel:deploy

# Static attempt (will likely fail)
npm run firebase:build:out
```
