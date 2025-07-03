"use server";

import clientPromise from "@/lib/mongodb";
import { getValidatedUserId } from "@/lib/server-auth";
import { DailyPlan, DailyPlanSchema, DailySummary, ErrorSummary } from "@/types/schemas";


/**
 * Get weekly overview for the user
 * @param dateString - Date string to get the week for
 * @param userIdFromClient - User ID from the client context (required)
 */
export async function getWeeklyOverview(dateString: string, userIdFromClient: string): Promise<DailySummary[] | ErrorSummary[]> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userIdFromClient);
        if (!userValidation.isValid) {
            return [{ title: "Auth Error", description: userValidation.error || "Authentication required." }];
        }
        const userId = userValidation.userId!;

        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);

        // Calculate start of the week (assuming week starts on Sunday)
        const dayOfWeek = targetDate.getDay(); // 0 (Sun) - 6 (Sat)
        const startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);

        // Calculate end of the week
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<DailyPlan>("DailyPlan");

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

            // Create a more structured entry that preserves the meaning of each field
            const entry: any = {};

            // Build a meaningful description from priorities
            let prioritiesDescription = "";
            if (plan.priority1) prioritiesDescription += `Priority 1: ${plan.priority1}. `;
            if (plan.priority2) prioritiesDescription += `Priority 2: ${plan.priority2}. `;
            if (plan.priority3) prioritiesDescription += `Priority 3: ${plan.priority3}. `;

            if (prioritiesDescription) {
                entry.description = prioritiesDescription;
            }

            // Include individual fields for better context
            if (plan.morningNotes) {
                entry.morningNotes = plan.morningNotes;
            }
            if (plan.accomplishments) {
                entry.accomplishments = plan.accomplishments;
            }
            if (plan.challenges) {
                entry.challenges = plan.challenges;
            }
            if (plan.reflectionNotes) {
                entry.reflectionNotes = plan.reflectionNotes;
            }
            if (plan.tomorrowFocus) {
                entry.tomorrowFocus = plan.tomorrowFocus;
            }

            // Only add the entry if it has some meaningful content
            if (Object.keys(entry).length > 0) {
                weeklyDataForGemini[dayName].push(entry);
            }
        });

        // Add debugging to see what data we're sending to AI
        console.log('Weekly data for Gemini:', JSON.stringify(weeklyDataForGemini, null, 2));

        // Dynamically import to avoid issues if not always used or in different environments
        const { generateWeeklyOverview: geminiGenerateWeeklyOverview } = await import("@/lib/gemini");
        const overviewFromAI = await geminiGenerateWeeklyOverview({ weeklyData: weeklyDataForGemini });

        console.log('AI overview response:', overviewFromAI);

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

