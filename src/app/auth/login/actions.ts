"use server";

import clientPromise from "@/lib/mongodb";
import { User } from "@/types/schemas";

interface ProfileCheckResult {
    success: boolean;
    isComplete: boolean;
    profile?: User;
    message?: string;
}

/**
 * Checks if a user's profile is considered "complete" based on business rules
 * Currently checking for: bio, timezone, firstName (basic profile completeness)
 */
export async function checkUserProfileCompleteness(uid: string): Promise<ProfileCheckResult> {
    try {
        if (!uid) {
            return { success: false, isComplete: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        const userDoc = await usersCollection.findOne({ _id: uid as any });

        if (!userDoc) {
            return {
                success: false,
                isComplete: false,
                message: "User profile not found in database."
            };
        }

        // Map MongoDB document to User schema format
        const profile: User = {
            id: userDoc._id.toString(),
            email: userDoc.email,
            isEmailVerified: userDoc.isEmailVerified || false,
            isActive: userDoc.isActive || true,
            role: userDoc.role || 'user',
            lastLogin: userDoc.lastLogin ? new Date(userDoc.lastLogin) : undefined,
            twoFactorEnabled: userDoc.twoFactorEnabled || false,
            twoFactorSecret: userDoc.twoFactorSecret,
            recoveryCodes: userDoc.recoveryCodes || [],
            telegramId: userDoc.telegramId,
            telegramUsername: userDoc.telegramUsername,
            telegramFirstName: userDoc.telegramFirstName,
            telegramLastName: userDoc.telegramLastName,
            emailNotificationsEnabled: userDoc.emailNotificationsEnabled !== false,
            displayName: userDoc.displayName,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            avatarUrl: userDoc.avatarUrl,
            bio: userDoc.bio,
            timezone: userDoc.timezone,
            createdAt: new Date(userDoc.createdAt),
            updatedAt: new Date(userDoc.updatedAt),
        };

        // Define what constitutes a "complete" profile
        // You can adjust these criteria based on your business requirements
        const isComplete = Boolean(
            profile.firstName &&
            profile.bio &&
            profile.timezone
        );

        return {
            success: true,
            isComplete,
            profile,
        };

    } catch (error) {
        console.error("Error in checkUserProfileCompleteness:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            isComplete: false,
            message: `Failed to check profile completeness: ${errorMessage}`
        };
    }
}

/**
 * Updates the lastLogin timestamp and email verification status for a user
 */
export async function updateUserLastLogin(
    uid: string,
    isEmailVerified?: boolean
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        // Prepare update data
        const updateData: any = {
            lastLogin: new Date(),
            updatedAt: new Date()
        };

        // If email verification status is provided, update it
        if (isEmailVerified !== undefined) {
            updateData.isEmailVerified = isEmailVerified;
        }

        await usersCollection.updateOne(
            { _id: uid as any },
            { $set: updateData }
        );

        return { success: true };

    } catch (error) {
        console.error("Error in updateUserLastLogin:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to update last login: ${errorMessage}`
        };
    }
}

/**
 * Gets user profile by UID
 */
export async function getUserProfile(uid: string): Promise<{ success: boolean; profile?: User; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        const userDoc = await usersCollection.findOne({ _id: uid as any });

        if (!userDoc) {
            return {
                success: false,
                message: "User profile not found in database."
            };
        }

        // Map MongoDB document to User schema format
        const profile: User = {
            id: userDoc._id.toString(),
            email: userDoc.email,
            isEmailVerified: userDoc.isEmailVerified || false,
            isActive: userDoc.isActive || true,
            role: userDoc.role || 'user',
            lastLogin: userDoc.lastLogin ? new Date(userDoc.lastLogin) : undefined,
            twoFactorEnabled: userDoc.twoFactorEnabled || false,
            twoFactorSecret: userDoc.twoFactorSecret,
            recoveryCodes: userDoc.recoveryCodes || [],
            telegramId: userDoc.telegramId,
            telegramUsername: userDoc.telegramUsername,
            telegramFirstName: userDoc.telegramFirstName,
            telegramLastName: userDoc.telegramLastName,
            emailNotificationsEnabled: userDoc.emailNotificationsEnabled !== false,
            displayName: userDoc.displayName,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            avatarUrl: userDoc.avatarUrl,
            bio: userDoc.bio,
            timezone: userDoc.timezone,
            createdAt: new Date(userDoc.createdAt),
            updatedAt: new Date(userDoc.updatedAt),
        };

        return {
            success: true,
            profile,
        };

    } catch (error) {
        console.error("Error in getUserProfile:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to get user profile: ${errorMessage}`
        };
    }
}
