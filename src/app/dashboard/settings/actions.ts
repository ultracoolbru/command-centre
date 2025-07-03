'use server';

// Settings actions for user preferences and API key management
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

// Helper function to validate user ID
function validateUserId(userId: string) {
    if (!userId || typeof userId !== 'string') {
        return { isValid: false, error: 'Invalid user ID' };
    }
    return { isValid: true };
}

// Encryption key for API keys (in production, this should be in environment variables)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || 'Xr5BfHxVxg4vCCBVLI2rlbBnKAbLDMGc';

// Helper function to encrypt sensitive data
function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
    };
}

// Helper function to decrypt sensitive data
function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

interface UserSettings {
    language: string;
    theme: string;
    voiceLanguage: string;
    notifications: {
        email: boolean;
        push: boolean;
        dailyReminders: boolean;
        aiInsights: boolean;
    };
    privacy: {
        shareData: boolean;
        analytics: boolean;
    };
    ai: {
        defaultProvider: string;
        enableContextMemory: boolean;
        maxContextLength: number;
    };
}

interface ApiKeyData {
    name: string;
    keyType: 'openai' | 'gemini' | 'anthropic' | 'other';
    apiKey: string;
}

interface ApiKey {
    id: string;
    name: string;
    keyType: 'openai' | 'gemini' | 'anthropic' | 'other';
    createdAt: string;
    lastUsed?: string;
}

// Get user settings
export async function getSettings(userId: string) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const settingsCollection = db.collection('Settings');

        const settings = await settingsCollection.findOne({ userId: userId });

        if (!settings) {
            // Return default settings if none exist
            const defaultSettings: UserSettings = {
                language: 'en',
                theme: 'light',
                voiceLanguage: 'en-US',
                notifications: {
                    email: true,
                    push: true,
                    dailyReminders: true,
                    aiInsights: true,
                },
                privacy: {
                    shareData: false,
                    analytics: true,
                },
                ai: {
                    defaultProvider: 'gemini',
                    enableContextMemory: true,
                    maxContextLength: 4000,
                },
            };
            return { success: true, settings: defaultSettings };
        }

        // Remove MongoDB internal fields
        const { _id, userId: _, ...userSettings } = settings;
        return { success: true, settings: userSettings as UserSettings };
    } catch (error) {
        console.error('Error getting user settings:', error);
        return { success: false, message: 'Failed to load settings' };
    }
}

// Update user settings
export async function updateSettings(userId: string, settings: UserSettings) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const settingsCollection = db.collection('Settings');

        await settingsCollection.updateOne(
            { userId: userId },
            {
                $set: {
                    ...settings,
                    updatedAt: new Date().toISOString(),
                    userId: userId
                }
            },
            { upsert: true }
        );

        console.log(`Settings updated for user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating user settings:', error);
        return { success: false, message: 'Failed to save settings' };
    }
}

// Get user API keys
export async function getUserApiKeys(userId: string) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const apiKeysCollection = db.collection('ApiKeys');

        const apiKeyDocs = await apiKeysCollection
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .toArray();

        const apiKeys: ApiKey[] = apiKeyDocs.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            keyType: doc.keyType,
            createdAt: doc.createdAt,
            lastUsed: doc.lastUsed,
        }));

        return { success: true, apiKeys };
    } catch (error) {
        console.error('Error getting user API keys:', error);
        return { success: false, message: 'Failed to load API keys' };
    }
}

// Save API key
export async function saveApiKey(userId: string, apiKeyData: ApiKeyData) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        // Encrypt the API key
        const encryptedApiKey = encrypt(apiKeyData.apiKey);

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const apiKeysCollection = db.collection('ApiKeys');

        const apiKeyDoc = {
            name: apiKeyData.name,
            keyType: apiKeyData.keyType,
            encryptedKey: encryptedApiKey,
            createdAt: new Date().toISOString(),
            userId: userId,
        };

        const result = await apiKeysCollection.insertOne(apiKeyDoc);

        const newApiKey: ApiKey = {
            id: result.insertedId.toString(),
            name: apiKeyData.name,
            keyType: apiKeyData.keyType,
            createdAt: apiKeyDoc.createdAt,
        };

        console.log(`API key saved for user ${userId}: ${apiKeyData.name}`);
        return { success: true, apiKey: newApiKey };
    } catch (error) {
        console.error('Error saving API key:', error);
        return { success: false, message: 'Failed to save API key' };
    }
}

// Delete API key
export async function deleteApiKey(userId: string, keyId: string) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const apiKeysCollection = db.collection('ApiKeys');

        // Verify the API key exists and belongs to the user
        const apiKeyDoc = await apiKeysCollection.findOne({
            _id: new ObjectId(keyId),
            userId: userId
        });

        if (!apiKeyDoc) {
            return { success: false, message: 'API key not found or unauthorized' };
        }

        await apiKeysCollection.deleteOne({
            _id: new ObjectId(keyId),
            userId: userId
        });

        console.log(`API key deleted for user ${userId}: ${keyId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting API key:', error);
        return { success: false, message: 'Failed to delete API key' };
    }
}

// Get decrypted API key (for internal use)
export async function getDecryptedApiKey(userId: string, keyId: string) {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const apiKeysCollection = db.collection('ApiKeys');

        const apiKeyDoc = await apiKeysCollection.findOne({
            _id: new ObjectId(keyId),
            userId: userId
        });

        if (!apiKeyDoc) {
            return { success: false, message: 'API key not found or unauthorized' };
        }

        // Decrypt the API key
        const decryptedKey = decrypt(apiKeyDoc.encryptedKey);

        // Update last used timestamp
        await apiKeysCollection.updateOne(
            { _id: new ObjectId(keyId), userId: userId },
            { $set: { lastUsed: new Date().toISOString() } }
        );

        return {
            success: true,
            apiKey: decryptedKey,
            keyType: apiKeyDoc.keyType,
            name: apiKeyDoc.name
        };
    } catch (error) {
        console.error('Error getting decrypted API key:', error);
        return { success: false, message: 'Failed to retrieve API key' };
    }
}

// Get API keys by provider (for internal use)
export async function getApiKeysByProvider(userId: string, provider: 'openai' | 'gemini' | 'anthropic' | 'other') {
    try {
        const validation = validateUserId(userId);
        if (!validation.isValid) {
            return { success: false, message: validation.error };
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'commandCentreDb0');
        const apiKeysCollection = db.collection('ApiKeys');

        const apiKeyDocs = await apiKeysCollection
            .find({
                userId: userId,
                keyType: provider
            })
            .sort({ createdAt: -1 })
            .toArray();

        const apiKeys: Array<{ id: string; name: string; decryptedKey: string }> = [];

        for (const doc of apiKeyDocs) {
            try {
                const decryptedKey = decrypt(doc.encryptedKey);
                apiKeys.push({
                    id: doc._id.toString(),
                    name: doc.name,
                    decryptedKey,
                });
            } catch (decryptError) {
                console.error(`Error decrypting API key ${doc._id}:`, decryptError);
            }
        }

        return { success: true, apiKeys };
    } catch (error) {
        console.error('Error getting API keys by provider:', error);
        return { success: false, message: 'Failed to retrieve API keys' };
    }
}