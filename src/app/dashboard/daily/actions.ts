"use server";

import { DailyPlan, DailyPlanSchema, DailySummary, ErrorSummary } from "@/types/schemas";
import { generateWeeklyOverview } from "@/lib/gemini";
import clientPromise from "@/lib/mongodb";

export async function getWeeklyOverview(dateString: string): Promise<DailySummary[] | ErrorSummary[]> {
    try {
        // This will run on the server
        // For now, we'll return mock data since we don't have actual weekly data
        // In a real app, you would fetch the weekly data from your database here
        const mockWeeklyData = {
            monday: [
                { title: 'Team Meeting', description: 'Discuss project updates' },
                { title: 'Code Review', description: 'Review PR #123' }
            ],
            tuesday: [
                { title: 'Feature Development', description: 'Work on new dashboard' },
                { title: 'Standup', description: 'Daily sync with team' }
            ],
            // Add more days as needed
        };

        const overview = await generateWeeklyOverview({ weeklyData: mockWeeklyData });
        // If the result is an error array, return as is
        if (overview.length > 0 && "title" in overview[0]) {
            return overview as ErrorSummary[];
        }
        // Otherwise, map to the required type
        const now = new Date();
        const userId = "mock-user"; // Replace with actual userId if available
        return (overview as any[]).map((item, idx) => ({
            id: `mock-id-${idx}`,
            userId,
            date: now,
            day: item.day,
            summary: item.summary,
            focus: item.focus,
            createdAt: now,
            updatedAt: now,
        }));
    } catch (error) {
        console.error('Error in getWeeklyOverview:', error);
        return [{
            title: 'Error',
            description: 'Failed to generate weekly overview. Please try again later.'
        }];
    }
}

export async function saveMorningPlan(
    userId: string, // Added userId parameter
    dateString: string,
    values: {
        priority1?: string;
        priority2?: string;
        priority3?: string;
        morningNotes?: string;
    }
): Promise<{ success: boolean; message: string; data?: Partial<DailyPlan> }> {
    try {
        if (!userId) {
            return { success: false, message: "User ID is required." };
        }
        if (!dateString) {
            return { success: false, message: "Date is required." };
        }

        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
            return { success: false, message: "Invalid date format." };
        }

        // Validate input values against the schema
        const validationResult = DailyPlanSchema.safeParse(values);
        if (!validationResult.success) {
            return { success: false, message: `Validation failed: ${validationResult.error.flatten().fieldErrors}` };
        }

        const validatedValues = validationResult.data;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Omit<DailyPlan, 'id'>>("dailyPlans");

        const documentToSave = {
            userId,
            date: parsedDate, // Store as BSON Date
            priority1: validatedValues.priority1 || "", // Ensure empty strings if optional and not provided
            priority2: validatedValues.priority2 || "",
            priority3: validatedValues.priority3 || "",
            morningNotes: validatedValues.morningNotes || "",
            // Initialize evening fields as empty or undefined as per your schema logic for a new morning plan
            accomplishments: "",
            challenges: "",
            tomorrowFocus: "",
            reflectionNotes: "",
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { userId: userId, date: parsedDate }, // Filter to find existing plan for this user and date
            {
                $set: documentToSave,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        if (result.acknowledged) {
            let savedDataId: string;
            if (result.upsertedId) {
                savedDataId = result.upsertedId.toString();
            } else {
                // If updated, fetch the document to get its _id if needed, or assume success
                const existingDoc = await collection.findOne({ userId: userId, date: parsedDate });
                if (!existingDoc?._id) {
                    return { success: false, message: "Failed to retrieve saved plan ID after update." };
                }
                savedDataId = existingDoc._id.toString();
            }
            return {
                success: true,
                message: "Morning plan saved successfully.",
                data: {
                    id: savedDataId,
                    userId,
                    date: parsedDate,
                    ...(() => {
                        const { id, userId, date, ...rest } = validatedValues;
                        return rest;
                    })()
                }
            };
        } else {
            return { success: false, message: "Failed to save morning plan." };
        }
    } catch (error) {
        console.error("Error saving morning plan:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error saving morning plan: ${errorMessage}` };
    }
}