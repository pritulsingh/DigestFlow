import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { healthRouter } from './api/routes/healthRoutes.js';
import { sourceRouter } from './api/routes/sourceRoutes.js';
import { qualityRouter } from './api/routes/qualityRoutes.js';
import { digestRouter } from './api/routes/digestRoutes.js';
import { changeRouter } from './api/routes/changeRoutes.js';
import { draftRouter } from './api/routes/draftRoutes.js';
import { errorHandler } from './api/middleware/errorHandler.js';

const app = express();

// CORS setup for local frontend React development
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

app.use(express.json());

// Mount routers on /api and /api/v1
app.use('/api', healthRouter);
app.use('/api', sourceRouter);
app.use('/api', qualityRouter);
app.use('/api', digestRouter);
app.use('/api', changeRouter);
app.use('/api', draftRouter);

app.use(config.apiPrefix, healthRouter);
app.use(config.apiPrefix, sourceRouter);
app.use(config.apiPrefix, qualityRouter);
app.use(config.apiPrefix, digestRouter);
app.use(config.apiPrefix, changeRouter);
app.use(config.apiPrefix, draftRouter);

// Root informational endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Weekly Digest Composer API',
    endpoints: {
      health: '/api/health',
      signals: '/api/signals',
      projects: '/api/projects',
      runs: '/api/runs',
      dataQuality: '/api/data-quality',
      digestPreview: '/api/digests/preview?from=YYYY-MM-DD&to=YYYY-MM-DD',
      digestChanges: '/api/digests/changes?from=YYYY-MM-DD&to=YYYY-MM-DD',
      digestDraft: 'POST /api/digests/draft',
    },
  });
});

// Centralized error handling middleware
app.use(errorHandler);

const isMainModule = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.env})`);
  });
}

export default app;
