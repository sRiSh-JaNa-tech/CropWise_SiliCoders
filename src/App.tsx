import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import AiChat from './components/AiChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PMSchemes from './pages/PMSchemes';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-dark text-white flex flex-col font-outfit selection:bg-primary selection:text-white">
        {/* Fixed Navbar */}
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex flex-1 pt-20">
          {/* Collapsible Sidebar */}
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

          {/* Main Content Area */}
          <main className="flex-1 transition-all duration-300 relative">
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pm-kisan" element={<PMSchemes />} />
              {/* Dummy routes for sidebar links */}
              <Route path="/crop-recommendation" element={<div className="p-8"><h2 className="text-3xl font-bold">Crop Recommendation</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
              <Route path="/smart-mandi" element={<div className="p-8"><h2 className="text-3xl font-bold">Smart Mandi</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
              <Route path="/calendar" element={<div className="p-8"><h2 className="text-3xl font-bold">Planning Calendar</h2><p className="text-text-dim mt-4">Feature coming soon.</p></div>} />
            </Routes>
          </main>
        </div>

        {/* Global AI Chatbot */}
        <AiChat />
      </div>
    </Router>
  );
}

export default App;
