import { Router, Request, Response } from 'express';
import WeatherData from './WeatherModel.js';

/**
 * Weather API Routes for Tanya Dashboard
 * 
 * GET /api/tanya/weather?lat=28.61&lon=77.21
 *   → Fetches real-time weather + forecast from OpenWeatherMap,
 *     detects disaster alerts, stores in MongoDB, returns JSON.
 * 
 * GET /api/tanya/weather/history?lat=28.61&lon=77.21&limit=10
 *   → Returns recent weather records from MongoDB.
 */

const router = Router();
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * Analyze weather data and generate disaster/severe weather alerts.
 */
function detectAlerts(current: any, forecast: any[]): any[] {
  const alerts: any[] = [];

  // Check current conditions for severe weather
  const condition = current.weather?.[0]?.main?.toLowerCase() || '';
  const description = current.weather?.[0]?.description?.toLowerCase() || '';
  const temp = current.main?.temp ?? 0;
  const windSpeed = current.wind?.speed ?? 0;
  const humidity = current.main?.humidity ?? 0;
  const rain1h = current.rain?.['1h'] ?? 0;
  const rain3h = current.rain?.['3h'] ?? 0;

  // Extreme Heat Alert
  if (temp > 42) {
    alerts.push({
      event: 'Extreme Heat Wave',
      severity: 'Extreme',
      description: `Temperature at ${temp}°C — dangerous heat levels. Stay indoors and hydrate.`,
    });
  } else if (temp > 38) {
    alerts.push({
      event: 'Heat Wave Warning',
      severity: 'Severe',
      description: `Temperature at ${temp}°C — heat wave conditions. Avoid outdoor work during peak hours.`,
    });
  }

  // Heavy Rain / Flood Alert
  if (rain1h > 50 || rain3h > 100) {
    alerts.push({
      event: 'Flash Flood Warning',
      severity: 'Extreme',
      description: `Heavy rainfall detected (${rain1h > 0 ? rain1h + 'mm/hr' : rain3h + 'mm/3hr'}). Flash floods possible in low-lying areas.`,
    });
  } else if (rain1h > 20 || rain3h > 50) {
    alerts.push({
      event: 'Heavy Rain Alert',
      severity: 'Severe',
      description: `Significant rainfall (${rain1h > 0 ? rain1h + 'mm/hr' : rain3h + 'mm/3hr'}). Waterlogging possible.`,
    });
  }

  // Storm / Thunderstorm Alert
  if (condition === 'thunderstorm') {
    const severity = windSpeed > 25 ? 'Extreme' : windSpeed > 15 ? 'Severe' : 'Moderate';
    alerts.push({
      event: 'Thunderstorm Alert',
      severity,
      description: `Thunderstorm with ${description}. Wind speed: ${windSpeed} m/s. Seek shelter immediately.`,
    });
  }

  // Cyclone / High Wind Alert
  if (windSpeed > 30) {
    alerts.push({
      event: 'Cyclone Warning',
      severity: 'Extreme',
      description: `Extremely high winds at ${windSpeed} m/s (${(windSpeed * 3.6).toFixed(0)} km/h). Potential cyclonic activity.`,
    });
  } else if (windSpeed > 20) {
    alerts.push({
      event: 'High Wind Alert',
      severity: 'Severe',
      description: `Strong winds at ${windSpeed} m/s (${(windSpeed * 3.6).toFixed(0)} km/h). Secure loose objects and avoid travel.`,
    });
  }

  // Cold Wave
  if (temp < 2) {
    alerts.push({
      event: 'Cold Wave Warning',
      severity: 'Severe',
      description: `Temperature at ${temp}°C — severe cold wave. Protect crops from frost damage.`,
    });
  }

  // Check forecast for upcoming severe weather
  if (forecast && forecast.length > 0) {
    const next24h = forecast.slice(0, 8); // 3-hour intervals × 8 = 24 hours
    const maxFutureRain = Math.max(...next24h.map((f: any) => f.pop ?? 0));
    const maxFutureWind = Math.max(...next24h.map((f: any) => f.wind?.speed ?? 0));

    if (maxFutureRain > 0.8 && !alerts.find(a => a.event.includes('Rain') || a.event.includes('Flood'))) {
      alerts.push({
        event: 'Rain Expected',
        severity: 'Moderate',
        description: `${(maxFutureRain * 100).toFixed(0)}% chance of rain in the next 24 hours. Plan farm activities accordingly.`,
      });
    }

    if (maxFutureWind > 15 && !alerts.find(a => a.event.includes('Wind') || a.event.includes('Cyclone'))) {
      alerts.push({
        event: 'Strong Wind Expected',
        severity: 'Moderate',
        description: `Winds up to ${(maxFutureWind * 3.6).toFixed(0)} km/h expected in the next 24 hours.`,
      });
    }
  }

  return alerts;
}

