
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, MoodEntry, StudyTask, WellnessInsight, UserProfile, AppState, Resource, AppStats } from "../types.ts";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Performs OCR on an image or PDF using Gemini.
 */
export const performOCR = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: "Act as a high-precision OCR engine. Extract all text from this document/image. Maintain the logical structure and formatting. If it's a table, represent it as a markdown table. If it's handwriting, do your best to transcribe it accurately. Output ONLY the extracted text."
            }
          ]
        }
      ]
    });
    return response.text || "";
  } catch (e) {
    console.error("OCR failed", e);
    return "";
  }
};

export const transcribeYoutubeVideo = async (url: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "AI Service not configured.";

  const prompt = `SEARCH AND TRANSCRIBE: Find the content, main summary, and key takeaways for the YouTube video at this URL: ${url}. 
  Use Google Search grounding to find the actual transcript or detailed descriptions from the web.
  If the video is a specific educational tutorial, provide the core steps and concepts discussed.
  Output a clean, structured summary.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Failed to find content for this video URL via search.";
  } catch (e) {
    console.error("YouTube sync failed", e);
    return "Service error while retrieving video details.";
  }
};

export const generateStudyPlan = async (subjects: Subject[]): Promise<Partial<StudyTask>[]> => {
  const ai = getAI();
  if (!ai) return [];

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
  const ai = getAI();
  if (!ai) return [];

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
  const ai = getAI();
  if (!ai) return { summary: "Offline", tips: [], burnoutWarning: false, correlation: "" };

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
  context: { 
    subjects: Subject[], 
    tasks: StudyTask[], 
    moods: MoodEntry[],
    stats: AppStats
  }, 
  messages: { role: 'user' | 'assistant', content: string, attached?: Resource[] }[]
): Promise<string> => {
  const ai = getAI();
  if (!ai) return "AI Service not configured.";

  const completionRate = context.tasks.length > 0 ? Math.round((context.tasks.filter(t => t.completed).length / context.tasks.length) * 100) : 0;
  const lastMood = context.moods[context.moods.length - 1];

  const systemInstruction = `You are the MindTrack Neural Assistant. You have full visibility into the student's holistic data ecosystem.

STUDENT IDENTITY (PROFILE):
- Name: ${profile.name}
- Stream: ${profile.stream}
- Year: ${profile.collegeYear}
- Age: ${profile.age}
- Blood Type: ${profile.bloodType}
- Bio/Goals: ${profile.bio || "No specific goals set yet."}

ACADEMIC VELOCITY (DASHBOARD):
- Total Subjects: ${context.subjects.length}
- Task Completion: ${completionRate}% (${context.tasks.filter(t=>!t.completed).length} pending tasks)
- System XP: ${context.stats.points} (Level ${context.stats.level}, ${context.stats.streak} day streak)

WELLNESS JOURNAL (LAST 5 LOGS):
${JSON.stringify(context.moods.slice(-5))}

GROUNDING RULES (STRICT - NO HALLUCINATION):
1. USE ONLY PROVIDED DATA: If the user asks about their progress, cite the ${completionRate}% rate. If they ask about wellness, cite the specific health symptoms or mood scores from the journal.
2. NO DELUSIONS: Do not make up subjects the student isn't taking. Do not invent medical diagnoses. If asked for medical advice, provide nutritional/wellness patterns from the log but always advise seeing a professional.
3. RESOURCE INTEGRATION: If a resource is attached (notes, PDF OCR, etc.), prioritize its content for academic answers.
4. PERSONALIZED ADVICE: Use the Bio/Goals to frame advice. If the goal is "Pass Calculus", focus strategy on math tasks.

MANDATORY RESPONSE FORMATS:
- For NUTRITION/FOOD: Start with a macro analysis. Provide Markdown Table: | Food Item | Protein | Fat | Carbs | Calories |. Link macros to focus levels.
- For STUDY/TASKS: Start with current velocity. Provide Markdown Table: | Subject | Task | Status | Priority |.
- For WELLNESS/HEALTH: Start with biometric summary. Provide Markdown Table: | Metric | Value | Status/Trend |. Identify correlations between sleep/mood and study streaks.`;

  const geminiContents = messages.map(msg => {
    const parts: any[] = [];
    
    if (msg.attached) {
      msg.attached.forEach(res => {
        let resourceContextText = `[ATTACHED RESOURCE: ${res.title}]\nType: ${res.type}\n`;
        if (res.notes) {
          resourceContextText += `EXTRACTED CONTENT/OCR:\n"""\n${res.notes}\n"""\n`;
        }
        parts.push({ text: resourceContextText });

        if (res.fileData) {
          try {
            const mimeTypeMatch = res.fileData.match(/^data:([^;]+);base64,/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
            const base64Data = res.fileData.split(',')[1] || res.fileData;

            if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
              parts.push({
                inlineData: { mimeType, data: base64Data }
              });
            }
          } catch (e) {
            console.error("Error processing attachment binary data:", e);
          }
        }
      });
    }

    parts.push({ text: msg.content });

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts
    };
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: geminiContents,
    config: { systemInstruction }
  });

  return response.text || "Neural bridge timeout. Verify your data stream.";
};
