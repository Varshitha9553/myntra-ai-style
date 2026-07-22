import WeatherService from '../services/WeatherService.js';
import axios from 'axios';

export async function getWeatherByCoordinates(req, res, next) {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weather = await WeatherService.getWeatherByCoordinates(parseFloat(lat), parseFloat(lon));
    res.json(weather);
  } catch (error) {
    console.error('[Weather Controller] Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
}

export async function getWeatherByCity(req, res, next) {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City name is required' });
    }

    const weather = await WeatherService.getWeatherByCity(city);
    res.json(weather);
  } catch (error) {
    console.error('[Weather Controller] Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
}

export async function getAutoWeather(req, res, next) {
  try {
    let lat = 19.076;
    let lon = 72.877;
    let city = 'Mumbai';
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const cleanIp = ip.split(',')[0].trim();
      let geoUrl = 'http://ip-api.com/json/';
      if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1' && cleanIp !== '::ffff:127.0.0.1' && !cleanIp.startsWith('192.168.') && !cleanIp.startsWith('10.')) {
        geoUrl = `http://ip-api.com/json/${cleanIp}`;
      }
      const geo = await axios.get(geoUrl, { timeout: 3000 });
      if (geo.data && geo.data.status === 'success') {
        lat = geo.data.lat;
        lon = geo.data.lon;
        city = geo.data.city;
      }
    } catch (e) {
      // ignore and use default
    }

    const weather = await WeatherService.getWeatherByCoordinates(lat, lon, city);
    res.json(weather);
  } catch (error) {
    console.error('[Weather Controller] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch auto weather' });
  }
}
