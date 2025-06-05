import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Input validation middleware for API routes
export function validateInput(schema: z.ZodType<any, any>) {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    try {
      // Parse and validate the request body
      const body = await req.json();
      schema.parse(body);

      // Continue to the next middleware or handler
      return next();
    } catch (error) {
      // Return validation error
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors
          },
          { status: 400 }
        );
      }

      // Handle other errors
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}

// Sanitize HTML content to prevent XSS
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\w+/g, '');
}

// Validate and sanitize MongoDB queries to prevent injection
export function sanitizeMongoQuery(query: Record<string, any>): Record<string, any> {
  // Remove operators that could be used for injection
  const sanitized = { ...query };

  // Remove $ prefixed keys that could be used for MongoDB operator injection
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) {
      delete sanitized[key];
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeMongoQuery(sanitized[key]);
    }
  });

  return sanitized;
}

// Rate limiting helper
const ipRequests = new Map<string, { count: number, timestamp: number }>();

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or initialize request data for this IP
  const requestData = ipRequests.get(ip) || { count: 0, timestamp: now };

  // Reset if outside the current window
  if (requestData.timestamp < windowStart) {
    requestData.count = 0;
    requestData.timestamp = now;
  }

  // Increment request count
  requestData.count++;
  ipRequests.set(ip, requestData);

  // Clean up old entries periodically
  if (ipRequests.size > 10000) {
    for (const [key, data] of ipRequests.entries()) {
      if (data.timestamp < windowStart) {
        ipRequests.delete(key);
      }
    }
  }

  // Return true if under limit, false if rate limited
  return requestData.count <= limit;
}

// Validate environment variables
export function validateEnvVars(requiredVars: string[]): string[] {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}
