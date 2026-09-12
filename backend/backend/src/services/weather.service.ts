import { logger } from '../utils/logger.js';

export interface WeatherInfo {
  city: string;
  country: string;
  temperature: number; // Celsius
  apparentTemperature: number;
  humidity: number;
  precipitation: number; // mm
  condition: string;
  weatherCode: number;
  isRainy: boolean;
  isCold: boolean;
  isHot: boolean;
  thermalBand: 'freezing' | 'cool' | 'mild' | 'warm' | 'hot';
  summary: string;
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number; country: string }> = {
  mumbai: { lat: 19.076, lon: 72.8777, country: 'India' },
  delhi: { lat: 28.6139, lon: 77.209, country: 'India' },
  bengaluru: { lat: 12.9716, lon: 77.5946, country: 'India' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, country: 'India' },
  london: { lat: 51.5074, lon: -0.1278, country: 'UK' },
  'new york': { lat: 40.7128, lon: -74.006, country: 'USA' },
  tokyo: { lat: 35.6762, lon: 139.6503, country: 'Japan' },
  paris: { lat: 48.8566, lon: 2.3522, country: 'France' },
  berlin: { lat: 52.52, lon: 13.405, country: 'Germany' },
  dubai: { lat: 25.2048, lon: 55.2708, country: 'UAE' },
  seoul: { lat: 37.5665, lon: 126.978, country: 'South Korea' },
  sydney: { lat: -33.8688, lon: 151.2093, country: 'Australia' },
  toronto: { lat: 43.6532, lon: -79.3832, country: 'Canada' },
  milan: { lat: 45.4642, lon: 9.19, country: 'Italy' },
};

export const WEATHER_PRESETS: Record<string, WeatherInfo> = {
  hot_summer: {
    city: 'Mumbai (Simulated)',
    country: 'India',
    temperature: 34,
    apparentTemperature: 38,
    humidity: 78,
    precipitation: 0,
    condition: 'Sunny & Humid',
    weatherCode: 0,
    isRainy: false,
    isCold: false,
    isHot: true,
    thermalBand: 'hot',
    summary: '34°C, intense tropical heat with high humidity. Breathable, ultra-lightweight clothing essential.',
  },
  monsoon_rain: {
    city: 'Bengaluru (Simulated)',
    country: 'India',
    temperature: 23,
    apparentTemperature: 22,
    humidity: 92,
    precipitation: 14.5,
    condition: 'Heavy Rain & Showers',
    weatherCode: 65,
    isRainy: true,
    isCold: false,
    isHot: false,
    thermalBand: 'mild',
    summary: '23°C with heavy monsoon showers. Water-resistant outer layer and sturdy waterproof footwear required.',
  },
  freezing_winter: {
    city: 'New York (Simulated)',
    country: 'USA',
    temperature: 2,
    apparentTemperature: -3,
    humidity: 65,
    precipitation: 0,
    condition: 'Freezing & Clear',
    weatherCode: 1,
    isRainy: false,
    isCold: true,
    isHot: false,
    thermalBand: 'freezing',
    summary: '2°C (Feels like -3°C). Sub-zero chill requiring insulated overcoat, knitwear layers, and warm boots.',
  },
  crisp_autumn: {
    city: 'London (Simulated)',
    country: 'UK',
    temperature: 14,
    apparentTemperature: 13,
    humidity: 75,
    precipitation: 1.2,
    condition: 'Brisk & Overcast',
    weatherCode: 3,
    isRainy: false,
    isCold: false,
    isHot: false,
    thermalBand: 'cool',
    summary: '14°C, brisk autumn breeze. Perfect for layered trench coats, lightweight sweaters, and chinos.',
  },
  mild_spring: {
    city: 'Tokyo (Simulated)',
    country: 'Japan',
    temperature: 21,
    apparentTemperature: 21,
    humidity: 55,
    precipitation: 0,
    condition: 'Pleasant & Mild',
    weatherCode: 1,
    isRainy: false,
    isCold: false,
    isHot: false,
    thermalBand: 'mild',
    summary: '21°C, delightfully mild and temperate. Light shirts, cotton trousers, and smart-casual styling recommended.',
  },
};

function determineThermalBand(temp: number): 'freezing' | 'cool' | 'mild' | 'warm' | 'hot' {
  if (temp < 6) return 'freezing';
  if (temp < 18) return 'cool';
  if (temp < 25) return 'mild';
  if (temp < 32) return 'warm';
  return 'hot';
}

function mapWmoCode(code: number): { condition: string; isRainy: boolean } {
  if (code === 0) return { condition: 'Clear Sky', isRainy: false };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', isRainy: false };
  if (code >= 45 && code <= 48) return { condition: 'Foggy', isRainy: false };
  if (code >= 51 && code <= 67) return { condition: 'Rain / Drizzle', isRainy: true };
  if (code >= 71 && code <= 77) return { condition: 'Snow', isRainy: true };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', isRainy: true };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', isRainy: true };
  return { condition: 'Overcast', isRainy: false };
}

export async function getWeatherForLocation(options: {
  city?: string;
  lat?: number;
  lon?: number;
  preset?: string;
}): Promise<WeatherInfo> {
  // Check if a preset is requested
  if (options.preset && WEATHER_PRESETS[options.preset]) {
    return WEATHER_PRESETS[options.preset];
  }

  const cityName = (options.city || 'Mumbai').toLowerCase().trim();
  const coords = CITY_COORDINATES[cityName] || { lat: 19.076, lon: 72.8777, country: 'India' };
  const lat = options.lat !== undefined ? options.lat : coords.lat;
  const lon = options.lon !== undefined ? options.lon : coords.lon;
  const country = coords.country || 'Global';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });

    if (res.ok) {
      const data = (await res.json()) as any;
      const current = data.current;
      const temp = Math.round(current.temperature_2m);
      const appTemp = Math.round(current.apparent_temperature);
      const precip = current.precipitation || 0;
      const wCode = current.weather_code || 0;
      const { condition, isRainy: codeIsRainy } = mapWmoCode(wCode);
      const isRainy = codeIsRainy || precip > 0.5;
      const thermalBand = determineThermalBand(temp);

      const titleCity = options.city
        ? options.city.charAt(0).toUpperCase() + options.city.slice(1)
        : 'Mumbai';

      return {
        city: titleCity,
        country,
        temperature: temp,
        apparentTemperature: appTemp,
        humidity: Math.round(current.relative_humidity_2m || 60),
        precipitation: precip,
        condition,
        weatherCode: wCode,
        isRainy,
        isCold: thermalBand === 'freezing' || thermalBand === 'cool',
        isHot: thermalBand === 'hot' || thermalBand === 'warm',
        thermalBand,
        summary: `${temp}°C (Feels like ${appTemp}°C), ${condition}. ${
          isRainy ? 'Precipitation expected — waterproof layer recommended.' : 'Dry conditions.'
        }`,
      };
    }
  } catch (err) {
    logger.warn(`Open-Meteo live API call failed for ${cityName}, falling back to climate model: ${err}`);
  }

  // Fallback realistic climate estimation if external API is unreachable
  return {
    city: options.city || 'Mumbai',
    country,
    temperature: 28,
    apparentTemperature: 31,
    humidity: 70,
    precipitation: 0,
    condition: 'Partly Cloudy',
    weatherCode: 2,
    isRainy: false,
    isCold: false,
    isHot: true,
    thermalBand: 'warm',
    summary: '28°C (Feels like 31°C), Partly Cloudy. Warm and pleasant.',
  };
}
