
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, OpenRouterConfig } from '../types';
import { Save, User as UserIcon, Shield, ChevronDown, CheckCircle2, Cpu, Key, RefreshCw, AlertCircle, Upload, Image as ImageIcon, Sparkles, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { fetchModels } from '../services/openRouterService';

interface Props {
  profile: UserProfile;
  openRouterConfig: OpenRouterConfig;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateConfig: (config: OpenRouterConfig) => void;
  onResetApp: () => void;
}

const Settings: React.FC<Props> = ({ profile, openRouterConfig, onUpdateProfile, onUpdateConfig, onResetApp }) => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [localConfig, setLocalConfig] = useState<OpenRouterConfig>(openRouterConfig);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const isProfileComplete = 
    localProfile.name.trim() !== '' &&
    localProfile.stream.trim() !== '' &&
    localProfile.gender !== 'Not Specified' &&
    localProfile.bloodType !== '' &&
    localProfile.age >= 10 && localProfile.age <= 120 &&
    localConfig.apiKey.trim() !== '';

  const handleFetchModels = async () => {
    if (!localConfig.apiKey) {
      setError('OpenRouter API Key is mandatory to fetch neural models');
      return;
    }
    setError('');
    setIsFetching(true);
    try {
      const fetched = await fetchModels(localConfig.apiKey);
      const modelList = fetched.map((m: any) => ({ id: m.id, name: m.name || m.id }));
      setLocalConfig(prev => ({ ...prev, availableModels: modelList }));
      showSuccess('Available models synchronized.');
    } catch (e: any) {
      setError(e.message || 'Failed to fetch models');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile({ ...localProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    if (localProfile.age < 10 || localProfile.age > 120) {
      setError('Please provide a realistic age (10-120).');
      return;
    }
    if (!isProfileComplete) {
      setError('All mandatory fields (Name, Stream, Gender, Blood Type, Age, and API Key) must be filled to commit.');
      return;
    }
    setError('');
    onUpdateProfile(localProfile);
    onUpdateConfig(localConfig);
    showSuccess('Neural synchronization successful. System unlocked.');
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const renderMandatoryLabel = (text: string, value: any) => {
    const isMissing = !value || (typeof value === 'string' && value.trim() === '') || value === 'Not Specified' || (typeof value === 'number' && (value < 10 || value > 120));
    return (
      <label className={`text-[14px] font-black uppercase ml-3 tracking-[0.2em] flex items-center gap-2 ${isMissing ? 'text-rose-400' : 'text-slate-400'}`}>
        {text} {isMissing && <span className="text-[10px] bg-rose-50 px-2 py-0.5 rounded-md text-rose-500">MANDATORY</span>}
      </label>
    );
  };

  const isModelsLocked = !localConfig.apiKey;
  const availableModels = localConfig.availableModels || [];

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="space-y-4 px-2">
        <h2 className="text-6xl font-black text-slate-800 tracking-tight">System Configuration</h2>
        <p className="text-xl text-slate-500 font-semibold opacity-70">Initialize your core profile and neural bridge to unlock full system capability.</p>
      </header>

      {!isProfileComplete && (
        <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-center gap-6 animate-pulse">
           <div className="p-4 bg-amber-400 text-white rounded-2xl shadow-lg">
             <AlertCircle size={32} />
           </div>
           <div>
             <h4 className="text-xl font-black text-amber-900 tracking-tight">Setup Pending</h4>
             <p className="text-amber-700 font-bold">Please provide all mandatory details and click 'Commit Configuration' at the bottom.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-8 space-y-12">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-20">
              <div className="flex items-center gap-8">
                <div className="p-6 bg-slate-50 text-indigo-600 rounded-[2rem] shadow-sm border border-slate-100">
                  <UserIcon size={36} />
                </div>
                <h3 className="text-5xl font-black text-slate-800 tracking-tight">Account Identity</h3>
              </div>
              
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center text-slate-200">
                  {localProfile.avatar ? (
                    <img src={localProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={48} />
                  )}
                </div>
                <div className="absolute inset-0 bg-indigo-600/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                  <Upload size={32} />
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>

            <div className="space-y-14">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  {renderMandatoryLabel("Student Name", localProfile.name)}
                  <input
                    className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    value={localProfile.name}
                    onChange={e => setLocalProfile({ ...localProfile, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-5">
                  {renderMandatoryLabel("Academic Stream", localProfile.stream)}
                  <input
                    className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    value={localProfile.stream}
                    onChange={e => setLocalProfile({ ...localProfile, stream: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="space-y-5">
                  {renderMandatoryLabel("Gender Orientation", localProfile.gender)}
                  <div className="relative">
                    <select
                      className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                      value={localProfile.gender}
                      onChange={e => setLocalProfile({ ...localProfile, gender: e.target.value })}
                    >
                      <option value="Not Specified">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                    <ChevronDown size={32} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-5">
                  {renderMandatoryLabel("Blood Type Identifier", localProfile.bloodType)}
                  <div className="relative">
                    <select
                      className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                      value={localProfile.bloodType}
                      onChange={e => setLocalProfile({ ...localProfile, bloodType: e.target.value })}
                    >
                      <option value="">Select blood type...</option>
                      {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <ChevronDown size={32} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  <label className="text-[14px] font-black text-slate-400 uppercase ml-3 tracking-[0.2em]">Current Academic Year</label>
                  <input
                    className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all shadow-inner"
                    value={localProfile.collegeYear}
                    onChange={e => setLocalProfile({ ...localProfile, collegeYear: e.target.value })}
                  />
                </div>
                <div className="space-y-5">
                  {renderMandatoryLabel("User Chronology (Age)", localProfile.age)}
                  <input
                    type="number"
                    min="10"
                    max="120"
                    className="w-full p-8 rounded-[2.2rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    value={localProfile.age || ''}
                    onChange={e => setLocalProfile({ ...localProfile, age: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 20 (Mandatory 10-120)"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[14px] font-black text-slate-400 uppercase ml-3 tracking-[0.2em]">Personal Bio / Scholarly Goals</label>
                <textarea
                  rows={5}
                  className="w-full p-8 rounded-[2.5rem] bg-slate-100/50 border-2 border-transparent text-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all resize-none placeholder:text-slate-300 shadow-inner"
                  value={localProfile.bio}
                  onChange={e => setLocalProfile({ ...localProfile, bio: e.target.value })}
                  placeholder="Briefly describe your goals for tailored AI advice..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveAll}
              className={`w-full py-10 rounded-[2.5rem] font-black text-xl transition-all flex items-center justify-center gap-6 shadow-2xl mt-20 active:scale-[0.98] tracking-[0.3em] uppercase ${
                isProfileComplete ? 'bg-[#161b2e] text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProfileComplete ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              Commit Configuration
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/50 p-12 md:p-20 rounded-[4rem] border border-rose-100 space-y-12">
             <div className="flex items-center gap-6">
                <div className="p-5 bg-rose-500 text-white rounded-[2rem] shadow-xl shadow-rose-100">
                  <AlertTriangle size={36} />
                </div>
                <div>
                   <h3 className="text-3xl font-black text-rose-900 tracking-tight">Danger Zone</h3>
                   <p className="text-rose-600 font-bold opacity-70">Irreversible system modifications.</p>
                </div>
             </div>
             
             <div className="p-8 bg-white/60 rounded-[2.5rem] border border-rose-100 space-y-6">
                <p className="text-sm font-bold text-rose-800 leading-relaxed">
                  Resetting the application will wipe all local storage cache, including subjects, study plans, wellness logs, and profile data. This action cannot be undone.
                </p>
                <button 
                  onClick={onResetApp}
                  className="w-full py-6 bg-rose-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                >
                  <Trash2 size={20} /> Purge All Local Data
                </button>
             </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-12">
          <section className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-12 animate-in slide-in-from-right-8 duration-700 delay-200">
             <div className="flex items-center gap-6">
                <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-sm border border-slate-50">
                  <Cpu size={32} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Neural Engine</h3>
             </div>
             
             {error && (
               <div className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] text-sm font-black flex items-center gap-4 border border-rose-100 animate-in fade-in zoom-in-95">
                 <AlertCircle size={24} /> {error}
               </div>
             )}

             <div className="space-y-10">
                <div className="space-y-5">
                   <div className="flex justify-between items-center ml-3">
                     {renderMandatoryLabel("OpenRouter Key", localConfig.apiKey)}
                     <button 
                      onClick={handleFetchModels}
                      disabled={isFetching}
                      className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                     >
                       <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                       Sync Models
                     </button>
                   </div>
                   <input
                    type="password"
                    className="w-full p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-lg font-bold text-slate-800 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    value={localConfig.apiKey}
                    onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                   />
                </div>

                <div className="space-y-5">
                   <div className="flex items-center justify-between ml-3">
                     <label className={`text-[12px] font-black uppercase tracking-[0.2em] ${isModelsLocked ? 'text-slate-300' : 'text-slate-400'}`}>Model Provider</label>
                     {availableModels.length === 0 && localConfig.apiKey && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1"><Lock size={10} /> Sync Advised</span>}
                   </div>
                   <div className="relative group">
                      <select
                        disabled={isModelsLocked}
                        className={`w-full p-8 rounded-[2rem] border-2 text-lg font-bold outline-none transition-all appearance-none shadow-inner ${
                          isModelsLocked 
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                          : 'bg-slate-50 border-slate-100 text-slate-800 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/20 cursor-pointer'
                        }`}
                        value={localConfig.selectedModel}
                        onChange={e => setLocalConfig({ ...localConfig, selectedModel: e.target.value })}
                      >
                        <option value="google/gemini-flash-1.5">Gemini 1.5 Flash (Default)</option>
                        {availableModels.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={32} className={`absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none ${isModelsLocked ? 'text-slate-200' : 'text-slate-400'}`} />
                   </div>
                </div>
             </div>
             
             <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50">
               <p className="text-sm text-indigo-900 font-bold leading-relaxed opacity-70">
                 Providing a valid API key is mandatory to bridge the system to the neural processing cluster.
               </p>
             </div>
          </section>

          <section className="bg-[#161b2e] p-16 rounded-[4rem] shadow-2xl text-white space-y-12 relative overflow-hidden group">
            <div className="flex items-center gap-6 relative z-10">
              <div className="p-5 bg-white/10 text-white rounded-[2rem] border border-white/10">
                <Shield size={36} />
              </div>
              <h3 className="text-4xl font-black tracking-tight">Vault Protocol</h3>
            </div>
            <p className="text-lg text-slate-400 leading-relaxed font-bold relative z-10 opacity-80">
              Your academic footprint is ephemeral and secure. All session data, including mandatory neural API keys, are stored exclusively within your local browser's persistent cache.
            </p>
            {success && (
              <div className="p-8 bg-indigo-500 text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] text-center shadow-2xl animate-in fade-in slide-in-from-bottom-8 flex items-center justify-center gap-5 relative z-10">
                <Sparkles size={28} /> {success}
              </div>
            )}
            <div className="absolute -right-32 -bottom-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000"></div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
