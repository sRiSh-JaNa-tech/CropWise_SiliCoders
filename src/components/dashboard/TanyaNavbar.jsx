import React, { useState } from 'react';
import { Leaf, Globe, User, Menu, X, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageContext';

/**
 * TanyaNavbar — Sticky top navigation bar for CropWise Dashboard.
 * Features: logo, nav links, language selector, and profile icon.
 * Fully integrated with LanguageContext for multilingual support.
 */

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Punjabi',
];

export default function TanyaNavbar() {
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t('home'), href: '#tanya-hero' },
    { label: t('features'), href: '#tanya-features' },
    { label: t('weather'), href: '#tanya-weather' },
  ];

  /** @param {string} lang */
  const handleLangSelect = (lang) => {
    setLanguage(lang);
    setLangOpen(false);
  };

  /**
   * @param {React.MouseEvent} e
   * @param {string} href
   */
  const handleNavClick = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <nav
      id="tanya-navbar"
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-[#0B1F1A]/80 border-b border-[#1FAF5A]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sidebar Toggle (3-line icon) + Logo */}
          <div className="flex items-center gap-3">
            {/* 3-line sidebar button */}
            <button
              className="w-9 h-9 rounded-lg bg-[#122F27] border border-[#1FAF5A]/20 flex flex-col items-center justify-center gap-[5px] hover:border-[#1FAF5A]/50 hover:bg-[#1FAF5A]/10 transition-all duration-300"
              aria-label="Toggle sidebar"
            >
              <span className="block w-4 h-[2px] bg-gray-300 rounded-full" />
              <span className="block w-4 h-[2px] bg-gray-300 rounded-full" />
              <span className="block w-4 h-[2px] bg-gray-300 rounded-full" />
            </button>

            {/* Logo */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1FAF5A] to-[#F4C430] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Crop<span className="text-[#1FAF5A]">Wise</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-gray-300 hover:text-[#1FAF5A] transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#122F27] text-sm text-gray-300 hover:text-white border border-[#1FAF5A]/20 hover:border-[#1FAF5A]/50 transition-all duration-300"
              >
                <Globe className="w-4 h-4 text-[#1FAF5A]" />
                <span className="hidden sm:inline">{language}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[#122F27] border border-[#1FAF5A]/20 shadow-2xl shadow-black/50 py-1 z-50 animate-in fade-in duration-200">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLangSelect(lang)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        language === lang
                          ? 'text-[#1FAF5A] bg-[#1FAF5A]/10'
                          : 'text-gray-300 hover:text-white hover:bg-[#1FAF5A]/5'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Icon */}
            <button className="w-9 h-9 rounded-full bg-[#122F27] border border-[#1FAF5A]/20 flex items-center justify-center hover:border-[#1FAF5A]/50 transition-all duration-300">
              <User className="w-4 h-4 text-gray-300" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-lg bg-[#122F27] border border-[#1FAF5A]/20 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-gray-300" />
              ) : (
                <Menu className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#1FAF5A]/10 mt-2 pt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block py-2 text-sm text-gray-300 hover:text-[#1FAF5A] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
