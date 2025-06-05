import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { analyzeSentiment } from '@/lib/gemini';
import { auth } from '@/lib/firebase';

// Helper to get user ID from session
const getUserId = async () => {
  const session = await auth.currentUser;
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session.uid;
};

// Analyze sentiment of text using Gemini
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Analyze sentiment using Gemini
    const sentimentResult = await analyzeSentiment(text);

    return NextResponse.json({
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence
    });
  } catch (error) {
    console.error('Error in POST /api/gemini/sentiment:', error);
    let status = 500;
    if (error instanceof Error && error.message === 'Not authenticated') {
      status = 401;
    }
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status }
    );
  }
}
