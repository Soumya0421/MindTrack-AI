
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Subject, StudyTask, MoodEntry, Resource, StudySession, UserProfile, OpenRouterConfig } from './types';
import Dashboard from './components/Dashboard';
import StudyPlanner from './components/StudyPlanner';
import MoodTracker from './components/MoodTracker';
import ResourceManager from './components/ResourceManager';
import ProductivityTracker from './components/ProductivityTracker';
import Settings from './components/Settings';
import AIChatbot from './components/AIChatbot';
import { LayoutDashboard, Calendar, Smile, Library, Menu, Brain, Sparkles, Zap, Settings as SettingsIcon, Cpu, X, Lock } from 'lucide-react';
import { analyzeWellness as analyzeWellnessGemini } from './services/geminiService';
import { analyzeWellness as analyzeWellnessOpenRouter } from './services/openRouterService';

const INITIAL_STATE: AppState = {
  profile: {
    name: '',
    avatar: '',
    gender: 'Not Specified',
    bloodType: '',
    stream: '',
    collegeYear: '1st',
    bio: '',
    age: 0
  },
  stats: {
    points: 0,
    level: 1,
    streak: 0,
    lastCheckInDate: null
  },
  subjects: [],
  resources: [],
  studyTasks: [],
  moodEntries: [],
  studySessions: [],
  wellnessInsight: null,
  openRouterConfig: {
    apiKey: '',
    selectedModel: 'google/gemini-flash-1.5'
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('mindtrack_v4_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  
  const isProfileComplete = useMemo(() => {
    return (
      state.profile.name.trim() !== '' &&
      state.profile.stream.trim() !== '' &&
      state.profile.gender !== 'Not Specified' &&
      state.profile.bloodType.trim() !== '' &&
      state.profile.age > 0 &&
      state.openRouterConfig.apiKey.trim() !== ''
    );
  }, [state.profile, state.openRouterConfig.apiKey]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'mood' | 'resources' | 'productivity' | 'settings'>(
    isProfileComplete ? 'dashboard' : 'settings'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindtrack_v4_state', JSON.stringify(state));
  }, [state]);

  // Force settings if incomplete
  useEffect(() => {
    if (!isProfileComplete && activeTab !== 'settings') {
      setActiveTab('settings');
    }
  }, [isProfileComplete, activeTab]);

  // Enhanced Periodic Wellness Synchronization with full state context
  useEffect(() => {
    const syncWellness = async () => {
      if (state.moodEntries.length > 0 && isProfileComplete) {
        try {
          const insight = state.openRouterConfig.apiKey 
            ? await analyzeWellnessOpenRouter(state.openRouterConfig, state.moodEntries, state.studyTasks)
            : await analyzeWellnessGemini(state);
          setState(prev => ({ ...prev, wellnessInsight: insight }));
        } catch (e) {
          console.error("Wellness sync failed", e);
        }
      }
    };
    
    syncWellness();
  }, [state.moodEntries.length, state.studyTasks.length, state.studySessions.length, state.openRouterConfig.apiKey, isProfileComplete]);

  const addPoints = (amount: number) => {
    setState(prev => {
      const newPoints = prev.stats.points + amount;
      const xpNextLevel = (prev.stats.level + 1) * 1000;
      if (newPoints >= xpNextLevel) {
        return {
          ...prev,
          stats: { ...prev.stats, points: newPoints, level: prev.stats.level + 1 }
        };
      }
      return { ...prev, stats: { ...prev.stats, points: newPoints } };
    });
  };

  const handleDailyCheckIn = () => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => {
      if (prev.stats.lastCheckInDate === today) return prev;
      
      let newStreak = prev.stats.streak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (prev.stats.lastCheckInDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      return {
        ...prev,
        stats: { ...prev.stats, lastCheckInDate: today, streak: newStreak, points: prev.stats.points + 50 }
      };
    });
  };

  const addSubject = (s: Subject) => {
    setState(prev => ({ ...prev, subjects: [...prev.subjects, s] }));
    addPoints(20);
  };
  const deleteSubject = (id: string) => setState(prev => ({ 
    ...prev, 
    subjects: prev.subjects.filter(s => s.id !== id),
    studyTasks: prev.studyTasks.filter(t => t.subjectId !== id),
    resources: prev.resources.filter(r => r.subjectId !== id)
  }));
  
  const addTasks = (tasks: StudyTask[]) => {
    setState(prev => ({ ...prev, studyTasks: [...prev.studyTasks, ...tasks] }));
    addPoints(tasks.length * 5);
  };
  const toggleTask = (id: string) => {
    const isNowCompleted = !state.studyTasks.find(t => t.id === id)?.completed;
    setState(prev => ({
      ...prev,
      studyTasks: prev.studyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
    if (isNowCompleted) addPoints(10);
  };

  const addMood = (entry: MoodEntry) => {
    setState(prev => ({ ...prev, moodEntries: [...prev.moodEntries, entry] }));
    addPoints(15);
  };
  const addResource = (r: Resource) => setState(prev => ({ ...prev, resources: [...prev.resources, r] }));
  const deleteResource = (id: string) => setState(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== id) }));
  const addSession = (session: StudySession) => {
    setState(prev => ({ ...prev, studySessions: [...prev.studySessions, session] }));
    if (session.type === 'focus') addPoints(session.durationMinutes);
  };
  const updateProfile = (profile: UserProfile) => setState(prev => ({ ...prev, profile }));
  const updateConfig = (config: OpenRouterConfig) => setState(prev => ({ ...prev, openRouterConfig: config }));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'planner', label: 'Study Plan', icon: <Calendar size={20} /> },
    { id: 'productivity', label: 'Focus Timer', icon: <Zap size={20} /> },
    { id: 'mood', label: 'Wellness', icon: <Smile size={20} /> },
    { id: 'resources', label: 'Resource Hub', icon: <Library size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transition-all duration-300 ease-in-out transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-[#6366f1] p-3 rounded-2xl text-white shadow-xl shadow-indigo-100"><Brain size={26} /></div>
              <span className="text-2xl font-black text-slate-800 tracking-tighter">MindTrack</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map(item => {
              const isLocked = item.id !== 'settings' && !isProfileComplete;
              return (
                <button 
                  key={item.id} 
                  disabled={isLocked}
                  onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                  className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all duration-300 font-bold text-sm ${
                    activeTab === item.id 
                      ? 'bg-[#6366f1] text-white shadow-2xl shadow-indigo-200 scale-[1.03] active:scale-100' 
                      : isLocked 
                        ? 'text-slate-200 cursor-not-allowed opacity-50' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`${activeTab === item.id ? 'text-white' : isLocked ? 'text-slate-200' : 'text-slate-400'} transition-colors`}>
                      {item.icon}
                    </div>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {isLocked && <Lock size={14} className="text-slate-200" />}
                </button>
              );
            })}
          </nav>
          <div className="p-8 space-y-6">
            <div className="px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center gap-5 group transition-all hover:border-indigo-200">
               <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:text-indigo-600">
                 <Cpu size={18} />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">AI Cluster</p>
                  <p className="text-xs font-black text-slate-700 truncate mt-0.5">
                    {state.openRouterConfig.apiKey ? (state.openRouterConfig.selectedModel.split('/').pop() || 'OpenRouter') : 'System Offline'}
                  </p>
               </div>
            </div>

            <div className="bg-[#161b2e] text-white rounded-[3rem] p-10 space-y-6 relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Global Rank</p>
                    <span className="text-[11px] font-black text-amber-400 uppercase">Tier {Math.floor(state.stats.level / 5) + 1}</span>
                 </div>
                 <p className="text-4xl font-black tabular-nums tracking-tighter">{state.stats.points}</p>
                 <div className="h-2.5 bg-white/10 rounded-full mt-5 overflow-hidden">
                    <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-700 ease-out" style={{width: `${(state.stats.points % 1000) / 10}%`}}></div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 mt-4 text-right">Next Milestone: {1000 - (state.stats.points % 1000)} XP</p>
               </div>
               <Sparkles size={100} className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-24 bg-white border-b border-slate-50 flex items-center justify-between px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <div className="bg-[#6366f1] p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><Brain size={24} /></div>
            <span className="font-black text-slate-800 text-xl tracking-tighter uppercase">MindTrack</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-4 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Menu size={26} />
          </button>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {!isProfileComplete && activeTab !== 'settings' ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-500">
               <div className="p-8 bg-indigo-50 text-indigo-600 rounded-[3rem] shadow-xl shadow-indigo-100">
                 <Lock size={64} strokeWidth={2.5} />
               </div>
               <div className="space-y-4 max-w-lg">
                 <h2 className="text-4xl font-black text-slate-800 tracking-tight">System Initialization Required</h2>
                 <p className="text-lg text-slate-500 font-medium leading-relaxed">
                   Please complete your academic profile and provide an OpenRouter API key in the Settings tab to unlock neural planning and wellness tracking.
                 </p>
               </div>
               <button 
                onClick={() => setActiveTab('settings')}
                className="px-12 py-6 bg-[#6366f1] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
               >
                 Go to Settings
               </button>
            </div>
          ) : (
            <div className="p-6 sm:p-10 md:p-12 lg:p-16 xl:p-20 max-w-[1600px] mx-auto w-full">
              {activeTab === 'dashboard' && <Dashboard state={state} onCheckIn={handleDailyCheckIn} />}
              {activeTab === 'planner' && (
                <StudyPlanner 
                  subjects={state.subjects} 
                  tasks={state.studyTasks} 
                  openRouterConfig={state.openRouterConfig}
                  onAddSubject={addSubject} 
                  onDeleteSubject={deleteSubject} 
                  onAddTasks={addTasks} 
                  onToggleTask={toggleTask} 
                />
              )}
              {activeTab === 'productivity' && <ProductivityTracker subjects={state.subjects} sessions={state.studySessions} onAddSession={addSession} />}
              {activeTab === 'mood' && <MoodTracker onAddMood={addMood} entries={state.moodEntries} />}
              {activeTab === 'resources' && <ResourceManager state={state} onAddResource={addResource} onDeleteResource={deleteResource} />}
              {activeTab === 'settings' && <Settings profile={state.profile} openRouterConfig={state.openRouterConfig} onUpdateProfile={updateProfile} onUpdateConfig={updateConfig} />}
            </div>
          )}
        </div>
        
        {/* Chatbot Overlay - Always accessible if complete */}
        {isProfileComplete && <AIChatbot state={state} onAddTasks={addTasks} onAddResource={addResource} />}
      </main>
    </div>
  );
};

export default App;
