import type { Database } from '../db/client';

// Cloudflare Worker bindings
export interface Bindings {
  // R2 bucket for image storage
  R2_BUCKET: R2Bucket;

  // Environment variables (secrets)
  DATABASE_URL: string;
  SUPABASE_JWT_SECRET: string;
  STABILITY_API_KEY: string;
  R2_PUBLIC_URL: string;
  ALLOWED_ORIGINS: string;
}

// Hono context variables
export interface Variables {
  // Database client
  db: Database;

  // Authenticated user ID (from JWT)
  userId: string;
}
