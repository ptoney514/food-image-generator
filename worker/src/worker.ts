import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config.js';
import { buildPrompt, RecipeData } from './prompt-builder.js';
import { generateImage } from './image-generator.js';
import { processImage } from './image-processor.js';
import { uploadToR2 } from './r2-uploader.js';
import { updateRecipeImage, closeDatabase } from './database.js';

const connection = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
});

interface GenerateRecipeImageJob {
    recipeId: string;
    title: string;
    category?: string;
    ingredients: string[];
}

/**
 * Main worker process
 */
const worker = new Worker<GenerateRecipeImageJob>(
    'GenerateRecipeImage',
    async (job: Job<GenerateRecipeImageJob>) => {
        const { recipeId, title, category, ingredients } = job.data;

        console.log(`\n=== Processing job ${job.id} for recipe ${recipeId} ===`);
        console.log(`Title: ${title}`);
        console.log(`Category: ${category || 'N/A'}`);
        console.log(`Ingredients: ${ingredients.join(', ')}`);

        try {
            // Step 1: Build prompt
            await job.updateProgress(10);
            const { positive, negative } = buildPrompt({ title, category, ingredients });
            console.log(`\nPrompt built:\n  Positive: ${positive}\n  Negative: ${negative}`);

            // Step 2: Generate image
            await job.updateProgress(20);
            const imageBuffer = await generateImage({
                prompt: positive,
                negativePrompt: negative,
                size: '1024x1024',
            });
            console.log(`Image generated: ${imageBuffer.length} bytes`);

            // Step 3: Process image
            await job.updateProgress(60);
            const processedBuffer = await processImage(imageBuffer);
            console.log(`Image processed: ${processedBuffer.length} bytes`);

            // Step 4: Upload to R2
            await job.updateProgress(80);
            const imageUrl = await uploadToR2(recipeId, processedBuffer, config.image.format);

            // Step 5: Update database
            await job.updateProgress(90);
            await updateRecipeImage(recipeId, imageUrl);

            await job.updateProgress(100);
            console.log(`=== Job ${job.id} completed successfully ===\n`);

            return { imageUrl };
        } catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 1,  // Process one image at a time
        limiter: {
            max: 10,  // Max 10 jobs per duration
            duration: 60000,  // 1 minute
        },
    }
);

// Event handlers
worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await worker.close();
    await connection.quit();
    await closeDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await worker.close();
    await connection.quit();
    await closeDatabase();
    process.exit(0);
});

console.log('🚀 Food Image Worker started');
console.log(`   LocalAI: ${config.localai.baseUrl}`);
console.log(`   Model: ${config.localai.model}`);
console.log(`   Redis: ${config.redis.host}:${config.redis.port}`);
console.log(`   Waiting for jobs...\n`);
