
import React, { useState } from 'react';
import { Subject, Priority, StudyTask, OpenRouterConfig, TaskCategory } from '../types';
import { Plus, Calendar as CalendarIcon, Trash2, CheckCircle, Circle, Loader2, Sparkles, List, ChevronLeft, ChevronRight, ChevronDown, BookOpen, AlertCircle, Clock, StickyNote, Brain, Tag, Type } from 'lucide-react';
import { generateStudyPlan as generateStudyPlanGemini } from '../services/geminiService';
import { generateStudyPlan as generateStudyPlanOpenRouter } from '../services/openRouterService';

interface Props {
  subjects: Subject[];
  tasks: StudyTask[];
  openRouterConfig: OpenRouterConfig;
  onAddSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onAddTasks: (t: StudyTask[]) => void;
  onToggleTask: (id: string) => void;
}

const StudyPlanner: React.FC<Props> = ({ 
  subjects, tasks, openRouterConfig, onAddSubject, onDeleteSubject, onAddTasks, onToggleTask 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timetable'>('calendar');
  
  // Quick Task Form State
  const [quickTaskName, setQuickTaskName] = useState('');
  const [quickTaskDate, setQuickTaskDate] = useState('');
  const [quickTaskDesc, setQuickTaskDesc] = useState('');
  const [quickTaskType, setQuickTaskType] = useState<string>('Holiday');
  
  // Manual Task Modal Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [taskSubId, setTaskSubId] = useState('');
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('revision');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timetableDate, setTimetableDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddQuickTask = () => {
    if (!quickTaskName || !quickTaskDate) return;
    
    const newTask: StudyTask = {
      id: crypto.randomUUID(),
      subjectId: 'global_event', 
      task: `${quickTaskType.toUpperCase()}: ${quickTaskName}`,
      completed: false,
      scheduledDate: quickTaskDate,
      startTime: '00:00',
      category: quickTaskType === 'Exam' ? 'exam-prep' : 'lecture', 
      difficulty: quickTaskType === 'Exam' ? 5 : 1
    };
    
    onAddTasks([newTask]);
    setQuickTaskName('');
    setQuickTaskDate('');
    setQuickTaskDesc('');
  };

  const handleAddManualTask = () => {
    if (!taskText || !taskSubId) return;
    const newTask: StudyTask = {
      id: crypto.randomUUID(),
      subjectId: taskSubId,
      task: taskText,
      completed: false,
      scheduledDate: timetableDate,
      startTime: taskTime,
      category: taskCategory,
      difficulty: 3
    };
    onAddTasks([newTask]);
    setTaskText('');
    setIsAddingTask(false);
  };

  const handleGeneratePlan = async () => {
    if (subjects.length === 0) {
      setError('Please add subjects in the Settings or Resource tab first.');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    try {
      const generated = openRouterConfig.apiKey 
        ? await generateStudyPlanOpenRouter(openRouterConfig, subjects)
        : await generateStudyPlanGemini(subjects);

      const newTasks: StudyTask[] = generated.map(t => ({
        id: crypto.randomUUID(),
        subjectId: t.subjectId!,
        task: t.task!,
        scheduledDate: t.scheduledDate!,
        startTime: t.startTime || '09:00',
        completed: false,
        category: (t.category as any) || 'revision',
        difficulty: t.difficulty || 3
      }));
      onAddTasks(newTasks);
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const tasksByDate = tasks.reduce((acc, task) => {
    acc[task.scheduledDate] = acc[task.scheduledDate] || [];
    acc[task.scheduledDate].push(task);
    return acc;
  }, {} as Record<string, StudyTask[]>);

  const sortedDates = Object.keys(tasksByDate).sort();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-slate-50 bg-slate-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasksByDate[dateStr] || [];
      const dayExams = subjects.filter(s => s.examDate === dateStr);

      days.push(
        <div 
          key={d} 
          onClick={() => { setTimetableDate(dateStr); setViewMode('timetable'); }}
          className="h-24 border border-slate-50 p-1 overflow-y-auto cursor-pointer custom-scrollbar bg-white group hover:bg-indigo-50/30 transition-colors"
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-bold ${new Date().toISOString().split('T')[0] === dateStr ? 'bg-indigo-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
              {d}
            </span>
            {dayExams.length > 0 && <span className="text-[7px] bg-rose-500 text-white px-1 rounded animate-pulse">EXAM</span>}
          </div>
          <div className="space-y-0.5">
            {dayTasks.sort((a,b) => (a.startTime || '').localeCompare(b.startTime || '')).map(t => {
              const isExam = t.task.startsWith('EXAM:');
              return (
                <div 
                  key={t.id} 
                  className={`text-[8px] px-1 py-0.5 rounded truncate ${
                    t.completed 
                      ? 'bg-slate-100 text-slate-400' 
                      : isExam 
                        ? 'bg-rose-100 text-rose-700 font-black border border-rose-200' 
                        : t.subjectId === 'global_event' 
                          ? 'bg-amber-100 text-amber-700 font-bold' 
                          : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {t.startTime !== '00:00' ? `${t.startTime} ` : ''}{t.task}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderTimetable = () => {
    const dayTasks = (tasksByDate[timetableDate] || []).sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-10 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => {
              const d = new Date(timetableDate);
              d.setDate(d.getDate() - 1);
              setTimetableDate(d.toISOString().split('T')[0]);
            }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {new Date(timetableDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <button onClick={() => {
              const d = new Date(timetableDate);
              d.setDate(d.getDate() + 1);
              setTimetableDate(d.toISOString().split('T')[0]);
            }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={timetableDate}
              onChange={(e) => setTimetableDate(e.target.value)}
            />
            <button 
              onClick={() => setIsAddingTask(true)}
              className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="text-xs font-black uppercase tracking-widest px-1">Add Entry</span>
            </button>
          </div>
        </div>

        <div className="relative space-y-0.5">
          {hours.map(hour => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            const tasksAtHour = dayTasks.filter(t => t.startTime && t.startTime.startsWith(String(hour).padStart(2, '0')));
            
            return (
              <div key={hour} className="flex gap-8 items-start group">
                <div className="w-20 text-right pt-4">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{hourStr}</span>
                </div>
                <div className="flex-1 min-h-[90px] border-t border-slate-100 pt-4 pb-4 relative">
                  <div className="absolute top-0 left-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 rounded-full border-2 border-white group-hover:bg-indigo-300 transition-colors"></div>
                  <div className="space-y-4">
                    {tasksAtHour.length > 0 ? tasksAtHour.map(t => {
                      const subject = subjects.find(s => s.id === t.subjectId);
                      const isExam = t.task.startsWith('EXAM:');
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => onToggleTask(t.id)}
                          className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group/task ${
                            t.completed 
                              ? 'bg-slate-50 border-slate-100 opacity-60' 
                              : isExam
                                ? 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-100'
                                : t.subjectId === 'global_event'
                                  ? 'bg-amber-50 border-amber-100 shadow-sm'
                                  : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              {t.completed ? (
                                <div className="p-1 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-500/20">
                                  <CheckCircle size={22} />
                                </div>
                              ) : (
                                <Circle className={`text-slate-200 group-hover/task:text-indigo-400 transition-colors ${isExam ? 'text-rose-300' : ''}`} size={24} />
                              )}
                            </div>
                            <div>
                              <p className={`font-black text-slate-800 text-base tracking-tight ${t.completed ? 'line-through text-slate-400' : isExam ? 'text-rose-900' : ''}`}>
                                {t.task}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm" style={{backgroundColor: isExam ? '#e11d48' : (t.subjectId === 'global_event' ? '#f59e0b' : (subject?.color || '#94a3b8'))}}>
                                   {isExam ? 'EXAM' : (t.subjectId === 'global_event' ? 'Global Task' : (subject?.name || 'Academic'))}
                                 </span>
                                 <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   <Clock size={12} /> {t.startTime}
                                 </span>
                              </div>
                            </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            isExam || t.category === 'exam-prep' ? 'bg-rose-50 text-rose-500' : 
                            t.category === 'assignment' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {t.category}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-4">No tasks scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newDate);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Task Entry */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-left duration-500">
            <h2 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
              <StickyNote size={22} className="text-indigo-600" />
              Task Entry
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NAME</label>
                <input 
                  type="text" 
                  placeholder="Task name" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  value={quickTaskName}
                  onChange={(e) => setQuickTaskName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATE</label>
                <input 
                  type="date" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  value={quickTaskDate}
                  onChange={(e) => setQuickTaskDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DESCRIPTION</label>
                <textarea 
                  placeholder="Task details..." 
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm resize-none"
                  value={quickTaskDesc}
                  rows={3}
                  onChange={(e) => setQuickTaskDesc(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TYPE</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all shadow-sm pr-10"
                    value={quickTaskType}
                    onChange={(e) => setQuickTaskType(e.target.value)}
                  >
                    <option value="Exam">Exam</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Outing">Outing</option>
                    <option value="Social">Social</option>
                    <option value="Academic">Academic</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button 
                onClick={handleAddQuickTask}
                className="w-full py-4 bg-[#0e111a] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] mt-4"
              >
                <Plus size={18} /> Add Task
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Subject Registry</h3>
             <div className="space-y-3">
               {subjects.map(s => (
                 <div key={s.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-50 shadow-sm">
                   <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}} />
                   <span className="text-[11px] font-bold text-slate-700">{s.name}</span>
                 </div>
               ))}
               {subjects.length === 0 && <p className="text-[10px] text-slate-300 font-bold uppercase">No academic subjects indexed</p>}
             </div>
          </div>
        </div>

        {/* Right Panel: Schedule View */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-[2rem] border border-rose-100 flex items-center gap-4 text-xs font-black animate-in slide-in-from-top-4">
              <AlertCircle size={20} /> {error}
            </div>
          )}
          
          <div className="flex items-center justify-between flex-wrap gap-6 px-2">
            <div className="flex items-center gap-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                <Sparkles size={22} className="text-indigo-600" />
                Study Schedule
              </h2>
              <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100 backdrop-blur-sm">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={18} strokeWidth={2.5} />
                  {viewMode === 'list' && <span className="text-[10px] font-black uppercase tracking-widest pr-1">List</span>}
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <CalendarIcon size={18} strokeWidth={2.5} />
                  {viewMode === 'calendar' && <span className="text-[10px] font-black uppercase tracking-widest pr-1">Calendar</span>}
                </button>
                <button 
                  onClick={() => setViewMode('timetable')}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'timetable' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Clock size={18} strokeWidth={2.5} />
                  {viewMode === 'timetable' && <span className="text-[10px] font-black uppercase tracking-widest pr-1">Table</span>}
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleGeneratePlan}
              disabled={isGenerating || subjects.length === 0}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
                isGenerating ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGenerating ? 'Synthesizing' : 'Generate AI Plan'}
            </button>
          </div>

          <div className="animate-in fade-in duration-700">
            {viewMode === 'timetable' ? renderTimetable() : viewMode === 'list' ? (
              <div className="space-y-10">
                {sortedDates.length > 0 ? (
                  sortedDates.map(date => (
                    <div key={date} className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3 ml-3">
                        <CalendarIcon size={16} className="text-indigo-400" />
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="grid gap-3">
                        {tasksByDate[date].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || '')).map(task => {
                          const subject = subjects.find(s => s.id === task.subjectId);
                          const isExam = task.task.startsWith('EXAM:');
                          return (
                            <div 
                              key={task.id} 
                              onClick={() => onToggleTask(task.id)}
                              className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-6 ${
                                task.completed 
                                  ? 'bg-slate-50 border-slate-100 opacity-60' 
                                  : isExam 
                                    ? 'bg-rose-50 border-rose-200 shadow-md'
                                    : task.subjectId === 'global_event'
                                      ? 'bg-amber-50 border-amber-50 shadow-sm'
                                      : 'bg-white border-slate-50 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-0.5'
                              }`}
                            >
                              {task.completed ? (
                                <div className="p-1.5 bg-emerald-500 rounded-full text-white shadow-lg">
                                  <CheckCircle size={22} strokeWidth={3} />
                                </div>
                              ) : (
                                <Circle className={`text-slate-100 group-hover:text-indigo-400 transition-colors ${isExam ? 'text-rose-300' : ''}`} size={24} strokeWidth={2.5} />
                              )}
                              <div className="flex-1">
                                <p className={`font-black text-slate-800 text-base tracking-tight ${task.completed ? 'line-through text-slate-400' : isExam ? 'text-rose-900' : ''}`}>
                                  {task.task}
                                </p>
                                <div className="flex items-center gap-4 mt-1.5">
                                  <span 
                                    className="text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest text-white shadow-sm"
                                    style={{backgroundColor: isExam ? '#e11d48' : (task.subjectId === 'global_event' ? '#f59e0b' : (subject?.color || '#cbd5e1'))}}
                                  >
                                    {isExam ? 'EXAM' : (task.subjectId === 'global_event' ? 'Global Task' : (subject?.name || 'Academic'))}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    <Clock size={12} /> {task.startTime || '--:--'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f2f4f7] border-4 border-dashed border-white rounded-[4rem] p-24 text-center animate-in zoom-in-95 duration-500">
                    <div className="bg-white w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                      <CalendarIcon className="text-slate-900" size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">Schedule is vacant</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                      Populate your tasks or engage the AI generator to architect your curriculum flow.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => changeMonth(-1)} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-5 py-2 text-[9px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm text-slate-700">
                      Today
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-100 shadow-sm">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {renderCalendar()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0e111a]/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] space-y-10 animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                <StickyNote className="text-indigo-600" size={28} /> Manual Entry
              </h3>
              <button onClick={() => setIsAddingTask(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
                <Trash2 className="text-slate-200 group-hover:text-rose-500" size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Task Details</label>
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  className="w-full p-6 rounded-2xl bg-slate-50 border-none text-base font-bold text-slate-800 placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Target Subject</label>
                <select 
                  className="w-full p-6 rounded-2xl bg-slate-50 border-none text-base font-bold text-slate-800 focus:ring-8 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer shadow-sm"
                  value={taskSubId}
                  onChange={(e) => setTaskSubId(e.target.value)}
                >
                  <option value="">Select subject...</option>
                  <option value="global_event">Global / Personal</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sync Time</label>
                  <input 
                    type="time" 
                    className="w-full p-6 rounded-2xl bg-slate-50 border-none text-base font-bold text-slate-800 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Priority</label>
                  <select 
                    className="w-full p-6 rounded-2xl bg-slate-50 border-none text-base font-bold text-slate-800 focus:ring-8 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer shadow-sm"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                  >
                    <option value="revision">Revision</option>
                    <option value="exam-prep">Exam Prep</option>
                    <option value="assignment">Assignment</option>
                    <option value="lecture">Lecture</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAddManualTask}
                className="w-full py-6 bg-[#0e111a] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] mt-4"
              >
                Log to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
