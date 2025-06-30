# Firebase Email Verification Setup Guide

## Common Issues and Solutions

### 1. Firebase Console Configuration

**CRITICAL: You must configure your email verification template in Firebase Console:**

1. Go to Firebase Console → Authentication → Templates
2. Click on "Email address verification"
3. Set the Action URL to: `https://yourdomain.com/auth/action` (or `http://localhost:3001/auth/action` for development)
4. Make sure "Customize action URL" is checked
5. Save the template

### 2. Authorized Domains

**Make sure your domain is authorized:**

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `yourdomain.com`)
3. For development, `localhost` should already be there

### 3. Development vs Production URLs

- **Development**: Use `http://localhost:3001/auth/action`
- **Production**: Use `https://yourdomain.com/auth/action`

### 4. Common Error Causes

- **"Invalid Action"**: Usually means the action URL in Firebase Console doesn't match your actual URL
- **Expired links**: Firebase email verification links expire after 1 hour
- **Already used links**: Each verification link can only be used once
- **Wrong domain**: The link domain doesn't match your authorized domains

### 5. Testing Steps

1. Register a new user
2. Check the email verification link received
3. Verify the URL format matches: `https://[your-auth-domain]/auth/action?mode=verifyEmail&oobCode=...`
4. If the domain in the email doesn't match your app, update Firebase Console settings

### 6. Environment Variables

Make sure these are set correctly in your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

The `FIREBASE_AUTH_DOMAIN` should match what's configured in Firebase Console.
