import React from 'react';
import { Menu, Leaf, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AutoTranslate } from '../features/smart-planner/components/AutoTranslate';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
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
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <AutoTranslate text="More Tools" /> <span className="text-xs opacity-50">▼</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden sm:block px-4 py-2 border border-white/20 hover:bg-white/5 rounded-full text-sm font-semibold transition-all">
          <AutoTranslate text="Login" />
        </button>
        <button className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-full text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
          <AutoTranslate text="Sign Up" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
