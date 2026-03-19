import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AiChat from './components/AiChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PMSchemes from './pages/PMSchemes';
import { SmartPlannerDashboard } from './features/smart-planner/pages/SmartPlannerDashboard';
import { LanguageProvider as UpstreamLanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider as TanyaLanguageProvider } from './components/dashboard/LanguageContext';

// Lazy-load Tanya Dashboard (isolated module)
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <AuthProvider>
      <UpstreamLanguageProvider>
        <TanyaLanguageProvider>
          <Router>
            <div className="min-h-screen bg-dark text-white flex flex-col font-outfit selection:bg-primary selection:text-white overflow-x-hidden">
              {/* Global Original Working Navbar */}
              <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
              
              <div className="flex flex-1 pt-16">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <main className="flex-1 transition-all duration-300 relative w-full overflow-hidden">
                  <Routes>
                    {/* Tanya Dashboard — Now wrapped in the working global layout! */}
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center p-20 text-lg">Loading Dashboard...</div>}>
                          <Dashboard />
                        </Suspense>
                      }
                    />
                    
                    <Route path="/old-home" element={<Hero />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/pm-kisan" element={<PMSchemes />} />
                    <Route path="/crop-recommendation" element={<div className="p-8"><h2 className="text-3xl font-bold">Crop Recommendation</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
                    <Route path="/smart-mandi" element={<div className="p-8"><h2 className="text-3xl font-bold">Smart Mandi</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
                    
                    {/* Upstream Smart Planner routes */}
                    <Route path="/calendar" element={<SmartPlannerDashboard />} />
                    <Route path="/smart-planner" element={<SmartPlannerDashboard />} />
                  </Routes>
                </main>
              </div>

              {/* Global AI Chatbot */}
              <AiChat />
            </div>
          </Router>
        </TanyaLanguageProvider>
      </UpstreamLanguageProvider>
    </AuthProvider>
  );
}

export default App;
