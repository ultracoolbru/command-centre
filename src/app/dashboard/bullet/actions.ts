'use server';

import connectToMongoDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

export interface BulletEntry {
    _id?: string;
    id: string;
    userId: string;
    date: Date;
    title: string;
    content: string;
    type: 'task' | 'event' | 'note' | 'journal';
    status: 'pending' | 'completed' | 'migrated' | 'cancelled';
    mood?: 'positive' | 'neutral' | 'negative';
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    updatedAt: Date;
}

// Get all entries for a user
export async function getBulletEntries(userId: string): Promise<BulletEntry[]> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');
        const entries = await db
            .collection('BulletEntry')
            .find({ userId })
            .sort({ date: -1, createdAt: -1 })
            .toArray();

        return entries.map((entry: any) => ({
            ...entry,
            _id: entry._id.toString(),
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
        }));
    } catch (error) {
        console.error('Error fetching bullet entries:', error);
        throw new Error('Failed to fetch bullet journal entries');
    }
}

// Get entries for a specific date
export async function getBulletEntriesForDate(userId: string, date: Date): Promise<BulletEntry[]> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const entries = await db
            .collection('BulletEntry')
            .find({
                userId,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            })
            .sort({ createdAt: -1 })
            .toArray();

        return entries.map((entry: any) => ({
            ...entry,
            _id: entry._id.toString(),
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
        }));
    } catch (error) {
        console.error('Error fetching entries for date:', error);
        throw new Error('Failed to fetch entries for date');
    }
}

// Create a new bullet entry
export async function createBulletEntry(entryData: Omit<BulletEntry, '_id' | 'createdAt' | 'updatedAt'>): Promise<BulletEntry> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');
        const now = new Date();

        const entry = {
            ...entryData,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('BulletEntry').insertOne(entry);

        revalidatePath('/dashboard/bullet');

        return {
            ...entry,
            _id: result.insertedId.toString(),
        };
    } catch (error) {
        console.error('Error creating bullet entry:', error);
        throw new Error('Failed to create bullet journal entry');
    }
}

// Create multiple bullet entries (for rapid logging)
export async function createMultipleBulletEntries(entriesData: Omit<BulletEntry, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<BulletEntry[]> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');
        const now = new Date();

        const entries = entriesData.map(entry => ({
            ...entry,
            createdAt: now,
            updatedAt: now,
        }));

        const result = await db.collection('BulletEntry').insertMany(entries);

        revalidatePath('/dashboard/bullet');

        return entries.map((entry, index) => ({
            ...entry,
            _id: result.insertedIds[index].toString(),
        }));
    } catch (error) {
        console.error('Error creating multiple bullet entries:', error);
        throw new Error('Failed to create bullet journal entries');
    }
}

// Update a bullet entry
export async function updateBulletEntry(entryId: string, updates: Partial<BulletEntry>): Promise<BulletEntry> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');
        const now = new Date();

        const updateData = {
            ...updates,
            updatedAt: now,
        };

        // Remove _id from updates if present
        delete updateData._id;

        const result = await db.collection('BulletEntry').findOneAndUpdate(
            { _id: new ObjectId(entryId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            throw new Error('Entry not found');
        }

        revalidatePath('/dashboard/bullet');

        return {
            ...result,
            _id: result._id.toString(),
            date: new Date(result.date),
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt),
        } as BulletEntry;
    } catch (error) {
        console.error('Error updating bullet entry:', error);
        throw new Error('Failed to update bullet journal entry');
    }
}

// Delete a bullet entry
export async function deleteBulletEntry(entryId: string): Promise<boolean> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');

        const result = await db.collection('BulletEntry').deleteOne({
            _id: new ObjectId(entryId)
        });

        revalidatePath('/dashboard/bullet');

        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error deleting bullet entry:', error);
        throw new Error('Failed to delete bullet journal entry');
    }
}

// Toggle entry status (for tasks)
export async function toggleEntryStatus(entryId: string, currentStatus: string): Promise<BulletEntry> {
    try {
        const newStatus = currentStatus === 'pending' ? 'completed' :
            currentStatus === 'completed' ? 'pending' : currentStatus;

        return await updateBulletEntry(entryId, { status: newStatus as any });
    } catch (error) {
        console.error('Error toggling entry status:', error);
        throw new Error('Failed to update entry status');
    }
}

// Get entries for AI insights (journal entries from last week)
export async function getJournalEntriesForInsights(userId: string, fromDate: Date): Promise<BulletEntry[]> {
    try {
        const client = await connectToMongoDB;
        const db = client.db(process.env.MONGODB_DB || 'personal-dashboard');

        const entries = await db
            .collection('BulletEntry')
            .find({
                userId,
                type: 'journal',
                date: { $gte: fromDate }
            })
            .sort({ date: -1 })
            .toArray();

        return entries.map((entry: any) => ({
            ...entry,
            _id: entry._id.toString(),
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
        }));
    } catch (error) {
        console.error('Error fetching journal entries for insights:', error);
        throw new Error('Failed to fetch journal entries');
    }
}


