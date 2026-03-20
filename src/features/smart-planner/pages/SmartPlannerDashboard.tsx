import * as React from 'react';
import { usePlanner } from '../hooks/usePlanner';
import { PlannerForm } from '../components/PlannerForm';
import { CalendarView } from '../components/CalendarView';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { WifiOff, Leaf, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AutoTranslate } from '../components/AutoTranslate';
import { LanguageSelector } from '../components/LanguageSelector';
import { useSidebar } from '../../../context/SidebarContext';

import { AICardRenderer } from '../components/AICardRenderer';

export const SmartPlannerDashboard: React.FC = () => {
  const { generatePlan, events, loading, error } = usePlanner();
  const { toggleSidebar } = useSidebar();

  const aiPlan = events.find(e => e.id?.toString().startsWith('ai-plan'));
  const otherEvents = events.filter(e => !e.id?.toString().startsWith('ai-plan'));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-teal-800 font-sans pb-12">
      {/* Custom Translucent Green Navbar (z-60 to overlay global navbar) */}
      <nav className="fixed top-0 w-full z-[60] bg-green-700/80 backdrop-blur-md px-4 py-3 flex items-center shadow-sm">
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="bg-white/20 backdrop-blur-lg p-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <Leaf className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-white tracking-tight">CropWise</span>
          </Link>
        </div>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          <Link to="/" className="text-white hover:text-green-200 transition-colors font-medium text-sm"><AutoTranslate text="Home" /></Link>
          <a href="#" className="text-white hover:text-green-200 transition-colors font-medium text-sm"><AutoTranslate text="Features" /></a>
          <a href="#" className="text-white hover:text-green-200 transition-colors font-medium text-sm"><AutoTranslate text="Weather" /></a>
        </div>

        {/* Right: Languages & Profile */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center border border-white/30 backdrop-blur-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
        </div>
      </nav>

      {/* Spacing for fixed navbar */}
      <div className="h-16"></div>

      {/* Top White Strip with Shadow */}
      <div className="bg-white shadow-xl py-6 px-6 mb-10 text-center border-b border-gray-200 w-full relative">
        <div className="flex items-center justify-center gap-6">
          <div className="hidden sm:block">
            <Leaf className="w-10 h-10 text-green-500/30 rotate-[-15deg] transition-all hover:text-green-500 hover:rotate-[-45deg] duration-500 cursor-default" />
          </div>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
              <span className="sm:hidden"><Leaf className="w-6 h-6 text-green-500" /></span>
              <AutoTranslate text="Smart Farming Planner" />
              <span className="sm:hidden"><Leaf className="w-6 h-6 text-green-500 scale-x-[-1]" /></span>
            </h1>
            <p className="text-green-700 mt-1 font-semibold text-sm">
              <AutoTranslate text="AI-generated weekly and monthly agricultural schedules" />
            </p>
          </div>

          <div className="hidden sm:block">
            <Leaf className="w-10 h-10 text-green-500/30 rotate-[15deg] scale-x-[-1] transition-all hover:text-green-500 hover:rotate-[45deg] duration-500 cursor-default" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-12 px-6 sm:px-10 lg:px-12">
        
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <WifiOff className="w-5 h-5" />
            <p><AutoTranslate text={error} /></p>
          </div>
        )}

        {/* Top Grid: Form + Notifications side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PlannerForm onSubmit={generatePlan} isLoading={loading} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
               <NotificationsPanel events={events} />
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm text-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                <AutoTranslate text="Offline Ready" />
              </h4>
              <p className="text-gray-600 leading-relaxed">
                <AutoTranslate text="Your plans are synchronized to your device. You can access them locally even without an internet connection." />
              </p>
            </div>
          </div>
        </div>

        {/* AI Master Strategy Hub (Prominent) */}
        {aiPlan && (
          <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center gap-6">
                <h2 className="text-2xl font-black text-white shrink-0 tracking-tight">
                  <AutoTranslate text="AI Master Strategy" />
                </h2>
                <div className="h-[2px] bg-white/20 flex-1 rounded-full" />
                <span className="px-4 py-1.5 bg-green-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                  Live Agent Analysis
                </span>
             </div>
             <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-1 border border-white/10">
                <AICardRenderer text={aiPlan.description} />
             </div>
          </div>
        )}

        {/* Bottom Area: Full Calendar View */}
        {otherEvents.length > 0 && (
          <div className="pt-12 mt-12 border-t border-white/10">
            <h2 className="text-2xl font-black text-white mb-8 drop-shadow-md tracking-tight">
              <AutoTranslate text="Farming Tasks & Milestones" />
            </h2>
            <CalendarView events={otherEvents} />
          </div>
        )}

      </div>
    </div>
  );
};
