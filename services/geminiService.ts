
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, MoodEntry, StudyTask, WellnessInsight, UserProfile, AppState, Resource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeYoutubeVideo = async (url: string): Promise<string> => {
  const prompt = `Please provide a detailed summary and a key-point transcript for the YouTube video at this URL: ${url}. 
  If you cannot access the video directly, use your search tools to find information about its content. 
  Focus on educational value and main takeaways.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return response.text || "Failed to transcribe video content.";
};

export const generateStudyPlan = async (subjects: Subject[]): Promise<Partial<StudyTask>[]> => {
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
  Correlate their sleep quality, physical activity, health symptoms, wellness tags, social connection, and mood with their study session frequency and task completion rates.
  Pay special attention to how their nutrition (macros) and any health symptoms affect their focus and productivity.
  Provide a summary of their current mental/physical state, 3 actionable scientific tips for improvement, 
  a burnout warning (boolean), and a specific correlation insight.`;

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

export const sendMultimodalMessage = async (
  profile: UserProfile, 
  context: { subjects: Subject[], tasks: StudyTask[], moodCount: number }, 
  messages: { role: 'user' | 'assistant', content: string, attached?: Resource[] }[]
): Promise<string> => {
  const lastUserMessage = messages[messages.length - 1];
  
  const parts: any[] = [];
  
  // System Instruction Context with Refined Tag Formatting
  const systemInstruction = `You are MindTrack AI assistant. Help with academic scheduling and wellness.
  Student Profile: ${profile.name} (${profile.stream}, Year ${profile.collegeYear}).
  Academic Context: ${context.subjects.length} subjects, ${context.tasks.filter(t => !t.completed).length} pending tasks.
  Provide intelligent and encouraging advice. Use attached resources (including images and notes) as context.

  MANDATORY RESPONSE FORMATS FOR DETECTED CONTEXTS:
  - If the user is asking about FOOD or NUTRITION:
    1. Start with a 2-3 sentence summary of the dietary intake or advice.
    2. Provide a detailed Markdown Table with columns: | Food Item | Protein (g) | Fat (g) | Carbs (g) | Calories |
    3. End with a "Daily Total" row and a brief macro-correlation tip.

  - If the user is asking about STUDY or ACADEMICS:
    1. Start with a progress overview.
    2. Provide a Markdown Table: | Subject | Topic | Status | Recommended Focus |
    3. End with a "Learning Strategy" suggestion.

  - If the user is asking about HEALTH or WELLNESS:
    1. Start with a holistic state summary.
    2. Provide a Markdown Table: | Metric | Current Value | Status/Trend |
    3. End with a scientific wellness directive.

  - If the user is asking about SYMPTOMS or ILLNESS:
    1. Start with a symptom analysis.
    2. Provide a Markdown Table: | Symptom | Intensity (1-5) | Possible Trigger | Duration |
    3. End with a pattern correlation insight.

  - If the user is asking about TASKS or PRODUCTIVITY:
    1. Start with a backlog summary.
    2. Provide a Markdown Table: | Task | Priority | Est. Time | Strategy |
    3. End with a "Next Best Action" highlight.

  - If the user is asking about EVENTS or MILESTONES:
    1. Start with a timeline overview.
    2. Provide a Markdown Table: | Event | Date | Preparation | Importance |
    3. End with a "Readiness Checklist".`;

  // Build the message parts for the latest interaction
  if (lastUserMessage.attached) {
    for (const res of lastUserMessage.attached) {
      if (res.type === 'image' && res.fileData) {
        const base64Data = res.fileData.split(',')[1] || res.fileData;
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: base64Data
          }
        });
      }
      parts.push({ text: `[ATTACHED RESOURCE: ${res.title}]\nType: ${res.type}\nNotes: ${res.notes || 'N/A'}` });
    }
  }

  parts.push({ text: lastUserMessage.content });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction
    }
  });

  return response.text || "I'm having trouble connecting to my neural network right now.";
};
