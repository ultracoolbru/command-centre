import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Initialize the Gemini API with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create a secure server-side only wrapper for Gemini API
export async function generateContent(prompt: string, context?: string) {
  try {
    // For safety, ensure this is only called server-side
    if (typeof window !== 'undefined') {
      throw new Error('Gemini API can only be called server-side');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    // Create a model instance with appropriate configuration
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      safetySettings: safetySettings,
    });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const parts = [
      { text: prompt },
    ];

    // If you intend to use history, ensure it is passed as an array argument and handled accordingly.
    // Otherwise, remove or comment out this block to avoid errors.
    // Example:
    // if (Array.isArray(history)) {
    //   history.forEach((item: any) => {
    //     parts.unshift({ text: item.parts[0].text }); // Assuming user prompt
    //     if (item.parts[1] && item.parts[1].text) {
    //       parts.unshift({ text: item.parts[1].text });
    //     }
    //   });
    // }

    // Add context to the prompt if provided
    const fullPrompt = context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt;

    let retries = 3; // Number of retries
    let delay = 1000; // Initial delay in ms

    for (let i = 0; i < retries; i++) {
      try {
        // Generate content
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        return response.text();
      } catch (error: any) {
        // Check if the error is a 503 or a network-related error that might be transient
        if (error.status === 503 || (error.message && error.message.includes('fetch'))) {
          console.warn(`Attempt ${i + 1} failed with error: ${error.message}. Retrying in ${delay / 1000}s...`);
          if (i < retries - 1) { // Don't sleep after the last attempt
            await sleep(delay);
            delay *= 2; // Exponential backoff
          } else {
            console.error("Max retries reached. Error generating content with Gemini:", error);
            throw error; // Re-throw the error after max retries
          }
        } else {
          // For other errors, re-throw immediately
          console.error("Error generating content with Gemini:", error);
          throw error;
        }
      }
    }
    // Should not be reached if retries are exhausted and error is re-thrown
    throw new Error("Failed to generate content after multiple retries.");
  }
  catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
}

