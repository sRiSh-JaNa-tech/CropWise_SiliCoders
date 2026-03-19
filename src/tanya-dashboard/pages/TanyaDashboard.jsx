import React from 'react';
import { LanguageProvider } from '../components/LanguageContext';
import TanyaNavbar from '../components/TanyaNavbar';
import TanyaHero from '../components/TanyaHero';
import TanyaFeatures from '../components/TanyaFeatures';
import TanyaWeather from '../components/TanyaWeather';
import TanyaFooter from '../components/TanyaFooter';

/**
 * TanyaDashboard — Main dashboard page that assembles all sections.
 * Wrapped in LanguageProvider for multilingual support.
 * This page is fully self-contained and does not depend on
 * any existing components from the main app.
 */
export default function TanyaDashboard() {
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
