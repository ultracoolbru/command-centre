import { sanitizeHtml, sanitizeMongoQuery, rateLimit, validateEnvVars } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/firebase';

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

// Middleware to check environment variables on startup
export async function middleware(req: NextRequest) {
  // Validate environment variables
  const missingVars = validateEnvVars(requiredEnvVars);
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Rate limiting
  const ip = (await headers()).get('x-forwarded-for') || 'unknown';
  if (!rateLimit(ip, 100, 60 * 1000)) { // 100 requests per minute
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Continue to the handler
  return NextResponse.next();
}

// Helper to get user ID from session with security checks
export async function getSecureUserId() {
  const session = await auth.currentUser;
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Additional security checks could be added here
  // For example, checking if the user is banned, etc.

  return session.uid;
}

// Secure database collections with sanitization
export async function getSecureCollection(collectionName: string) {
  // Sanitize collection name to prevent injection
  const sanitizedName = collectionName.replace(/[^a-zA-Z0-9_]/g, '');

  if (sanitizedName !== collectionName) {
    throw new Error('Invalid collection name');
  }

  const client = await clientPromise;
  const db = client.db('command-dashboard');
  return db.collection(sanitizedName);
}

// Secure API route handlers with validation and sanitization
export async function secureGet(req: NextRequest, { params }: { params: { collection: string } }, schema: any) {
  try {
    const userId = await getSecureUserId();
    const { collection } = params;

    // Parse and sanitize query parameters
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const sanitizedParams = sanitizeMongoQuery(searchParams);

    const limit = parseInt(sanitizedParams.limit || '50');
    const skip = parseInt(sanitizedParams.skip || '0');

    // Ensure reasonable limits
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit too high' },
        { status: 400 }
      );
    }

    const dbCollection = await getSecureCollection(collection);
    const data = await dbCollection
      .find({ userId, ...sanitizeMongoQuery(sanitizedParams) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Error in secure GET /${params.collection}:`, error);
    let status = 500;
    if (error instanceof Error && error.message === 'Not authenticated') {
      status = 401;
    }
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status }
    );
  }
}

export async function securePost(req: NextRequest, { params }: { params: { collection: string } }, schema: any) {
  try {
    const userId = await getSecureUserId();
    const { collection } = params;

    // Validate request body against schema
    let data;
    try {
      const body = await req.json();
      if (schema) {
        data = schema.parse(body);
      } else {
        data = body;
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Sanitize any HTML content
    const sanitizedData = Object.entries(data).reduce<Record<string, any>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = sanitizeHtml(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Add metadata
    const now = new Date();
    const documentWithMetadata = {
      ...sanitizedData,
      userId,
      createdAt: now,
      updatedAt: now
    };

    const dbCollection = await getSecureCollection(collection);
    const result = await dbCollection.insertOne(documentWithMetadata);

    return NextResponse.json({
      id: result.insertedId,
      ...documentWithMetadata
    });
  } catch (error) {
    console.error(`Error in secure POST /${params.collection}:`, error);
    let status = 500;
    if (error instanceof Error && error.message === 'Not authenticated') {
      status = 401;
    }
    return NextResponse.json(
      { error: 'Failed to create data' },
      { status }
    );
  }
}