// Function to analyze sentiment in text
export async function analyzeSentiment(text: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('Gemini API can only be called server-side');
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro', safetySettings: safetySettings });

    const prompt = `
      Analyze the sentiment of the following text and categorize it as "positive", "negative", or "neutral".
      Also provide a confidence score between 0 and 1.
      Return the result in JSON format with keys "sentiment" and "confidence".
      
      Text to analyze: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch (parseError) {
      // If parsing fails, return a default structured response
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        error: 'Failed to parse Gemini response'
      };
    }
  } catch (error) {
    console.error('Error analyzing sentiment with Gemini:', error);
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      error: 'Error processing request'
    };
  }
}

// Function to generate insights from data
export async function generateInsights(data: any, category: string) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('Gemini API can only be called server-side');
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro', safetySettings: safetySettings });

    let specificPrompt = "";
    if (category === "daily personal planning and reflection") {
      specificPrompt = `
Analyze the following daily planning and reflection data:
- Priorities: ${JSON.stringify(data.priorities)}
- Morning Notes: ${data.morningNotes || "Not provided."}
- Accomplishments: ${data.accomplishments || "Not provided."}
- Challenges: ${data.challenges || "Not provided."}
- Focus for Tomorrow: ${data.tomorrowFocus || "Not provided."}
- General Reflection Notes: ${data.reflectionNotes || "Not provided."}

Based on this data, provide 2-4 concise and actionable insights. Focus on:
- Potential patterns in accomplishments or challenges.
- Connections between priorities and outcomes.
- Suggestions for improving productivity or well-being for the next day.
- Observations about focus or recurring themes.

Format the response as a JSON array of insight objects, each with a "title" (a brief heading for the insight) and "description" (the detailed insight).
Example: [{"title": "Productivity Peak", "description": "You seem to accomplish most of your priorities in the morning."}]
`;
    } else {
      // Fallback to the original generic prompt if category is different
      specificPrompt = `
      Analyze the following ${category} data and provide 3-5 meaningful insights.
      Focus on patterns, correlations, and actionable recommendations.
      Format the response as a JSON array of insight objects, each with "title" and "description" fields.
      
      Data: ${JSON.stringify(data)}
    `;
    }

    const result = await model.generateContent(specificPrompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch (parseError) {
      // If parsing fails, return a default structured response
      return [{
        title: 'Data Analysis',
        description: 'Insights could not be generated at this time. Please try again later.'
      }];
    }
  } catch (error) {
    console.error('Error generating insights with Gemini:', error);
    return [{
      title: 'Error',
      description: 'Failed to generate insights. Please try again later.'
    }];
  }
}

export async function generateWeeklyOverview(data: any) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('Gemini API can only be called server-side');
    }

    const { weeklyData } = data;

    // Build your Gemini prompt
    const prompt = buildWeeklyPrompt(weeklyData);
    console.log('Gemini prompt:', prompt);

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro', safetySettings: safetySettings });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('Gemini raw response:', response);
    try {
      // It's common for Gemini to return plain text for this kind of structured prompt, not JSON.
      // So, we directly use `response.text()` if no explicit JSON format was requested in the prompt for the *entire* output.
      // The prompt for weekly overview asks for a specific text format, not a JSON wrapper for the whole thing.
      const aiText = response; // Directly use the text response
      if (!aiText || aiText.trim() === "") {
        console.warn("Gemini returned empty text for weekly overview.");
        return [{ title: 'AI Response Empty', description: 'AI returned an empty response for the weekly overview.' }];
      }
      const summaries = parseGeminiSummaries(aiText);

      // Filter out any entries that didn't parse correctly (e.g., missing day)
      const validSummaries = summaries.filter(s => s.day && s.summary);

      if (validSummaries.length === 0 && summaries.length > 0) {
        // Parsing happened, but no valid items were produced. This indicates a format mismatch.
        console.warn("Failed to parse any valid summaries from AI weekly overview response:", aiText);
        return [{ title: 'Parsing Error', description: 'Could not parse the AI response for weekly overview.' }];
      }

      return validSummaries;

    } catch (e) { // Catch any unexpected error during processing, though parseGeminiSummaries is quite safe.
      console.error('Error processing AI response for weekly overview:', e);
      return [{
        title: 'Processing Error',
        description: 'An error occurred while processing the AI response for weekly overview.'
      }];
    }

  } catch (error) {
    console.error('Error generating Weekly Overview Analysis with Gemini:', error);
    return [{
      title: 'Error',
      description: 'Failed to generate Weekly Overview Analysis. Please try again later.'
    }];
  }
}

// Prompt builder
function buildWeeklyPrompt(weeklyData: any): string {
  if (!weeklyData) {
    console.warn('No weekly data provided to buildWeeklyPrompt');
    return 'No weekly data available for summarization.';
  }

  // weeklyData should be an object with keys for each day, each with an array of events/tasks/etc.
  let prompt = `You are creating a weekly overview for a personal productivity dashboard. Based on the user's daily plans, accomplishments, and reflections, provide a meaningful summary for each day that actually reflects their personal activities, work, and goals.

IMPORTANT: 
- Only use the actual data provided below. Do not invent, imagine, or create fictional content.
- If no meaningful data is available for a day, simply state "No activities recorded" for that day.
- For the Focus, identify the main theme or area based on the actual activities. Use specific focus areas like "Project Work", "Productivity", "Learning", "Collaboration", "Planning", "Health", etc. Only use "Rest" if there truly were no activities.
- You MUST provide summaries for ALL 7 days: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.

Format your response exactly as:
Sunday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Monday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Tuesday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Wednesday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Thursday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Friday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Saturday: <summary based on actual user data OR "No activities recorded">
Focus: <specific focus area based on activities OR "Rest" only if no activities>

Here is the user's actual daily data:

`;
  const days = Object.keys(weeklyData);
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (days.length === 0) {
    // If no data at all, still ask for all days to be covered
    prompt += 'No activities found for any day of the week.\n\n';
    prompt += 'Please provide a summary for all 7 days (Sunday through Saturday) indicating "No activities recorded" for each day.';
    return prompt;
  }

  // Process all days, whether they have data or not
  for (const day of allDays) {
    const dayActivities = weeklyData[day];
    prompt += `${day}:\n`;

    if (Array.isArray(dayActivities) && dayActivities.length > 0) {
      let hasContent = false;
      dayActivities.forEach((item: any, index: number) => {
        if (item.description && item.description.trim() !== '') {
          prompt += `  - ${item.description}\n`;
          hasContent = true;
        }
        if (item.morningNotes && item.morningNotes.trim() !== '') {
          prompt += `  - Morning notes: ${item.morningNotes}\n`;
          hasContent = true;
        }
        if (item.accomplishments && item.accomplishments.trim() !== '') {
          prompt += `  - Accomplishments: ${item.accomplishments}\n`;
          hasContent = true;
        }
        if (item.challenges && item.challenges.trim() !== '') {
          prompt += `  - Challenges: ${item.challenges}\n`;
          hasContent = true;
        }
        if (item.reflectionNotes && item.reflectionNotes.trim() !== '') {
          prompt += `  - Reflection: ${item.reflectionNotes}\n`;
          hasContent = true;
        }
        if (item.tomorrowFocus && item.tomorrowFocus.trim() !== '') {
          prompt += `  - Tomorrow's focus: ${item.tomorrowFocus}\n`;
          hasContent = true;
        }
      });

      if (!hasContent) {
        prompt += `  - No activities recorded\n`;
      }
    } else {
      prompt += `  - No activities recorded\n`;
    }
    prompt += '\n';
  }

  prompt += '\nPlease provide a realistic summary based on the actual user data above. Do not invent fictional content. If no meaningful data is available for a day, indicate that no activities were recorded.';

  return prompt;
}

