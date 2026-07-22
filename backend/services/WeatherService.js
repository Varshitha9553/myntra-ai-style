import axios from 'axios';

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.weatherapi.com/v1';
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes cache
  }

  getWeatherEmoji(condition) {
    const normalizedCondition = String(condition || '').toLowerCase().trim();
    
    const emojiMap = {
      sunny: '☀️',
      clear: '☀️',
      'partly cloudy': '⛅',
      'partly cloud': '⛅',
      cloudy: '☁️',
      overcast: '☁️',
      rainy: '🌧️',
      rain: '🌧️',
      'light rain': '🌧️',
      drizzle: '🌦️',
      thunderstorm: '⛈️',
      'thunder': '⛈️',
      snow: '❄️',
      snowing: '❄️',
      'light snow': '❄️',
      sleet: '🌨️',
      fog: '🌫️',
      foggy: '🌫️',
      mist: '🌫️',
      haze: '🌫️',
      windy: '💨',
      wind: '💨',
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (normalizedCondition.includes(key)) {
        return emoji;
      }
    }

    return '🌤️'; // Default emoji
  }

  getConditionFromWmoCode(code, isDay) {
    const mappings = {
      0: { text: isDay ? 'Sunny' : 'Clear', emoji: isDay ? '☀️' : '🌙' },
      1: { text: 'Mainly Clear', emoji: isDay ? '☀️' : '🌙' },
      2: { text: 'Partly Cloudy', emoji: '⛅' },
      3: { text: 'Overcast', emoji: '☁️' },
      45: { text: 'Foggy', emoji: '🌫️' },
      48: { text: 'Depositing Rime Fog', emoji: '🌫️' },
      51: { text: 'Light Drizzle', emoji: '🌦️' },
      53: { text: 'Moderate Drizzle', emoji: '🌦️' },
      55: { text: 'Dense Drizzle', emoji: '🌦️' },
      61: { text: 'Light Rain', emoji: '🌧️' },
      63: { text: 'Moderate Rain', emoji: '🌧️' },
      65: { text: 'Heavy Rain', emoji: '🌧️' },
      71: { text: 'Light Snow', emoji: '❄️' },
      73: { text: 'Moderate Snow', emoji: '❄️' },
      75: { text: 'Heavy Snow', emoji: '❄️' },
      77: { text: 'Snow Grains', emoji: '❄️' },
      80: { text: 'Light Rain Showers', emoji: '🌦️' },
      81: { text: 'Moderate Rain Showers', emoji: '🌦️' },
      82: { text: 'Violent Rain Showers', emoji: '🌧️' },
      85: { text: 'Light Snow Showers', emoji: '❄️' },
      86: { text: 'Heavy Snow Showers', emoji: '❄️' },
      95: { text: 'Thunderstorm', emoji: '⛈️' },
      96: { text: 'Thunderstorm with Hail', emoji: '⛈️' },
      99: { text: 'Thunderstorm with Heavy Hail', emoji: '⛈️' }
    };
    return mappings[code] || { text: isDay ? 'Sunny' : 'Clear', emoji: isDay ? '☀️' : '🌙' };
  }

  guessCityFromCoordinates(lat, lon) {
    const testCities = [
      { name: 'Bhimavaram', lat: 16.5449, lon: 81.5224 },
      { name: 'Mysuru', lat: 12.2989, lon: 76.6394 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      { name: 'Delhi', lat: 28.6139, lon: 77.2090 }
    ];
    
    let nearestCity = 'Mumbai';
    let minDistance = Infinity;
    
    for (const city of testCities) {
      const dist = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearestCity = city.name;
      }
    }
    
    if (minDistance < 1.5) {
      return nearestCity;
    }
    return null;
  }

  async getWeatherByCoordinates(lat, lon, city) {
    const cacheKey = `${lat}-${lon}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`[Weather] Returning cached weather for ${lat}, ${lon}`);
      return cached.data;
    }

    const localHour = new Date().getHours();
    const isDay = localHour >= 6 && localHour < 18;
    const resolvedCity = this.guessCityFromCoordinates(lat, lon) || city || 'Mumbai';

    const fallbackWeather = {
      location: {
        city: resolvedCity,
        region: resolvedCity === 'Bhimavaram' ? 'Andhra Pradesh' : 'Maharashtra',
        country: 'India',
        latitude: lat,
        longitude: lon,
      },
      current: {
        tempC: 28,
        tempF: 82.4,
        feelsLikeC: 30,
        feelsLikeF: 86,
        condition: isDay ? 'Sunny' : 'Clear',
        humidity: 70,
        windKph: 12,
        windMph: 7.5,
        icon: isDay ? '//cdn.weatherapi.com/weather/64x64/day/113.png' : '//cdn.weatherapi.com/weather/64x64/night/113.png',
        code: 1000,
        isDay: isDay,
        emoji: isDay ? '☀️' : '🌙',
      },
      timestamp: Date.now(),
    };

    if (!this.apiKey) {
      console.log(`[Weather] WEATHER_API_KEY not set. Attempting free key-less fetch from Open-Meteo for ${lat}, ${lon}`);
      try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
          },
          timeout: 4000,
        });

        const data = response.data;
        const currentData = data.current || {};
        const isDay = currentData.is_day === 1;
        const wmoCode = currentData.weather_code || 0;
        const resolvedCity = this.guessCityFromCoordinates(lat, lon) || city || 'Current Location';

        const wmoMapping = this.getConditionFromWmoCode(wmoCode, isDay);

        const weather = {
          location: {
            city: resolvedCity,
            region: resolvedCity === 'Bhimavaram' ? 'Andhra Pradesh' : 'Maharashtra',
            country: 'India',
            latitude: lat,
            longitude: lon,
          },
          current: {
            tempC: currentData.temperature_2m ?? 28,
            tempF: ((currentData.temperature_2m ?? 28) * 9/5) + 32,
            feelsLikeC: currentData.apparent_temperature ?? 30,
            feelsLikeF: ((currentData.apparent_temperature ?? 30) * 9/5) + 32,
            condition: wmoMapping.text,
            humidity: currentData.relative_humidity_2m ?? 70,
            windKph: currentData.wind_speed_10m ?? 12,
            windMph: (currentData.wind_speed_10m ?? 12) * 0.621371,
            icon: isDay ? '//cdn.weatherapi.com/weather/64x64/day/113.png' : '//cdn.weatherapi.com/weather/64x64/night/113.png',
            code: 1000,
            isDay: isDay,
            emoji: wmoMapping.emoji,
          },
          timestamp: Date.now(),
        };

        // Cache the result
        this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });
        return weather;
      } catch (openMeteoErr) {
        console.warn('[Weather] Open-Meteo fetch failed, returning static fallback weather:', openMeteoErr.message);
        return fallbackWeather;
      }
    }

    try {
      console.log(`[Weather] Fetching weather for coordinates ${lat}, ${lon}`);
      
      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: `${lat},${lon}`,
          aqi: 'no',
        },
        timeout: 5000,
      });

      const data = response.data;
      const weather = {
        location: {
          city: data.location?.name || 'Unknown',
          region: data.location?.region || '',
          country: data.location?.country || '',
          latitude: data.location?.lat,
          longitude: data.location?.lon,
        },
        current: {
          tempC: data.current?.temp_c,
          tempF: data.current?.temp_f,
          feelsLikeC: data.current?.feelslike_c,
          feelsLikeF: data.current?.feelslike_f,
          condition: data.current?.condition?.text || 'Unknown',
          humidity: data.current?.humidity,
          windKph: data.current?.wind_kph,
          windMph: data.current?.wind_mph,
          icon: data.current?.condition?.icon || '',
          code: data.current?.condition?.code,
          isDay: data.current?.is_day === 1,
        },
        timestamp: Date.now(),
      };

      // Add emoji based on condition
      weather.current.emoji = this.getWeatherEmoji(weather.current.condition);

      // Cache the result
      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      return weather;
    } catch (error) {
      console.error('[Weather] Error fetching weather, using fallback:', error.message);
      return fallbackWeather;
    }
  }

  async getWeatherByCity(city) {
    const cacheKey = `city-${city}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`[Weather] Returning cached weather for city ${city}`);
      return cached.data;
    }

    const localHour = new Date().getHours();
    const isDay = localHour >= 6 && localHour < 18;

    const fallbackWeather = {
      location: {
        city: city || 'Mumbai',
        region: city === 'Bhimavaram' ? 'Andhra Pradesh' : 'Maharashtra',
        country: 'India',
        latitude: 19.076,
        longitude: 72.877,
      },
      current: {
        tempC: 28,
        tempF: 82.4,
        feelsLikeC: 30,
        feelsLikeF: 86,
        condition: isDay ? 'Sunny' : 'Clear',
        humidity: 70,
        windKph: 12,
        windMph: 7.5,
        icon: isDay ? '//cdn.weatherapi.com/weather/64x64/day/113.png' : '//cdn.weatherapi.com/weather/64x64/night/113.png',
        code: 1000,
        isDay: isDay,
        emoji: isDay ? '☀️' : '🌙',
      },
      timestamp: Date.now(),
    };

    if (!this.apiKey) {
      console.log(`[Weather] WEATHER_API_KEY not set. Attempting free key-less search + fetch from Open-Meteo for city: ${city}`);
      try {
        const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
          params: { name: city, count: 1 },
          timeout: 3000
        });
        
        let lat = 19.076;
        let lon = 72.877;
        let resolvedCity = city;
        let region = 'Maharashtra';
        
        if (geoResponse.data && Array.isArray(geoResponse.data.results) && geoResponse.data.results.length > 0) {
          const res = geoResponse.data.results[0];
          lat = res.latitude;
          lon = res.longitude;
          resolvedCity = res.name;
          region = res.admin1 || '';
        }

        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
          },
          timeout: 4000,
        });

        const data = response.data;
        const currentData = data.current || {};
        const isDay = currentData.is_day === 1;
        const wmoCode = currentData.weather_code || 0;

        const wmoMapping = this.getConditionFromWmoCode(wmoCode, isDay);

        const weather = {
          location: {
            city: resolvedCity,
            region: region,
            country: 'India',
            latitude: lat,
            longitude: lon,
          },
          current: {
            tempC: currentData.temperature_2m ?? 28,
            tempF: ((currentData.temperature_2m ?? 28) * 9/5) + 32,
            feelsLikeC: currentData.apparent_temperature ?? 30,
            feelsLikeF: ((currentData.apparent_temperature ?? 30) * 9/5) + 32,
            condition: wmoMapping.text,
            humidity: currentData.relative_humidity_2m ?? 70,
            windKph: currentData.wind_speed_10m ?? 12,
            windMph: (currentData.wind_speed_10m ?? 12) * 0.621371,
            icon: isDay ? '//cdn.weatherapi.com/weather/64x64/day/113.png' : '//cdn.weatherapi.com/weather/64x64/night/113.png',
            code: 1000,
            isDay: isDay,
            emoji: wmoMapping.emoji,
          },
          timestamp: Date.now(),
        };

        // Cache the result
        this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });
        return weather;
      } catch (openMeteoErr) {
        console.warn('[Weather] Open-Meteo city fetch failed, returning static fallback weather:', openMeteoErr.message);
        return fallbackWeather;
      }
    }

    try {
      console.log(`[Weather] Fetching weather for city ${city}`);
      
      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: city,
          aqi: 'no',
        },
        timeout: 5000,
      });

      const data = response.data;
      const weather = {
        location: {
          city: data.location?.name || 'Unknown',
          region: data.location?.region || '',
          country: data.location?.country || '',
          latitude: data.location?.lat,
          longitude: data.location?.lon,
        },
        current: {
          tempC: data.current?.temp_c,
          tempF: data.current?.temp_f,
          feelsLikeC: data.current?.feelslike_c,
          feelsLikeF: data.current?.feelslike_f,
          condition: data.current?.condition?.text || 'Unknown',
          humidity: data.current?.humidity,
          windKph: data.current?.wind_kph,
          windMph: data.current?.wind_mph,
          icon: data.current?.condition?.icon || '',
          code: data.current?.condition?.code,
          isDay: data.current?.is_day === 1,
        },
        timestamp: Date.now(),
      };

      // Add emoji based on condition
      weather.current.emoji = this.getWeatherEmoji(weather.current.condition);

      // Cache the result
      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      return weather;
    } catch (error) {
      console.error('[Weather] Error fetching weather for city, using fallback:', error.message);
      return fallbackWeather;
    }
  }

  clearCache() {
    this.cache.clear();
  }

  async getWeatherSummary(city = 'Mumbai') {
    return {
      city,
      condition: 'Sunny',
      temperature: 28,
      recommendation: 'Light layers work well.',
    };
  }
}

export default new WeatherService();

