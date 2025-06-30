"use server";

import { DailyPlan, DailyPlanSchema, DailySummary, ErrorSummary } from "@/types/schemas";
import { generateWeeklyOverview, generateInsights } from "@/lib/gemini"; // Added generateInsights
import clientPromise from "@/lib/mongodb";
import { getAuth } from "@clerk/nextjs/server"; // Assuming Clerk for auth, adjust if different
import { NextApiRequest } from "next"; // For auth if using API routes, not directly here but for context


// Helper to get user ID - adjust based on your actual auth setup
// This is a placeholder. In a real app, you'd get this from your auth provider context on client or server.
// For server actions, you might need to pass it or use a server-side auth utility.
async function getCurrentUserId(): Promise<string | null> {
    // Example for Clerk (if in API route or server component with access to req)
    // const { userId } = getAuth(req as NextApiRequest); return userId;
    // For now, returning a mock. This needs to be replaced with actual auth logic.
    // If your actions are called from client components that have user context, pass userId as an argument.
    console.warn("Using mock user ID in server actions. Replace with actual auth logic.");
    return "mock-user-id"; // Replace this
}


export async function getWeeklyOverview(dateString: string, userIdFromClient?: string): Promise<DailySummary[] | ErrorSummary[]> {
    try {
        const userId = userIdFromClient || await getCurrentUserId();
        if (!userId) {
            return [{ title: "Auth Error", description: "User ID not found." }];
        }

        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);

        // Calculate start of the week (assuming week starts on Sunday)
        const dayOfWeek = targetDate.getDay(); // 0 (Sun) - 6 (Sat)
        const startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - dayOfWeek);
        startDate.setHours(0,0,0,0);

        // Calculate end of the week
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23,59,59,999);

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<DailyPlan>("dailyPlans");

        const weeklyPlans = await collection.find({
            userId: userId,
            date: {
                $gte: startDate,
                $lte: endDate,
            }
        }).sort({ date: 1 }).toArray();

        if (!weeklyPlans || weeklyPlans.length === 0) {
            return [{ title: "No Data", description: "No daily plans found for this week." }];
        }

        // Process data for Gemini
        const weeklyDataForGemini: { [key: string]: Array<{ title?: string; description?: string; morningNotes?: string; accomplishments?: string; challenges?: string; }> } = {};
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        weeklyPlans.forEach(plan => {
            const dayName = dayNames[plan.date.getDay()];
            if (!weeklyDataForGemini[dayName]) {
                weeklyDataForGemini[dayName] = [];
            }
            // Consolidate relevant info for the prompt.
            // The prompt in gemini.ts expects 'title' or 'description'. We can adapt.
            let entryFocus = "";
            if(plan.priority1) entryFocus += `Priority 1: ${plan.priority1}. `;
            if(plan.accomplishments) entryFocus += `Accomplished: ${plan.accomplishments}. `;
            if(plan.challenges) entryFocus += `Challenges: ${plan.challenges}.`;

            weeklyDataForGemini[dayName].push({
                // title: plan.priority1 || "General Update", // Or combine priorities
                description: entryFocus || plan.morningNotes || plan.reflectionNotes || "No specific details.",
                morningNotes: plan.morningNotes,
                accomplishments: plan.accomplishments,
                challenges: plan.challenges,
            });
        });

        // Dynamically import to avoid issues if not always used or in different environments
        const { generateWeeklyOverview: geminiGenerateWeeklyOverview } = await import("@/lib/gemini");
        const overviewFromAI = await geminiGenerateWeeklyOverview({ weeklyData: weeklyDataForGemini });

        if (overviewFromAI.length > 0 && "title" in overviewFromAI[0] && overviewFromAI[0].title === 'Error') {
             return overviewFromAI as ErrorSummary[]; // AI returned an error structure
        }
        if (overviewFromAI.length === 0) {
            return [{ title: "AI Error", description: "AI could not generate a weekly overview." }];
        }


        // Map AI response to DailySummary[], assuming AI returns {day: string, summary: string, focus: string} objects
        return overviewFromAI.map((item: any, idx: number) => ({
            id: item.id || `weekly-summary-${idx}-${new Date().getTime()}`, // Ensure unique ID
            userId: userId,
            date: targetDate, // Or perhaps the specific day's date if AI provides it
            day: item.day,
            summary: item.summary,
            focus: item.focus,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

    } catch (error) {
        console.error('Error in getWeeklyOverview:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return [{
            title: 'Error',
            description: `Failed to generate weekly overview: ${errorMessage}`
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
        const collection = db.collection<Omit<DailyPlan, 'id'>>("dailyPlans");

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
        const collection = db.collection<Omit<DailyPlan, 'id'>>("dailyPlans");

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
        const collection = db.collection<DailyPlan>("dailyPlans"); // Use DailyPlan type

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
                 return { success: false, message: (insights as any).description || "Could not generate insights at this time."};
            }
            return { success: false, message: "Received an unexpected format for AI insights." };
        }

    } catch (error) {
        console.error("Error fetching AI insights:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching AI insights.";
        return { success: false, message: errorMessage };
    }
}