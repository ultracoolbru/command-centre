"use server";

import clientPromise from "@/lib/mongodb";

/**
 * Updates the email verification status in MongoDB when user verifies email through Firebase
 */
export async function updateEmailVerificationStatus(
    uid: string,
    isEmailVerified: boolean
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        const result = await usersCollection.updateOne(
            { _id: uid as any },
            {
                $set: {
                    isEmailVerified,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found in database." };
        }

        return { success: true, message: "Email verification status updated successfully." };

    } catch (error) {
        console.error("Error in updateEmailVerificationStatus:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to update email verification status: ${errorMessage}`
        };
    }
}

/**
 * Updates user's last login timestamp and email verification status if needed
 */
export async function updateUserLoginStatus(uid: string): Promise<{ success: boolean; message?: string }> {
    try {
        if (!uid) {
            return { success: false, message: "User ID is required." };
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("User");

        // Update last login and check if we need to sync email verification from Firebase
        const result = await usersCollection.updateOne(
            { _id: uid as any },
            {
                $set: {
                    lastLogin: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found in database." };
        }

        return { success: true, message: "User login status updated successfully." };

    } catch (error) {
        console.error("Error in updateUserLoginStatus:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to update user login status: ${errorMessage}`
        };
    }
}
