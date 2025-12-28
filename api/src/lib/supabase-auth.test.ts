import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, getAuthUser } from './supabase-auth';
import type { Bindings, Variables } from './types';

// Mock jose module
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from 'jose';

describe('authMiddleware', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    app.use('*', authMiddleware);
    app.get('/test', (c) => {
      const { userId } = getAuthUser(c);
      return c.json({ userId });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockEnv: Bindings = {
    R2_BUCKET: {} as R2Bucket,
    DATABASE_URL: 'postgres://test',
    SUPABASE_JWT_SECRET: 'test-secret',
    STABILITY_API_KEY: 'test-key',
    R2_PUBLIC_URL: 'https://test.r2.dev',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  it('should return 401 when Authorization header is missing', async () => {
    const res = await app.request('/test', {}, mockEnv);

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Missing or invalid Authorization header');
  });

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    const res = await app.request(
      '/test',
      { headers: { Authorization: 'Basic token123' } },
      mockEnv
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Missing or invalid Authorization header');
  });

  it('should return 401 when JWT verification fails', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('Invalid token'));

    const res = await app.request(
      '/test',
      { headers: { Authorization: 'Bearer invalid-token' } },
      mockEnv
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid or expired token');
  });

  it('should return 401 when token is missing sub claim', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { email: 'test@example.com' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    const res = await app.request(
      '/test',
      { headers: { Authorization: 'Bearer valid-token' } },
      mockEnv
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid token: missing user ID');
  });

  it('should set userId in context when token is valid', async () => {
    const mockUserId = 'user-123-uuid';
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: mockUserId, email: 'test@example.com' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    const res = await app.request(
      '/test',
      { headers: { Authorization: 'Bearer valid-token' } },
      mockEnv
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { userId: string };
    expect(body.userId).toBe(mockUserId);
  });

  it('should call jwtVerify with correct parameters', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: 'user-123' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    await app.request(
      '/test',
      { headers: { Authorization: 'Bearer my-token' } },
      mockEnv
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    const [token, secret, options] = vi.mocked(jwtVerify).mock.calls[0];
    expect(token).toBe('my-token');
    expect(options).toEqual({ algorithms: ['HS256'] });
  });
});

describe('getAuthUser', () => {
  it('should return userId from context', async () => {
    const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    app.use('*', async (c, next) => {
      c.set('userId', 'test-user-id');
      await next();
    });
    app.get('/test', (c) => {
      const auth = getAuthUser(c);
      return c.json(auth);
    });

    const mockEnv: Bindings = {
      R2_BUCKET: {} as R2Bucket,
      DATABASE_URL: 'postgres://test',
      SUPABASE_JWT_SECRET: 'test-secret',
      STABILITY_API_KEY: 'test-key',
      R2_PUBLIC_URL: 'https://test.r2.dev',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    };

    const res = await app.request('/test', {}, mockEnv);
    const body = (await res.json()) as { userId: string };

    expect(body.userId).toBe('test-user-id');
  });
});
