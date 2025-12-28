import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings, Variables } from './lib/types';
import { createDb } from './db/client';
import { authMiddleware } from './lib/supabase-auth';
import { rateLimiters } from './lib/rate-limiter';
import { getLandingPageHTML } from './lib/landing-page';
import { openApiSpec, getSwaggerUIHTML } from './lib/openapi';
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

// ============================================
// Public Routes (no auth required)
// ============================================

// Landing page with HTML
app.get('/', (c) => {
  const baseUrl = new URL(c.req.url).origin;
  return c.html(getLandingPageHTML(baseUrl));
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'food-image-api', version: '1.0.0' });
});

// OpenAPI spec (JSON)
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Swagger UI documentation
app.get('/docs', (c) => {
  const baseUrl = new URL(c.req.url).origin;
  return c.html(getSwaggerUIHTML(`${baseUrl}/openapi.json`));
});

// ============================================
// API v1 Routes (auth required)
// ============================================

// Apply auth middleware to all v1 routes
app.use('/v1/*', authMiddleware);

// Apply rate limiting to image generation
app.use('/v1/images/generate', rateLimiters.imageGeneration);

// Apply standard rate limiting to other image routes
app.use('/v1/images/*', rateLimiters.standard);

// Mount image routes under /v1
app.route('/v1/images', images);

// ============================================
// Legacy routes (redirect to v1)
// ============================================

app.all('/images/*', (c) => {
  const newPath = c.req.path.replace('/images', '/v1/images');
  return c.redirect(newPath, 301);
});

// ============================================
// Error Handling
// ============================================

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
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

export default app;
