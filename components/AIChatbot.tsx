
import React, { useState, useRef, useEffect } from 'react';
import { AppState, Resource, StudyTask } from '../types';
import { 
  X, Send, Bot, User, Sparkles, Brain, AlertCircle, Utensils, 
  Book, HeartPulse, Stethoscope, Paperclip, Youtube, 
  Library, Trash2, Link as LinkIcon, Plus
} from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  state: AppState;
  onAddTasks?: (tasks: StudyTask[]) => void;
  onAddResource?: (resource: Resource) => void;
}

const AIChatbot: React.FC<Props> = ({ state, onAddTasks, onAddResource }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "Neural Link initialized. I've analyzed your academic profile, focus trends, and wellness history. Attach a resource or ask anything to begin." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedResources, setAttachedResources] = useState<Resource[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // Tool Definitions for creating content
  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'create_study_schedule',
      parameters: {
        type: Type.OBJECT,
        description: 'Automatically create study tasks in the planner based on attached context.',
        properties: {
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subjectId: { type: Type.STRING, description: 'ID of existing subject' },
                task: { type: Type.STRING, description: 'Task title' },
                scheduledDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
                startTime: { type: Type.STRING, description: 'HH:mm format' },
                category: { type: Type.STRING, enum: ['lecture', 'assignment', 'revision', 'exam-prep'] }
              },
              required: ['subjectId', 'task', 'scheduledDate', 'startTime', 'category']
            }
          }
        },
        required: ['tasks']
      }
    },
    {
      name: 'create_academic_note',
      parameters: {
        type: Type.OBJECT,
        description: 'Create a permanent note in the Resource Hub based on chat context or attached material.',
        properties: {
          subjectId: { type: Type.STRING, description: 'ID of existing subject' },
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: 'Detailed markdown content for the note' }
        },
        required: ['subjectId', 'title', 'content']
      }
    }
  ];

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    if (!overrideInput) setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const context = `
      USER CONTEXT:
      - Name: ${state.profile.name}
      - Major: ${state.profile.stream}
      - Age: ${state.profile.age}
      - Blood: ${state.profile.bloodType}
      - Gender: ${state.profile.gender}
      - Available Subjects: ${JSON.stringify(state.subjects.map(s => ({id: s.id, name: s.name})))}
      
      ATTACHED RESOURCES (Active Context):
      ${JSON.stringify(attachedResources.map(r => ({title: r.title, type: r.type, notes: r.notes, url: r.url})))}

      SYSTEM INSTRUCTION: You are the MindTrack Assistant. You can create schedules and notes using tools.
      
      CATEGORIES:
      1. FOOD: Provide nutrient analysis and its impact on study focus.
      2. HEALTH: Analyze biometrics and stress levels.
      3. STUDY: Suggest plans and refer to attached Resource Vault knowledge.
      4. SYMPTOM: Perform a structured wellness check-up correlating with recent sleep/mood logs.
      
      If the user wants to save information as a note or schedule a task, call the appropriate function.
      When summarizing YouTube links, use the provided metadata to create a structured outline.
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: context,
          tools: [{ functionDeclarations }]
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'create_study_schedule' && onAddTasks) {
            const tasks = (fc.args.tasks as any[]).map(t => ({
              ...t,
              id: crypto.randomUUID(),
              completed: false,
              difficulty: 3
            }));
            onAddTasks(tasks);
            setMessages(prev => [...prev, { role: 'model', content: `Neural synchronization complete. I have automatically posted ${tasks.length} tasks to your Study Schedule.` }]);
          } else if (fc.name === 'create_academic_note' && onAddResource) {
            const note: Resource = {
              id: crypto.randomUUID(),
              subjectId: fc.args.subjectId as string,
              title: fc.args.title as string,
              notes: fc.args.content as string,
              type: 'note'
            };
            onAddResource(note);
            setMessages(prev => [...prev, { role: 'model', content: `Knowledge Archive updated. Note "${note.title}" has been posted to your Resource Hub.` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', content: response.text || "Neural stream processed." }]);
      }
    } catch (e: any) {
      console.error("AI Error:", e);
      setError(e.message || "Neural link failure.");
      setMessages(prev => [...prev, { role: 'model', content: "Neural sync error encountered. Check connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: 'Food' | 'Study' | 'Health' | 'Symptom') => {
    switch (tag) {
      case 'Food': handleSend('Analyze nutrition for: '); break;
      case 'Study': handleSend('Suggest a personalized study plan based on my backlog.'); break;
      case 'Health': handleSend('Analyze my recent biometrics and wellness data.'); break;
      case 'Symptom': handleSend('Wellness Check-up: I am feeling (describe symptoms)...'); break;
    }
  };

  const attachFromHub = (resource: Resource) => {
    if (!attachedResources.find(r => r.id === resource.id)) {
      setAttachedResources(prev => [...prev, resource]);
    }
    setShowAttachMenu(false);
  };

  const removeAttachment = (id: string) => {
    setAttachedResources(prev => prev.filter(r => r.id !== id));
  };

  const handleYoutubeAttach = () => {
    const url = prompt("Enter YouTube Link:");
    if (url) {
      const newRes: Resource = {
        id: crypto.randomUUID(),
        subjectId: state.subjects[0]?.id || '',
        title: "YouTube Source",
        url: url,
        type: 'video'
      };
      setAttachedResources(prev => [...prev, newRes]);
    }
    setShowAttachMenu(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 p-4 md:p-6 bg-[#161b2e] text-white rounded-[2.5rem] shadow-2xl hover:scale-105 transition-all z-[100] border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Brain size={24} />
          </div>
          <div className="text-left pr-2">
            <span className="font-black text-xs md:text-sm block">Neural Link</span>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active System</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-[480px] h-[100dvh] md:h-[750px] bg-white rounded-none md:rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex flex-col border border-slate-100 z-[100] overflow-hidden animate-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[#161b2e] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500 rounded-2xl shadow-xl">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="font-black text-base md:text-lg block tracking-tight">Neural Link</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Live Intelligence</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 bg-white custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 md:gap-5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-md ${m.role === 'user' ? 'bg-slate-50 text-indigo-600 border border-slate-100' : 'bg-[#161b2e] text-white'}`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[88%] p-5 md:p-7 rounded-[2rem] text-sm md:text-base leading-relaxed font-semibold shadow-sm markdown-content ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-2">Synthesizing Context...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-10 bg-white border-t border-slate-50 space-y-4 shrink-0 relative">
        
        {/* Attachments UI */}
        {attachedResources.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachedResources.map(r => (
              <div key={r.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl animate-in zoom-in-95">
                {r.type === 'video' ? <Youtube size={12} className="text-rose-500" /> : <Library size={12} className="text-indigo-500" />}
                <span className="text-[10px] font-black text-indigo-600 truncate max-w-[100px]">{r.title}</span>
                <button onClick={() => removeAttachment(r.id)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Restore all Tags */}
        <div className="flex gap-2 flex-wrap mb-2">
          <button onClick={() => handleTagClick('Food')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all">
            <Utensils size={12} /> Food
          </button>
          <button onClick={() => handleTagClick('Study')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all">
            <Book size={12} /> Study
          </button>
          <button onClick={() => handleTagClick('Health')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all">
            <HeartPulse size={12} /> Health
          </button>
          <button onClick={() => handleTagClick('Symptom')} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-all">
            <Stethoscope size={12} /> Symptom
          </button>
        </div>

        {showAttachMenu && (
          <div className="absolute bottom-full left-10 mb-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-72 z-20 animate-in slide-in-from-bottom-4">
             <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Attach Neural Context</p>
                <button onClick={handleYoutubeAttach} className="w-full flex items-center gap-4 p-3 hover:bg-rose-50 rounded-2xl transition-colors text-slate-700">
                  <Youtube className="text-rose-500" /> <span className="text-xs font-bold">YouTube Source</span>
                </button>
                <div className="border-t border-slate-50 pt-2 max-h-40 overflow-y-auto custom-scrollbar">
                   {state.resources.map(r => (
                     <button key={r.id} onClick={() => attachFromHub(r)} className="w-full flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-2xl text-left">
                        <Library size={16} className="text-indigo-400" /> <span className="text-xs font-bold truncate">{r.title}</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}
        
        <div className="flex gap-4 items-center bg-slate-50 rounded-[2.5rem] p-2 pl-4 border border-slate-100 shadow-inner focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
          <button 
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-3 rounded-full transition-all ${showAttachMenu ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="text"
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none text-sm font-bold text-slate-800 outline-none py-4"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-5 bg-indigo-500 text-white rounded-[2rem] hover:bg-indigo-600 shadow-xl disabled:opacity-50 active:scale-95"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
