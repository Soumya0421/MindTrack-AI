
import React, { useState, useRef, useEffect } from 'react';
import { AppState, Resource, StudyTask } from '../types';
import { 
  X, Send, Bot, User, Sparkles, Brain, Paperclip, 
  Library, Link as LinkIcon, FileText, Plus, ChevronDown,
  Utensils, BookOpen, Heart, Activity, ListChecks, CalendarDays, AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMultimodalMessage } from '../services/geminiService';

interface Props {
  state: AppState;
  onAddTasks?: (tasks: StudyTask[]) => void;
  onAddResource?: (resource: Resource) => void;
}

interface PromptTag {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  borderColor: string;
  placeholder: string;
  contextPrompt: string;
}

const AIChatbot: React.FC<Props> = ({ state, onAddTasks, onAddResource }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; attached?: Resource[] }[]>([
    { role: 'assistant', content: "Neural Link initialized. How can I assist with your productivity flow today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<Resource[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const PROMPT_TAGS: PromptTag[] = [
    { 
      id: "food",
      label: "FOOD", 
      icon: <Utensils size={14} />, 
      color: "bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]", 
      activeColor: "bg-[#ea580c] text-white border-[#ea580c]",
      borderColor: "border-orange-200",
      placeholder: "What did you eat? Or ask for a nutrition summary...",
      contextPrompt: "Context: FOOD and NUTRITION tracking. Provide a summary and a detailed nutritional breakdown table."
    },
    { 
      id: "study",
      label: "STUDY", 
      icon: <BookOpen size={14} />, 
      color: "bg-[#eef2ff] text-[#4f46e5] border-[#e0e7ff]", 
      activeColor: "bg-[#4f46e5] text-white border-[#4f46e5]",
      borderColor: "border-indigo-200",
      placeholder: "Ask about subjects or techniques...",
      contextPrompt: "Context: STUDY and ACADEMIC optimization. Provide a progress overview and a subject focus table."
    },
    { 
      id: "health",
      label: "HEALTH", 
      icon: <Heart size={14} />, 
      color: "bg-[#fff1f2] text-[#e11d48] border-[#ffe4e6]", 
      activeColor: "bg-[#e11d48] text-white border-[#e11d48]",
      borderColor: "border-rose-200",
      placeholder: "Ask about sleep, stress, or wellness...",
      contextPrompt: "Context: HEALTH and WELLNESS monitoring. Provide a holistic summary and a biometric metrics table."
    },
    { 
      id: "symptoms",
      label: "SYMPTOMS", 
      icon: <Activity size={14} />, 
      color: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]", 
      activeColor: "bg-[#16a34a] text-white border-[#16a34a]",
      borderColor: "border-emerald-200",
      placeholder: "Describe feeling or triggers...",
      contextPrompt: "Context: SYMPTOMS and ILLNESS analysis. Provide a clinical analysis and a symptom intensity table."
    },
    { 
      id: "tasks",
      label: "TASKS", 
      icon: <ListChecks size={14} />, 
      color: "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]", 
      activeColor: "bg-[#d97706] text-white border-[#d97706]",
      borderColor: "border-amber-200",
      placeholder: "Prioritize backlog...",
      contextPrompt: "Context: TASKS and PRODUCTIVITY management. Provide a priority summary and a task allocation table."
    },
    { 
      id: "events",
      label: "EVENTS", 
      icon: <CalendarDays size={14} />, 
      color: "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]", 
      activeColor: "bg-[#2563eb] text-white border-[#2563eb]",
      borderColor: "border-blue-200",
      placeholder: "Upcoming milestones...",
      contextPrompt: "Context: EVENTS and MILESTONES. Provide a timeline overview and an event preparation table."
    }
  ];

  const handleTagClick = (tag: PromptTag) => {
    if (activeTagId === tag.id) {
      setActiveTagId(null);
    } else {
      setActiveTagId(tag.id);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    const userMsg = input.trim();
    const activeTag = PROMPT_TAGS.find(t => t.id === activeTagId);
    
    // If a tag is active and input is empty, use the tag's context as the prompt
    let finalUserMsg = userMsg;
    if (!userMsg && activeTag) {
        finalUserMsg = `Please analyze my ${activeTag.label} status and provide the required summary and breakdown table.`;
    }
    
    if ((!finalUserMsg && selectedAttachments.length === 0) || isLoading) return;

    // Prepend the context prompt for the AI's logic
    const contextContent = activeTag ? `[TAG: ${activeTag.label}] ${activeTag.contextPrompt}\n\n${finalUserMsg}` : finalUserMsg;

    const currentAttachments = [...selectedAttachments];
    setInput('');
    setActiveTagId(null); 
    setSelectedAttachments([]);
    setShowAttachMenu(false);
    setError('');
    
    const newUserMessage = { role: 'user' as const, content: contextContent, attached: currentAttachments };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const responseContent = await sendMultimodalMessage(
        state.profile,
        { subjects: state.subjects, tasks: state.studyTasks, moodCount: state.moodEntries.length },
        newMessages
      );

      setMessages(prev => [...prev, { role: 'assistant', content: responseContent || "Neural processing complete." }]);
    } catch (e: any) {
      setError(e.message || "An unexpected neural sync error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttachment = (res: Resource) => {
    setSelectedAttachments(prev => 
      prev.find(a => a.id === res.id) 
        ? prev.filter(a => a.id !== res.id) 
        : [...prev, res]
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 px-6 py-4 bg-[#0a0c10] text-white rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 transition-all z-[100] border border-white/10 group flex items-center gap-5"
      >
        <div className="p-2.5 bg-[#6366f1] rounded-2xl shadow-xl group-hover:bg-indigo-400 transition-colors shadow-indigo-500/20">
          <Brain size={24} />
        </div>
        <div className="text-left hidden md:block">
          <span className="font-black text-[15px] block tracking-tight">Neural Link</span>
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">ACTIVE BRIDGE</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[450px] h-[100dvh] md:h-[780px] bg-white rounded-none md:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col border border-slate-100 z-[110] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className="p-6 md:p-8 bg-[#1a1c2e] text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2.5 bg-[#6366f1] rounded-[1rem] shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="font-black text-lg block tracking-tight">Neural Link</span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">SYNCHRONIZED</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors relative z-10">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-indigo-50 text-indigo-600' : 'bg-[#161b2e] text-white'}`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[85%] space-y-2`}>
              <div className={`p-5 rounded-[2rem] text-[13px] font-medium leading-relaxed shadow-sm ${
                m.role === 'user' ? 'bg-[#4f46e5] text-white' : 'bg-[#f8fafc] text-[#1e293b] border border-[#f1f5f9]'
              }`}>
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content.includes('[TAG:') ? m.content.split('\n\n').slice(1).join('\n\n') : m.content}
                    </ReactMarkdown>
                </div>
              </div>
              {m.attached && m.attached.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.attached.map(res => (
                    <div key={res.id} className="px-3 py-1.5 bg-[#eef2ff] border border-[#e0e7ff] rounded-xl text-[9px] font-black text-[#4f46e5] uppercase flex items-center gap-2">
                      {res.type === 'image' ? <ImageIcon size={10} /> : <Paperclip size={10} />} {res.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 items-center p-4 bg-slate-50/50 rounded-[2rem] border border-slate-50 border-dashed">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Neural Processing...</span>
          </div>
        )}
        {error && (
           <div className="p-5 bg-[#fff1f2] border border-[#ffe4e6] rounded-[1.5rem] flex items-center gap-4 text-[#e11d48] text-[12px] font-black animate-in slide-in-from-bottom-2">
             <div className="shrink-0 p-2 bg-[#ffe4e6] rounded-xl flex items-center justify-center text-[#e11d48]"><AlertCircle size={18}/></div>
             <p className="flex-1 leading-relaxed">{error}</p>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-slate-50 space-y-4 shrink-0 overflow-visible relative">
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {PROMPT_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className={`flex items-center gap-3 px-5 py-3 border-2 rounded-full text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 ${
                  activeTagId === tag.id ? tag.activeColor : `${tag.color} hover:shadow-md`
                }`}
              >
                {tag.icon}
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {selectedAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1 animate-in slide-in-from-bottom-2">
            {selectedAttachments.map(res => (
              <div key={res.id} className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-xl text-[10px] font-black flex items-center gap-2 shadow-lg">
                {res.type === 'image' ? <ImageIcon size={12} /> : <Paperclip size={12} />} {res.title}
                <button onClick={() => toggleAttachment(res)} className="hover:text-rose-300 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAttachMenu && (
          <div className="absolute bottom-[100%] left-6 right-6 mb-4 bg-white p-6 rounded-[2.5rem] border border-[#f1f5f9] space-y-4 animate-in slide-in-from-bottom-4 duration-300 max-h-[350px] overflow-y-auto custom-scrollbar shadow-[0_-25px_60px_-20px_rgba(0,0,0,0.2)] z-[120]">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Vault</p>
              <button onClick={() => setShowAttachMenu(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><ChevronDown size={18}/></button>
            </div>
            <div className="grid gap-3">
              {state.resources.map(res => {
                const isSelected = !!selectedAttachments.find(a => a.id === res.id);
                return (
                  <button 
                    key={res.id}
                    onClick={() => toggleAttachment(res)}
                    className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all border ${
                      isSelected ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-xl' : 'bg-[#f8fafc] text-[#475569] border-[#f1f5f9] hover:border-[#4f46e5]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                      {res.type === 'video' ? <LinkIcon size={14} /> : res.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate">{res.title}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>
                        {res.type}
                      </p>
                    </div>
                    {isSelected && <X size={14} className="rotate-45" />}
                  </button>
                );
              })}
              {state.resources.length === 0 && (
                <div className="text-center py-10">
                  <Library className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Vault is vacant</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setShowAttachMenu(!showAttachMenu)} 
            className={`p-4 rounded-2xl transition-all shadow-sm ${showAttachMenu ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-[#f8fafc] text-slate-400 hover:bg-[#f1f5f9]'}`}
          >
            <Paperclip size={22} />
          </button>
          <div className="flex-1 relative">
            <input 
              ref={inputRef} 
              type="text" 
              placeholder={activeTagId ? PROMPT_TAGS.find(t => t.id === activeTagId)?.placeholder : "Query neural network..."}
              className="w-full pl-6 pr-14 py-5 bg-[#f8fafc] rounded-full border-none text-[13px] font-bold text-[#1e293b] outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 shadow-inner"
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={(!input.trim() && !activeTagId && selectedAttachments.length === 0) || isLoading} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-[#6366f1] text-white rounded-full shadow-lg hover:bg-[#4f46e5] hover:scale-105 disabled:opacity-50 transition-all active:scale-90"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
