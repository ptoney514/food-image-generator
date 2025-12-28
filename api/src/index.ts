import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings, Variables } from './lib/types';
import { createDb } from './db/client';
import { authMiddleware } from './lib/supabase-auth';
import images from './routes/images';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Request logging
app.use('*', logger());

// CORS middleware
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

  return cors({
    origin: (origin) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return '*';
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) return origin;
      // In development, allow localhost
      if (origin.includes('localhost')) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  })(c, next);
});

// Database middleware - inject Drizzle client
app.use('*', async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set('db', db);
  await next();
});

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'food-image-api' });
});

// API info (no auth required)
app.get('/', (c) => {
  return c.json({
    name: 'Food Image Generator API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generate: 'POST /images/generate',
      list: 'GET /images',
      get: 'GET /images/:id',
      delete: 'DELETE /images/:id',
    },
  });
});

// Protected routes - require authentication
app.use('/images/*', authMiddleware);

// Mount image routes
app.route('/images', images);

// Global error handler
app.onError((error, c) => {
  console.error('Unhandled error:', error);

  // Don't expose internal errors
  const message =
    error instanceof Error ? error.message : 'Internal server error';

  return c.json({ error: message }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
