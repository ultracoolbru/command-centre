import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

function getWeekRange(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - day); // Sunday
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        const date = req.nextUrl.searchParams.get('date');
        if (!userId || !date) {
            return NextResponse.json({ success: false, error: 'Missing userId or date' }, { status: 400 });
        }
        const { start, end } = getWeekRange(date);
        const client = await clientPromise;
        const db = client.db();
        const logs = await db.collection('HealthLog').find({
            userId,
            date: { $gte: start.toISOString(), $lte: end.toISOString() }
        }).sort({ date: 1 }).toArray();
        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching health logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch health logs' }, { status: 500 });
    }
}
