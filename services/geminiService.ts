
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, MoodEntry, StudyTask, WellnessInsight, UserProfile, AppState } from "../types";

export const generateStudyPlan = async (subjects: Subject[]): Promise<Partial<StudyTask>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate a daily study plan for the next 7 days based on these subjects: ${JSON.stringify(subjects)}. 
  Distribute tasks intelligently across the day. 
  Assign a category ('lecture', 'assignment', 'revision', 'exam-prep'), difficulty (1-5), and a logical startTime (HH:mm format between 08:00 and 22:00) to each task.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subjectId: { type: Type.STRING },
                task: { type: Type.STRING },
                scheduledDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                startTime: { type: Type.STRING, description: "HH:mm" },
                category: { type: Type.STRING },
                difficulty: { type: Type.NUMBER }
              },
              required: ["subjectId", "task", "scheduledDate", "startTime", "category", "difficulty"]
            }
          }
        },
        required: ["tasks"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data.tasks || [];
  } catch (e) {
    console.error("Failed to parse study plan", e);
    return [];
  }
};

export const generateStudyResources = async (profile: UserProfile, subjects: Subject[]): Promise<{title: string, advice: string}[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as an AI Intelligent Tutor. Based on this profile: ${JSON.stringify(profile)} 
  and these subjects: ${JSON.stringify(subjects)}, generate 5 specific study resource guides or conceptual frameworks the student should follow.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          guides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                advice: { type: Type.STRING }
              },
              required: ["title", "advice"]
            }
          }
        },
        required: ["guides"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data.guides || [];
  } catch (e) {
    return [];
  }
};

export const analyzeWellness = async (state: AppState): Promise<WellnessInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Package the most relevant data for analysis
  const snapshot = {
    profile: state.profile,
    subjects: state.subjects.map(s => ({ name: s.name, priority: s.priority })),
    recentMoods: state.moodEntries.slice(-10),
    taskBacklog: state.studyTasks.filter(t => !t.completed).length,
    completedTasks: state.studyTasks.filter(t => t.completed).length,
    sessions: state.studySessions.slice(-14),
    resources: state.resources.length
  };

  const prompt = `Act as a Neural Wellness Consultant. Analyze this student's holistic lifecycle data: ${JSON.stringify(snapshot)}. 
  Correlate their sleep quality, physical activity (including exercise type and macros if provided like protein/carbs/fats), social connection, and mood with their study session frequency and task completion rates.
  Pay special attention to how their nutrition (macros) affects their focus and productivity.
  Provide a summary of their current mental/physical state, 3 actionable scientific tips for improvement, 
  a burnout warning (boolean), and a specific correlation insight (e.g., 'You complete 40% more tasks when your protein intake is high and you have 7+ hours of high-quality sleep').`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          burnoutWarning: { type: Type.BOOLEAN },
          correlation: { type: Type.STRING }
        },
        required: ["summary", "tips", "burnoutWarning", "correlation"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      summary: "Neural state analysis pending more data streams.",
      tips: ["Prioritize consistent sleep rhythm", "Incremental movement breaks", "Hydration optimization"],
      burnoutWarning: false,
      correlation: "Not enough historical depth for biometric correlation yet."
    };
  }
};
