import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro', safetySettings: safetySettings });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    try {
      const data = JSON.parse(response);
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const summaries = parseGeminiSummaries(aiText);

      return summaries;
    } catch (parseError) {
      // If parsing fails, return a default structured response
      return [{
        title: 'Weekly Overview Analysis',
        description: 'Weekly Overview Analysis could not be generated at this time. Please try again later.'
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
  let prompt = 'Summarize the following weekly activity log. For each day, provide a one-sentence summary and the main focus for that day. Format your response as:\nMonday: <summary> Focus: <main focus>\n...\n\n';

  const days = Object.keys(weeklyData);
  if (days.length === 0) {
    return 'No activities found for the week.';
  }

  for (const day of days) {
    const dayActivities = weeklyData[day];
    if (Array.isArray(dayActivities) && dayActivities.length > 0) {
      const activities = dayActivities
        .map((item: any) => item?.title || item?.description)
        .filter(Boolean);

      if (activities.length > 0) {
        prompt += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${activities.join('; ')}\n`;
      }
    }
  }

  return prompt;
}

// Parser for Gemini output
function parseGeminiSummaries(text: string) {
  // Example Gemini output:
  // Monday: Completed 3/3 priorities. Focus: Project planning.
  // Tuesday: ...
  const lines = text.split('\n').filter(Boolean);
  return lines.map(line => {
    const [dayPart, ...rest] = line.split(':');
    const [summary, focusPart] = rest.join(':').split('Focus:');
    return {
      day: dayPart.trim(),
      summary: summary?.trim() || '',
      focus: focusPart?.trim() || '',
    };
  });
}