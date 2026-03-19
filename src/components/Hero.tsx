import React, { useState } from 'react';
import { CloudRain, Server, ArrowRight } from 'lucide-react';
import { AutoTranslate } from '../features/smart-planner/components/AutoTranslate';

const Hero: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setHealthStatus('Checking backend...');
      // Uses the new Vite proxy to hit the Express port
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data.message);
    } catch (err) {
      setHealthStatus('Connection failed. Backend is offline.');
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 lg:p-12 min-h-[calc(100vh-80px)]">
      
      {/* Background Starry/Space effect can be achieved via CSS in index.css, here we add top content */}
      <div className="text-center max-w-4xl mx-auto z-10 animate-fade-in-up mt-[-10vh]">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <AutoTranslate text="CROPWISE COPILOT V1.0" />
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2 text-white drop-shadow-lg">
          <AutoTranslate text="Your Farm." />
        </h1>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-primary to-secondary bg-clip-text text-transparent pb-2">
          <AutoTranslate text="Mastered." />
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          <AutoTranslate text="Secure, analyze, plan, and automate your farming decisions with our Generative AI-powered toolkit. Your data stays 100% private." />
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={checkHealth}
            className="w-full sm:w-auto px-8 py-4 bg-[#111827] hover:bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all group"
          >
            <Server className={`w-5 h-5 ${healthStatus && !healthStatus.includes('failed') ? 'text-green-400' : 'text-gray-400 group-hover:text-primary'} transition-colors`} />
            <AutoTranslate text={healthStatus || "Test Backend Connection"} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
            <AutoTranslate text="Start AI Chat" /> <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold mr-2 shadow-[0_0_10px_rgba(37,99,235,0.4)]"><AutoTranslate text="NEW" /></span>
          <p><AutoTranslate text="Live Weather Maps & Smart Mandi APIs now enabled!" /> <a href="#" className="underline hover:text-white transition-colors"><AutoTranslate text="View Map" /></a></p>
        </div>
      </div>

      {/* Mock Live Weather Widget (Bottom centered) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <CloudRain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white"><AutoTranslate text="Live Weather Radar" /></p>
              <p className="text-xs text-gray-400"><AutoTranslate text="Clear conditions • 24°C" /></p>
            </div>
          </div>
          <button className="text-xs font-bold text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <AutoTranslate text="Open Map" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
