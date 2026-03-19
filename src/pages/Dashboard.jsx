import React from 'react';
import { LanguageProvider } from '../components/dashboard/LanguageContext';
import TanyaNavbar from '../components/dashboard/TanyaNavbar';
import TanyaHero from '../components/dashboard/TanyaHero';
import TanyaFeatures from '../components/dashboard/TanyaFeatures';
import TanyaWeather from '../components/dashboard/TanyaWeather';
import TanyaFooter from '../components/dashboard/TanyaFooter';

/**
 * TanyaDashboard — Main dashboard page that assembles all sections.
 * Wrapped in LanguageProvider for multilingual support.
 * This page is fully self-contained and does not depend on
 * any existing components from the main app.
 */
export default function Dashboard() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#0B1F1A] text-white font-outfit scroll-smooth">
        {/* Sticky Navbar */}
        <TanyaNavbar />

        {/* Main Content */}
        <main>
          <TanyaHero />
          <TanyaFeatures />
          <TanyaWeather />
        </main>

        {/* Footer */}
        <TanyaFooter />
      </div>
    </LanguageProvider>
  );
}
