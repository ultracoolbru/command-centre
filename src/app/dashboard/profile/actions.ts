"use server";

import clientPromise from "@/lib/mongodb";

interface UpdateProfileParams {
    uid: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
    timezone?: string;
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<{ success: boolean; message?: string }> {
    try {
        const { uid, firstName, lastName, displayName, bio, timezone } = params;

        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("users");

        // Prepare update data - only include fields that are provided
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (timezone !== undefined) updateData.timezone = timezone;

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
