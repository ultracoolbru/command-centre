"use server";

import clientPromise from "@/lib/mongodb";

interface UpdateProfileParams {
    uid: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
    timezone?: string;
    emailNotificationsEnabled?: boolean;
    telegramId?: string;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramLastName?: string;
    avatarUrl?: string;
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<{ success: boolean; message?: string }> {
    try {
        const { uid, firstName, lastName, displayName, bio, timezone, emailNotificationsEnabled, telegramId, telegramUsername, telegramFirstName, telegramLastName, avatarUrl } = params;

        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        // Prepare update data - only include fields that are provided
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (emailNotificationsEnabled !== undefined) updateData.emailNotificationsEnabled = emailNotificationsEnabled;
        if (telegramId !== undefined) updateData.telegramId = telegramId;
        if (telegramUsername !== undefined) updateData.telegramUsername = telegramUsername;
        if (telegramFirstName !== undefined) updateData.telegramFirstName = telegramFirstName;
        if (telegramLastName !== undefined) updateData.telegramLastName = telegramLastName;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

        const result = await usersCollection.updateOne(
            { _id: uid as any },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found." };
        }

        return { success: true, message: "Profile updated successfully." };

    } catch (error) {
        console.error("Error in updateUserProfile:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to update profile: ${errorMessage}`
        };
    }
}

// Server action to update only the avatar URL
export async function updateUserAvatar(uid: string, avatarUrl: string | null): Promise<{ success: boolean; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (avatarUrl !== null) {
            updateData.avatarUrl = avatarUrl;
        } else {
            // Remove the avatarUrl field if null
            updateData.$unset = { avatarUrl: "" };
        }

        const result = await usersCollection.updateOne(
            { _id: uid as any },
            avatarUrl !== null ? { $set: updateData } : { $unset: { avatarUrl: "" }, $set: { updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found." };
        }

        return { success: true, message: "Avatar updated successfully." };

    } catch (error) {
        console.error("Error in updateUserAvatar:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to update avatar: ${errorMessage}`
        };
    }
}

export async function getUserProfile(uid: string): Promise<{ success: boolean; profile?: any; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        const profile = await usersCollection.findOne({ _id: uid as any });

        if (!profile) {
            return { success: false, message: "User profile not found." };
        }

        return { success: true, profile };

    } catch (error) {
        console.error("Error in getUserProfile:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to fetch profile: ${errorMessage}`
        };
    }
}
