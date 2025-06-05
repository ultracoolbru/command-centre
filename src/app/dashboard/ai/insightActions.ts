"use server";

import clientPromise from "@/lib/mongodb";
import { generateContent } from "@/lib/gemini";
import { ObjectId } from "mongodb";

// Helper: Get userId (replace with your actual auth logic)


export async function getProductivityInsights(date: Date | null, userId: string) {
  const client = await clientPromise;
  const db = client.db();
  // Fetch tasks and daily plans for the date (or recent week)
  const dailyPlans = await db.collection("DailyPlan").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const tasks = await db.collection("Task").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
  // Format prompt
  const prompt = `Analyze the following productivity data and provide personalized productivity insights in markdown format.\n\nDaily Plans: ${JSON.stringify(dailyPlans)}\n\nTasks: ${JSON.stringify(tasks)}`;
  return generateContent(prompt);
}

export async function getHealthInsights(date: Date | null, userId: string) {
  const client = await clientPromise;
  const db = client.db();
  // Fetch health logs for the user (recent week)
  const healthLogs = await db.collection("HealthLog").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const prompt = `Analyze the following health data and provide correlations, patterns, and suggestions in markdown format.\n\nHealth Logs: ${JSON.stringify(healthLogs)}`;
  return generateContent(prompt);
}

export async function getJournalInsights(date: Date | null, userId: string) {
  const client = await clientPromise;
  const db = client.db();
  // Fetch journal entries for the user (recent week)
  const journalEntries = await db.collection("JournalEntry").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const prompt = `Analyze the following journal entries for emotional trends and patterns. Summarize your findings in markdown format.\n\nJournal Entries: ${JSON.stringify(journalEntries)}`;
  return generateContent(prompt);
}

export async function getWeeklySummaryInsights(date: Date | null, userId: string) {
  const client = await clientPromise;
  const db = client.db();
  // Fetch all relevant data
  const dailyPlans = await db.collection("DailyPlan").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const tasks = await db.collection("Task").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
  const healthLogs = await db.collection("HealthLog").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const journalEntries = await db.collection("JournalEntry").find({ userId }).sort({ date: -1 }).limit(7).toArray();
  const prompt = `Based on the following data from the past week, provide a concise weekly summary with key highlights and trends in markdown format.\n\nDaily Plans: ${JSON.stringify(dailyPlans)}\nTasks: ${JSON.stringify(tasks)}\nHealth Logs: ${JSON.stringify(healthLogs)}\nJournal Entries: ${JSON.stringify(journalEntries)}`;
  return generateContent(prompt);
}
