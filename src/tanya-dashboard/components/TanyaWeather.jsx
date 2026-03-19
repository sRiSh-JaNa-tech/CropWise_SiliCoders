import React, { useEffect, useRef, useState } from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  MapPin,
  Sun,
  Cloud,
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

/**
 * TanyaWeather — Live Weather Insights section with a map placeholder
 * on the left and weather stat cards on the right.
 * Uses mock data. Fully integrated with LanguageContext.
 */

export default function TanyaWeather() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const { t } = useLanguage();

  const WEATHER_STATS = [
    {
      icon: Thermometer,
      labelKey: 'temperature',
      value: '28°C',
      subKey: 'feelsLike',
      color: '#F4C430',
    },
    {
      icon: Droplets,
      labelKey: 'humidity',
      value: '72%',
      subKey: 'moderate',
      color: '#1FAF5A',
    },
    {
      icon: CloudRain,
      labelKey: 'rainProbability',
      value: '35%',
      subKey: 'lightShowers',
      color: '#5BB8F5',
    },
    {
      icon: Wind,
      labelKey: 'windSpeed',
      value: '12 km/h',
      subKey: 'nwDirection',
      color: '#A78BFA',
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
      id="tanya-weather"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 bg-[#0B1F1A]"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto text-center mb-14">
        <p className="text-[#1FAF5A] text-sm font-semibold tracking-widest uppercase mb-3">
          {t('stayInformed')}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          {t('live')}{' '}
          <span className="text-[#1FAF5A]">{t('weather')}</span>{' '}
          {t('weatherInsights')}
        </h2>
      </div>

      {/* Content Grid: Map + Stats */}
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Map Placeholder */}
        <div className="relative rounded-2xl overflow-hidden bg-[#122F27] border border-[#1FAF5A]/10 min-h-[320px] flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#122F27] via-[#0B1F1A] to-[#122F27]" />
          <div className="absolute inset-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full h-px bg-[#1FAF5A]/50"
                style={{ top: `${(i + 1) * 12}%` }}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full w-px bg-[#1FAF5A]/50"
                style={{ left: `${(i + 1) * 12}%` }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#1FAF5A]/10 flex items-center justify-center animate-pulse">
              <MapPin className="w-8 h-8 text-[#1FAF5A]" />
            </div>
            <p className="text-white font-semibold text-lg">{t('yourLocation')}</p>
            <p className="text-gray-400 text-sm">{t('locationName')}</p>
          </div>

          <Sun className="absolute top-6 right-8 w-6 h-6 text-[#F4C430]/20 animate-spin" style={{ animationDuration: '20s' }} />
          <Cloud className="absolute bottom-8 left-8 w-8 h-8 text-gray-600/30" />
        </div>

        {/* Weather Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WEATHER_STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.labelKey}
                className={`group bg-[#122F27] rounded-2xl p-5 border border-[#1FAF5A]/10
                  hover:border-[#1FAF5A]/40 hover:shadow-lg hover:shadow-[#1FAF5A]/5
                  transition-all duration-500 ease-out cursor-default
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      {t(stat.labelKey)}
                    </p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{t(stat.subKey)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
