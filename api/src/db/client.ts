import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDb(connectionString: string) {
  // Use postgres.js with settings optimized for serverless
  const client = postgres(connectionString, {
    prepare: false, // Required for Cloudflare Workers
    max: 1, // Single connection for serverless
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
