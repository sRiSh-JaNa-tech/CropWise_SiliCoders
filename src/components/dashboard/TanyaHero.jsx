import React, { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';
import heroBg from '../../assets/tanya/images/hero-bg.png';

/**
 * TanyaHero — Full-width hero section with farming background,
 * dark overlay, heading, subheading, and CTA button.
 * Fully integrated with LanguageContext for multilingual support.
 */
export default function TanyaHero() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleExploreClick = () => {
    const el = document.getElementById('tanya-features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="tanya-hero"
      className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1F1A]/70 via-[#0B1F1A]/60 to-[#0B1F1A]/95" />

      {/* Decorative floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1FAF5A]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-[#F4C430]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[#1FAF5A]/30 bg-[#1FAF5A]/10 text-[#1FAF5A] text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#1FAF5A] animate-pulse" />
          {t('badgeText')}
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          {t('heroHeading1')}{' '}
          <span className="bg-gradient-to-r from-[#1FAF5A] to-[#F4C430] bg-clip-text text-transparent">
            {t('heroHeading2')}
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('heroSubheading')}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleExploreClick}
          className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1FAF5A] to-[#1FAF5A]/80 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-[#1FAF5A]/25 hover:shadow-xl hover:shadow-[#1FAF5A]/30 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          {t('exploreFeatures')}
          <svg
            className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0B1F1A] to-transparent" />
    </section>
  );
}
