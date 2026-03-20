import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Wind, Zap, Thermometer, Play, Pause, Droplets, Eye, Gauge, Sunrise, Sunset, MapPin, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// OpenWeather key (from .env, exposed via Vite client-side)
// ─────────────────────────────────────────────────────────────────────────────
const OW_KEY = 'e6c32e6f0d524252deff5ef9c0801e7c';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Layers = { rain: boolean; wind: boolean; lightning: boolean; temperature: boolean };

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  pressure: number;
  visibility: number;
  clouds: number;
  description: string;
  icon: string;
  sunrise: string;
  sunset: string;
  lat: number;
  lon: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Particle Engine
// ─────────────────────────────────────────────────────────────────────────────
function WeatherParticles({ layers }: { layers: Layers }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const onResize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    const rain = Array.from({ length: 300 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      l: Math.random() * 20 + 10, v: Math.random() * 15 + 10,
    }));

    const windParts = Array.from({ length: 150 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      l: Math.random() * 50 + 20, v: Math.random() * 5 + 2,
    }));

    let flash = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (layers.rain) {
        ctx.strokeStyle = 'rgba(173,216,230,0.6)';
        ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath();
        for (const p of rain) {
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.v * 0.1, p.y + p.l);
          p.y += p.v; p.x += p.v * 0.1;
          if (p.y > height) { p.y = -20; p.x = Math.random() * width; }
        }
        ctx.stroke();
      }

      if (layers.wind) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const w of windParts) {
          ctx.moveTo(w.x, w.y);
          ctx.quadraticCurveTo(w.x + w.l / 2, w.y - 10, w.x + w.l, w.y);
          w.x += w.v;
          if (w.x > width) { w.x = -w.l; w.y = Math.random() * height; }
        }
        ctx.stroke();
      }

      if (layers.lightning) {
        if (Math.random() < 0.004) flash = 1.0;
        if (flash > 0) {
          ctx.fillStyle = 'rgba(200,220,255,' + (flash * 0.3) + ')';
          ctx.fillRect(0, 0, width, height);
          if (flash > 0.8) {
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
            ctx.beginPath();
            let lx = Math.random() * width; let ly = 0;
            ctx.moveTo(lx, ly);
            while (ly < height / 2) { lx += (Math.random() - 0.5) * 100; ly += Math.random() * 100; ctx.lineTo(lx, ly); }
            ctx.stroke();
          }
          flash -= 0.05;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, [layers]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[400]" style={{ mixBlendMode: 'screen' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Right-panel layer toggle (Windy style)
// ─────────────────────────────────────────────────────────────────────────────
function WindyBtn({ active, label, icon, gradient, onClick }: {
  active: boolean; label: string; icon: React.ReactNode; gradient: string; onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer" onClick={onClick}>
      <span className={'text-sm font-sans drop-shadow transition-colors ' + (active ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white')}>
        {label}
      </span>
      <div className={'w-10 h-10 rounded-full flex items-center justify-center shadow-lg ' + gradient + ' ' + (active ? 'ring-2 ring-white scale-110' : 'opacity-75 group-hover:opacity-100 group-hover:scale-105') + ' transition-all duration-200'}>
        {icon}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Telemetry stat chip
// ─────────────────────────────────────────────────────────────────────────────
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
      <span className="text-blue-300">{icon}</span>
      <span className="text-[10px] text-gray-500 leading-none">{label}</span>
      <span className="text-xs text-white font-bold font-sans leading-none">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — Unix timestamp → HH:MM AM/PM
// ─────────────────────────────────────────────────────────────────────────────
function fmtTime(unix: number) {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WeatherCenter() {
  const [layers, setLayers] = useState<Layers>({ rain: true, wind: true, lightning: false, temperature: true });
  const [time, setTime] = useState(4);
  const [playing, setPlaying] = useState(false);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5937, 78.9629]);

  const toggle = (k: keyof Layers) => setLayers(prev => ({ ...prev, [k]: !prev[k] }));

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime(t => (t >= 24 ? 0 : t + 1)), 900);
    return () => clearInterval(id);
  }, [playing]);

  // ── Fetch weather from OpenWeather ──────────────────────────────────────
  const fetchWeather = (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    fetch(
      'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&appid=' + OW_KEY + '&units=metric'
    )
      .then(r => r.json())
      .then(d => {
        if (d.cod !== 200) throw new Error(d.message || 'API error');
        setWeather({
          city: d.name,
          country: d.sys.country,
          temp: Math.round(d.main.temp),
          feels_like: Math.round(d.main.feels_like),
          temp_min: Math.round(d.main.temp_min),
          temp_max: Math.round(d.main.temp_max),
          humidity: d.main.humidity,
          wind_speed: parseFloat((d.wind.speed * 3.6).toFixed(1)), // m/s → km/h
          wind_deg: d.wind.deg,
          pressure: d.main.pressure,
          visibility: Math.round((d.visibility || 0) / 1000),
          clouds: d.clouds.all,
          description: d.weather[0]?.description || '',
          icon: d.weather[0]?.icon || '01d',
          sunrise: fmtTime(d.sys.sunrise),
          sunset: fmtTime(d.sys.sunset),
          lat, lon,
        });
        setMapCenter([lat, lon]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Auto-detect on mount
  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { fetchWeather(28.6139, 77.2090); }, // fallback: New Delhi
      { timeout: 8000 }
    );
  }, []);

  const days = ['Fri 20', 'Sat 21', 'Sun 22', 'Mon 23', 'Tue 24', 'Wed 25', 'Thu 26'];

  // Wind direction arrow
  const windDir = weather ? 'rotate-' + Math.round(weather.wind_deg / 45) * 45 : '';

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-black overflow-hidden select-none">
      {/* ── MAP ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={8} zoomControl={false} className="w-full h-full" style={{ background: '#0a0a0a' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
          {/* Live location marker */}
          {weather && (
            <CircleMarker center={[weather.lat, weather.lon]} radius={8} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.8, weight: 2 }}>
              <Popup className="rounded-lg">
                <span className="font-bold">{weather.city}</span><br />
                🌡️ {weather.temp}°C — {weather.description}
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {/* ── PARTICLES ── */}
      <WeatherParticles layers={layers} />

      {/* ── HUD OVERLAY ── */}
      <div className="absolute inset-0 z-[500] pointer-events-none flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <div className="flex justify-between items-start p-3 pointer-events-auto">
          {/* Search pill */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center bg-white rounded-full px-4 py-2 w-72 shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search location..." className="flex-1 outline-none text-gray-800 text-sm placeholder-gray-400 font-sans bg-transparent" />
            <div className="w-px h-4 bg-gray-200 mx-2" />
            <MapPin className="w-4 h-4 text-orange-500 cursor-pointer hover:text-orange-400" onClick={() => {
              navigator.geolocation?.getCurrentPosition(p => fetchWeather(p.coords.latitude, p.coords.longitude));
            }} />
          </motion.div>

          {/* Menu + location badge */}
          <div className="flex items-center gap-2">
            {weather && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 bg-black/50 backdrop-blur border border-white/10 rounded-full px-3 py-1.5 text-xs text-white font-sans">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>{weather.city}, {weather.country}</span>
              </motion.div>
            )}
            <div className="w-10 h-10 bg-red-700 hover:bg-red-600 cursor-pointer rounded-full flex flex-col gap-1.5 items-center justify-center shadow-lg transition-colors">
              <span className="w-4 h-0.5 bg-white rounded" />
              <span className="w-4 h-0.5 bg-white rounded" />
              <span className="w-4 h-0.5 bg-white rounded" />
            </div>
          </div>
        </div>

        {/* LEFT PANEL — Live Weather Telemetry Card */}
        <AnimatePresence>
          {(weather || loading) && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="absolute left-3 top-20 w-72 bg-black/55 backdrop-blur-lg border border-white/10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden"
            >
              {loading && (
                <div className="flex items-center justify-center h-40 text-white/50 text-sm gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Fetching weather…
                </div>
              )}
              {error && !loading && (
                <div className="p-4 text-red-400 text-xs">{error}</div>
              )}
              {weather && !loading && (
                <>
                  {/* Temperature hero */}
                  <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-blue-900/40 to-transparent border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-end gap-1">
                          <span className="text-6xl font-bold text-white font-sans leading-none">{weather.temp}°</span>
                          <span className="text-xl text-gray-400 mb-2">C</span>
                        </div>
                        <div className="text-sm text-gray-300 capitalize font-sans mt-1">{weather.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Feels {weather.feels_like}° · H:{weather.temp_max}° L:{weather.temp_min}°
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <img
                          src={'https://openweathermap.org/img/wn/' + weather.icon + '@2x.png'}
                          alt={weather.description}
                          className="w-16 h-16 -m-2 drop-shadow-lg"
                        />
                        <button onClick={() => fetchWeather(weather.lat, weather.lon)}
                          className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 mt-1 transition-colors">
                          <RefreshCw className="w-2.5 h-2.5" /> refresh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <Stat icon={<Droplets className="w-3.5 h-3.5" />} label="Humidity" value={weather.humidity + '%'} />
                    <Stat icon={<Wind className="w-3.5 h-3.5" />} label="Wind" value={weather.wind_speed + ' km/h'} />
                    <Stat icon={<Gauge className="w-3.5 h-3.5" />} label="Pressure" value={weather.pressure + ' hPa'} />
                    <Stat icon={<Eye className="w-3.5 h-3.5" />} label="Visibility" value={weather.visibility + ' km'} />
                    <Stat icon={<CloudRain className="w-3.5 h-3.5" />} label="Clouds" value={weather.clouds + '%'} />
                    <Stat icon={<Thermometer className="w-3.5 h-3.5" />} label="Feels like" value={weather.feels_like + '°C'} />
                  </div>

                  {/* Sunrise / Sunset */}
                  <div className="px-3 pb-3 flex justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-sans">
                      <Sunrise className="w-4 h-4" />
                      <div><div className="text-[9px] text-gray-500">Sunrise</div>{weather.sunrise}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-sans">
                      <Sunset className="w-4 h-4" />
                      <div><div className="text-[9px] text-gray-500">Sunset</div>{weather.sunset}</div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT PANEL — layer toggles */}
        <div className="absolute right-4 top-20 flex flex-col gap-4 pointer-events-auto">
          <WindyBtn active={layers.rain}        label="Rain, thunder"  gradient="bg-gradient-to-br from-cyan-400 to-blue-600"    icon={<CloudRain    className="w-4 h-4 text-white" />} onClick={() => toggle('rain')} />
          <WindyBtn active={layers.wind}        label="Wind"           gradient="bg-gradient-to-br from-green-400 to-emerald-600" icon={<Wind         className="w-4 h-4 text-white" />} onClick={() => toggle('wind')} />
          <WindyBtn active={layers.temperature} label="Temperature"    gradient="bg-gradient-to-br from-yellow-400 to-orange-500" icon={<Thermometer  className="w-4 h-4 text-white" />} onClick={() => toggle('temperature')} />
          <WindyBtn active={layers.lightning}   label="Thunderstorms"  gradient="bg-gradient-to-br from-yellow-300 to-amber-600"  icon={<Zap          className="w-4 h-4 text-white" />} onClick={() => toggle('lightning')} />
        </div>

        {/* BOTTOM BAR */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          className="mt-auto w-full bg-black/65 backdrop-blur border-t border-white/15 pointer-events-auto">

          {/* Controls row */}
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setPlaying(p => !p)}
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform shrink-0">
                {playing ? <Pause className="w-4 h-4 text-red-600" /> : <Play className="w-4 h-4 text-red-600 ml-0.5" />}
              </button>
              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-sm shadow whitespace-nowrap font-sans">
                {days[Math.floor(time / 4)] || 'Fri 20'} — {['12','3','6','9'][time % 4] + ['AM','AM','AM','PM'][time % 4]}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex rounded-full overflow-hidden border border-white/10 text-[11px] font-sans shadow">
                <button className="px-3 py-1 bg-orange-500 text-white font-bold">ECMWF <span className="opacity-70 text-[9px]">9km</span></button>
                <button className="px-3 py-1 bg-black/60 text-gray-300 hover:text-white">GFS <span className="opacity-50 text-[9px]">22km</span></button>
                <button className="px-3 py-1 bg-black/60 text-gray-300 hover:text-white">ICON <span className="opacity-50 text-[9px]">13km</span></button>
              </div>
              <div className="flex items-stretch text-[10px] text-white rounded overflow-hidden border border-white/10 font-sans">
                {[['mm','bg-gray-600'],['1.5','bg-blue-300'],['2','bg-blue-400'],['3','bg-blue-600'],['7','bg-cyan-500'],['10','bg-green-500'],['20','bg-yellow-500'],['30','bg-purple-600']].map(([v,c]) => (
                  <div key={v} className={'px-2 py-0.5 ' + c}>{v}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline scrubber */}
          <div className="relative h-9 mx-4 mb-1">
            <div className="absolute inset-0 flex font-sans">
              {days.map(d => (
                <span key={d} className="flex-1 text-center text-[11px] text-gray-300 border-r border-white/10 flex items-center justify-center">{d}</span>
              ))}
            </div>
            <div className="absolute top-0 left-0 h-full bg-white/15 pointer-events-none rounded transition-all" style={{ width: ((time / 24) * 100) + '%' }} />
            <input type="range" min="0" max="24" value={time} onChange={e => setTime(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          </div>

          <div className="text-right text-[9px] text-gray-600 pr-3 pb-1 font-sans">© OpenStreetMap contributors · OpenWeather</div>
        </motion.div>

      </div>
    </div>
  );
}
