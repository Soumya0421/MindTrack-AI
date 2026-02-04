
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
    { role: 'assistant', content: "Neural Link initialized. How can I assist with your productivity flow today?" }
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

  const tools = [
    {
      type: "function",
      function: {
        name: "create_study_schedule",
        description: "Generate and post study tasks based on material.",
        parameters: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subjectId: { type: "string" },
                  task: { type: "string" },
                  scheduledDate: { type: "string" },
                  startTime: { type: "string" },
                  category: { type: "string", enum: ["lecture", "assignment", "revision", "exam-prep"] }
                },
                required: ["subjectId", "task", "scheduledDate", "startTime", "category"]
              }
            }
          },
          required: ["tasks"]
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
            { role: "system", content: "You are MindTrack AI assistant. Help with scheduling and wellness." },
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ],
          tools: tools,
          tool_choice: "auto"
        })
      });

      if (!response.ok) throw new Error("Sync failure.");
      const data = await response.json();
      const message = data.choices[0].message;
      setMessages(prev => [...prev, { role: 'assistant', content: message.content || "Neural processing complete." }]);
    } catch (e: any) {
      setError("Sync error.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 md:p-5 bg-[#161b2e] text-white rounded-[1.5rem] shadow-2xl hover:scale-105 transition-all z-[100] border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="p-1.5 bg-indigo-500 rounded-lg shadow-lg">
            <Brain size={20} />
          </div>
          <div className="text-left hidden md:block">
            <span className="font-black text-xs block">Neural Link</span>
            <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Active Link</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[400px] h-[100dvh] md:h-[600px] bg-white rounded-none md:rounded-[2rem] shadow-2xl flex flex-col border border-slate-100 z-[100] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 md:p-6 bg-[#161b2e] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl">
            <Sparkles size={18} />
          </div>
          <span className="font-black text-sm">Neural Link</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-900 text-white'}`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] p-3.5 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${
              m.role === 'user' ? 'bg-[#6366f1] text-white' : 'bg-slate-50 text-slate-800 border border-slate-100'
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Processing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-50 space-y-4 shrink-0">
        <div className="flex gap-2 items-center bg-slate-50 rounded-2xl p-2 border border-slate-100">
          <input 
            type="text"
            placeholder="Query neural network..."
            className="flex-1 bg-transparent border-none text-[13px] font-bold text-slate-800 outline-none px-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-[#6366f1] text-white rounded-xl shadow-lg disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
