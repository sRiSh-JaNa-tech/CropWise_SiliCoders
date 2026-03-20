import React, { useEffect, useRef, useState } from 'react';
import { Landmark, Sprout, TrendingUp, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

/**
 * TanyaFeatures — 4-card responsive grid showcasing key CropWise features.
 * Cards have hover glow + scale effects and scroll-triggered fade-in.
 * Fully integrated with LanguageContext for multilingual support.
 */

export default function TanyaFeatures() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const FEATURES = [
    {
      icon: Landmark,
      titleKey: 'pmKisanTitle',
      descKey: 'pmKisanDesc',
      color: '#1FAF5A',
    },
    {
      icon: Sprout,
      titleKey: 'cropDoctorTitle',
      descKey: 'cropDoctorDesc',
      color: '#F4C430',
    },
    {
      icon: TrendingUp,
      titleKey: 'smartMandiTitle',
      descKey: 'smartMandiDesc',
      color: '#1FAF5A',
    },
    {
      icon: CalendarDays,
      titleKey: 'farmingPlannerTitle',
      descKey: 'farmingPlannerDesc',
      color: '#F4C430',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="tanya-features"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 bg-[#0B1F1A]"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto text-center mb-14">
        <p className="text-[#1FAF5A] text-sm font-semibold tracking-widest uppercase mb-3">
          {t('whatWeOffer')}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          {t('powerfulFeatures')}{' '}
          <span className="text-[#1FAF5A]">{t('features')}</span>{' '}
          {t('forModernFarming')}
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.titleKey}
              onClick={() => {
                if (feature.titleKey === 'pmKisanTitle') navigate('/pm-kisan');
                else if (feature.titleKey === 'cropDoctorTitle') navigate('/crop-recommendation');
                else if (feature.titleKey === 'farmingPlannerTitle') navigate('/smart-planner');
              }}
              className={`group relative bg-[#122F27] rounded-2xl p-6 border border-[#1FAF5A]/10
                hover:border-[#1FAF5A]/50 hover:shadow-lg hover:shadow-[#1FAF5A]/10
                hover:scale-[1.04] transition-all duration-500 ease-out cursor-pointer
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1FAF5A]/0 to-[#1FAF5A]/0 group-hover:from-[#1FAF5A]/5 group-hover:to-transparent transition-all duration-500" />

              {/* Icon */}
              <div
                className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <Icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>

              {/* Title */}
              <h3 className="relative text-lg font-bold text-white mb-2 group-hover:text-[#1FAF5A] transition-colors duration-300">
                {t(feature.titleKey)}
              </h3>

              {/* Description */}
              <p className="relative text-sm text-gray-400 leading-relaxed">
                {t(feature.descKey)}
              </p>

              {/* Arrow indicator */}
              <div className="relative mt-4 flex items-center text-[#1FAF5A] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                {t('learnMore')}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
