"use server";

import { generateContent } from "@/lib/gemini";

export async function askGemini(prompt: string, context?: string): Promise<string> {
  // This will run on the server
  return await generateContent(prompt, context);
}
