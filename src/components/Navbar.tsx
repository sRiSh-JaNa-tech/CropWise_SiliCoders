import React from 'react';
import { Menu, Leaf, User, LogOut, BellRing, AlertCircle, Globe, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from './dashboard/LanguageContext';

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Punjabi',
];

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
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
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <Link to="/about" className="hover:text-primary transition-colors">About App</Link>
        <Link to="/api" className="hover:text-primary transition-colors">Mandi API</Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-300"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{language}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in duration-200">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                    language === lang
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
        {user ? (
          <>
            {/* Pulsing Reminder Icon */}
            {hasMissingDocs && (
              <div className="relative group cursor-help">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping" />
                <AlertCircle className="w-6 h-6 text-yellow-500 relative z-10" />
                
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-3 w-64 p-3 bg-gray-900 border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[11px]">
                  <p className="font-bold text-yellow-500 mb-1">Profile Incomplete</p>
                  <p className="text-gray-400 leading-relaxed">
                    A few documents are missing from your profile ({user.missingDocs.length} items). Please upload them at your convenience to unlock all PM schemes.
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
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hidden sm:block px-4 py-2 border border-white/20 hover:bg-white/5 rounded-full text-sm font-semibold transition-all">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-full text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
