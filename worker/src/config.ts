import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
    localai: z.object({
        baseUrl: z.string().url(),
        apiKey: z.string(),
        model: z.string(),
    }),
    redis: z.object({
        host: z.string(),
        port: z.number(),
        password: z.string().optional(),
    }),
    database: z.object({
        url: z.string().url(),
    }),
    r2: z.object({
        accountId: z.string(),
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        bucketName: z.string(),
        publicUrl: z.string().url(),
    }),
    image: z.object({
        size: z.string(),
        quality: z.number().min(1).max(100),
        format: z.enum(['webp', 'jpeg', 'png']),
        generationTimeout: z.number(),
    }),
});

export const config = configSchema.parse({
    localai: {
        baseUrl: process.env.LOCALAI_BASE_URL!,
        apiKey: process.env.LOCALAI_API_KEY!,
        model: process.env.LOCALAI_MODEL!,
    },
    redis: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD,
    },
    database: {
        url: process.env.DATABASE_URL!,
    },
    r2: {
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucketName: process.env.R2_BUCKET_NAME!,
        publicUrl: process.env.R2_PUBLIC_URL!,
    },
    image: {
        size: process.env.IMAGE_SIZE || '1024x1024',
        quality: parseInt(process.env.IMAGE_QUALITY || '85'),
        format: (process.env.IMAGE_FORMAT || 'webp') as 'webp' | 'jpeg' | 'png',
        generationTimeout: parseInt(process.env.GENERATION_TIMEOUT || '120000'),
    },
});
