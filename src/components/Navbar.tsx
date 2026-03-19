import React from 'react';
import { Menu, Leaf, User, LogOut, BellRing, AlertCircle, Globe, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AutoTranslate } from '../features/smart-planner/components/AutoTranslate';
import { LanguageSelector } from '../features/smart-planner/components/LanguageSelector';
import { useLanguage } from './dashboard/LanguageContext';
import { useSidebar } from '../context/SidebarContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasMissingDocs = user && user.missingDocs && user.missingDocs.length > 0;

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2 group">
          <Leaf className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight">CropWise</span>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <Link to="/" className="hover:text-primary transition-colors"><AutoTranslate text="Home" /></Link>
        <Link to="/about" className="hover:text-primary transition-colors"><AutoTranslate text="About App" /></Link>
        <Link to="/api" className="hover:text-primary transition-colors"><AutoTranslate text="Mandi API" /></Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Upstream Global Language Selector */}
        <LanguageSelector />
        {user ? (
          <>
            {/* Pulsing Reminder Icon */}
            {hasMissingDocs && (
              <div className="relative group cursor-help">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping" />
                <AlertCircle className="w-6 h-6 text-yellow-500 relative z-10" />
                
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-3 w-64 p-3 bg-gray-900 border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[11px]">
                  <p className="font-bold text-yellow-500 mb-1">
                    <AutoTranslate text="Profile Incomplete" />
                  </p>
                  <p className="text-gray-400 leading-relaxed">
                    <AutoTranslate text={`A few documents are missing from your profile (${user.missingDocs.length} items). Please upload them at your convenience to unlock all PM schemes.`} />
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mr-1 sm:mr-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold hidden sm:block">{user.name.split(' ')[0]}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/10 rounded-full text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block"><AutoTranslate text="Sign Out" /></span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hidden sm:block px-4 py-2 border border-white/20 hover:bg-white/5 rounded-full text-sm font-semibold transition-all">
              <AutoTranslate text="Login" />
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-full text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
              <AutoTranslate text="Sign Up" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
