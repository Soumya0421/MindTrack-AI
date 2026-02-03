
import { Subject, MoodEntry, StudyTask, WellnessInsight, UserProfile, OpenRouterConfig } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const fetchModels = async (apiKey: string) => {
  if (!apiKey) throw new Error("API Key required to fetch models");
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    }
  });
  if (!response.ok) throw new Error("Failed to fetch models from OpenRouter");
  const data = await response.json();
  return data.data;
};

const parseJsonResponse = (text: string) => {
  try {
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("The AI returned an invalid response format.");
      }
    }
    throw new Error("The AI returned an invalid response format.");
  }
};

const callOpenRouter = async (config: OpenRouterConfig, systemPrompt: string, userPrompt: string) => {
  if (!config.apiKey) throw new Error("API Key missing");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "MindTrack AI"
    },
    body: JSON.stringify({
      model: config.selectedModel || "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: systemPrompt + " IMPORTANT: You must return ONLY raw JSON. No conversational text." },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenRouter Request Failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from provider");
  
  return parseJsonResponse(content);
};

export const generateStudyPlan = async (config: OpenRouterConfig, subjects: Subject[]): Promise<Partial<StudyTask>[]> => {
  const system = `You are an expert academic planner. Return ONLY a JSON object with a "tasks" array. 
  Each task must have: subjectId, task, scheduledDate (YYYY-MM-DD), startTime (HH:mm), category ('lecture', 'assignment', 'revision', 'exam-prep'), and difficulty (1-5).`;
  
  const prompt = `Generate a 7-day study plan for these subjects: ${JSON.stringify(subjects)}. Distribute tasks logically across working hours. Ensure subjectId matches provided IDs.`;

  try {
    const result = await callOpenRouter(config, system, prompt);
    return result.tasks || [];
  } catch (e) {
    console.error("Study Plan Generation Error:", e);
    return [];
  }
};

export const generateStudyResources = async (config: OpenRouterConfig, profile: UserProfile, subjects: Subject[]): Promise<{title: string, advice: string}[]> => {
  const system = `You are an AI Intelligent Tutor. Return ONLY a JSON object with a "guides" array containing 5 items with "title" and "advice".`;
  const prompt = `Profile: ${JSON.stringify(profile)}. Subjects: ${JSON.stringify(subjects)}. Generate specific study guides.`;
  try {
    const result = await callOpenRouter(config, system, prompt);
    return result.guides || [];
  } catch (e) {
    return [];
  }
};

export const analyzeWellness = async (config: OpenRouterConfig, moodEntries: MoodEntry[], tasks: StudyTask[]): Promise<WellnessInsight> => {
  const system = `Analyze wellness data. Return ONLY a JSON object with: summary, tips (array of strings), burnoutWarning (boolean), and correlation (string).`;
  const prompt = `History: ${JSON.stringify(moodEntries.slice(-7))}. Pending Tasks: ${tasks.filter(t => !t.completed).length}.`;
  try {
    return await callOpenRouter(config, system, prompt);
  } catch (e) {
    return {
      summary: "Neural analysis encountered a provider error. Please check your API settings.",
      tips: ["Check OpenRouter Key", "Try a different model"],
      burnoutWarning: false,
      correlation: "Connection pending."
    };
  }
};
