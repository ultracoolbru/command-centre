"use server";

import { generateWeeklyOverview } from "@/lib/gemini";

export type DailySummary = {
    day: string;
    summary: string;
    focus: string;
};

export type ErrorSummary = {
    title: string;
    description: string;
};

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
        
        return await generateWeeklyOverview({ weeklyData: mockWeeklyData });
    } catch (error) {
        console.error('Error in getWeeklyOverview:', error);
        return [{
            title: 'Error',
            description: 'Failed to generate weekly overview. Please try again later.'
        }];
    }
}
