// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, 
  Map, 
  Sprout, 
  Activity, 
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

/**
 * TanyaSoilHeatmap — Professional Soil Distribution & Crop Suitability Heatmap.
 * Displays a colorful grid representing soil types across regions.
 * Includes interactive tooltips for crop recommendations and disease risk.
 */

const SOIL_TYPES = [
  'Alluvial', 'Black', 'Red', 'Laterite', 'Desert', 'Forest'
];

const REGIONS = [
  'North', 'South', 'East', 'West', 'Central', 'North-East'
];

// Suitability Data (0-100)
// Format: region_index, soil_type_index: { suitability, crop, disease }
const HEATMAP_DATA = {
  '0-0': { suitability: 95, crop: 'Wheat', disease: 'Low' },
  '0-1': { suitability: 30, crop: 'Cotton', disease: 'Medium' },
  '0-2': { suitability: 45, crop: 'Pulses', disease: 'High' },
  '0-3': { suitability: 20, crop: 'Tea', disease: 'Low' },
  '0-4': { suitability: 10, crop: 'Millet', disease: 'Medium' },
  '0-5': { suitability: 60, crop: 'Maize', disease: 'Low' },

  '1-0': { suitability: 50, crop: 'Rice', disease: 'Medium' },
  '1-1': { suitability: 85, crop: 'Cotton', disease: 'Low' },
  '1-2': { suitability: 90, crop: 'Groundnut', disease: 'Low' },
  '1-3': { suitability: 70, crop: 'Coffee', disease: 'Medium' },
  '1-4': { suitability: 5, crop: 'Dates', disease: 'High' },
  '1-5': { suitability: 40, crop: 'Rubber', disease: 'Low' },

  '2-0': { suitability: 88, crop: 'Jute', disease: 'Medium' },
  '2-1': { suitability: 40, crop: 'Sugarcane', disease: 'Low' },
  '2-2': { suitability: 75, crop: 'Rice', disease: 'Low' },
  '2-3': { suitability: 50, crop: 'Tea', disease: 'High' },
  '2-4': { suitability: 10, crop: 'Guava', disease: 'Low' },
  '2-5': { suitability: 80, crop: 'Timber', disease: 'Low' },

  '3-0': { suitability: 40, crop: 'Onion', disease: 'Low' },
  '3-1': { suitability: 92, crop: 'Cotton', disease: 'Low' },
  '3-2': { suitability: 60, crop: 'Bajra', disease: 'Medium' },
  '3-3': { suitability: 30, crop: 'Cashew', disease: 'High' },
  '3-4': { suitability: 85, crop: 'Millet', disease: 'Low' },
  '3-5': { suitability: 20, crop: 'Grape', disease: 'Medium' },

  '4-0': { suitability: 70, crop: 'Soybean', disease: 'Medium' },
  '4-1': { suitability: 88, crop: 'Cotton', disease: 'Low' },
  '4-2': { suitability: 65, crop: 'Pulses', disease: 'Low' },
  '4-3': { suitability: 40, crop: 'Tobacco', disease: 'Medium' },
  '4-4': { suitability: 20, crop: 'Mustard', disease: 'High' },
  '4-5': { suitability: 50, crop: 'Teak', disease: 'Low' },

  '5-0': { suitability: 60, crop: 'Rice', disease: 'High' },
  '5-1': { suitability: 20, crop: 'Citrus', disease: 'Medium' },
  '5-2': { suitability: 40, crop: 'Ginger', disease: 'Low' },
  '5-3': { suitability: 15, crop: 'Pineapple', disease: 'Low' },
  '5-4': { suitability: 5, crop: 'Cactus', disease: 'Low' },
  '5-5': { suitability: 95, crop: 'Tea', disease: 'Low' },
};

