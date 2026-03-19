import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Sprout, TrendingUp, CalendarDays, User } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

const Sidebar: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Farmer Profile', path: '/account', icon: User },
    { name: 'PM-Kisan Scheme', path: '/pm-kisan', icon: FileText },
    { name: 'Crop Recommendation', path: '/crop-recommendation', icon: Sprout },
    { name: 'Smart Mandi Returns', path: '/smart-mandi', icon: TrendingUp },
    { name: 'Planning Calendar', path: '/calendar', icon: CalendarDays },
  ];

  return (
    <>
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 left-0 h-screen pt-20 pb-6 bg-[#0a0f0a]/95 backdrop-blur-xl border-r border-white/10 w-64 z-[80] transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="font-medium whitespace-nowrap">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-4 mt-auto">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 text-sm">
            <h4 className="font-bold text-white mb-1">Need Help?</h4>
            <p className="text-gray-400 text-xs mb-3">Ask our AI inside the chat below.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
