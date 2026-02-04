
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts';
import { AppState } from '../types';
import { 
  Activity, Brain, AlertCircle, Zap, Star, Flame,
  Sparkles, TrendingUp, Target, Award, ShieldCheck, 
  BarChart3, LayoutGrid, Utensils, Heart, Coffee, Users
} from 'lucide-react';

interface Props {
  state: AppState;
  onCheckIn: () => void;
}

const Dashboard: React.FC<Props> = ({ state, onCheckIn }) => {
  const { moodEntries, studyTasks, wellnessInsight, subjects, stats } = state;

  // Nutritional Macro Correlation Data
  const macroData = moodEntries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Protein: entry.proteinGrams || 0,
    Carbs: entry.carbGrams || 0,
    Efficiency: (entry.productivityScore || 0) * 15, // scaled
  })).slice(-7);

  // Radar Chart Data (Granular biomarkers)
  const recentLogs = moodEntries.slice(-3);
  const radarData = [
    { subject: 'Emotional', A: recentLogs.reduce((acc, l) => acc + l.moodScore, 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Calmness', A: recentLogs.reduce((acc, l) => acc + (6 - l.stressScore), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Deep Sleep', A: recentLogs.reduce((acc, l) => acc + (l.sleepQuality || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Movement', A: recentLogs.reduce((acc, l) => acc + (l.physicalActivity || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Social', A: recentLogs.reduce((acc, l) => acc + (l.socialConnection || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Nutrition', A: recentLogs.reduce((acc, l) => acc + (l.nutritionScore || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
  ];

  const pendingTasks = studyTasks.filter(t => !t.completed);
  const tasksDueSoon = pendingTasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.scheduledDate <= today;
  }).length;
  
  const completedTasksCount = studyTasks.filter(t => t.completed).length;
  const totalTasksCount = studyTasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  const isCheckedIn = stats.lastCheckInDate === new Date().toISOString().split('T')[0];
  const wellnessStatus = wellnessInsight?.burnoutWarning ? "At Risk" : moodEntries.length > 0 && moodEntries[moodEntries.length - 1].stressScore > 3 ? "Under Strain" : "Optimal";
  const academicStatus = tasksDueSoon > 3 ? "Critical Load" : tasksDueSoon > 0 ? "Steady" : "Pace Setting";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Neural Summary Header */}
      <section className="bg-gradient-to-br from-[#0e111a] via-[#1e293b] to-[#0e111a] p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Brain size={14} /> Neural Analytics Hub
              </div>
              <div className="px-3 py-1 bg-[#10b98120] border border-[#10b98130] rounded-full text-[#10b981] text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} /> Initiate
              </div>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15]">
              Curriculum velocity: <span className="text-indigo-400">{academicStatus}</span>.<br />
              Bio-state sync: <span className={wellnessStatus === 'Optimal' ? 'text-emerald-400' : 'text-rose-400'}>{wellnessStatus}</span>.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Efficiency</p>
                  <p className="text-xl font-black">{completionRate}% Accuracy</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Focus Delta</p>
                  <p className="text-xl font-black">+{stats.points % 100} XP</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full xl:w-auto flex flex-col items-center gap-6 p-8 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl shrink-0">
             <div className="text-center relative">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Neural Aligment</p>
                <div className="relative w-36 h-36 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - completionRate / 100)} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black">{completionRate}%</span>
                   </div>
                </div>
             </div>
             <button onClick={onCheckIn} className={`w-full py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isCheckedIn ? 'bg-emerald-500/80 text-white' : 'bg-[#6366f1] hover:bg-indigo-700 text-white'}`}>
                {isCheckedIn ? 'Sync Successful' : 'Sync Neural Stream'}
             </button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      </section>

      {/* Primary Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Macro vs Productivity Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <BarChart3 size={24} className="text-indigo-600" /> Neural Biometrics
                </h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                 </div>
              </div>
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={macroData}>
                  <defs>
                    <linearGradient id="colorMacro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', padding: '12px'}}
                    itemStyle={{fontWeight: 900, textTransform: 'uppercase', fontSize: '9px'}}
                  />
                  <Area type="monotone" dataKey="Efficiency" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMacro)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Radar Chart (Spider Chart) */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-4">
              <Target size={24} className="text-indigo-600" /> Bio-Profile
            </h3>
            
            <div className="h-64 w-full flex items-center justify-center relative">
               {moodEntries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 8, fontWeight: 800}} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                    <Radar
                      name="Neural Sync"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
               ) : (
                <div className="text-center opacity-20">
                  <Activity size={48} className="mx-auto text-slate-300" />
                  <p className="text-[8px] font-black uppercase tracking-widest mt-2">No Logs</p>
                </div>
               )}
            </div>
        </div>
      </section>

      {/* Advisor Section */}
      <section className="bg-[#0e111a] p-8 md:p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row gap-8 items-center shadow-xl">
         <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-3 bg-indigo-600 rounded-2xl">
                <Brain size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">System Advisor</h3>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              {wellnessInsight?.summary || "Initialization pending daily biometric synchronization."}
            </p>
         </div>
         
         <div className="w-full md:w-1/2 space-y-3">
            {wellnessInsight?.tips.slice(0, 2).map((tip, i) => (
              <div key={i} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                  <Zap size={16} />
                </div>
                <p className="text-[11px] font-bold text-slate-300 leading-tight">{tip}</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default Dashboard;
