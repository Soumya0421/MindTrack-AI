
import React, { useState, useRef, useEffect } from 'react';
import { AppState, Resource, StudyTask } from '../types';
import { 
  X, Send, Bot, User, Sparkles, Brain, AlertCircle, Utensils, 
  Book, HeartPulse, Stethoscope, Paperclip, Youtube, 
  Library, Trash2, Link as LinkIcon, Plus
} from 'lucide-react';
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
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Neural Link initialized. I am your high-performance academic and wellness architect. Attach a resource or paste a YouTube link to begin our collaborative optimization." }
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

  // OpenRouter / OpenAI Compatible Tool Definitions
  const tools = [
    {
      type: "function",
      function: {
        name: "create_study_schedule",
        description: "Generate and post multiple study tasks to the user's planner based on the analyzed material.",
        parameters: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subjectId: { type: "string", description: "The ID of the relevant subject from the provided context." },
                  task: { type: "string", description: "Detailed task name (e.g., 'Review Newton's Laws Summary')." },
                  scheduledDate: { type: "string", description: "The date for the task in YYYY-MM-DD format." },
                  startTime: { type: "string", description: "The start time in 24h HH:mm format." },
                  category: { type: "string", enum: ["lecture", "assignment", "revision", "exam-prep"] }
                },
                required: ["subjectId", "task", "scheduledDate", "startTime", "category"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "create_academic_note",
        description: "Save a structured academic note or summary directly to the user's Resource Hub.",
        parameters: {
          type: "object",
          properties: {
            subjectId: { type: "string", description: "ID of the subject this note belongs to." },
            title: { type: "string", description: "Clear and descriptive note title." },
            content: { type: "string", description: "The full markdown-formatted content of the note." }
          },
          required: ["subjectId", "title", "content"]
        }
      }
    }
  ];

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    if (!overrideInput) setInput('');
    setError('');
    
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    const systemInstruction = `
      SYSTEM IDENTITY: You are MindTrack Neural Assistant. You operate via the OpenRouter backbone.
      
      USER CONTEXT:
      - Name: ${state.profile.name}
      - Academic Stream: ${state.profile.stream}
      - Biological Profile: Age ${state.profile.age}, Blood Type ${state.profile.bloodType}, Gender ${state.profile.gender}
      - Active Subjects: ${JSON.stringify(state.subjects.map(s => ({id: s.id, name: s.name})))}
      
      ATTACHED CONTEXT (ACTIVE REFERENCE):
      ${JSON.stringify(attachedResources.map(r => ({title: r.title, type: r.type, notes: r.notes, url: r.url})))}

      CAPABILITIES:
      1. NUTRITION: Analyze dietary input and suggest improvements for focus.
      2. SCHEDULING: If analyzing a YouTube link or document, automatically generate a study schedule using create_study_schedule.
      3. ARCHIVING: Capture critical concepts into notes using create_academic_note.
      4. WELLNESS: Conduct health check-ups for symptoms like eye strain, fatigue, or stress.
      
      MODUS OPERANDI:
      - For YouTube links: Summarize the content, identify key learning objectives, and OFFER to create a schedule or note.
      - Correlate biological states (from Bio check-ins) with study productivity.
      - Be direct, clinical yet empathetic, and high-performance focused.
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${state.openRouterConfig.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "MindTrack AI"
        },
        body: JSON.stringify({
          model: state.openRouterConfig.selectedModel || "google/gemini-flash-1.5",
          messages: [
            { role: "system", content: systemInstruction },
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ],
          tools: tools,
          tool_choice: "auto"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "OpenRouter Synchronization Failed.");
      }

      const data = await response.json();
      const message = data.choices[0].message;

      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'create_study_schedule' && onAddTasks) {
            const tasks = args.tasks.map((t: any) => ({
              ...t,
              id: crypto.randomUUID(),
              completed: false,
              difficulty: 3
            }));
            onAddTasks(tasks);
            setMessages(prev => [...prev, { role: 'assistant', content: `Neural sync successful. I have automatically generated ${tasks.length} tasks and posted them to your Study Schedule based on the provided material.` }]);
          } else if (toolCall.function.name === 'create_academic_note' && onAddResource) {
            const note: Resource = {
              id: crypto.randomUUID(),
              subjectId: args.subjectId,
              title: args.title,
              notes: args.content,
              type: 'note'
            };
            onAddResource(note);
            setMessages(prev => [...prev, { role: 'assistant', content: `Archive updated. I have posted a structured note titled "${note.title}" to your Resource Hub.` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: message.content || "Neural data stream processed." }]);
      }
    } catch (e: any) {
      console.error("AI Error:", e);
      setError(e.message || "Neural link failure.");
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural synchronization error. Please verify your OpenRouter credentials." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: 'Food' | 'Study' | 'Health' | 'Symptom') => {
    switch (tag) {
      case 'Food': handleSend('Analyze my nutrition and suggest focus-boosting meals.'); break;
      case 'Study': handleSend('Generate an automated study schedule based on my current backlog.'); break;
      case 'Health': handleSend('Analyze my biometric trends and burnout risk.'); break;
      case 'Symptom': handleSend('Wellness Check-up: I have some symptoms (e.g. fatigue, headache).'); break;
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
    const url = prompt("Enter YouTube URL for deep analysis:");
    if (url) {
      const newRes: Resource = {
        id: crypto.randomUUID(),
        subjectId: state.subjects[0]?.id || '',
        title: "YouTube: " + (url.split('v=')[1]?.substring(0, 8) || "Video Source"),
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
            <span className="font-black text-xs md:text-sm block tracking-tight">Neural Link</span>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Link</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-[500px] h-[100dvh] md:h-[800px] bg-white rounded-none md:rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] flex flex-col border border-slate-100 z-[100] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      {/* Header */}
      <div className="p-6 md:p-10 bg-[#161b2e] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-indigo-500 rounded-2xl shadow-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="font-black text-lg md:text-xl block tracking-tight">Neural Link</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">OpenRouter Stream</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 md:gap-6 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-md ${m.role === 'user' ? 'bg-slate-50 text-indigo-600 border border-slate-100' : 'bg-[#161b2e] text-white'}`}>
              {m.role === 'user' ? <User size={22} /> : <Bot size={22} />}
            </div>
            <div className={`max-w-[85%] p-6 md:p-8 rounded-[2.5rem] text-sm md:text-base leading-relaxed font-semibold shadow-sm markdown-content ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4">Streaming Contextual Data...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Tools Area */}
      <div className="p-6 md:p-10 bg-white border-t border-slate-50 space-y-6 shrink-0 relative">
        
        {/* Context Attachment Preview */}
        {attachedResources.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
            {attachedResources.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl group shadow-sm">
                {r.type === 'video' ? <Youtube size={14} className="text-rose-500" /> : <Library size={14} className="text-indigo-500" />}
                <span className="text-[11px] font-black text-indigo-600 truncate max-w-[120px]">{r.title}</span>
                <button onClick={() => removeAttachment(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Action Tags */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => handleTagClick('Food')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all shadow-sm">
            <Utensils size={14} className="text-amber-500" /> Food
          </button>
          <button onClick={() => handleTagClick('Study')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all shadow-sm">
            <Book size={14} className="text-blue-500" /> Study
          </button>
          <button onClick={() => handleTagClick('Health')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-50 transition-all shadow-sm">
            <HeartPulse size={14} className="text-rose-500" /> Health
          </button>
          <button onClick={() => handleTagClick('Symptom')} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-all shadow-sm">
            <Stethoscope size={14} /> Symptom
          </button>
        </div>

        {/* Attachment Popup */}
        {showAttachMenu && (
          <div className="absolute bottom-full left-10 mb-6 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-6 w-80 z-20 animate-in slide-in-from-bottom-4">
             <div className="space-y-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Attach To Chat Context</p>
                <button onClick={handleYoutubeAttach} className="w-full flex items-center gap-5 p-4 hover:bg-rose-50 rounded-2xl transition-all text-slate-700">
                  <Youtube className="text-rose-500" size={20} /> <span className="text-sm font-bold">YouTube Analysis</span>
                </button>
                <div className="border-t border-slate-50 pt-4">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2 px-2">Knowledge Vault</p>
                   <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                      {state.resources.map(r => (
                        <button key={r.id} onClick={() => attachFromHub(r)} className="w-full flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-xl text-left transition-colors">
                           <Library size={18} className="text-indigo-400" /> <span className="text-xs font-bold truncate text-slate-600">{r.title}</span>
                        </button>
                      ))}
                      {state.resources.length === 0 && <p className="text-[10px] text-slate-300 p-4 italic text-center">Your Vault is empty.</p>}
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {/* Main Input Control */}
        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black border border-rose-100 mb-2 flex items-center gap-2 animate-in shake"><AlertCircle size={16}/> {error}</div>}
        
        <div className="flex gap-4 items-center bg-slate-50 rounded-[3rem] p-3 pl-6 border border-slate-100 shadow-inner focus-within:ring-8 focus-within:ring-indigo-500/5 transition-all">
          <button 
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-4 rounded-full transition-all shadow-sm ${showAttachMenu ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
          >
            <Paperclip size={22} />
          </button>
          <input 
            type="text"
            placeholder="Ask anything or command automated tasks..."
            className="flex-1 bg-transparent border-none text-base font-bold text-slate-800 outline-none py-4 placeholder:text-slate-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-6 bg-indigo-500 text-white rounded-[2.5rem] hover:bg-indigo-600 shadow-xl disabled:opacity-50 active:scale-95 transition-all"
          >
            <Send size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
