
import React, { useState, useEffect, useRef } from 'react';
import { StudySession, Subject } from '../types';
import { Play, Pause, RotateCcw, Coffee, Target, History, Brain, ChevronRight, Clock } from 'lucide-react';

interface Props {
  subjects: Subject[];
  sessions: StudySession[];
  onAddSession: (session: StudySession) => void;
}

const ProductivityTracker: React.FC<Props> = ({ subjects, sessions, onAddSession }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const timerRef = useRef<any>(null);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Timer Section */}
      <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-10">
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
            mode === 'focus' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {mode === 'focus' ? <Brain size={14} /> : <Coffee size={14} />}
            {mode === 'focus' ? 'Deep Focus Phase' : 'Relaxation Phase'}
          </div>
          <h2 className="text-sm text-slate-400 font-medium">Minimize distractions, maximize growth.</h2>
        </div>

        {/* Circular Progress (Larger size and safety margin to prevent clipping) */}
        <div className="relative w-80 h-80 flex items-center justify-center p-4">
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
            <span className="text-7xl font-bold text-slate-800 tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-black text-slate-300 uppercase mt-2 tracking-widest">Remaining</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block ml-1">Assigned Subject</label>
            <div className="relative">
              <select 
                className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">No subject selected</option>
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
              className={`flex-1 py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                isActive 
                ? 'bg-slate-800 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isActive ? <Pause size={20} /> : <Play size={20} />}
              {isActive ? 'Pause' : 'Start Focus'}
            </button>
            <button 
              onClick={resetTimer}
              className="p-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors shadow-sm"
              title="Reset Timer"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* History & Stats Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
              <Target size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Focus</p>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {sessions.reduce((acc, s) => s.type === 'focus' ? acc + s.durationMinutes : acc, 0)} <span className="text-sm font-normal text-slate-400 uppercase tracking-tighter">mins</span>
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
              <Clock size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {sessions.filter(s => s.type === 'focus').length} <span className="text-sm font-normal text-slate-400 uppercase tracking-tighter">total</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[400px]">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
            <History size={20} className="text-indigo-600" />
            Productivity Log
          </h3>
          
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
            {sessions.slice().reverse().map(s => {
              const subject = subjects.find(sub => sub.id === s.subjectId);
              return (
                <div key={s.id} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/40 hover:bg-white hover:border-indigo-100 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-5">
                    <div className={`p-2.5 rounded-xl shadow-sm ${s.type === 'focus' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                      {s.type === 'focus' ? <Brain size={18} /> : <Coffee size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{subject?.name || (s.type === 'focus' ? 'Focus Session' : 'Break Time')}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">
                        {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {s.durationMinutes}m
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              );
            })}
            {sessions.length === 0 && (
              <div className="text-center py-24 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <Brain className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold text-sm tracking-tight">Your focus journey begins with one session.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityTracker;
