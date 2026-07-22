import { Cloud, Droplets, Wind, RefreshCw, AlertCircle } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useState } from 'react';

export function WeatherWidget() {
  const { weather, loading, error, refreshWeather } = useWeather();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    refreshWeather();
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Location Access Required</p>
            <p className="text-xs text-amber-700 mt-1">{error}</p>
            <div className="mt-3 p-3 bg-amber-100/50 rounded-xl">
              <p className="text-xs text-amber-800 font-medium mb-2">How to enable location access:</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                <li>Click the lock icon 🔒 in your browser's address bar</li>
                <li>Find "Location" in the permissions</li>
                <li>Change it to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
            <button
              onClick={handleManualRefresh}
              className="mt-3 px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !weather) {
    return (
      <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-cyan-50 p-6 mb-8">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground">Detecting your location...</span>
        </div>
      </div>
    );
  }

  const {
    location: { city, region, country },
    current: { tempC, feelsLikeC, condition, humidity, windKph, icon, emoji, isDay },
  } = weather;

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6 mb-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Location & Main Weather */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Your Weather</h3>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1 hover:bg-white/50 rounded-full transition disabled:opacity-50"
              title="Refresh weather"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-end gap-4 mt-2 mb-4">
            <div>
              <div className="text-5xl font-black text-myntra-dark">{emoji}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-myntra-dark">{Math.round(tempC)}°C</div>
              <div className="text-xs text-muted-foreground">Feels like {Math.round(feelsLikeC)}°C</div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-myntra-dark">{condition}</p>
            <p className="text-xs text-muted-foreground">
              {city}
              {region ? `, ${region}` : ''}
              {country ? `, ${country}` : ''}
            </p>
          </div>
        </div>

        {/* Right: Weather Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/70 backdrop-blur p-3 text-center">
            <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <div className="text-xs font-semibold text-myntra-dark">{humidity}%</div>
            <div className="text-[10px] text-muted-foreground">Humidity</div>
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur p-3 text-center">
            <Wind className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
            <div className="text-xs font-semibold text-myntra-dark">{Math.round(windKph)} km/h</div>
            <div className="text-[10px] text-muted-foreground">Wind</div>
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur p-3 text-center col-span-2">
            <Cloud className="w-4 h-4 text-teal-500 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">
              {isDay ? '☀️ Day' : '🌙 Night'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground bg-white/40 rounded-lg p-2 text-center">
        📍 Auto-refreshes every 30 minutes · Last updated {new Date(weather.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
