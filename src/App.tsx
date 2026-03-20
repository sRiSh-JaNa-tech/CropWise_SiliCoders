import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AiChat from './components/AiChat';
import CropRecommendationPage from './components/CropRecommendationPage';
import SmartMandiReturnsPage from './components/SmartMandiReturnsPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PMSchemes from './pages/PMSchemes';
import Account from './pages/Account';
import WeatherCenter from './pages/WeatherCenter';
import { SmartPlannerDashboard } from './features/smart-planner/pages/SmartPlannerDashboard';
import { LanguageProvider as UpstreamLanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider as TanyaLanguageProvider } from './components/dashboard/LanguageContext';
import { SidebarProvider } from './context/SidebarContext';

import { OpenClawProvider } from './context/OpenClawContext';

// Lazy-load Tanya Dashboard (isolated module)
const Dashboard = lazy(() => import('./pages/Dashboard'));

import { ConnectivityProvider } from './context/ConnectivityContext';

function App() {
  return (
    <AuthProvider>
      <ConnectivityProvider>
        <UpstreamLanguageProvider>
        <TanyaLanguageProvider>
          <SidebarProvider>
            <Router>
              <OpenClawProvider>
                <div className="min-h-screen bg-dark text-white flex flex-col font-outfit selection:bg-primary selection:text-white overflow-x-hidden">
                  {/* Global Original Working Navbar */}
                  <Navbar />
                  
                  <div className="flex flex-1 pt-16">
                    <Sidebar />
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
                        <Route path="/account" element={<Account />} />
                        <Route path="/pm-kisan" element={<PMSchemes />} />
                        <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
                        <Route path="/smart-mandi" element={<SmartMandiReturnsPage />} />
                        
                        {/* Upstream Smart Planner routes */}
                        <Route path="/calendar" element={<SmartPlannerDashboard />} />
                        <Route path="/smart-planner" element={<SmartPlannerDashboard />} />
                        <Route path="/weather-command" element={<WeatherCenter />} />
                      </Routes>
                    </main>
                  </div>
                  {/* Global AI Chatbot */}
                  <AiChat />
                </div>
              </OpenClawProvider>
            </Router>
          </SidebarProvider>
        </TanyaLanguageProvider>
      </UpstreamLanguageProvider>
      </ConnectivityProvider>
    </AuthProvider>
  );
}

export default App;