export default function TanyaSoilHeatmap() {
  const [visible, setVisible] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const sectionRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getColor = (suitability) => {
    if (suitability > 80) return 'bg-[#1FAF5A]'; // Excellent
    if (suitability > 60) return 'bg-[#1FAF5A]/70'; // Good
    if (suitability > 40) return 'bg-[#F4C430]/70'; // Average
    if (suitability > 20) return 'bg-[#F4C430]/40'; // Poor
    return 'bg-[#F4C430]/10'; // Unsuitable
  };

  const getDiseaseColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleDownloadReport = () => {
    let csvContent = 'Region,Soil Type,Recommended Crop,Suitability (%),Disease Risk\n';
    REGIONS.forEach((region, rIdx) => {
      SOIL_TYPES.forEach((soil, sIdx) => {
        const data = HEATMAP_DATA[`${rIdx}-${sIdx}`];
        csvContent += `${region},${soil},${data.crop},${data.suitability},${data.disease}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'soil_suitability_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section 
      id="tanya-soil-heatmap"
      ref={sectionRef}
      className="relative pt-10 pb-20 sm:pt-12 sm:pb-28 px-4 bg-[#0B1F1A] overflow-hidden"
    >
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1FAF5A]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[#1FAF5A] text-sm font-semibold tracking-widest uppercase mb-3">
            {t('regionalAnalytics') || 'Regional Analytics'}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {t('soilDistribution') || 'Soil Distribution'} <span className="text-[#1FAF5A]">&</span> {t('cropSuitability') || 'Crop Suitability'}
          </h2>
          <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg leading-relaxed">
            {t('heatmapDescription') || 'Explore the distribution of soil types across regions and discover optimal crops for your land.'}
          </p>
        </div>

        {/* Heatmap Container */}
        <div 
          className={`relative bg-[#122F27] rounded-3xl p-6 sm:p-10 border border-[#1FAF5A]/10 shadow-2xl transition-all duration-1000 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-end gap-6 mb-8 text-xs font-medium uppercase tracking-wider text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1FAF5A] rounded-full shadow-[0_0_8px_rgba(31,175,90,0.5)]" />
              <span>{t('highSuitability') || 'High Suitability'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#F4C430]/70 rounded-full" />
              <span>{t('moderateSuitability') || 'Moderate'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#F4C430]/10 rounded-full border border-white/5" />
              <span>{t('lowSuitability') || 'Low'}</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[800px]">
              {/* Table Header: Soil Types */}
              <div className="grid grid-cols-[150px_repeat(6,1fr)] gap-3 mb-3">
                <div className="flex items-center gap-2 text-white font-bold p-3">
                  <Map className="w-5 h-5 text-[#1FAF5A]" />
                  <span>{t('regions') || 'Regions'}</span>
                </div>
                {SOIL_TYPES.map((soil) => (
                  <div key={soil} className="text-center text-gray-400 text-sm font-semibold p-3 bg-[#1FAF5A]/5 rounded-xl border border-[#1FAF5A]/5">
                    {t(soil) || soil}
                  </div>
                ))}
              </div>

              {/* Table Body: Regions & Heatmap Cells */}
              {REGIONS.map((region, rIdx) => (
                <div key={region} className="grid grid-cols-[150px_repeat(6,1fr)] gap-3 mb-3">
                  <div className="flex items-center justify-between group px-4 py-3 bg-[#1FAF5A]/5 rounded-xl border border-[#1FAF5A]/5 text-white font-medium hover:bg-[#1FAF5A]/10 transition-colors cursor-default">
                    <span>{t(region) || region}</span>
                    <ChevronRight className="w-4 h-4 text-[#1FAF5A] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  {SOIL_TYPES.map((soil, sIdx) => {
                    const cellKey = `${rIdx}-${sIdx}`;
                    const data = HEATMAP_DATA[cellKey];
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <div 
                        key={soil}
                        className="relative group h-14"
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div className={`w-full h-full rounded-xl border border-white/5 cursor-pointer transition-all duration-300 ${getColor(data.suitability)} ${isHovered ? 'scale-[1.05] z-10 shadow-xl shadow-[#1FAF5A]/20' : ''}`} />
                        
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 bg-[#0B1F1A] border border-[#1FAF5A]/30 rounded-2xl p-4 shadow-2xl z-20 animate-in fade-in zoom-in duration-200">
                             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                <Sprout className="w-4 h-4 text-[#1FAF5A]" />
                                <span className="text-white font-bold text-sm tracking-tight">{data.crop}</span>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                                   <span className="text-gray-500">{t('suitability') || 'Suitability'}:</span>
                                   <span className="text-[#1FAF5A]">{data.suitability}%</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                   <div className="h-full bg-[#1FAF5A] transition-all duration-500" style={{ width: `${data.suitability}%` }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider pt-1">
                                   <span className="text-gray-500">{t('diseaseRisk') || 'Disease Risk'}:</span>
                                   <span className={getDiseaseColor(data.disease)}>{data.disease}</span>
                                </div>
                             </div>
                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1FAF5A]/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between p-6 bg-[#1FAF5A]/5 rounded-2xl border border-[#1FAF5A]/10 gap-6">
            <div className="flex items-center gap-4 text-gray-400 text-sm">
               <div className="w-10 h-10 rounded-full bg-[#1FAF5A]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#1FAF5A]" />
               </div>
               <p className="max-w-md">
                 <span className="text-white font-semibold">Pro Tip: </span>
                 {t('soilTip') || 'Soil health varies by season. We recommend combining these insights with real-time moisture data for best results.'}
               </p>
            </div>
            <button 
              onClick={handleDownloadReport}
              className="px-6 py-3 rounded-xl bg-[#1FAF5A] text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(31,175,90,0.4)] transition-all active:scale-95 flex items-center gap-2"
            >
               {t('detailedReport') || 'Download Detailed Report'}
               <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 175, 90, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(31, 175, 90, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(31, 175, 90, 0.4);
        }
      `}</style>
    </section>
  );
}