/**
 * Save morning plan for the user
 * @param userId - User ID from the client context (required)
 * @param dateString - Date string for the plan
 * @param values - Morning plan values
 */
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
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        if (!dateString) {
            return { success: false, message: "Date is required." };
        }

        const parsedDate = new Date(dateString);
        parsedDate.setHours(0, 0, 0, 0); // Normalize to start of day
        console.log('Save Morning Plan - Saving for date:', parsedDate, 'from dateString:', dateString);
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
            userId: validatedUserId,
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
            { userId: validatedUserId, date: parsedDate },
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
            const savedDoc = await collection.findOne({ userId: validatedUserId, date: parsedDate });
            if (!savedDoc || !savedDoc._id) {
                return { success: false, message: "Failed to retrieve saved plan ID." };
            }
            savedDataId = savedDoc._id.toString();

            return {
                success: true,
                message: "Morning plan saved successfully.",
                data: { // Return only the fields that were part of this operation
                    id: savedDataId,
                    userId: validatedUserId,
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

/**
 * Save evening plan for the user
 * @param userId - User ID from the client context (required)
 * @param dateString - Date string for the plan
 * @param values - Evening plan values
 */
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
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        if (!dateString) {
            return { success: false, message: "Date is required." };
        }

        const parsedDate = new Date(dateString);
        parsedDate.setHours(0, 0, 0, 0); // Normalize to start of day
        console.log('Save Evening Plan - Saving for date:', parsedDate, 'from dateString:', dateString);
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
            userId: validatedUserId, // technically not needed in $set if part of filter, but good for clarity
            date: parsedDate, // same as above
            accomplishments: validatedValues.accomplishments || "",
            challenges: validatedValues.challenges || "",
            tomorrowFocus: validatedValues.tomorrowFocus || "",
            reflectionNotes: validatedValues.reflectionNotes || "",
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { userId: validatedUserId, date: parsedDate },
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
            const savedDoc = await collection.findOne({ userId: validatedUserId, date: parsedDate });
            if (!savedDoc || !savedDoc._id) {
                return { success: false, message: "Failed to retrieve saved plan ID." };
            }
            const savedDataId = savedDoc._id.toString();

            return {
                success: true,
                message: "Evening reflection saved successfully.",
                data: { // Return only the fields that were part of this operation
                    id: savedDataId,
                    userId: validatedUserId,
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

/**
 * Fetch AI insights for daily plan based on comprehensive user data
 * @param userId - User ID from the client context (required)
 * @param dateString - Date string for the insights
 */
export async function fetchDailyAIInsights(
    userId: string,
    dateString: string
): Promise<{ success: boolean; message?: string; insights?: Array<{ title: string; description: string }> }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        if (!dateString) {
            return { success: false, message: "Date is required to fetch AI insights." };
        }

        const parsedDate = new Date(dateString);
        parsedDate.setHours(0, 0, 0, 0); // Normalize to start of day
        console.log('AI Insights - Querying for date:', parsedDate, 'from dateString:', dateString);
        if (isNaN(parsedDate.getTime())) {
            return { success: false, message: "Invalid date format for AI insights." };
        }

        const client = await clientPromise;
        const db = client.db();

        // Calculate date ranges for different queries
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const weekStart = new Date(parsedDate);
        weekStart.setDate(parsedDate.getDate() - parsedDate.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);

        // Gather comprehensive data from all collections
        const [
            dailyPlan,
            tasks,
            goals,
            journalEntries,
            healthLogs,
            bulletEntries,
            reminders,
            echoTasks,
            projectTasks,
            projectPhases,
            aiInsightHistory,
            collections
        ] = await Promise.all([
            // Daily plan for the specific date
            db.collection("DailyPlan").findOne({ userId: validatedUserId, date: parsedDate }),

            // Tasks (recent and relevant)
            db.collection("Task").find({
                userId: validatedUserId,
                $or: [
                    { createdAt: { $gte: weekStart, $lte: endOfDay } },
                    { dueDate: { $gte: parsedDate, $lte: endOfDay } },
                    { completed: false }
                ]
            }).limit(20).toArray(),

            // Goals (active and recent)
            db.collection("Goal").find({
                userId: validatedUserId,
                $or: [
                    { status: { $in: ['planning', 'in-progress'] } },
                    { updatedAt: { $gte: monthStart } }
                ]
            }).limit(10).toArray(),

            // Journal entries (recent week)
            db.collection("JournalEntry").find({
                userId: validatedUserId,
                createdAt: { $gte: weekStart, $lte: endOfDay }
            }).limit(5).toArray(),

            // Health logs (recent week)
            db.collection("HealthLog").find({
                userId: validatedUserId,
                date: { $gte: weekStart, $lte: endOfDay }
            }).limit(7).toArray(),

            // Bullet entries (recent week)
            db.collection("BulletEntry").find({
                userId: validatedUserId,
                createdAt: { $gte: weekStart, $lte: endOfDay }
            }).limit(15).toArray(),

            // Reminders (active and recent)
            db.collection("Reminder").find({
                userId: validatedUserId,
                $or: [
                    { dueDate: { $gte: parsedDate } },
                    { createdAt: { $gte: weekStart } }
                ]
            }).limit(10).toArray(),

            // Echo tasks (recent)
            db.collection("EchoTask").find({
                userId: validatedUserId,
                createdAt: { $gte: weekStart, $lte: endOfDay }
            }).limit(10).toArray(),

            // Project tasks (active)
            db.collection("ProjectTask").find({
                userId: validatedUserId,
                $or: [
                    { status: { $in: ['pending', 'in-progress'] } },
                    { updatedAt: { $gte: weekStart } }
                ]
            }).limit(15).toArray(),

            // Project phases (active)
            db.collection("ProjectPhase").find({
                userId: validatedUserId,
                $or: [
                    { status: { $in: ['planning', 'in-progress'] } },
                    { updatedAt: { $gte: monthStart } }
                ]
            }).limit(10).toArray(),

            // Recent AI insights to avoid repetition
            db.collection("AIInsight").find({
                userId: validatedUserId,
                createdAt: { $gte: weekStart }
            }).limit(5).toArray(),

            // Collections (active)
            db.collection("Collection").find({
                userId: validatedUserId,
                updatedAt: { $gte: monthStart }
            }).limit(10).toArray()
        ]);

        // Prepare comprehensive data for Gemini analysis
        const dataForInsights = {
            date: parsedDate.toISOString().split('T')[0],
            dailyPlan: dailyPlan ? {
                priorities: [dailyPlan.priority1, dailyPlan.priority2, dailyPlan.priority3].filter(Boolean),
                morningNotes: dailyPlan.morningNotes,
                accomplishments: dailyPlan.accomplishments,
                challenges: dailyPlan.challenges,
                tomorrowFocus: dailyPlan.tomorrowFocus,
                reflectionNotes: dailyPlan.reflectionNotes,
            } : null,

            tasks: {
                total: tasks.length,
                completed: tasks.filter(t => t.completed).length,
                overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < parsedDate && !t.completed).length,
                highPriority: tasks.filter(t => t.priority === 'high').length,
                recentTasks: tasks.slice(0, 5).map(t => ({
                    title: t.title,
                    priority: t.priority,
                    completed: t.completed,
                    dueDate: t.dueDate
                }))
            },

            goals: {
                total: goals.length,
                inProgress: goals.filter(g => g.status === 'in-progress').length,
                completed: goals.filter(g => g.status === 'completed').length,
                averageProgress: goals.length > 0 ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length : 0,
                recentGoals: goals.slice(0, 3).map(g => ({
                    title: g.title,
                    category: g.category,
                    progress: g.progress,
                    status: g.status
                }))
            },

            journaling: {
                totalEntries: journalEntries.length,
                recentTopics: journalEntries.slice(0, 3).map(j => j.title || 'Untitled')
            },

            health: {
                totalLogs: healthLogs.length,
                recentMetrics: healthLogs.slice(0, 3).map(h => ({
                    mood: h.mood,
                    energy: h.energy,
                    sleep: h.sleep
                }))
            },

            bulletJournal: {
                totalEntries: bulletEntries.length,
                recentEntries: bulletEntries.slice(0, 3).map(b => ({
                    type: b.type,
                    content: b.content
                }))
            },

            reminders: {
                total: reminders.length,
                upcoming: reminders.filter(r => r.dueDate && new Date(r.dueDate) >= parsedDate).length
            },

            projects: {
                activeTasks: projectTasks.filter(pt => pt.status === 'in-progress').length,
                activePhases: projectPhases.filter(pp => pp.status === 'in-progress').length,
                totalProjects: new Set(projectPhases.map(pp => pp.projectId)).size
            },

            productivity: {
                echoTasks: echoTasks.length,
                collections: collections.length
            }
        };

        console.log('Comprehensive data prepared for AI insights:', JSON.stringify(dataForInsights, null, 2));

        // For now, let's use fallback insights since they're more reliable
        // and we have comprehensive data to generate meaningful insights
        const fallbackInsights = generateFallbackInsights(dataForInsights);

        // Try AI insights, but always fall back to our reliable insights
        try {
            // Dynamically import generateInsights from gemini.ts
            const { generateInsights } = await import("@/lib/gemini");

            // Prepare data in the format Gemini expects for daily planning
            const geminiData = {
                priorities: dataForInsights.dailyPlan?.priorities || [],
                morningNotes: dataForInsights.dailyPlan?.morningNotes || "",
                accomplishments: dataForInsights.dailyPlan?.accomplishments || "",
                challenges: dataForInsights.dailyPlan?.challenges || "",
                tomorrowFocus: dataForInsights.dailyPlan?.tomorrowFocus || "",
                reflectionNotes: dataForInsights.dailyPlan?.reflectionNotes || "",

                // Add summary context from our comprehensive data
                taskSummary: `${dataForInsights.tasks.total} total tasks, ${dataForInsights.tasks.completed} completed (${Math.round((dataForInsights.tasks.completed / Math.max(dataForInsights.tasks.total, 1)) * 100)}% completion rate)`,
                goalSummary: `${dataForInsights.goals.total} goals with ${Math.round(dataForInsights.goals.averageProgress)}% average progress`,
                healthSummary: `${dataForInsights.health.totalLogs} health logs this week`,
                overallContext: `User has been tracking: ${dataForInsights.tasks.total} tasks, ${dataForInsights.goals.total} goals, ${dataForInsights.journaling.totalEntries} journal entries, ${dataForInsights.health.totalLogs} health logs, ${dataForInsights.bulletJournal.totalEntries} bullet journal entries, ${dataForInsights.reminders.total} reminders, and ${dataForInsights.projects.totalProjects} projects.`
            };

            console.log('Sending data to Gemini:', JSON.stringify(geminiData, null, 2));

            const insights = await generateInsights(geminiData, "daily personal planning and reflection");

            console.log('Received insights from Gemini:', insights);

            // Ensure insights is an array, even if Gemini returns a single object or error structure
            if (Array.isArray(insights) && insights.length > 0 && insights[0].title !== 'Error' && insights[0].title !== 'Data Analysis') {
                // Combine AI insights with our fallback insights for a richer experience
                return { success: true, insights: [...insights, ...fallbackInsights.slice(0, 2)] };
            } else {
                console.log('AI insights failed or empty, using fallback insights');
                return { success: true, insights: fallbackInsights };
            }
        } catch (aiError) {
            console.error('AI insights error, using fallback:', aiError);
            return { success: true, insights: fallbackInsights };
        }

    } catch (error) {
        console.error("Error fetching AI insights:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching AI insights.";

        // Return fallback insights even on error
        const fallbackInsights = [
            {
                title: "System Analysis",
                description: "Unable to generate AI insights at this time, but your personal dashboard data is being tracked across tasks, goals, and daily plans."
            }
        ];

        return { success: true, insights: fallbackInsights };
    }
}

/**
 * Generate fallback insights when AI is unavailable
 */
function generateFallbackInsights(data: any): Array<{ title: string; description: string }> {
    const insights = [];

    // Task productivity insight
    if (data.tasks.total > 0) {
        const completionRate = Math.round((data.tasks.completed / data.tasks.total) * 100);
        const overdueTasks = data.tasks.overdue;
        const highPriorityTasks = data.tasks.highPriority;

        let description = `You have ${data.tasks.total} tasks with a ${completionRate}% completion rate. `;

        if (overdueTasks > 0) {
            description += `Focus on ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} to get back on track. `;
        } else if (completionRate >= 80) {
            description += 'Excellent job staying on top of deadlines! ';
        }

        if (highPriorityTasks > 0) {
            description += `${highPriorityTasks} high-priority task${highPriorityTasks > 1 ? 's' : ''} need${highPriorityTasks === 1 ? 's' : ''} immediate attention.`;
        }

        insights.push({
            title: "Task Productivity Analysis",
            description: description.trim()
        });
    }

    // Goal progress insight
    if (data.goals.total > 0) {
        const avgProgress = Math.round(data.goals.averageProgress);
        const inProgressGoals = data.goals.inProgress;
        const completedGoals = data.goals.completed;

        let description = `Your ${data.goals.total} goals are averaging ${avgProgress}% completion. `;

        if (inProgressGoals > 0) {
            description += `${inProgressGoals} goal${inProgressGoals > 1 ? 's are' : ' is'} actively in progress. `;
        }

        if (completedGoals > 0) {
            description += `You've completed ${completedGoals} goal${completedGoals > 1 ? 's' : ''} recently - great momentum! `;
        }

        if (avgProgress >= 75) {
            description += 'You\'re making excellent progress across your goals.';
        } else if (avgProgress < 25) {
            description += 'Consider breaking down your goals into smaller, more manageable tasks.';
        }

        insights.push({
            title: "Goal Progress Tracker",
            description: description.trim()
        });
    }

    // Daily planning insight
    if (data.dailyPlan) {
        const prioritiesCount = data.dailyPlan.priorities.length;
        const hasAccomplishments = data.dailyPlan.accomplishments && data.dailyPlan.accomplishments.length > 0;
        const hasChallenges = data.dailyPlan.challenges && data.dailyPlan.challenges.length > 0;
        const hasTomorrowFocus = data.dailyPlan.tomorrowFocus && data.dailyPlan.tomorrowFocus.length > 0;

        let description = `You've set ${prioritiesCount} priorit${prioritiesCount === 1 ? 'y' : 'ies'} for today. `;

        if (hasAccomplishments && hasChallenges) {
            description += 'Great job reflecting on both accomplishments and challenges - this balanced approach helps continuous improvement. ';
        } else if (hasAccomplishments) {
            description += 'You\'ve reflected on accomplishments, which is great for motivation. Consider also noting challenges for learning opportunities. ';
        } else if (hasChallenges) {
            description += 'You\'ve identified challenges, which shows good self-awareness. Don\'t forget to celebrate your accomplishments too. ';
        }

        if (hasTomorrowFocus) {
            description += 'Planning for tomorrow shows excellent forward-thinking habits.';
        } else {
            description += 'Consider adding evening reflections and planning for tomorrow to enhance your productivity cycle.';
        }

        insights.push({
            title: "Daily Planning Habits",
            description: description.trim()
        });
    }

    // Health and wellness insight
    if (data.health.totalLogs > 0) {
        const logsThisWeek = data.health.totalLogs;
        let description = `You've logged ${logsThisWeek} health entr${logsThisWeek === 1 ? 'y' : 'ies'} this week. `;

        if (logsThisWeek >= 5) {
            description += 'Excellent consistency with health tracking! This data helps identify patterns in mood, energy, and sleep.';
        } else if (logsThisWeek >= 3) {
            description += 'Good progress with health tracking. Try to log daily for better pattern recognition.';
        } else {
            description += 'Consider tracking health metrics daily to better understand your wellness patterns.';
        }

        insights.push({
            title: "Wellness Tracking",
            description: description
        });
    }

    // Productivity ecosystem insight
    const totalActivities = data.tasks.total + data.goals.total + data.journaling.totalEntries +
        data.bulletJournal.totalEntries + data.reminders.total + data.projects.totalProjects;

    if (totalActivities > 0) {
        const mostActiveArea = [];
        if (data.tasks.total > 0) mostActiveArea.push(`${data.tasks.total} tasks`);
        if (data.goals.total > 0) mostActiveArea.push(`${data.goals.total} goals`);
        if (data.journaling.totalEntries > 0) mostActiveArea.push(`${data.journaling.totalEntries} journal entries`);
        if (data.projects.totalProjects > 0) mostActiveArea.push(`${data.projects.totalProjects} projects`);

        const description = `You're actively managing ${mostActiveArea.join(', ')}. This comprehensive approach to productivity shows great organization. ${data.projects.activeTasks > 0 ? `With ${data.projects.activeTasks} active project tasks, you're making good progress on larger initiatives.` :
                'Consider breaking down larger goals into project phases for better tracking.'
            }`;

        insights.push({
            title: "Productivity Ecosystem",
            description: description
        });
    }

    // Time management insight based on reminders and scheduling
    if (data.reminders.total > 0) {
        const upcomingReminders = data.reminders.upcoming;
        let description = `You have ${data.reminders.total} reminder${data.reminders.total > 1 ? 's' : ''} set`;

        if (upcomingReminders > 0) {
            description += `, with ${upcomingReminders} coming up soon. Good time management practices!`;
        } else {
            description += '. Consider setting reminders for upcoming deadlines and important tasks.';
        }

        insights.push({
            title: "Time Management",
            description: description
        });
    }

    // Fallback if no specific data
    if (insights.length === 0) {
        insights.push({
            title: "Getting Started",
            description: "Start by setting daily priorities, creating goals, or adding tasks to begin generating personalized insights about your productivity patterns."
        });

        insights.push({
            title: "Build Your System",
            description: "Your personal dashboard supports comprehensive productivity tracking. Try adding health logs, journal entries, or project planning to get richer insights."
        });
    }

    // Always add a motivational insight
    if (totalActivities > 5) {
        insights.push({
            title: "Momentum Building",
            description: `You're actively using ${totalActivities} different productivity features. This level of engagement shows commitment to personal growth and organization. Keep up the excellent work!`
        });
    }

    return insights.slice(0, 5); // Limit to 5 insights maximum
}