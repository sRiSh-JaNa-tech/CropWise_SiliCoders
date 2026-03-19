import React from 'react';
import { Leaf, Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { useLanguage } from './LanguageContext';

/**
 * TanyaFooter — Dark footer with heart message, links, and social icons.
 * Fully integrated with LanguageContext for multilingual support.
 */

const SOCIAL_ICONS = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export default function TanyaFooter() {
  const { t } = useLanguage();

  const FOOTER_LINKS = [
    { label: t('about'), href: '#' },
    { label: t('contact'), href: '#' },
    { label: t('privacy'), href: '#' },
  ];

  return (
    <footer className="relative bg-[#081512] border-t border-[#1FAF5A]/10 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Top row: Logo + Links + Social */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1FAF5A] to-[#F4C430] flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Crop<span className="text-[#1FAF5A]">Wise</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-400 hover:text-[#1FAF5A] transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {SOCIAL_ICONS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-[#122F27] border border-[#1FAF5A]/10 flex items-center justify-center
                    hover:border-[#1FAF5A]/40 hover:bg-[#1FAF5A]/10 transition-all duration-300"
                >
                  <Icon className="w-4 h-4 text-gray-400 hover:text-[#1FAF5A]" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1FAF5A]/20 to-transparent mb-6" />

        {/* Bottom: Heart message */}
        <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-1.5 flex-wrap">
          {t('madeWith')}{' '}
          <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />{' '}
          {t('forFeeders')}
        </p>

        <p className="text-center text-xs text-gray-600 mt-3">
          © 2026 CropWise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
