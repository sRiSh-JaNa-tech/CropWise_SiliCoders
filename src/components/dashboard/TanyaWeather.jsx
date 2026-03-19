import React, { useEffect, useRef, useState } from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  MapPin,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import TanyaAlertBanner from './TanyaAlertBanner';

/**
 * TanyaWeather — Live Weather Insights section.
 * Fetches real-time data from the backend API (OpenWeatherMap → MongoDB).
 * Displays an interactive Leaflet map + weather stat cards + disaster alerts.
 */

/**
 * Lazy-loaded Leaflet Map component.
 * Avoids SSR and context issues by loading Leaflet only on mount.
 */
function WeatherMap({ lat, lon, locationName, weatherData }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    let map = null;
    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!isMounted || !mapRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create map
      map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 10,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM © CARTO',
        maxZoom: 18,
      }).addTo(map);

      // Custom marker icon
      const markerIcon = L.divIcon({
        html: `<div style="
          width: 24px; height: 24px; background: #1FAF5A; border-radius: 50%;
          border: 3px solid white; box-shadow: 0 0 12px rgba(31,175,90,0.5);
        "></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add marker
      const marker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);
      marker.bindPopup(`<div style="text-align:center; font-family:sans-serif;">
        <strong>${locationName}</strong>
        ${weatherData ? `<br/><span style="font-size:12px">${weatherData.temperature}°C • ${weatherData.weatherDescription}</span>` : ''}
      </div>`);

      // Weather condition circle overlay
      if (weatherData) {
        const condColor = getConditionColor(weatherData.weatherCondition);
        L.circle([lat, lon], {
          radius: 15000,
          color: condColor,
          fillColor: condColor,
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);

        // Alert zone circles
        if (weatherData.alerts) {
          weatherData.alerts.forEach((alert, i) => {
            const alertColor =
              alert.severity === 'Extreme' ? '#ef4444'
                : alert.severity === 'Severe' ? '#f97316'
                  : '#eab308';
            L.circle([lat, lon], {
              radius: 25000 + i * 5000,
              color: alertColor,
              fillColor: alertColor,
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '8 4',
            }).addTo(map);
          });
        }
      }

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, locationName, weatherData]);

  return <div ref={mapRef} style={{ height: '100%', minHeight: '380px', width: '100%' }} />;
}

/** Get a weather condition color for map overlays */
function getConditionColor(condition) {
  switch (condition?.toLowerCase()) {
    case 'thunderstorm': return '#ef4444';
    case 'rain': case 'drizzle': return '#3b82f6';
    case 'snow': return '#a5b4fc';
    case 'clear': return '#22c55e';
    case 'clouds': return '#6b7280';
    case 'mist': case 'haze': case 'fog': return '#94a3b8';
    default: return '#1FAF5A';
  }
}

export default function TanyaWeather() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: 28.6139, lon: 77.2090 });
  const sectionRef = useRef(null);
  const { t } = useLanguage();

  // Intersection observer for scroll animation
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

  // Get user's real location via geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => console.log('[Weather] Geolocation denied, using default'),
        { timeout: 10000 }
      );
    }
  }, []);

  // Fetch weather data from backend
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tanya/weather?lat=${userCoords.lat}&lon=${userCoords.lon}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setWeatherData(json.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('[Weather] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when coordinates change
  useEffect(() => {
    fetchWeather();
  }, [userCoords.lat, userCoords.lon]);

  // Build stat cards from live data
  const stats = weatherData
    ? [
        {
          icon: Thermometer,
          labelKey: 'temperature',
          value: `${weatherData.temperature}°C`,
          sub: `Feels like ${weatherData.feelsLike}°C`,
          color: '#F4C430',
        },
        {
          icon: Droplets,
          labelKey: 'humidity',
          value: `${weatherData.humidity}%`,
          sub: weatherData.humidity > 70 ? 'High' : weatherData.humidity > 40 ? t('moderate') : 'Low',
          color: '#1FAF5A',
        },
        {
          icon: CloudRain,
          labelKey: 'rainProbability',
          value: `${weatherData.rainProbability}%`,
          sub: weatherData.weatherDescription || t('lightShowers'),
          color: '#5BB8F5',
        },
        {
          icon: Wind,
          labelKey: 'windSpeed',
          value: `${(weatherData.windSpeed * 3.6).toFixed(1)} km/h`,
          sub: `${weatherData.windSpeed.toFixed(1)} m/s`,
          color: '#A78BFA',
        },
      ]
    : [];

  const locationName = weatherData
    ? `${weatherData.location.name}${weatherData.location.country ? ', ' + weatherData.location.country : ''}`
    : t('locationName');

  return (
    <section
      id="tanya-weather"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 bg-[#0B1F1A]"
    >
      {/* Section Header */}
      <div className="max-w-7xl mx-auto text-center mb-8">
        <p className="text-[#1FAF5A] text-sm font-semibold tracking-widest uppercase mb-3">
          {t('stayInformed')}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
          {t('live')}{' '}
          <span className="text-[#1FAF5A]">{t('weather')}</span>{' '}
          {t('weatherInsights')}
        </h2>
        {weatherData && (
          <p className="text-gray-400 text-sm mt-3 flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-[#1FAF5A]" />
            {locationName}
            {' • '}
            {weatherData.weatherDescription}
            <button
              onClick={fetchWeather}
              className="ml-2 p-1 rounded-lg hover:bg-[#1FAF5A]/10 transition-colors"
              title="Refresh weather data"
            >
              <RefreshCw className={`w-4 h-4 text-[#1FAF5A] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </p>
        )}
      </div>

      {/* Disaster Alerts */}
      <div className="max-w-6xl mx-auto">
        {weatherData && weatherData.alerts && weatherData.alerts.length > 0 && (
          <TanyaAlertBanner alerts={weatherData.alerts} />
        )}
      </div>

      {/* Content Grid: Map + Stats */}
      <div
        className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Interactive Leaflet Map */}
        <div className="relative rounded-2xl overflow-hidden bg-[#122F27] border border-[#1FAF5A]/10 min-h-[380px]">
          {loading && !weatherData ? (
            <div className="flex items-center justify-center h-full min-h-[380px]">
              <Loader2 className="w-8 h-8 text-[#1FAF5A] animate-spin" />
            </div>
          ) : (
            <WeatherMap
              lat={userCoords.lat}
              lon={userCoords.lon}
              locationName={locationName}
              weatherData={weatherData}
            />
          )}

          {/* Location badge overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-4 py-2 rounded-xl bg-[#122F27]/90 backdrop-blur-md border border-[#1FAF5A]/20">
            <MapPin className="w-4 h-4 text-[#1FAF5A]" />
            <div>
              <p className="text-white text-sm font-semibold">{t('yourLocation')}</p>
              <p className="text-gray-400 text-xs">{locationName}</p>
            </div>
          </div>
        </div>

        {/* Weather Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && !weatherData ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#122F27] rounded-2xl p-5 border border-[#1FAF5A]/10 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1FAF5A]/10" />
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-[#1FAF5A]/10 rounded mb-2" />
                    <div className="h-6 w-16 bg-[#1FAF5A]/10 rounded mb-1" />
                    <div className="h-3 w-24 bg-[#1FAF5A]/10 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-2 bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Failed to load weather data</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={fetchWeather}
                className="px-4 py-2 rounded-lg bg-[#1FAF5A] text-white text-sm font-medium hover:bg-[#1FAF5A]/80 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            stats.map((stat, index) => {
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
                      <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
