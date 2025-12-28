import { Context, MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import type { Bindings, Variables } from './types';

interface SupabaseJWTPayload {
  sub: string; // User ID
  email?: string;
}

/**
 * Middleware to verify Supabase JWT and extract user info
 * Simplified: just verifies token is valid, no household check
 */
export const authMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.SUPABASE_JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const jwtPayload = payload as unknown as SupabaseJWTPayload;

    if (!jwtPayload.sub) {
      return c.json({ error: 'Invalid token: missing user ID' }, 401);
    }

    // Set user ID in context
    c.set('userId', jwtPayload.sub);

    await next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

/**
 * Helper to get authenticated user ID from context
 */
export function getAuthUser(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  return {
    userId: c.get('userId'),
  };
}
