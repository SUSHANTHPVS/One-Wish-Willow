import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  humidity: number;
  windSpeed: number;
  updatedAt: string;
}

const STORAGE_KEY = 'one-wish-weather';

const weatherCodeMap: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy hailstorm',
};

function storageKey(user: string) {
  return `one-wish-${user}-weather`;
}

function loadWeather(user: string) {
  if (typeof window === 'undefined') {
    return { weather: null as WeatherData | null, location: '' };
  }

  try {
    const saved = window.localStorage.getItem(storageKey(user));
    if (!saved) {
      return { weather: null as WeatherData | null, location: '' };
    }

    const parsed = JSON.parse(saved) as { weather?: WeatherData | null; location?: string };
    return {
      weather: parsed.weather ?? null,
      location: parsed.location ?? '',
    };
  } catch {
    return { weather: null as WeatherData | null, location: '' };
  }
}

interface WeatherPageProps {
  currentUser: string;
}

export default function WeatherPage({ currentUser }: WeatherPageProps) {
  const saved = useMemo(() => loadWeather(currentUser), [currentUser]);
  const [weather, setWeather] = useState<WeatherData | null>(saved.weather);
  const [location, setLocation] = useState(saved.location);
  const [status, setStatus] = useState(saved.weather ? 'Weather loaded' : 'Fetching weather...');
  const [loading, setLoading] = useState(!saved.weather);

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify({ weather, location }));
  }, [weather, location, currentUser]);

  useEffect(() => {
    if (!weather) return;
    const timer = window.setInterval(() => {
      setWeather((current) => (current ? { ...current, updatedAt: new Date().toISOString() } : null));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [weather]);

  useEffect(() => {
    if (saved.weather) return;
    
    // Auto-fetch weather using geolocation if not already saved
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to default city if geolocation fails
          setLocation('London');
          setStatus('Using default location (London)');
        }
      );
    } else {
      setLocation('London');
      setStatus('Using default location (London)');
    }
  }, []);

  async function fetchWeatherByCoords(lat: number, lon: number) {
    try {
      // Use Open-Meteo (free, no API key required)
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`);
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      const weatherData = await weatherRes.json();
      const current = weatherData.current_weather;
      const humidityIndex = weatherData.hourly?.time?.indexOf(current.time) ?? -1;
      const humidity = humidityIndex >= 0 ? weatherData.hourly.relativehumidity_2m[humidityIndex] : 0;
      const description = weatherCodeMap[current.weathercode] ?? 'Live conditions';
      
      // Get city name from coordinates
      const reverseGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await reverseGeo.json();
      const cityName = geoData.address?.city || geoData.address?.town || geoData.address?.state || 'Current Location';

      const newWeather = {
        temp: current.temperature,
        description,
        city: cityName,
        humidity: Math.round(humidity),
        windSpeed: current.windspeed,
        updatedAt: new Date(current.time).toISOString(),
      };
      setWeather(newWeather);
      setLocation(cityName);
      setStatus('Weather loaded from your location ✓');
      setLoading(false);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setStatus('Could not fetch weather. Try entering a city manually.');
      setLoading(false);
    }
  }

  async function fetchWeather() {
    const query = location.trim();
    if (!query) return;

    setLoading(true);
    setStatus('Looking up city...');

    try {
      // Use Open-Meteo geocoding (free, no API key)
      const geocodeRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
      if (!geocodeRes.ok) throw new Error('City lookup failed');
      const geocodeData = await geocodeRes.json();
      const place = geocodeData.results?.[0];
      if (!place) {
        setStatus('❌ City not found. Try a different name.');
        setWeather(null);
        setLoading(false);
        return;
      }

      setStatus('Loading weather...');
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`);
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      const weatherData = await weatherRes.json();
      const current = weatherData.current_weather;
      const humidityIndex = weatherData.hourly?.time?.indexOf(current.time) ?? -1;
      const humidity = humidityIndex >= 0 ? weatherData.hourly.relativehumidity_2m[humidityIndex] : 0;
      const description = weatherCodeMap[current.weathercode] ?? 'Live conditions';

      const countryCode = place.country_code ? ` (${place.country_code.toUpperCase()})` : '';
      setWeather({
        temp: current.temperature,
        description,
        city: `${place.name}${countryCode}`,
        humidity: Math.round(humidity),
        windSpeed: current.windspeed,
        updatedAt: new Date(current.time).toISOString(),
      });
      setStatus('✓ Weather loaded successfully');
    } catch (error) {
      console.error('Fetch error:', error);
      setWeather(null);
      setStatus('❌ Unable to load weather. Try another location.');
    } finally {
      setLoading(false);
    }
  }

  const weatherMood = weather?.description.toLowerCase() ?? '';
  const weatherPageClass = weatherMood.includes('rain') || weatherMood.includes('drizzle') || weatherMood.includes('snow') || weatherMood.includes('storm')
    ? 'weather-page rainy'
    : weatherMood.includes('cloud') || weatherMood.includes('overcast') || weatherMood.includes('fog')
      ? 'weather-page cloudy'
      : weatherMood.includes('clear') || weatherMood.includes('sun')
        ? 'weather-page sunny'
        : 'weather-page';

  return (
    <section className={`page-card ${weatherPageClass}`}>
      <div className="page-header">
        <div>
          <PageTitle topic="weather"><h2>Weather</h2></PageTitle>
          <p>Check today&apos;s conditions and keep your plans aligned.</p>
        </div>
        <img src="/weather-illustration.svg" alt="Weather illustration" className="page-illustration" />
      </div>

      <div className="weather-panel">
        <div className="weather-input-row">
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Enter city name"
            disabled={loading}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? 'Loading…' : 'Get Weather'}
          </button>
        </div>

        <div className="weather-status">{status}</div>
        {weather && (
          <div className="weather-card">
            <div className="weather-main">
              <span className="weather-temp">{Math.round(weather.temp)}°C</span>
              <div>
                <h3>{weather.city}</h3>
                <p>{weather.description}</p>
              </div>
            </div>
            <div className="weather-details">
              <span>Humidity: {weather.humidity}%</span>
              <span>Wind: {Math.round(weather.windSpeed)} km/h</span>
              <span>Updated: {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' }).format(new Date(weather.updatedAt))}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