/**
 * GET /api/tanya/weather
 * Fetch real-time weather data from OpenWeatherMap
 */
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lon = parseFloat(req.query.lon as string) || 77.2090;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENWEATHER_API_KEY not configured in .env' });
    }

    // Fetch current weather and 5-day forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
      fetch(`${OPENWEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
    ]);

    if (!currentRes.ok) {
      const errText = await currentRes.text();
      return res.status(currentRes.status).json({ error: `OpenWeatherMap error: ${errText}` });
    }

    const currentData = await currentRes.json();
    const forecastData = forecastRes.ok ? await forecastRes.json() : { list: [] };

    // Process forecast entries
    const forecastEntries = (forecastData.list || []).slice(0, 16).map((entry: any) => ({
      dt: new Date(entry.dt * 1000),
      temp: entry.main?.temp,
      humidity: entry.main?.humidity,
      windSpeed: entry.wind?.speed,
      rainProbability: Math.round((entry.pop ?? 0) * 100),
      condition: entry.weather?.[0]?.main,
      description: entry.weather?.[0]?.description,
      icon: entry.weather?.[0]?.icon,
    }));

    // Detect alerts
    const alerts = detectAlerts(currentData, forecastData.list || []);

    // Calculate rain probability from forecast
    const nextFewHours = (forecastData.list || []).slice(0, 4);
    const avgRainProb = nextFewHours.length > 0
      ? Math.round(nextFewHours.reduce((sum: number, f: any) => sum + (f.pop ?? 0), 0) / nextFewHours.length * 100)
      : 0;

    // Build weather document
    const weatherDoc = {
      location: {
        lat,
        lon,
        name: currentData.name || 'Unknown',
        country: currentData.sys?.country || '',
      },
      temperature: Math.round(currentData.main?.temp ?? 0),
      feelsLike: Math.round(currentData.main?.feels_like ?? 0),
      humidity: currentData.main?.humidity ?? 0,
      windSpeed: currentData.wind?.speed ?? 0,
      windDeg: currentData.wind?.deg ?? 0,
      rainProbability: avgRainProb,
      weatherCondition: currentData.weather?.[0]?.main ?? 'Unknown',
      weatherDescription: currentData.weather?.[0]?.description ?? '',
      weatherIcon: currentData.weather?.[0]?.icon ?? '01d',
      pressure: currentData.main?.pressure ?? 0,
      visibility: currentData.visibility ?? 0,
      alerts,
      forecast: forecastEntries,
      fetchedAt: new Date(),
    };

    // Store in MongoDB (non-blocking — don't let DB errors break the API)
    try {
      await WeatherData.create(weatherDoc);
      console.log(`[Weather] Stored data for ${weatherDoc.location.name} (${lat}, ${lon})`);
    } catch (dbErr) {
      console.error('[Weather] MongoDB save error:', dbErr);
    }

    // Return response
    return res.status(200).json({
      success: true,
      data: weatherDoc,
    });

  } catch (err: any) {
    console.error('[Weather] API error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch weather data', details: err.message });
  }
});

/**
 * GET /api/tanya/weather/history
 * Retrieve recent weather records from MongoDB
 */
router.get('/weather/history', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 28.6139;
    const lon = parseFloat(req.query.lon as string) || 77.2090;
    const limit = parseInt(req.query.limit as string) || 10;

    // Find records near the given location (within ~0.1 degree ≈ 11km)
    const records = await WeatherData.find({
      'location.lat': { $gte: lat - 0.1, $lte: lat + 0.1 },
      'location.lon': { $gte: lon - 0.1, $lte: lon + 0.1 },
    })
      .sort({ fetchedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch weather history', details: err.message });
  }
});

export default router;
