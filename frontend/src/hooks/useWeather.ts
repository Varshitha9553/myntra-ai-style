import { useEffect, useState, useRef } from 'react';
import { getWeatherByCoordinates, getWeatherByCity, getAutoWeather } from '@/lib/api';

interface Weather {
  location: {
    city: string;
    region?: string;
    country?: string;
    latitude: number;
    longitude: number;
  };
  current: {
    tempC: number;
    tempF: number;
    feelsLikeC: number;
    feelsLikeF: number;
    condition: string;
    humidity: number;
    windKph: number;
    windMph: number;
    icon: string;
    emoji: string;
    isDay: boolean;
  };
  timestamp: number;
}

interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  refreshWeather: () => void;
}

/**
 * Hook to fetch weather based on user's current location
 * Automatically requests geolocation permission and refreshes every 30 minutes
 */
export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationFetchedRef = useRef(false);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeatherByCoordinates(lat, lon);
      setWeather(data);
    } catch (err: any) {
      console.error('[Weather Hook] Error fetching weather:', err);
      setError(err?.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    console.log('[Weather Hook] Location obtained:', { latitude, longitude });
    fetchWeather(latitude, longitude);
    locationFetchedRef.current = true;
  };

  const handleLocationError = async (error: GeolocationPositionError) => {
    console.warn('[Weather Hook] Geolocation error, falling back to auto weather:', error.message);
    try {
      setLoading(true);
      setError(null);
      const data = await getAutoWeather();
      setWeather(data);
    } catch (err: any) {
      console.error('[Weather Hook] Fallback auto weather error:', err);
      setError('Unable to detect your location or load fallback weather.');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
        timeout: 10000,
        enableHighAccuracy: false,
      });
    } else {
      handleLocationError(new Error('Geolocation not supported') as any);
    }
  };

  useEffect(() => {
    // Request location permission only once on mount
    if ('geolocation' in navigator && !locationFetchedRef.current) {
      navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
        timeout: 10000,
        enableHighAccuracy: false,
      });
    } else if (!('geolocation' in navigator)) {
      handleLocationError(new Error('Geolocation not supported') as any);
    }

    // Set up auto-refresh every 30 minutes
    refreshIntervalRef.current = setInterval(() => {
      if (locationFetchedRef.current && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return { weather, loading, error, refreshWeather };
}
