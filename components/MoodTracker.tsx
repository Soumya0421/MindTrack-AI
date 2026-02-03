
import React, { useState } from 'react';
import { MoodEntry } from '../types';
import { 
  Smile, Frown, Meh, Save, History, MessageSquare, 
  AlertTriangle, Droplets, Moon, UtensilsCrossed, 
  Dumbbell, Users, Zap, Star, Activity, Beef, Cookie, Pizza, Flame
} from 'lucide-react';

interface Props {
  onAddMood: (entry: MoodEntry) => void;
  entries: MoodEntry[];
}

const MoodTracker: React.FC<Props> = ({ onAddMood, entries }) => {
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [water, setWater] = useState(4);
  const [nutrition, setNutrition] = useState(3);
  const [activity, setActivity] = useState(3);
  const [social, setSocial] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [journal, setJournal] = useState('');

  // New Macro & Exercise State
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [calories, setCalories] = useState(0);
  const [exerciseType, setExerciseType] = useState('');

  const handleSave = () => {
    onAddMood({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      moodScore: mood,
      stressScore: stress,
      sleepHours: sleep,
      sleepQuality,
      physicalActivity: activity,
      socialConnection: social,
      productivityScore: productivity,
      waterIntake: water,
      nutritionScore: nutrition,
      journal,
      proteinGrams: protein,
      fatGrams: fat,
      carbGrams: carbs,
      totalCalories: calories,
      exerciseType
    });
    setJournal('');
    setMood(3);
    setStress(3);
    setWater(4);
    setSleep(7);
    setSleepQuality(3);
    setNutrition(3);
    setActivity(3);
    setSocial(3);
    setProductivity(3);
    setProtein(0);
    setFat(0);
    setCarbs(0);
    setCalories(0);
    setExerciseType('');
  };

  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile size={40} className="text-emerald-500" />;
    if (score <= 2) return <Frown size={40} className="text-rose-500" />;
    return <Meh size={40} className="text-amber-500" />;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
      {/* Entry Form */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
        <header>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Biometric Check-In</h2>
          <p className="text-slate-500 font-medium mt-2">Log your neural and physical states for AI correlation analysis.</p>
        </header>

        <div className="space-y-8">
          {/* Mood & Stress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5 bg-slate-50 p-6 rounded-[2rem]">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                Core Mood {getMoodIcon(mood)}
              </label>
              <input 
                type="range" min="1" max="5" step="1" 
                className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer accent-indigo-600 shadow-inner"
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-5 bg-slate-50 p-6 rounded-[2rem]">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                Stress Level <span className={`font-black ${stress > 3 ? 'text-rose-500' : 'text-emerald-500'}`}>{stress}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" 
                className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer accent-rose-500 shadow-inner"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* New Nutritional & Physical Protocol Section */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <UtensilsCrossed size={20} className="text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Macronutrient Protocol</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Beef size={12} className="text-rose-400" /> Protein
                </label>
                <input 
                  type="number" 
                  placeholder="0g"
                  className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl text-lg font-black text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  value={protein || ''}
                  onChange={(e) => setProtein(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Pizza size={12} className="text-amber-400" /> Fat
                </label>
                <input 
                  type="number" 
                  placeholder="0g"
                  className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl text-lg font-black text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  value={fat || ''}
                  onChange={(e) => setFat(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Cookie size={12} className="text-blue-400" /> Carbs
                </label>
                <input 
                  type="number" 
                  placeholder="0g"
                  className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl text-lg font-black text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  value={carbs || ''}
                  onChange={(e) => setCarbs(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Flame size={12} className="text-orange-400" /> Kcal
                </label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl text-lg font-black text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  value={calories || ''}
                  onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
               <div className="flex items-center gap-3">
                <Activity size={20} className="text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Physical Modality</h3>
              </div>
              <input 
                  type="text" 
                  placeholder="Exercise type (e.g. HIIT, Yoga, Lifting)"
                  className="w-full bg-white/5 border-2 border-white/10 p-5 rounded-2xl text-base font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sleep Section */}
            <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  <span className="flex items-center gap-2">
                    <Moon size={16} className="text-indigo-500" /> Sleep Duration
                  </span>
                  <span className="text-indigo-600">{sleep}h</span>
                </div>
                <input 
                  type="range" min="0" max="15" step="0.5" 
                  className="w-full h-2.5 bg-white rounded-full appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                  value={sleep}
                  onChange={(e) => setSleep(parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  <span className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500" /> Sleep Quality
                  </span>
                  <span className="text-amber-600">Lvl {sleepQuality}</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1" 
                  className="w-full h-2.5 bg-white rounded-full appearance-none cursor-pointer accent-amber-500 shadow-inner"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Activity & Social */}
            <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  <span className="flex items-center gap-2">
                    <Dumbbell size={16} className="text-emerald-500" /> Movement Intensity
                  </span>
                  <span className="text-emerald-600">Lvl {activity}</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1" 
                  className="w-full h-2.5 bg-white rounded-full appearance-none cursor-pointer accent-emerald-500 shadow-inner"
                  value={activity}
                  onChange={(e) => setActivity(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" /> Social Connection
                  </span>
                  <span className="text-blue-600">Lvl {social}</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1" 
                  className="w-full h-2.5 bg-white rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner"
                  value={social}
                  onChange={(e) => setSocial(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Water & Nutrition */}
            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem]">
               <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest mb-2">
                  <span className="flex items-center gap-2">
                    <Droplets size={16} className="text-cyan-500" /> Water
                  </span>
                  <span className="text-cyan-600">{water} glasses</span>
                </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setWater(i + 1)}
                    className={`flex-1 h-6 rounded-md transition-all ${i < water ? 'bg-cyan-500 shadow-sm' : 'bg-white border border-slate-200'}`}
                  ></button>
                ))}
              </div>
            </div>
            {/* Productivity */}
            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem]">
               <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-widest mb-2">
                  <span className="flex items-center gap-2">
                    <Zap size={16} className="text-indigo-500" /> Self-Productivity
                  </span>
                  <span className="text-indigo-600">Lvl {productivity}</span>
                </div>
               <input 
                  type="range" min="1" max="5" step="1" 
                  className="w-full h-2.5 bg-white rounded-full appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                  value={productivity}
                  onChange={(e) => setProductivity(parseInt(e.target.value))}
                />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <MessageSquare size={16} className="text-indigo-400" />
              Journal Insights (Optional)
            </label>
            <textarea 
              rows={4}
              placeholder="Reflect on your emotional triggers or breakthroughs today..."
              className="w-full p-6 rounded-[2rem] bg-slate-50 border-none text-base font-bold text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none shadow-inner"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
          >
            <Save size={20} /> Commit Wellness Log
          </button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-10">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
          <History size={28} className="text-indigo-600" />
          Neural History
        </h3>
        <div className="space-y-6 max-h-[1200px] overflow-y-auto pr-4 custom-scrollbar">
          {entries.slice().reverse().map(entry => (
            <div key={entry.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:border-indigo-100 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter saturate-150">{entry.moodScore >= 4 ? '✨' : entry.moodScore <= 2 ? '🌧️' : '⛅'}</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">Sleep: {entry.sleepHours}h ({entry.sleepQuality}★)</span>
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">Prod: {entry.productivityScore}/5</span>
                      {entry.exerciseType && (
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">{entry.exerciseType}</span>
                      )}
                    </div>
                  </div>
                  {entry.proteinGrams !== undefined && entry.proteinGrams > 0 && (
                    <div className="flex gap-4 mt-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        P: <span className="text-slate-800">{entry.proteinGrams}g</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        F: <span className="text-slate-800">{entry.fatGrams}g</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        C: <span className="text-slate-800">{entry.carbGrams}g</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        K: <span className="text-slate-800">{entry.totalCalories}</span>
                      </div>
                    </div>
                  )}
                </div>
                {entry.stressScore >= 4 && (
                  <div className="flex items-center gap-2 text-[10px] bg-rose-50 text-rose-600 font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-rose-100 animate-pulse">
                    <AlertTriangle size={14} /> Critical Strain
                  </div>
                )}
              </div>
              {entry.journal && (
                <div className="p-6 bg-slate-50 rounded-[1.8rem] text-sm text-slate-600 font-medium leading-relaxed border-l-4 border-indigo-200">
                  {entry.journal}
                </div>
              )}
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
               <Smile className="mx-auto text-slate-200 mb-6" size={64} />
              <p className="text-slate-400 font-black uppercase tracking-widest">Awaiting Initial Calibration</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
