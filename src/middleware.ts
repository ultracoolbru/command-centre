import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultRateLimiter } from '@/lib/rateLimit';

// Define paths that should be protected by rate limiting
const RATE_LIMITED_PATHS = ['/api/auth/'];

export default function middleware(request: NextRequest) {
  // Apply rate limiting to specific paths
  const { pathname } = request.nextUrl;

  if (RATE_LIMITED_PATHS.some(path => pathname.startsWith(path))) {
    const response = defaultRateLimiter(request);
    if (response) return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP Header - adjust based on your needs
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

// Specify which paths should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
