import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateWeeklyOverview } from '@/lib/gemini';
import { auth } from '@/lib/firebase';

// Helper to get user ID from session
const getUserId = async () => {
    const session = await auth.currentUser;
    if (!session) {
        throw new Error('Not authenticated');
    }
    return session.uid;
};

// Analyze Weekly Overview using Gemini
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

        // Analyze Weekly Overview using Gemini
        const weeklyOverview = await generateWeeklyOverview(text);

        return NextResponse.json({
            weeklyOverview
        });
    } catch (error) {
        console.error('Error in POST /api/gemini/weekly-overview:', error);
        let status = 500;
        if (error instanceof Error && error.message === 'Not authenticated') {
            status = 401;
        }
        return NextResponse.json(
            { error: 'Failed to analyze weekly overview' },
            { status }
        );
    }
}
