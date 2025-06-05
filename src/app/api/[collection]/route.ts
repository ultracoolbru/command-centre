"use server";

import { NextResponse } from 'next/server';
import { Collection, Document, Filter, ObjectId, WithId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { generateContent, analyzeSentiment, generateInsights } from '@/lib/gemini';
import { auth } from '@/lib/firebase';

// Type definitions for request parameters
type RequestParams = {
  params: {
    collection: string;
    id?: string;  // For routes that include an ID
  };
};

type SearchParams = {
  limit?: string;
  skip?: string;
  [key: string]: string | undefined;
};

// Type guard to check if error is an instance of Error
const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

// Type for MongoDB document with _id
interface BaseDocument extends Document {
  _id: ObjectId;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to get user ID from session
const getUserId = async (req: Request): Promise<string> => {
  const session = await auth.currentUser;
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session.uid;
};

// Database collections
const getCollection = async <T extends BaseDocument>(
  collectionName: string
): Promise<Collection<WithId<T>>> => {
  if (!clientPromise) {
    throw new Error('MongoDB client is not initialized');
  }
  const client = await clientPromise;
  const db = client.db('command-dashboard');
  return db.collection(collectionName);
};

// API route handlers
export async function GET(req: Request, { params }: RequestParams): Promise<NextResponse> {
  try {
    const userId = await getUserId(req);
    const { collection } = params;
    const searchParams = new URL(req.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const dbCollection = await getCollection(collection);
    const data = await dbCollection
      .find({ userId } as Filter<Document>)
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error(`Error in GET /${params.collection}:`, error);
    const errorMessage = isError(error) ? error.message : 'An unknown error occurred';
    const statusCode = isError(error) && error.message === 'Not authenticated' ? 401 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function POST(req: Request, { params }: RequestParams): Promise<NextResponse> {
  try {
    const userId = await getUserId(req);
    const { collection } = params;
    const data = await req.json();

    // Add metadata
    const now = new Date();
    const documentWithMetadata = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now
    };

    const dbCollection = await getCollection(collection);
    const result = await dbCollection.insertOne(documentWithMetadata);

    return NextResponse.json({
      id: result.insertedId,
      ...documentWithMetadata
    });
  } catch (error: unknown) {
    console.error(`Error in POST /${params.collection}:`, error);
    const errorMessage = isError(error) ? error.message : 'Failed to create document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RequestParams): Promise<NextResponse> {
  try {
    const userId = await getUserId(req);
    const { collection } = params;
    const id = params.id;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    try {
      const objectId = new ObjectId(id);
      const dbCollection = await getCollection(collection);
      const result = await dbCollection.updateOne(
        { _id: objectId, userId } as Filter<Document>,
        { $set: { ...body, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Document not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error('Error updating document:', error);
      const errorMessage = isError(error) ? error.message : 'Failed to update document';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error(`Error in PUT /${params.collection}/${params.id}:`, error);
    const errorMessage = isError(error) ? error.message : 'Failed to update document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RequestParams): Promise<NextResponse> {
  try {
    const userId = await getUserId(req);
    const { collection } = params;
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    try {
      const objectId = new ObjectId(id);
      const dbCollection = await getCollection(collection);
      const result = await dbCollection.deleteOne({ _id: objectId, userId });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Document not found or not authorized' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error('Error deleting document:', error);
      const errorMessage = isError(error) ? error.message : 'Failed to delete document';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error(`Error in DELETE /${params.collection}/${params.id}:`, error);
    const errorMessage = isError(error) ? error.message : 'Failed to delete document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
