import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AiChat from './components/AiChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PMSchemes from './pages/PMSchemes';

// Lazy-load Tanya Dashboard (isolated module)
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Layout for older pages (with Global Navbar & Sidebar)
function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 pt-20">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 transition-all duration-300 relative">
          <Outlet /> {/* Renders child routes */}
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark text-white flex flex-col font-outfit selection:bg-primary selection:text-white">
        <Routes>
          {/* Tanya Dashboard — Self-contained page as the ROOT landing page! */}
          <Route
            path="/"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen text-lg">Loading Dashboard...</div>}>
                <Dashboard />
              </Suspense>
            }
          />
          
          {/* Old Pages wrapped in original Navbar/Sidebar layout */}
          <Route element={<MainLayout />}>
            <Route path="/old-home" element={<Hero />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pm-kisan" element={<PMSchemes />} />
            {/* Dummy routes for sidebar links */}
            <Route path="/crop-recommendation" element={<div className="p-8"><h2 className="text-3xl font-bold">Crop Recommendation</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
            <Route path="/smart-mandi" element={<div className="p-8"><h2 className="text-3xl font-bold">Smart Mandi</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
            <Route path="/calendar" element={<div className="p-8"><h2 className="text-3xl font-bold">Planning Calendar</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
          </Route>
        </Routes>

        {/* Global AI Chatbot */}
        <AiChat />
      </div>
    </Router>
  );
}

export default App;
