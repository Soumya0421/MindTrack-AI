
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { AppState } from '../types';
import { 
  Activity, Brain, Zap, Star, Flame,
  TrendingUp, Target, ShieldCheck, 
  Utensils, Info, CheckCircle2,
  Clock, AlertTriangle, Calendar, Layers, HelpCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onCheckIn: () => void;
}

const InfoTooltip: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="group relative inline-block ml-2 cursor-help align-middle">
    <HelpCircle size={14} className="text-slate-500 hover:text-indigo-400 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-[#161b22] text-white text-[11px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[120] shadow-2xl border border-white/10 pointer-events-none">
      <div className="font-black uppercase tracking-widest text-indigo-400 mb-2 border-b border-white/5 pb-1">{title}</div>
      <p className="font-medium leading-relaxed text-slate-300">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#161b22]"></div>
    </div>
  </div>
);

const Dashboard: React.FC<Props> = ({ state, onCheckIn }) => {
  const { moodEntries, studyTasks, wellnessInsight, stats, subjects } = state;
  const [activeChartTab, setActiveChartTab] = useState<'biometrics' | 'nutrition' | 'performance'>('biometrics');

  // Derived metrics
  const lastEntry = moodEntries[moodEntries.length - 1];
  const stability = moodEntries.length > 1 
    ? Math.max(0, 100 - (moodEntries.slice(-5).reduce((acc, curr, i, arr) => {
        if (i === 0) return 0;
        return acc + Math.abs(curr.moodScore - arr[i-1].moodScore);
      }, 0) * 15))
    : 100;

  const mindScore = lastEntry 
    ? Math.round(((lastEntry.moodScore + lastEntry.productivityScore + (6 - lastEntry.stressScore)) / 15) * 100)
    : 0;

  const burnoutRisk = wellnessInsight?.burnoutWarning ? "Critical" : (lastEntry?.stressScore > 3 ? "Elevated" : "Low");

  // Chart Data Preparation
  const chartData = moodEntries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Protein: entry.proteinGrams || 0,
    Carbs: entry.carbGrams || 0,
    Fats: entry.fatGrams || 0,
    Efficiency: (entry.productivityScore || 0) * 15,
    Stability: (entry.moodScore || 0) * 15,
  })).slice(-7);

  const radarData = [
    { subject: 'Emotional', A: (moodEntries.slice(-3).reduce((acc, l) => acc + l.moodScore, 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
    { subject: 'Calmness', A: (moodEntries.slice(-3).reduce((acc, l) => acc + (6 - l.stressScore), 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
    { subject: 'Deep Sleep', A: (moodEntries.slice(-3).reduce((acc, l) => acc + (l.sleepQuality || 3), 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
    { subject: 'Movement', A: (moodEntries.slice(-3).reduce((acc, l) => acc + (l.physicalActivity || 3), 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
    { subject: 'Social', A: (moodEntries.slice(-3).reduce((acc, l) => acc + (l.socialConnection || 3), 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
    { subject: 'Nutrition', A: (moodEntries.slice(-3).reduce((acc, l) => acc + (l.nutritionScore || 3), 0) / (moodEntries.slice(-3).length || 1)), fullMark: 5 },
  ];

  const pendingTasks = studyTasks.filter(t => !t.completed);
  const tasksDueSoon = pendingTasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.scheduledDate <= today;
  }).length;
  
  const completionRate = studyTasks.length > 0 ? Math.round((studyTasks.filter(t => t.completed).length / studyTasks.length) * 100) : 0;
  const isCheckedIn = stats.lastCheckInDate === new Date().toISOString().split('T')[0];
  const academicStatus = tasksDueSoon > 3 ? "Critical" : tasksDueSoon > 0 ? "Steady" : "Pace Setting";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1400px] mx-auto">
      {/* Dark Analytics Header - Matches Screenshot Aesthetic */}
      <section className="bg-[#05070a] p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Brain size={14} /> NEURAL ANALYTICS HUB
              </div>
              <div className="px-4 py-1.5 bg-[#10b98115] border border-[#10b98130] rounded-full text-[#10b981] text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap size={14} /> INITIATE
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              Curriculum velocity: <span className="text-indigo-500 font-black">{academicStatus}</span>.<br />
              Bio-state sync: <span className={burnoutRisk === 'Low' ? 'text-emerald-500' : 'text-rose-500'}>{burnoutRisk === 'Low' ? 'Optimal' : burnoutRisk}</span>.
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="flex flex-col gap-1.5 bg-[#12141a] p-6 rounded-3xl border border-white/5 transition-all hover:border-indigo-500/30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                  EFFICIENCY <InfoTooltip title="Efficiency" text="Quantifies your task completion accuracy against your scheduled academic goals." />
                </p>
                <p className="text-2xl font-black tabular-nums">{completionRate}% Accuracy</p>
              </div>
              <div className="flex flex-col gap-1.5 bg-[#12141a] p-6 rounded-3xl border border-white/5 transition-all hover:border-indigo-500/30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                  FOCUS DELTA <InfoTooltip title="Focus Delta" text="Calculates the variance in focus intensity across your active study sessions." />
                </p>
                <p className="text-2xl font-black tabular-nums">+{stats.points % 100} XP</p>
              </div>
              <div className="flex flex-col gap-1.5 bg-[#12141a] p-6 rounded-3xl border border-white/5 transition-all hover:border-indigo-500/30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                  STABILITY <InfoTooltip title="Stability" text="Measures the consistency of your emotional state and biometric feedback loops." />
                </p>
                <p className="text-2xl font-black tabular-nums">{stability}%</p>
              </div>
              <div className="flex flex-col gap-1.5 bg-[#12141a] p-6 rounded-3xl border border-white/5 transition-all hover:border-indigo-500/30">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                  MINDSCORE <InfoTooltip title="MindScore" text="A weighted heuristic combining mood, stress, and productivity indicators." />
                </p>
                <p className="text-2xl font-black tabular-nums">{mindScore}</p>
              </div>
            </div>
          </div>
          
          <div className="w-full xl:w-96 flex flex-col items-center gap-8 p-10 bg-[#0d0f14] border border-white/10 rounded-[3rem] backdrop-blur-3xl shrink-0 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]">
             <div className="text-center relative w-full">
                <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.25em] mb-8 flex items-center justify-center">
                  NEURAL ALIGNMENT <InfoTooltip title="Neural Alignment" text="Real-time synchronization between academic output and mental bandwidth." />
                </p>
                <div className="relative w-44 h-44 flex items-center justify-center mx-auto">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <circle 
                        cx="50" cy="50" r="44" 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="8" 
                        strokeDasharray="276.5" 
                        strokeDashoffset={276.5 * (1 - completionRate / 100)} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000" 
                        style={{ filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.4))' }}
                      />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-6xl font-black tracking-tighter tabular-nums">{completionRate}%</span>
                   </div>
                </div>
             </div>
             <button onClick={onCheckIn} className={`w-full py-5 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl ${isCheckedIn ? 'bg-[#10b981] text-white shadow-emerald-500/20' : 'bg-[#6366f1] hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}>
                {isCheckedIn ? 'SYNC SUCCESSFUL' : 'SYNC NEURAL STREAM'}
             </button>
          </div>
        </div>
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </section>

      {/* Burnout/Streak/XP Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-indigo-100 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
              BURNOUT RISK <InfoTooltip title="Burnout Risk" text="Predictive metric tracking signs of academic fatigue and system overload." />
            </p>
            <p className={`text-3xl font-black ${burnoutRisk === 'Low' ? 'text-emerald-500' : 'text-rose-500'}`}>{burnoutRisk}</p>
          </div>
          <div className={`p-4 rounded-2xl ${burnoutRisk === 'Low' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            <ShieldCheck size={28} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-orange-100 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
              STREAK DAYS <InfoTooltip title="Streak Days" text="Consistency tracking of your consecutive neural check-ins." />
            </p>
            <p className="text-3xl font-black text-slate-800 tabular-nums">{stats.streak} Days</p>
          </div>
          <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
            <Flame size={28} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-amber-100 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
              TOTAL POINTS <InfoTooltip title="Total XP" text="Cumulative experience accumulated through productivity and wellness cycles." />
            </p>
            <p className="text-3xl font-black text-slate-800 tabular-nums">{stats.points} XP</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <Star size={28} />
          </div>
        </div>
      </section>

      {/* Summary Box & Spider Chart Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Executive Summary Box */}
        <div className="xl:col-span-7 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 animate-in slide-in-from-left duration-700">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                    <Layers size={22} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">Executive Summary</h3>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Real-time Snapshot</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Academic Sub-box */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-indigo-100">
                 <div className="flex items-center gap-3 text-indigo-600 mb-2">
                    <Calendar size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
                      CURRICULUM DELTA <InfoTooltip title="Curriculum Delta" text="Calculated gap between scheduled material and current mastery level." />
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-3xl font-black text-slate-800 tabular-nums">{tasksDueSoon}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">Pending Syncs</p>
                       </div>
                       <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${tasksDueSoon > 3 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {academicStatus}
                       </div>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 transition-all duration-1000" style={{width: `${completionRate}%`}}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                       {tasksDueSoon === 0 
                         ? "Curriculum is synchronized. Optimal state achieved." 
                         : `Action required: ${tasksDueSoon} priority nodes awaiting processing.`}
                    </p>
                 </div>
              </div>

              {/* Wellness Sub-box */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-emerald-100">
                 <div className="flex items-center gap-3 text-emerald-600 mb-2">
                    <Activity size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
                      BIO-STATE VARIANCE <InfoTooltip title="Bio-State Variance" text="Tracks the fluctuations in your reported physical and emotional biometrics." />
                    </p>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-3xl font-black text-slate-800 tabular-nums">{stability}%</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">Mental Stability</p>
                       </div>
                       <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${burnoutRisk === 'Low' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {burnoutRisk} Risk
                       </div>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${stability}%`}}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                       {burnoutRisk === 'Low' 
                         ? "Biometric flow is consistent. High performance buffer detected." 
                         : "Heuristic warning: System strain detected. Initiate recovery protocol."}
                    </p>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-[#0a0c10] rounded-[2rem] text-white flex items-center gap-6">
              <div className="p-3 bg-white/10 rounded-xl">
                 <Target size={24} className="text-amber-400" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Correlation Heuristic</p>
                 <p className="text-[13px] font-medium leading-relaxed italic text-slate-300">
                    "{wellnessInsight?.correlation || "Initiating long-term biometric tracking for adaptive correlation analysis."}"
                 </p>
              </div>
           </div>
        </div>

        {/* Spider Chart / Biometric Lattice */}
        <div className="xl:col-span-5 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center animate-in slide-in-from-right duration-700">
           <div className="w-full flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                 <Zap size={20} className="text-amber-500" /> Neural Biometric Lattice
              </h3>
              <Info size={16} className="text-slate-300 cursor-help" />
           </div>
           
           <div className="h-[350px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                    <Radar
                       name="User Bio"
                       dataKey="A"
                       stroke="#6366f1"
                       strokeWidth={3}
                       fill="#6366f1"
                       fillOpacity={0.15}
                    />
                    <Tooltip 
                       contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 900 }}
                    />
                 </RadarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="flex flex-wrap justify-center gap-4 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Baseline Sync</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center w-full">Heuristic profile of the last 3 neural cycles</p>
           </div>
        </div>
      </section>

      {/* Tabbed Analytics Graph Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
              <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                 <button 
                  onClick={() => setActiveChartTab('biometrics')}
                  className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeChartTab === 'biometrics' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Activity size={18} /> Biometrics
                 </button>
                 <button 
                  onClick={() => setActiveChartTab('nutrition')}
                  className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeChartTab === 'nutrition' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Utensils size={18} /> Nutrition
                 </button>
                 <button 
                  onClick={() => setActiveChartTab('performance')}
                  className={`px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeChartTab === 'performance' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <TrendingUp size={18} /> Performance
                 </button>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                <span className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${activeChartTab === 'biometrics' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : activeChartTab === 'nutrition' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                  Primary Delta
                </span>
              </div>
           </div>

           <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeChartTab === 'biometrics' ? '#6366f1' : activeChartTab === 'nutrition' ? '#f59e0b' : '#10b981'} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={activeChartTab === 'biometrics' ? '#6366f1' : activeChartTab === 'nutrition' ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} 
                    dy={20}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px'}}
                    itemStyle={{fontWeight: 900, textTransform: 'uppercase', fontSize: '11px'}}
                  />
                  {activeChartTab === 'biometrics' && (
                    <Area type="monotone" dataKey="Efficiency" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" />
                  )}
                  {activeChartTab === 'nutrition' && (
                    <>
                      <Area type="monotone" dataKey="Protein" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" />
                      <Area type="monotone" dataKey="Carbs" stroke="#3b82f6" strokeWidth={3} fill="none" />
                    </>
                  )}
                  {activeChartTab === 'performance' && (
                    <Area type="monotone" dataKey="Stability" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMain)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </section>

      {/* Advisory Section */}
      <section className="bg-[#0a0c10] p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
         <div className="flex flex-col md:flex-row gap-12 items-stretch relative z-10">
           <div className="flex-1 space-y-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/30">
                  <Brain size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tight">Neural Sync Advisor</h3>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-4 text-indigo-400">
                  <Info size={18} />
                  <p className="text-[12px] font-black uppercase tracking-[0.25em]">Baseline Analysis</p>
                </div>
                <p className="text-lg text-slate-300 font-medium leading-relaxed italic border-l-4 border-indigo-500/40 pl-8">
                  "{wellnessInsight?.summary || "Initializing biometric baseline. Please continue consistent neural logging for advanced heuristic analysis."}"
                </p>
              </div>
           </div>
           
           <div className="w-full md:w-[45%] space-y-6">
              <div className="flex items-center justify-between ml-2">
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.25em]">Sync Directives</p>
                <span className="text-[10px] px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg font-black uppercase tracking-widest border border-indigo-500/20">Active Priority</span>
              </div>
              <div className="grid gap-4">
                {wellnessInsight?.tips && wellnessInsight.tips.length > 0 ? (
                  wellnessInsight.tips.map((tip, i) => (
                    <div key={i} className="flex gap-6 items-center bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all cursor-default group/tip shadow-lg">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover/tip:bg-indigo-600 group-hover/tip:text-white transition-all transform group-hover/tip:scale-110">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-[13px] font-bold text-slate-100 leading-snug flex-1">{tip}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center flex flex-col items-center gap-4">
                    <Clock size={32} className="text-slate-600 animate-pulse" />
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">Calibrating Neural Cache...</p>
                  </div>
                )}
              </div>
           </div>
         </div>
         {/* Decoration */}
         <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
      </section>
    </div>
  );
};

export default Dashboard;
