import { Context, MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import type { Bindings, Variables } from './types';

interface SupabaseJWTPayload {
  sub: string; // User ID
  email?: string;
  app_metadata?: {
    household_id?: string;
  };
  user_metadata?: {
    household_id?: string;
  };
}

/**
 * Middleware to verify Supabase JWT and extract user info
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

    // Extract household ID from app_metadata or user_metadata
    const householdId =
      jwtPayload.app_metadata?.household_id ||
      jwtPayload.user_metadata?.household_id;

    if (!householdId) {
      return c.json({ error: 'User not associated with a household' }, 403);
    }

    // Set user info in context
    c.set('userId', jwtPayload.sub);
    c.set('householdId', householdId);

    await next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

/**
 * Helper to get authenticated user info from context
 */
export function getAuthUser(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  return {
    userId: c.get('userId'),
    householdId: c.get('householdId'),
  };
}
