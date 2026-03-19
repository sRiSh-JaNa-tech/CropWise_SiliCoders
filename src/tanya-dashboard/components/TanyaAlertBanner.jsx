import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CloudLightning,
  Droplets,
  Thermometer,
  Wind,
  CloudSnow,
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

/**
 * TanyaAlertBanner — Displays weather disaster alerts.
 * Color-coded by severity: Extreme (red), Severe (orange), Moderate (yellow), Minor (blue).
 */

const SEVERITY_CONFIG = {
  Extreme: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: 'text-red-500',
    badge: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/20',
  },
  Severe: {
    bg: 'bg-orange-900/30',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    icon: 'text-orange-500',
    badge: 'bg-orange-500/20 text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  Moderate: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
    badge: 'bg-yellow-500/20 text-yellow-400',
    glow: 'shadow-yellow-500/10',
  },
  Minor: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'text-blue-500',
    badge: 'bg-blue-500/20 text-blue-400',
    glow: 'shadow-blue-500/10',
  },
};

/** Pick a lucide icon based on the alert event name */
function getAlertIcon(event) {
  const e = event.toLowerCase();
  if (e.includes('flood') || e.includes('rain')) return Droplets;
  if (e.includes('storm') || e.includes('thunder') || e.includes('cyclone')) return CloudLightning;
  if (e.includes('heat')) return Thermometer;
  if (e.includes('wind')) return Wind;
  if (e.includes('cold') || e.includes('snow') || e.includes('frost')) return CloudSnow;
  return AlertTriangle;
}

export default function TanyaAlertBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState({});

  if (!alerts || alerts.length === 0) return null;

  const visibleAlerts = alerts.filter((_, i) => !dismissed[i]);
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      {alerts.map((alert, index) => {
        if (dismissed[index]) return null;

        const severity = alert.severity || 'Moderate';
        const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Moderate;
        const Icon = getAlertIcon(alert.event || '');

        return (
          <div
            key={index}
            className={`relative ${config.bg} ${config.border} border rounded-2xl p-4 shadow-lg ${config.glow}
              animate-in fade-in slide-in-from-top duration-500`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`mt-0.5 ${config.icon}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-sm font-bold ${config.text}`}>
                    {alert.event}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                    {severity}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {alert.description}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => setDismissed((prev) => ({ ...prev, [index]: true }))}
                className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
