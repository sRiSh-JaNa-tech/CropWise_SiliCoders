import React, { useState, useEffect } from 'react';
import { Stethoscope, Upload, Search, ShieldAlert, X, ChevronRight, FileText, Activity } from 'lucide-react';

const CropDoctor: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mock fetching records from CSV (simulated for simplicity)
    const mockRecords = [
      { id: 1, date: '2026-03-15', crop: 'Tomato', issue: 'Early Blight', severity: 'High', recommendation: 'Copper fungicide' },
      { id: 2, date: '2026-03-12', crop: 'Wheat', issue: 'Rust', severity: 'Medium', recommendation: 'Improve ventilation' },
      { id: 3, date: '2026-03-10', crop: 'Potato', issue: 'Late Blight', severity: 'Critical', recommendation: 'Pruning + Drainage' },
      { id: 4, date: '2026-03-05', crop: 'Corn', issue: 'Nitrogen Def.', severity: 'Low', recommendation: 'Organic fertilizer' },
    ];
    setRecords(mockRecords);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        startAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = () => {
    setAnalyzing(true);
    setResult(null);
    // Simulate AI analysis delay
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        disease: 'Tomato Late Blight (Phytophthora infestans)',
        deficiency: 'Magnesium & Nitrogen Deficiency',
        confidence: 97.8,
        treatment: '1. Remove affected leaves immediately. 2. Spray Mancozeb (2g/L). 3. Apply balanced N-P-K fertilizer with micronutrients.',
        severity: 'High'
      });
    }, 3500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-end overflow-hidden font-outfit">
      {/* Immersive Full-Screen Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/images/crop_doctor_full_bg.png" 
          alt="Crop Doctor Background" 
          className="w-full h-full object-cover"
        />
        {/* Subtle Dark Overlay for contrast on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B1F1A]/20 to-[#0B1F1A]/80 lg:to-[#0B1F1A]/90" />
      </div>

      {/* Main Content Pane (Right Aligned) */}
      <div className="relative z-10 w-full lg:w-1/2 p-6 sm:p-12 lg:pr-20 animate-in fade-in slide-in-from-right duration-1000">
        <div className="max-w-xl ml-auto bg-[#122F27]/60 backdrop-blur-2xl p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1FAF5A]/20 rounded-full border border-[#1FAF5A]/30 mb-8">
            <Stethoscope className="w-4 h-4 text-[#1FAF5A]" />
            <span className="text-[#1FAF5A] text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">Advanced AI Diagnostics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6">
            Meet Your <br/> <span className="text-[#1FAF5A]">AI Crop Doctor</span>
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed mb-10">
            Harness the power of neural networks to diagnose your crops in seconds. Select a photo from your gallery, and our doctor will do the rest.
          </p>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
            accept="image/*"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={handleUploadClick}
              disabled={analyzing}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 group shadow-xl ${
                analyzing 
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                  : 'bg-[#1FAF5A] text-white hover:bg-[#1FAF5A]/90 hover:shadow-[#1FAF5A]/20'
              }`}
            >
              {analyzing ? (
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Analyzing...
                </div>
              ) : (
                <>
                   <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                   Pick Photo
                </>
              )}
            </button>
            <button 
              onClick={() => setShowRecords(true)}
              className="flex items-center justify-center gap-3 px-8 py-5 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all active:scale-95 shadow-xl"
            >
              <Search className="w-5 h-5" />
              Recent Records
            </button>
          </div>

          {/* Analysis Image Preview */}
          {selectedImage && (
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative aspect-video bg-black/20">
              <img src={selectedImage} alt="Uploaded crop" className="w-full h-full object-contain" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#1FAF5A]/30 border-t-[#1FAF5A] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[#1FAF5A] font-bold text-sm tracking-widest uppercase">Scanning Tissues</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Result Display */}
          {result && (
            <div className="mt-8 p-6 bg-[#1FAF5A]/10 rounded-3xl border border-[#1FAF5A]/30 animate-in zoom-in duration-500 shadow-[0_0_50px_rgba(31,175,90,0.1)]">
               <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-[#1FAF5A]" />
                  <h3 className="text-xl font-bold text-white">Diagnostic Result</h3>
                  <span className="ml-auto text-xs font-bold px-2 py-1 bg-[#1FAF5A]/20 text-[#1FAF5A] rounded-lg">
                    {result.confidence}% Confidence
                  </span>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                     <span className="text-gray-400">Condition:</span>
                     <span className="text-[#1FAF5A] font-bold">{result.disease}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                     <span className="text-gray-400">Severity:</span>
                     <span className="text-red-400 font-bold uppercase tracking-widest text-xs mt-1">{result.severity}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Recommended Treatment</p>
                    <p className="text-sm text-gray-300 leading-relaxed italic">{result.treatment}</p>
                  </div>
               </div>
            </div>
          )}

          <div className="pt-10 mt-10 border-t border-white/10 flex items-center justify-between">
            <div className="text-center group cursor-help">
              <p className="text-3xl font-black text-white group-hover:text-[#1FAF5A] transition-colors">98%</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Accuracy</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center group cursor-help">
              <p className="text-3xl font-black text-white group-hover:text-[#1FAF5A] transition-colors">2s</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Analysis</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center group cursor-help">
              <p className="text-3xl font-black text-white group-hover:text-[#1FAF5A] transition-colors">50+</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Crops</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Badge (Bottom Left) */}
      <div className="absolute bottom-8 left-8 z-20 hidden sm:flex items-center gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-[#1FAF5A]/20 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-[#1FAF5A]" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">System Status</p>
          <p className="text-sm font-bold text-white tracking-tight">Active & Protecting Crops</p>
        </div>
      </div>

      {/* Recent Records Modal */}
      {showRecords && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#122F27] w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1FAF5A]/10 to-transparent">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#1FAF5A]" />
                <h2 className="text-2xl font-bold text-white tracking-tight">Recent Records</h2>
              </div>
              <button 
                onClick={() => setShowRecords(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {records.map((rec) => (
                  <div key={rec.id} className="group p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#1FAF5A]/30 hover:bg-[#1FAF5A]/5 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-md">{rec.date}</span>
                         <h4 className="font-bold text-white text-lg">{rec.crop}</h4>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        rec.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                        rec.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {rec.severity}
                      </span>
                    </div>
                    <p className="text-[#1FAF5A] font-semibold mb-2">{rec.issue}</p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                       <p className="italic">"{rec.recommendation}"</p>
                       <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-white/5 flex justify-center">
               <button className="text-[#1FAF5A] text-sm font-bold hover:underline">Download Full CSV Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropDoctor;
