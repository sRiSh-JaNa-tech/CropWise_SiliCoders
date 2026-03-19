import mongoose from 'mongoose';

/**
 * WeatherData Mongoose Schema
 * Stores real-time weather data fetched from OpenWeatherMap API.
 * Each document represents a single weather fetch for a location.
 */

const alertSchema = new mongoose.Schema({
  event: { type: String, required: true },
  severity: { type: String, enum: ['Extreme', 'Severe', 'Moderate', 'Minor'], default: 'Moderate' },
  description: { type: String, default: '' },
  start: { type: Date },
  end: { type: Date },
});

const forecastEntrySchema = new mongoose.Schema({
  dt: { type: Date, required: true },
  temp: { type: Number },
  humidity: { type: Number },
  windSpeed: { type: Number },
  rainProbability: { type: Number },
  condition: { type: String },
  description: { type: String },
  icon: { type: String },
});

const weatherDataSchema = new mongoose.Schema({
  // Location
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    name: { type: String, default: 'Unknown' },
    country: { type: String, default: '' },
  },

  // Current weather
  temperature: { type: Number, required: true },
  feelsLike: { type: Number },
  humidity: { type: Number },
  windSpeed: { type: Number },
  windDeg: { type: Number },
  rainProbability: { type: Number, default: 0 },
  weatherCondition: { type: String },
  weatherDescription: { type: String },
  weatherIcon: { type: String },
  pressure: { type: Number },
  visibility: { type: Number },

  // Alerts (from OpenWeatherMap or derived)
  alerts: [alertSchema],

  // 5-day forecast snapshots
  forecast: [forecastEntrySchema],

  // Metadata
  fetchedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'weatherdata',
});

// Index for querying by location and time
weatherDataSchema.index({ 'location.lat': 1, 'location.lon': 1, fetchedAt: -1 });

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

export default WeatherData;
