import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import generateRouter from './routes/generate';
import { getAIConfig } from './services/openaiService';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean) as string[];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  const aiConfig = getAIConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    provider: aiConfig.provider,
    hasApiKey: !!aiConfig.apiKey,
    model: aiConfig.model,
  });
});

// Routes
app.use('/api/generate', generateRouter);

if (isProduction) {
  const clientDistPath = [
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../../../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ].find((candidate) => fs.existsSync(path.join(candidate, 'index.html'))) ?? path.resolve(__dirname, '../../../../client/dist');

  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 handler for API/unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato.' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Errore interno del server.' });
});

app.listen(PORT, () => {
  const aiConfig = getAIConfig();
  console.log(`\nRP Architect Server avviato`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   Provider AI: ${aiConfig.provider}`);
  console.log(`   API Key: ${aiConfig.apiKey ? 'Configurata' : 'NON configurata'}`);
  console.log(`   Modello: ${aiConfig.model}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
