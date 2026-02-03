
import React, { useState, useMemo, useRef } from 'react';
import { Resource, Subject, AppState } from '../types';
import { 
  Youtube, FileText, Trash2, Search, 
  Layers, StickyNote, Brain, Link as LinkIcon, ExternalLink,
  ChevronDown, Sparkles, AlertCircle, Upload, FileCheck, Download, X
} from 'lucide-react';
import { generateStudyResources as generateStudyResourcesGemini } from '../services/geminiService';
import { generateStudyResources as generateStudyResourcesOpenRouter } from '../services/openRouterService';

interface Props {
  state: AppState;
  onAddResource: (r: Resource) => void;
  onDeleteResource: (id: string) => void;
}

const ResourceManager: React.FC<Props> = ({ state, onAddResource, onDeleteResource }) => {
  const { subjects, resources, profile, openRouterConfig } = state;
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // New Resource Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{name: string, data: string, type: string} | null>(null);
  
  const [error, setError] = useState('');
  const [aiGuides, setAiGuides] = useState<{title: string, advice: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAIResources = async () => {
    if (subjects.length === 0) {
      setError('Please add subjects in the Study Plan tab first.');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    try {
      const guides = openRouterConfig.apiKey 
        ? await generateStudyResourcesOpenRouter(openRouterConfig, profile, subjects)
        : await generateStudyResourcesGemini(profile, subjects);
      setAiGuides(guides);
    } catch (e: any) {
      setError(e.message || 'Guide generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          data: reader.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    const targetSubject = activeSubject === 'all' ? (subjects[0]?.id || '') : activeSubject;
    if (!title && !selectedFile) return;
    
    let detectedType: 'video' | 'document' | 'note' | 'file' = 'document';
    if (url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be')) {
      detectedType = 'video';
    } else if (selectedFile) {
      detectedType = 'file';
    } else if (!url && notes) {
      detectedType = 'note';
    }

    onAddResource({
      id: crypto.randomUUID(),
      subjectId: targetSubject,
      title: title || selectedFile?.name || 'Untitled Resource',
      url,
      notes,
      type: detectedType,
      fileName: selectedFile?.name,
      fileData: selectedFile?.data
    });

    // Reset form
    setTitle(''); 
    setUrl('');
    setNotes('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSubject = activeSubject === 'all' || r.subjectId === activeSubject;
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'video' && r.type === 'video') || 
        (typeFilter === 'document' && (r.type === 'document' || r.type === 'file'));
      return matchesSubject && matchesSearch && matchesType;
    });
  }, [resources, activeSubject, searchQuery, typeFilter]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Youtube size={24} />;
      case 'document': 
      case 'file': return <FileCheck size={24} />;
      case 'note': return <StickyNote size={24} />;
      default: return <LinkIcon size={24} />;
    }
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Sidebar Collections */}
        <div className="lg:col-span-3 space-y-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Collections</h3>
            <Layers size={22} className="text-slate-400" />
          </div>
          <div className="flex flex-col gap-4">
            {/* THICK ALL RESOURCES BUTTON */}
            <button 
              onClick={() => setActiveSubject('all')} 
              className={`p-6 rounded-[1.8rem] text-left text-base font-black transition-all relative overflow-hidden group ${
                activeSubject === 'all' 
                ? 'bg-gradient-to-r from-[#0000d1] via-[#2c37e1] to-[#6b21ff] text-white shadow-[0_15px_30px_-10px_rgba(44,55,225,0.6)]' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 shadow-sm'
              }`}
            >
              <span className="relative z-10">All Resources</span>
              {activeSubject === 'all' && (
                <div className="absolute inset-0 bg-white/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              )}
            </button>
            {subjects.map(s => (
              <button 
                key={s.id} 
                onClick={() => setActiveSubject(s.id)} 
                className={`p-6 rounded-[1.8rem] text-left text-base font-bold transition-all border-2 flex items-center gap-5 ${
                  activeSubject === s.id 
                  ? 'bg-white border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-100' 
                  : 'bg-white border-transparent text-slate-500 hover:border-slate-100 shadow-sm'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: s.color}}></div>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Vault Area */}
        <div className="lg:col-span-9 space-y-16">
           
           {/* Add New Reference Card */}
           <div className="bg-[#f2f4f7] p-12 md:p-16 rounded-[3.5rem] shadow-sm space-y-12">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Add New Reference</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    placeholder="Enter resource name" 
                    className="w-full p-6 rounded-2xl bg-white border-none text-base font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 shadow-sm" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                  />
                </div>
                <div className="space-y-5">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">URL / Link</label>
                  <input 
                    placeholder="Paste link here (Optional)" 
                    className="w-full p-6 rounded-2xl bg-white border-none text-base font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 shadow-sm" 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Normal Text Notes</label>
                <textarea 
                  placeholder="Enter details here..." 
                  rows={4}
                  className="w-full p-6 rounded-2xl bg-white border-none text-base font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-300 shadow-sm" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-5">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Attachment (PDF, DOCX)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-12 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer transition-all ${
                    selectedFile ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-8 w-full max-xl justify-between p-6 bg-white rounded-3xl shadow-lg border border-indigo-100 animate-in zoom-in-95">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                          <FileCheck size={32} />
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-black text-slate-800 truncate max-w-[300px]">{selectedFile.name}</p>
                          <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mt-1">Ready for Storage</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="p-3 hover:bg-rose-50 rounded-full text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <X size={28} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-6 bg-slate-100 text-slate-400 rounded-[2rem]">
                        <Upload size={40} />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-500">Click to upload document or drop file here</p>
                        <p className="text-sm text-slate-400 font-bold mt-2">PDF, DOCX supported</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* THICK SAVE TO VAULT BUTTON */}
              <div className="relative pt-4">
                <button 
                  onClick={handleAdd} 
                  className="w-full py-8 bg-[#0e111a] text-white rounded-[1.5rem] font-black text-base hover:bg-slate-800 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-[0.98] tracking-[0.2em] uppercase relative overflow-hidden group"
                >
                  <span className="relative z-10">Save to Vault</span>
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </button>
              </div>
           </div>

           {/* Search & Filtering */}
           <div className="bg-[#f2f4f7] p-4 rounded-[2.2rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input 
                  type="text"
                  placeholder="Search in vault"
                  className="w-full pl-20 pr-10 py-6 bg-white rounded-[1.8rem] border-none text-base font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4 p-1 px-6">
                 <button 
                  onClick={() => setTypeFilter('all')}
                  className={`px-8 py-4 rounded-2xl text-[12px] font-black transition-all ${typeFilter === 'all' ? 'bg-[#2c37e1] text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 bg-white shadow-sm'}`}
                 >
                   All
                 </button>
                 <button 
                  onClick={() => setTypeFilter('video')}
                  className={`px-8 py-4 rounded-2xl text-[12px] font-black flex items-center gap-3 transition-all ${typeFilter === 'video' ? 'bg-[#2c37e1] text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 bg-white shadow-sm'}`}
                 >
                   <Youtube size={18}/> Video
                 </button>
                 <button 
                  onClick={() => setTypeFilter('document')}
                  className={`px-8 py-4 rounded-2xl text-[12px] font-black flex items-center gap-3 transition-all ${typeFilter === 'document' ? 'bg-[#2c37e1] text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 bg-white shadow-sm'}`}
                 >
                   <FileText size={18}/> Docs
                 </button>
              </div>
           </div>

           {/* Results Display */}
           <div className="min-h-[600px] flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-slate-100 rounded-[3.5rem] shadow-inner">
              {filteredResources.length > 0 ? (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10">
                  {filteredResources.map(r => (
                    <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex gap-8 items-center group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all">
                       <div className={`p-6 rounded-3xl shadow-sm ${
                         r.type === 'video' ? 'bg-rose-50 text-rose-500' : 
                         (r.type === 'document' || r.type === 'file') ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                       }`}>
                         {getIcon(r.type)}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-800 text-lg truncate tracking-tight">{r.title}</h4>
                          <div className="flex flex-wrap gap-4 mt-3">
                            {r.url && (
                              <a href={r.url} target="_blank" className="text-[11px] font-black text-indigo-600 uppercase flex items-center gap-2 hover:underline tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                                View Source <ExternalLink size={14} />
                              </a>
                            )}
                            {r.fileData && (
                              <a 
                                href={r.fileData} 
                                download={r.fileName || 'document'} 
                                className="text-[11px] font-black text-emerald-600 uppercase flex items-center gap-2 hover:underline tracking-widest bg-emerald-50 px-2 py-1 rounded-lg"
                              >
                                Download <Download size={14} />
                              </a>
                            )}
                          </div>
                          {r.notes && (
                            <p className="text-sm text-slate-400 mt-3 line-clamp-2 font-medium leading-relaxed">{r.notes}</p>
                          )}
                       </div>
                       <button onClick={() => onDeleteResource(r.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-colors bg-slate-50 rounded-2xl group-hover:bg-rose-50">
                          <Trash2 size={24} />
                       </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-10 max-w-sm">
                  <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                    <Search size={64} />
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-slate-800 font-black text-2xl tracking-tight">No findings in the vault</h5>
                    <p className="text-slate-400 text-base font-medium leading-relaxed">Adjust your filters or add a new resource to begin building your academic intelligence database.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* AI Advisor Banner */}
      <section className="bg-[#0e111a] p-16 md:p-24 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row gap-16 items-center min-h-[400px]">
        <div className="relative z-10 flex-1 space-y-10">
           <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-white/5 border border-white/10 text-indigo-400 rounded-full text-[12px] font-black uppercase tracking-[0.25em]">
              <Brain size={20} /> AI Study Advisor
           </div>
           <h2 className="text-5xl font-black text-white tracking-tight leading-tight">Neural Resource Intelligence</h2>
           <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-medium">
             Activating advanced heuristics to analyze your stream ({profile.stream}) and current workload. I will architect a custom resource path tailored to your specific focus patterns.
           </p>
           
           {/* THICK GENERATE BUTTON */}
           <button 
            onClick={handleGenerateAIResources}
            disabled={isGenerating}
            className="px-14 py-7 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] active:scale-95 tracking-widest uppercase"
           >
             {isGenerating ? "Synthesizing Path..." : "Generate AI Learning Path"}
           </button>
        </div>
        
        <div className="relative z-10 w-full lg:w-2/5 h-[300px] border border-dashed border-white/10 rounded-[3rem] bg-white/5 flex flex-col items-center justify-center p-10 text-center shadow-2xl">
           {aiGuides.length > 0 ? (
             <div className="w-full space-y-6 overflow-y-auto max-h-full pr-4 custom-scrollbar">
                {aiGuides.map((guide, i) => (
                  <div key={i} className="text-left p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors group">
                    <p className="text-indigo-400 text-sm font-black mb-2 uppercase tracking-widest group-hover:text-indigo-300">{guide.title}</p>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{guide.advice}</p>
                  </div>
                ))}
             </div>
           ) : (
             <div className="space-y-6 opacity-30">
               <Sparkles size={64} className="mx-auto text-white animate-pulse" />
               <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Neural Cache Standby</p>
             </div>
           )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-40 -bottom-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      </section>
    </div>
  );
};

export default ResourceManager;
