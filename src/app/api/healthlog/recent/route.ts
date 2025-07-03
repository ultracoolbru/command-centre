import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db();
        const logs = await db.collection('HealthLog')
            .find({ userId })
            .sort({ date: -1, createdAt: -1 })
            .limit(limit)
            .toArray();
        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching recent health logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch recent health logs' }, { status: 500 });
    }
}
