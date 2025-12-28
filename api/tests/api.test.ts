import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../src/lib/types';

// Mock jose before importing modules that use it
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

// Mock the stability-ai module
vi.mock('../src/lib/stability-ai', () => ({
  generateImage: vi.fn(),
  StabilityAIError: class StabilityAIError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public details?: string
    ) {
      super(message);
      this.name = 'StabilityAIError';
    }
  },
}));

import { jwtVerify } from 'jose';
import { generateImage, StabilityAIError } from '../src/lib/stability-ai';

// Create a test app similar to main app
import { authMiddleware } from '../src/lib/supabase-auth';
import images from '../src/routes/images';

describe('API E2E Tests', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  const mockUserId = 'test-user-uuid-12345';

  // Mock R2 bucket
  const mockR2Bucket = {
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
  };

  // Mock database
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
  };

  const mockEnv: Bindings = {
    R2_BUCKET: mockR2Bucket as unknown as R2Bucket,
    DATABASE_URL: 'postgres://test',
    SUPABASE_JWT_SECRET: 'test-secret',
    STABILITY_API_KEY: 'test-stability-key',
    R2_PUBLIC_URL: 'https://test.r2.dev',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default JWT mock - valid token
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { sub: mockUserId },
      protectedHeader: { alg: 'HS256' },
    } as any);

    // Create test app
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

    // Add db middleware
    app.use('*', async (c, next) => {
      c.set('db', mockDb as any);
      await next();
    });

    // Add auth middleware
    app.use('/v1/images/*', authMiddleware);

    // Mount routes
    app.route('/v1/images', images);

    // Health endpoint
    app.get('/health', (c) => {
      return c.json({ status: 'ok', service: 'food-image-api', version: '1.0.0' });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health', {}, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('food-image-api');
    });
  });

  describe('POST /v1/images/generate', () => {
    const validRequest = {
      title: 'Grilled Salmon',
      category: 'dinner',
      ingredients: ['salmon', 'lemon', 'herbs'],
      style: 'photo',
    };

    it('should return 401 without auth header', async () => {
      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      }, mockEnv);

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid request body', async () => {
      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ title: '' }), // Empty title
      }, mockEnv);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid request');
    });

    it('should return 400 for invalid style', async () => {
      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ title: 'Test', style: 'invalid-style' }),
      }, mockEnv);

      expect(res.status).toBe(400);
    });

    it('should successfully generate an image', async () => {
      const mockImageBuffer = new ArrayBuffer(1024);
      vi.mocked(generateImage).mockResolvedValueOnce({
        imageBuffer: mockImageBuffer,
        contentType: 'image/png',
      });

      const mockInsertedImage = {
        id: 'generated-image-id',
        imageUrl: 'https://test.r2.dev/test-user-uuid-12345/generated/generated-image-id.png',
        style: 'photo',
        prompt: 'professional food photography of Grilled Salmon...',
        createdAt: new Date().toISOString(),
      };

      mockDb.returning.mockResolvedValueOnce([mockInsertedImage]);

      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify(validRequest),
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json() as { id: string; style: string; imageUrl: string };
      // ID is now a generated UUID, not from database
      expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(body.style).toBe('photo');
      expect(body.imageUrl).toBeDefined();
      expect(generateImage).toHaveBeenCalledOnce();
      expect(mockR2Bucket.put).toHaveBeenCalledOnce();
    });

    it('should handle Stability AI errors', async () => {
      vi.mocked(generateImage).mockRejectedValueOnce(
        new StabilityAIError('Insufficient Stability AI credits', 402, 'No credits')
      );

      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify(validRequest),
      }, mockEnv);

      expect(res.status).toBe(402);
      const body = await res.json();
      expect(body.error).toBe('Insufficient Stability AI credits');
    });

    it('should default style to watercolor', async () => {
      const mockImageBuffer = new ArrayBuffer(1024);
      vi.mocked(generateImage).mockResolvedValueOnce({
        imageBuffer: mockImageBuffer,
        contentType: 'image/png',
      });

      const mockInsertedImage = {
        id: 'generated-image-id',
        imageUrl: 'https://test.r2.dev/generated.png',
        style: 'watercolor',
        prompt: 'watercolor illustration...',
        createdAt: new Date().toISOString(),
      };

      mockDb.returning.mockResolvedValueOnce([mockInsertedImage]);

      const res = await app.request('/v1/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ title: 'Pizza' }), // No style specified
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.style).toBe('watercolor');
    });
  });

  describe('GET /v1/images', () => {
    it('should return 401 without auth header', async () => {
      const res = await app.request('/v1/images', {}, mockEnv);

      expect(res.status).toBe(401);
    });

    it('should return list of images', async () => {
      const mockImages = [
        {
          id: 'image-1',
          imageUrl: 'https://test.r2.dev/image1.png',
          style: 'watercolor',
          sourceTitle: 'Pizza',
          recipeId: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'image-2',
          imageUrl: 'https://test.r2.dev/image2.png',
          style: 'photo',
          sourceTitle: 'Burger',
          recipeId: 'recipe-uuid',
          createdAt: new Date().toISOString(),
        },
      ];

      mockDb.offset.mockResolvedValueOnce(mockImages);

      const res = await app.request('/v1/images', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.images).toHaveLength(2);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.offset).toBe(0);
    });

    it('should support pagination parameters', async () => {
      mockDb.offset.mockResolvedValueOnce([]);

      const res = await app.request('/v1/images?limit=10&offset=5', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.offset).toBe(5);
    });

    it('should filter by style', async () => {
      mockDb.offset.mockResolvedValueOnce([]);

      const res = await app.request('/v1/images?style=watercolor', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid query parameters', async () => {
      const res = await app.request('/v1/images?limit=invalid', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/images/:id', () => {
    it('should return 401 without auth header', async () => {
      const res = await app.request('/v1/images/some-uuid', {}, mockEnv);

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await app.request('/v1/images/invalid-id', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid image ID format');
    });

    it('should return 404 when image not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const res = await app.request('/v1/images/550e8400-e29b-41d4-a716-446655440000', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Image not found');
    });

    it('should return image details', async () => {
      const mockImage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        imageUrl: 'https://test.r2.dev/image.png',
        style: 'photo',
        prompt: 'professional food photography...',
        negativePrompt: 'blurry, low quality',
        aspectRatio: '1:1',
        sourceTitle: 'Grilled Salmon',
        sourceCategory: 'dinner',
        sourceIngredients: JSON.stringify(['salmon', 'lemon']),
        recipeId: null,
        fileSize: 1024,
        contentType: 'image/png',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDb.limit.mockResolvedValueOnce([mockImage]);

      const res = await app.request('/v1/images/550e8400-e29b-41d4-a716-446655440000', {
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(body.style).toBe('photo');
      expect(body.sourceIngredients).toEqual(['salmon', 'lemon']);
    });
  });

  describe('DELETE /v1/images/:id', () => {
    it('should return 401 without auth header', async () => {
      const res = await app.request('/v1/images/some-uuid', {
        method: 'DELETE',
      }, mockEnv);

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await app.request('/v1/images/invalid-id', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(400);
    });

    it('should return 404 when image not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const res = await app.request('/v1/images/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(404);
    });

    it('should delete image successfully', async () => {
      const mockImage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        r2Key: 'test-user/generated/image.png',
      };

      mockDb.limit.mockResolvedValueOnce([mockImage]);

      const res = await app.request('/v1/images/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.deletedId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockR2Bucket.delete).toHaveBeenCalledWith('test-user/generated/image.png');
    });

    it('should continue even if R2 delete fails', async () => {
      const mockImage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        r2Key: 'test-user/generated/image.png',
      };

      mockDb.limit.mockResolvedValueOnce([mockImage]);
      mockR2Bucket.delete.mockRejectedValueOnce(new Error('R2 error'));

      const res = await app.request('/v1/images/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      }, mockEnv);

      // Should still succeed even if R2 delete fails
      expect(res.status).toBe(200);
    });
  });
});
