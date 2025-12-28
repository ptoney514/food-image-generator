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
import { generatedImages } from './db/schema';

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

// Debug endpoint to test full image generation (remove in production)
app.post('/debug/generate-test', async (c) => {
  const db = c.get('db');

  try {
    // Test parameters
    const testTitle = 'Grilled cheese sandwich';
    const testUserId = 'debug-test-user';

    // Build prompt inline
    const positive = `professional food photography of ${testTitle}, elegant plating, restaurant quality, on white ceramic plate, soft natural lighting, window light, shallow depth of field, f/2.8, 50mm lens, appetizing, fresh, vibrant colors, food magazine quality, clean composition, 4K, high resolution`;
    const negative = 'illustration, drawing, painting, cartoon, sketch, watercolor, artificial, fake, low quality, blurry, text, logo, watermark, hands, people, utensils in frame, overexposed, underexposed, harsh shadows, messy, cluttered, unappetizing';

    // Generate image using FormData directly
    const formData = new FormData();
    formData.append('prompt', positive);
    formData.append('negative_prompt', negative);
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', '1:1');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.STABILITY_API_KEY}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return c.json({
        error: 'Stability AI error',
        status: response.status,
        details: errorText,
      }, response.status as 400 | 401 | 402 | 429 | 500);
    }

    const jsonResponse = await response.json() as { image?: string };
    if (!jsonResponse.image) {
      return c.json({ error: 'No image in response' }, 500);
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(jsonResponse.image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBuffer = bytes.buffer;

    // Generate R2 key
    const imageId = crypto.randomUUID();
    const r2Key = `${testUserId}/generated/${imageId}.png`;

    // Upload to R2
    await c.env.R2_BUCKET.put(r2Key, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    // Build public URL
    const imageUrl = `${c.env.R2_PUBLIC_URL}/${r2Key}`;

    // Try to insert into database (may fail without Hyperdrive)
    let inserted;
    try {
      [inserted] = await db
        .insert(generatedImages)
        .values({
          id: imageId,
          householdId: testUserId,
          imageUrl,
          r2Key,
          prompt: positive,
          negativePrompt: negative,
          style: 'photo',
          aspectRatio: '1:1',
          sourceTitle: testTitle,
          fileSize: imageBuffer.byteLength,
          contentType: 'image/png',
        })
        .returning();
    } catch (dbError) {
      console.warn('Database insert failed:', dbError);
    }

    return c.json({
      success: true,
      id: inserted?.id ?? imageId,
      imageUrl: inserted?.imageUrl ?? imageUrl,
      style: inserted?.style ?? 'photo',
      fileSize: imageBuffer.byteLength,
      persisted: !!inserted,
    });
  } catch (error) {
    return c.json({
      error: 'Test generation failed',
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
    }, 500);
  }
});

// Debug endpoint to test Stability AI connection with actual prompt
app.get('/debug/test-stability', async (c) => {
  const apiKey = c.env.STABILITY_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'STABILITY_API_KEY not configured' }, 500);
  }

  // Test actual connection to Stability AI with a real prompt
  try {
    const formData = new FormData();
    formData.append('prompt', 'A simple red apple on white background');
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', '1:1');

    const testResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    // If successful, we'll get image data back
    if (testResponse.ok) {
      const jsonResponse = await testResponse.json() as { image?: string };
      return c.json({
        status: 'generation_ok',
        keyConfigured: true,
        hasImage: !!jsonResponse.image,
        imageLength: jsonResponse.image?.length || 0,
      });
    }

    const responseText = await testResponse.text();
    return c.json({
      status: 'api_error',
      keyConfigured: true,
      apiResponse: {
        status: testResponse.status,
        statusText: testResponse.statusText,
        body: responseText.substring(0, 500),
      },
    });
  } catch (error) {
    return c.json({
      status: 'connection_failed',
      keyConfigured: true,
      keyLength: apiKey.length,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
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
