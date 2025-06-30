"use server";

import { generateWeeklyOverview } from "@/lib/gemini";
import clientPromise from "@/lib/mongodb";
import { DailyPlan, DailyPlanSchema, DailySummary, ErrorSummary } from "@/types/schemas";

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
    userId: string,
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
        const validationResult = DailyPlanSchema.pick({
            priority1: true,
            priority2: true,
            priority3: true,
            morningNotes: true,
        }).safeParse(values);

        if (!validationResult.success) {
            // Construct a user-friendly error message from Zod's error details
            const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join('; ');
            return { success: false, message: `Validation failed: ${errorMessages}` };
        }

        const validatedValues = validationResult.data;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Omit<DailyPlan, 'id'>>("DailyPlan");

        // Define the document to be set, focusing on morning plan fields
        const completeDocument = {
            userId,
            date: parsedDate,
            priority1: validatedValues.priority1 || "",
            priority2: validatedValues.priority2 || "",
            priority3: validatedValues.priority3 || "",
            morningNotes: validatedValues.morningNotes || "",
            // Evening fields are explicitly not set here for $set,
            // they will be initialized by $setOnInsert if it's a new document
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { userId: userId, date: parsedDate },
            {
                $set: completeDocument,
                $setOnInsert: {
                    createdAt: new Date(),
                    // Initialize evening fields only on insert if they are not part of this form
                    accomplishments: "",
                    challenges: "",
                    tomorrowFocus: "",
                    reflectionNotes: ""
                }
            },
            { upsert: true }
        );

        if (result.acknowledged) {
            let savedDataId: string;
            // After upsert, find the document to get its ID, whether inserted or updated
            const savedDoc = await collection.findOne({ userId: userId, date: parsedDate });
            if (!savedDoc || !savedDoc._id) {
                return { success: false, message: "Failed to retrieve saved plan ID." };
            }
            savedDataId = savedDoc._id.toString();

            return {
                success: true,
                message: "Morning plan saved successfully.",
                data: { // Return only the fields that were part of this operation
                    id: savedDataId,
                    userId,
                    date: parsedDate,
                    priority1: validatedValues.priority1,
                    priority2: validatedValues.priority2,
                    priority3: validatedValues.priority3,
                    morningNotes: validatedValues.morningNotes,
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

export async function saveEveningPlan(
    userId: string,
    dateString: string,
    values: {
        accomplishments?: string;
        challenges?: string;
        tomorrowFocus?: string;
        reflectionNotes?: string;
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

        const validationResult = DailyPlanSchema.pick({
            accomplishments: true,
            challenges: true,
            tomorrowFocus: true,
            reflectionNotes: true,
        }).safeParse(values);

        if (!validationResult.success) {
            const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join('; ');
            return { success: false, message: `Validation failed: ${errorMessages}` };
        }

        const validatedValues = validationResult.data;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Omit<DailyPlan, 'id'>>("DailyPlan");

        const documentToUpdate = {
            userId, // technically not needed in $set if part of filter, but good for clarity
            date: parsedDate, // same as above
            accomplishments: validatedValues.accomplishments || "",
            challenges: validatedValues.challenges || "",
            tomorrowFocus: validatedValues.tomorrowFocus || "",
            reflectionNotes: validatedValues.reflectionNotes || "",
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { userId: userId, date: parsedDate },
            {
                $set: documentToUpdate,
                $setOnInsert: {
                    createdAt: new Date(),
                    // Initialize morning fields only on insert if they are not part of this form and document is new
                    priority1: "",
                    priority2: "",
                    priority3: "",
                    morningNotes: ""
                }
            },
            { upsert: true }
        );

        if (result.acknowledged) {
            const savedDoc = await collection.findOne({ userId: userId, date: parsedDate });
            if (!savedDoc || !savedDoc._id) {
                return { success: false, message: "Failed to retrieve saved plan ID." };
            }
            const savedDataId = savedDoc._id.toString();

            return {
                success: true,
                message: "Evening reflection saved successfully.",
                data: { // Return only the fields that were part of this operation
                    id: savedDataId,
                    userId,
                    date: parsedDate,
                    accomplishments: validatedValues.accomplishments,
                    challenges: validatedValues.challenges,
                    tomorrowFocus: validatedValues.tomorrowFocus,
                    reflectionNotes: validatedValues.reflectionNotes,
                }
            };
        } else {
            return { success: false, message: "Failed to save evening reflection." };
        }
    } catch (error) {
        console.error("Error saving evening reflection:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error saving evening reflection: ${errorMessage}` };
    }
}

export async function fetchDailyAIInsights(
    userId: string,
    dateString: string
): Promise<{ success: boolean; message?: string; insights?: Array<{ title: string; description: string }> }> {
    try {
        if (!userId) {
            return { success: false, message: "User ID is required to fetch AI insights." };
        }
        if (!dateString) {
            return { success: false, message: "Date is required to fetch AI insights." };
        }

        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
            return { success: false, message: "Invalid date format for AI insights." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<DailyPlan>("DailyPlan"); // Use DailyPlan type

        const dailyPlanData = await collection.findOne({ userId: userId, date: parsedDate });

        if (!dailyPlanData) {
            return { success: false, message: "No daily plan data found for this date to generate insights." };
        }

        // Prepare data for Gemini. Only send relevant fields.
        const dataForInsights = {
            priorities: [dailyPlanData.priority1, dailyPlanData.priority2, dailyPlanData.priority3].filter(Boolean),
            morningNotes: dailyPlanData.morningNotes,
            accomplishments: dailyPlanData.accomplishments,
            challenges: dailyPlanData.challenges,
            tomorrowFocus: dailyPlanData.tomorrowFocus,
            reflectionNotes: dailyPlanData.reflectionNotes,
        };

        // Dynamically import generateInsights from gemini.ts
        const { generateInsights } = await import("@/lib/gemini");
        const insights = await generateInsights(dataForInsights, "daily personal planning and reflection");

        // Ensure insights is an array, even if Gemini returns a single object or error structure
        if (Array.isArray(insights)) {
            return { success: true, insights };
        } else if (insights && typeof insights === 'object' && insights.title && insights.description) {
            // Handle cases where Gemini might return a single insight object not in an array
            return { success: true, insights: [insights as { title: string; description: string }] };
        } else {
            // Handle cases where insights might be an error object from generateInsights's catch block
            if (insights && (insights as any).title === 'Error' || (insights as any).title === 'Data Analysis') {
                return { success: false, message: (insights as any).description || "Could not generate insights at this time." };
            }
            return { success: false, message: "Received an unexpected format for AI insights." };
        }

    } catch (error) {
        console.error("Error fetching AI insights:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching AI insights.";
        return { success: false, message: errorMessage };
    }
}