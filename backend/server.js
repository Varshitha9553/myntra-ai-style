import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import wardrobeRoutes from './routes/wardrobeRoutes.js';
import outfitRoutes from './routes/outfitRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import duplicateRoutes from './routes/duplicateRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import shoppingAssistantRoutes from './routes/shoppingAssistantRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import personalizationRoutes from './routes/personalizationRoutes.js';
import { repairWardrobeItems } from './utils/repair.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'myntra-ai-style-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/outfit', outfitRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/duplicate', duplicateRoutes);
app.use('/api/duplicate-check', duplicateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/shopping-assistant', shoppingAssistantRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/personalization', personalizationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async (preferredPort) => {
  await connectDB();
  // repairWardrobeItems().catch(err => console.error('[Database Repair Startup Error]:', err.message));
  
  const serverPort = parseInt(preferredPort || port, 10);

  const server = app.listen(serverPort, () => {
    console.log(`Backend running on http://localhost:${serverPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${serverPort} is in use. Trying port ${serverPort + 1}...`);
      startServer(serverPort + 1);
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });

  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
export default app;
// reload throttled restart final ok 30s final qwen sys run port






