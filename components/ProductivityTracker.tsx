
import React, { useState, useEffect, useRef } from 'react';
import { StudySession, Subject, StudyTask } from '../types';
import { Play, Pause, RotateCcw, Coffee, Target, History, Brain, ChevronRight, Clock, CheckSquare, ListChecks, Plus, Trash2, X } from 'lucide-react';

interface Props {
  subjects: Subject[];
  sessions: StudySession[];
  onAddSession: (session: StudySession) => void;
  tasks?: StudyTask[];
  onToggleTask?: (id: string) => void;
}

interface SessionToDo {
  id: string;
  name: string;
  description: string;
}

const ProductivityTracker: React.FC<Props> = ({ subjects, sessions, onAddSession, tasks = [], onToggleTask }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const timerRef = useRef<any>(null);

  // Session To-Do state
  const [sessionToDos, setSessionToDos] = useState<SessionToDo[]>([]);
  const [isAddingSessionTask, setIsAddingSessionTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    const completedDuration = mode === 'focus' ? 25 : 5;
    onAddSession({
      id: crypto.randomUUID(),
      subjectId: selectedSubject,
      durationMinutes: completedDuration,
      date: new Date().toISOString(),
      type: mode
    });
    
    const nextMode = mode === 'focus' ? 'break' : 'focus';
    setMode(nextMode);
    setTimeLeft(nextMode === 'focus' ? 25 * 60 : 5 * 60);
    
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.play();
    } catch (e) {}
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalDuration = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Filter global tasks
  const filteredGlobalTasks = tasks.filter(t => !t.completed && (t.subjectId === selectedSubject || t.subjectId === 'global_event' || !selectedSubject));

  const handleAddSessionTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: SessionToDo = {
      id: crypto.randomUUID(),
      name: newTaskName,
      description: newTaskDesc
    };
    setSessionToDos(prev => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskDesc('');
    setIsAddingSessionTask(false);
  };

  const handleToggleSessionTask = (id: string) => {
    // Checking it off deletes it as per user request
    setSessionToDos(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Timer Section */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-10">
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
            mode === 'focus' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {mode === 'focus' ? <Brain size={14} /> : <Coffee size={14} />}
            {mode === 'focus' ? 'Deep Focus Phase' : 'Relaxation Phase'}
          </div>
          <h2 className="text-sm text-slate-400 font-bold">Minimize distractions, maximize growth.</h2>
        </div>

        {/* Circular Progress */}
        <div className="relative w-64 h-64 flex items-center justify-center p-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="-15 -15 350 350">
            <circle 
              cx="160" cy="160" r="140" 
              fill="none" stroke="#f1f5f9" strokeWidth="10"
            />
            <circle 
              cx="160" cy="160" r="140" 
              fill="none" 
              stroke={mode === 'focus' ? '#6366f1' : '#10b981'} 
              strokeWidth="14"
              strokeDasharray="879.6"
              strokeDashoffset={879.6 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="flex flex-col items-center z-10">
            <span className="text-6xl font-black text-slate-800 tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-black text-slate-300 uppercase mt-2 tracking-widest">Remaining</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Focus Target</label>
            <div className="relative">
              <select 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">General Productivity</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={toggleTimer}
              className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                isActive 
                ? 'bg-slate-800 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isActive ? <Pause size={18} /> : <Play size={18} />}
              {isActive ? 'Pause' : 'Start Focus'}
            </button>
            <button 
              onClick={resetTimer}
              className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Section: To-Do List & Log */}
      <div className="space-y-6">
        {/* focus To-Do Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[400px] animate-in slide-in-from-right duration-500">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                <ListChecks size={22} className="text-indigo-600" />
                Focus To-Do
              </h3>
              <button 
                onClick={() => setIsAddingSessionTask(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Add To-Do</span>
              </button>
           </div>
           
           {/* Add Session Task Form */}
           {isAddingSessionTask && (
             <div className="mb-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">New Session Task</h4>
                  <button onClick={() => setIsAddingSessionTask(false)} className="text-slate-400 hover:text-rose-500"><X size={14}/></button>
                </div>
                <input 
                  type="text" 
                  placeholder="Task name" 
                  className="w-full p-3 rounded-xl bg-white border border-indigo-100 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
                <textarea 
                  placeholder="Description (Optional)" 
                  className="w-full p-3 rounded-xl bg-white border border-indigo-100 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
                <button 
                  onClick={handleAddSessionTask}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all"
                >
                  Create Task
                </button>
             </div>
           )}

           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {/* Ephemeral Session Tasks */}
             {sessionToDos.map(t => (
               <div 
                key={t.id} 
                onClick={() => handleToggleSessionTask(t.id)}
                className="group flex items-start gap-4 p-4 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 border border-indigo-100 transition-all cursor-pointer shadow-sm hover:shadow-md animate-in slide-in-from-left duration-300"
               >
                 <div className="shrink-0 mt-0.5 text-indigo-300 group-hover:text-indigo-600 transition-colors">
                   <CheckSquare size={20} />
                 </div>
                 <div className="min-w-0 flex-1">
                   <p className="text-[13px] font-black text-indigo-900 truncate">{t.name}</p>
                   {t.description && <p className="text-[11px] text-indigo-600/70 font-medium leading-relaxed mt-1">{t.description}</p>}
                   <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                     <Clock size={10} /> Session Goal
                   </p>
                 </div>
               </div>
             ))}

             {/* Global Tasks */}
             {filteredGlobalTasks.map(t => (
               <div 
                key={t.id} 
                onClick={() => onToggleTask?.(t.id)}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 transition-all cursor-pointer shadow-sm hover:shadow-md"
               >
                 <div className="shrink-0 text-slate-200 group-hover:text-indigo-500 transition-colors">
                   <CheckSquare size={20} />
                 </div>
                 <div className="min-w-0 flex-1">
                   <p className="text-[13px] font-bold text-slate-800 truncate">{t.task}</p>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                     {t.subjectId === 'global_event' ? 'General' : (subjects.find(s => s.id === t.subjectId)?.name || 'Study')}
                   </p>
                 </div>
               </div>
             ))}
             
             {filteredGlobalTasks.length === 0 && sessionToDos.length === 0 && (
               <div className="text-center py-12 opacity-30">
                 <Target size={32} className="mx-auto text-slate-300 mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No active focus tasks</p>
               </div>
             )}
           </div>
        </div>

        {/* Stats Summary Area */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-3">
              <Target size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Focus</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {sessions.reduce((acc, s) => s.type === 'focus' ? acc + s.durationMinutes : acc, 0)} <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">mins</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-3">
              <Clock size={20} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {sessions.filter(s => s.type === 'focus').length} <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">total</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[300px]">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
            <History size={20} className="text-indigo-600" />
            Session Log
          </h3>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
            {sessions.slice().reverse().map(s => {
              const subject = subjects.find(sub => sub.id === s.subjectId);
              return (
                <div key={s.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/40 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg shadow-sm ${s.type === 'focus' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                      {s.type === 'focus' ? <Brain size={14} /> : <Coffee size={14} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-800">{subject?.name || (s.type === 'focus' ? 'Focus Session' : 'Break Time')}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-0.5">
                        {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {s.durationMinutes}m
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              );
            })}
            {sessions.length === 0 && (
              <div className="text-center py-16 opacity-30">
                <Brain className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">No sessions recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityTracker;
