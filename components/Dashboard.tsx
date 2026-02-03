
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { AppState } from '../types';
import { 
  Activity, Brain, AlertCircle, Zap, Star, Flame,
  Sparkles, TrendingUp, Target, Award, ShieldCheck, 
  BarChart3, LayoutGrid
} from 'lucide-react';

interface Props {
  state: AppState;
  onCheckIn: () => void;
}

const Dashboard: React.FC<Props> = ({ state, onCheckIn }) => {
  const { moodEntries, studyTasks, wellnessInsight, subjects, studySessions = [], profile, stats } = state;

  // Biometric Trends Data
  const wellnessData = moodEntries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Mood: entry.moodScore,
    Stress: entry.stressScore,
    Prod: entry.productivityScore || 3,
  })).slice(-7);

  // Radar Chart Data (Latest state or average of last 3 days)
  const recentLogs = moodEntries.slice(-3);
  const radarData = [
    { subject: 'Mood', A: recentLogs.reduce((acc, l) => acc + l.moodScore, 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Relaxation', A: recentLogs.reduce((acc, l) => acc + (6 - l.stressScore), 0) / (recentLogs.length || 1), fullMark: 5 }, // Invert stress
    { subject: 'Sleep', A: recentLogs.reduce((acc, l) => acc + (l.sleepQuality || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Activity', A: recentLogs.reduce((acc, l) => acc + (l.physicalActivity || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Social', A: recentLogs.reduce((acc, l) => acc + (l.socialConnection || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
    { subject: 'Productivity', A: recentLogs.reduce((acc, l) => acc + (l.productivityScore || 3), 0) / (recentLogs.length || 1), fullMark: 5 },
  ];

  const pendingTasks = studyTasks.filter(t => !t.completed);
  const tasksDueSoon = pendingTasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.scheduledDate <= today;
  }).length;
  
  const completedTasksCount = studyTasks.filter(t => t.completed).length;
  const totalTasksCount = studyTasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  const xpNextLevel = (stats.level + 1) * 1000;
  const progressPercent = Math.min(100, (stats.points / xpNextLevel) * 100);

  const isCheckedIn = stats.lastCheckInDate === new Date().toISOString().split('T')[0];

  const wellnessStatus = wellnessInsight?.burnoutWarning ? "At Risk" : moodEntries.length > 0 && moodEntries[moodEntries.length - 1].stressScore > 3 ? "Under Strain" : "Optimal";
  const academicStatus = tasksDueSoon > 3 ? "Critical Load" : tasksDueSoon > 0 ? "Steady" : "Pace Setting";
  const academicBadge = completionRate > 90 ? "Dean's List Pace" : completionRate > 60 ? "Scholar Tier" : "Initiate";

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Neural Summary Header */}
      <section className="bg-gradient-to-br from-[#0e111a] via-[#1e293b] to-[#0e111a] p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col xl:flex-row gap-16">
          <div className="flex-1 space-y-10">
            <div className="flex flex-wrap items-center gap-5">
              <div className="px-5 py-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-lg">
                <Brain size={16} /> Neural Analytics Hub
              </div>
              <div className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <Award size={16} /> {academicBadge}
              </div>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Curriculum velocity: <span className="text-indigo-400">{academicStatus}</span>.<br />
              Bio-state sync: <span className={wellnessStatus === 'Optimal' ? 'text-emerald-400' : 'text-rose-400'}>{wellnessStatus}</span>.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
              <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-1">
                <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-[1.8rem]">
                  <Target size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Efficiency</p>
                  <p className="text-2xl font-black">{completionRate}% Accuracy</p>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-1">
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-[1.8rem]">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Focus Delta</p>
                  <p className="text-2xl font-black">+{stats.points % 100} XP</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full xl:w-auto flex flex-col items-center gap-8 p-12 bg-white/5 border border-white/10 rounded-[5rem] backdrop-blur-2xl">
             <div className="text-center relative">
                <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-8">Neural Aligment</p>
                <div className="relative w-48 h-48 flex items-center justify-center">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - completionRate / 100)} strokeLinecap="round" className="transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black">{completionRate}%</span>
                   </div>
                </div>
             </div>
             <button onClick={onCheckIn} className={`w-full py-6 px-12 rounded-[2rem] text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl ${isCheckedIn ? 'bg-emerald-500/80 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}>
                {isCheckedIn ? 'Neural State Locked' : 'Sync Neural Stream'}
             </button>
          </div>
        </div>
        <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      </section>

      {/* Primary Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Biometric Line Chart */}
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-12">
           <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                  <BarChart3 size={32} className="text-indigo-600" /> Neural Biometrics
                </h3>
                <p className="text-sm font-medium text-slate-400 mt-2">Correlating emotional states with academic performance.</p>
              </div>
              <div className="flex gap-8">
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]"></div>
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Mood</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"></div>
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Stress</span>
                 </div>
              </div>
           </div>
           <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wellnessData}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} dy={20} />
                  <YAxis hide domain={[0, 6]} />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px'}}
                    itemStyle={{fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', padding: '4px 0'}}
                  />
                  <Area type="monotone" dataKey="Mood" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#colorMood)" />
                  <Area type="monotone" dataKey="Stress" stroke="#f43f5e" strokeWidth={6} fillOpacity={1} fill="url(#colorStress)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Holistic Balance Radar Chart */}
        <div className="lg:col-span-4 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-12">
            <div>
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                <LayoutGrid size={32} className="text-indigo-600" /> Life Balance
              </h3>
              <p className="text-sm font-medium text-slate-400 mt-2">Multi-dimensional wellness snapshot.</p>
            </div>
            
            <div className="h-[350px] w-full flex items-center justify-center">
               {moodEntries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                    <Radar
                      name="Recent Balance"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
               ) : (
                <div className="text-center space-y-6 opacity-30">
                  <Star size={64} className="mx-auto text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Logging Required</p>
                </div>
               )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-slate-50 rounded-[1.8rem] text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stability</p>
                  <p className="text-lg font-black text-slate-800">High</p>
               </div>
               <div className="p-5 bg-slate-50 rounded-[1.8rem] text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Burnout Risk</p>
                  <p className={`text-lg font-black ${wellnessInsight?.burnoutWarning ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {wellnessInsight?.burnoutWarning ? 'Critical' : 'Minimal'}
                  </p>
               </div>
            </div>
        </div>
      </section>

      {/* Identity & Advisor Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-center md:items-start transition-all hover:shadow-xl hover:border-indigo-100">
           <div className="relative">
              <div className="w-40 h-40 rounded-[4rem] bg-slate-100 flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl font-black text-slate-300">{profile.name?.charAt(0) || 'S'}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-4 rounded-3xl border-4 border-white shadow-xl">
                <Star size={24} fill="currentColor" />
              </div>
           </div>
           
           <div className="flex-1 space-y-8 text-center md:text-left">
              <div>
                <h1 className="text-5xl font-black text-slate-800 tracking-tight">Focus on, {profile.name || 'Scholar'}</h1>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[12px] mt-3">
                  {profile.stream} • Year {profile.collegeYear}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                 <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Rank</p>
                    <p className="text-2xl font-black text-indigo-600">LVL {stats.level}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Streak</p>
                    <p className="text-2xl font-black text-rose-500 flex items-center justify-center md:justify-start gap-3">
                      <Flame size={24} fill="currentColor" /> {stats.streak}
                    </p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">MindScore</p>
                    <p className="text-2xl font-black text-amber-500">{stats.points}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-[#0e111a] p-12 rounded-[4rem] text-white relative overflow-hidden flex flex-col justify-center shadow-2xl group">
           <div className="relative z-10 space-y-8">
              <div className="p-5 bg-indigo-600 rounded-[2rem] w-fit shadow-2xl">
                 <Brain size={36} />
              </div>
              <h4 className="text-4xl font-black tracking-tight leading-tight">Neural Insight</h4>
              <p className="text-lg text-slate-400 leading-relaxed font-medium">
                {wellnessInsight?.summary || "Analyzing biometrics... Logging health data initiates advisor logic."}
              </p>
              <div className="space-y-4">
                {wellnessInsight?.tips.slice(0, 2).map((tip, i) => (
                  <div key={i} className="flex gap-5 items-start bg-white/5 p-6 rounded-[2.2rem] border border-white/5 hover:bg-white/10 transition-all">
                    <Sparkles size={20} className="text-amber-400 shrink-0 mt-1" />
                    <p className="text-sm font-black text-slate-300 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
           </div>
           <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
