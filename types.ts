
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export type TaskCategory = 'lecture' | 'assignment' | 'revision' | 'exam-prep';

export interface UserProfile {
  name: string;
  avatar: string;
  gender: string;
  bloodType: string;
  stream: string;
  collegeYear: string;
  bio: string;
  age: number;
}

export interface AppStats {
  points: number;
  level: number;
  streak: number;
  lastCheckInDate: string | null;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string;
  priority: Priority;
  color: string;
}

export interface Resource {
  id: string;
  subjectId: string;
  title: string;
  url?: string;
  notes?: string;
  type: 'video' | 'document' | 'note' | 'file' | 'image';
  fileName?: string;
  fileData?: string; // base64
}

export interface StudyTask {
  id: string;
  subjectId: string;
  task: string;
  completed: boolean;
  scheduledDate: string;
  startTime?: string; // HH:mm format
  category: TaskCategory;
  difficulty: number; // 1-5
}

export interface MoodEntry {
  id: string;
  date: string;
  moodScore: number;
  stressScore: number;
  sleepHours: number;
  sleepQuality: number;
  physicalActivity: number;
  socialConnection: number;
  productivityScore: number;
  waterIntake: number;
  nutritionScore: number;
  journal: string;
  proteinGrams?: number;
  fatGrams?: number;
  carbGrams?: number;
  totalCalories?: number;
  exerciseType?: string;
  healthSymptoms?: string;
  wellnessTags?: string[];
}

export interface StudySession {
  id: string;
  subjectId: string;
  durationMinutes: number;
  date: string;
  type: 'focus' | 'break';
}

export interface WellnessInsight {
  summary: string;
  tips: string[];
  burnoutWarning: boolean;
  correlation: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  selectedModel: string;
  availableModels?: { id: string, name: string }[];
}

export interface AppState {
  profile: UserProfile;
  stats: AppStats;
  subjects: Subject[];
  resources: Resource[];
  studyTasks: StudyTask[];
  moodEntries: MoodEntry[];
  studySessions: StudySession[];
  wellnessInsight: WellnessInsight | null;
  openRouterConfig: OpenRouterConfig;
}
