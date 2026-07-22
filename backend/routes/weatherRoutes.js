import express from 'express';
import { getWeatherByCoordinates, getWeatherByCity, getAutoWeather } from '../controllers/weatherController.js';

const router = express.Router();

router.post('/coordinates', getWeatherByCoordinates);
router.post('/city', getWeatherByCity);
router.get('/auto', getAutoWeather);

export default router;
