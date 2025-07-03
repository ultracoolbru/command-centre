import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // You may want to validate the body here
        const { userId, ...healthData } = body;
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db();
        const result = await db.collection('HealthLog').insertOne({
            userId,
            ...healthData,
            createdAt: new Date()
        });
        return NextResponse.json({ success: true, insertedId: result.insertedId });
    } catch (error) {
        console.error('Error saving health log:', error);
        return NextResponse.json({ success: false, error: 'Failed to save health log' }, { status: 500 });
    }
}