// Parser for Gemini output
function parseGeminiSummaries(text: string) {
  // Example Gemini output:
  // Monday: Completed 3/3 priorities. Focus: Project planning.
  // Tuesday: ...
  const lines = text.split('\n').filter(line => line.trim() !== ''); // Ensure no empty lines
  const summaries = lines.map(line => {
    const parts = line.split('Focus:');
    let focus = parts.length > 1 ? parts[1].trim() : ''; // Extract focus if present

    const dayAndSummaryPart = parts[0];
    const dayMatch = dayAndSummaryPart.match(/^(\w+):\s*/); // Match "DayName: "

    let day = '';
    let summary = '';

    if (dayMatch && dayMatch[1]) {
      day = dayMatch[1].trim();
      summary = dayAndSummaryPart.substring(dayMatch[0].length).trim(); // Get text after "DayName: "

      // If summary is empty or generic, provide a default
      if (!summary || summary.length < 5) {
        summary = 'No activities recorded';
      }

      // If focus is empty, try to derive it from summary or provide a meaningful default
      if (!focus || focus.length < 3) {
        // Try to derive focus from the summary content
        if (summary.toLowerCase().includes('no activities')) {
          focus = 'Rest';
        } else if (summary.toLowerCase().includes('priority') || summary.toLowerCase().includes('task')) {
          focus = 'Productivity';
        } else if (summary.toLowerCase().includes('meeting') || summary.toLowerCase().includes('collaboration')) {
          focus = 'Collaboration';
        } else if (summary.toLowerCase().includes('learning') || summary.toLowerCase().includes('study')) {
          focus = 'Learning';
        } else if (summary.toLowerCase().includes('project')) {
          focus = 'Project Work';
        } else {
          focus = 'General Activities';
        }
      }
    } else {
      // Line doesn't match "DayName: Summary..." format, could be a malformed line or just text
      // For now, we'll skip such lines by not returning a valid 'day'
      console.warn(`Could not parse day from weekly overview line: "${line}"`);
      return { day: '', summary: '', focus: '' }; // Invalid entry, will be filtered
    }

    return { day, summary, focus };
  });

  // Filter out entries where 'day' could not be parsed
  const validSummaries = summaries.filter(s => s.day !== '');

  // Ensure all 7 days are represented - add missing days
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parsedDays = validSummaries.map(s => s.day);
  allDays.forEach(dayName => {
    if (!parsedDays.includes(dayName)) {
      validSummaries.push({
        day: dayName,
        summary: 'No activities recorded',
        focus: 'Rest'
      });
    }
  });

  // Sort by day order
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  validSummaries.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return validSummaries;
}