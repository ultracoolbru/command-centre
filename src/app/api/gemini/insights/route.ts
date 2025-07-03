"use server";

import { generateInsights } from '@/lib/gemini';
import clientPromise from '@/lib/mongodb';
import { AIInsight } from '@/types/schemas';
import { NextRequest, NextResponse } from 'next/server';


// Generate AI insights based on user data
export async function POST(req: NextRequest) {
  try {
    // Extract userId from request body
    const { userId, category, data } = await req.json();
    console.log('Received insights request:', { userId, category, dataLength: data?.length });

    if (!userId || !category || !data) {
      console.error('Missing required fields:', { userId: !!userId, category: !!category, data: !!data });
      return NextResponse.json(
        { error: 'userId, category and data are required' },
        { status: 400 }
      );
    }

    // Generate insights using Gemini
    console.log('Generating insights for category:', category, 'with data:', data);
    const insights = await generateInsights(data, category);
    console.log('Generated insights:', insights);

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
