"use server";

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateInsights } from '@/lib/gemini';
import { auth } from '@/lib/firebase';
import { AIInsight } from '@/types/schemas';

// Helper to get user ID from session
const getUserId = async () => {
  const session = await auth.currentUser;
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session.uid;
};

// Generate AI insights based on user data
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { category, data } = await req.json();

    if (!category || !data) {
      return NextResponse.json(
        { error: 'Category and data are required' },
        { status: 400 }
      );
    }

    // Generate insights using Gemini
    const insights = await generateInsights(data, category);

    // Store the insights in the database
    const client = await clientPromise;
    const db = client.db('command-dashboard');
    const collection = db.collection('aiInsights');

    const now = new Date();
    const insightsWithMetadata = insights.map((insight: AIInsight) => ({
      userId,
      category,
      title: insight.title,
      description: insight.description,
      date: now,
      createdAt: now,
      updatedAt: now
    }));

    if (insightsWithMetadata.length > 0) {
      await collection.insertMany(insightsWithMetadata);
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in POST /api/gemini/insights:', error);
    const status =
      error instanceof Error && error.message === 'Not authenticated'
        ? 401
        : 500;
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status }
    );
  }
}
