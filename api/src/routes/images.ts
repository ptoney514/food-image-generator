import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import type { Bindings, Variables } from '../lib/types';
import { getAuthUser } from '../lib/supabase-auth';
import { generateImage, StabilityAIError } from '../lib/stability-ai';
import { buildPrompt } from '../lib/prompt-builder';
import { generatedImages, type ImageStyle } from '../db/schema';

const images = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Request validation schemas
const generateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  ingredients: z.array(z.string()).max(20).optional(),
  style: z.enum(['watercolor', 'pencil', 'photo']).default('watercolor'),
  recipeId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  style: z.enum(['watercolor', 'pencil', 'photo']).optional(),
  recipeId: z.string().uuid().optional(),
});

/**
 * POST /images/generate
 * Generate a new food image from recipe data
 */
images.post('/generate', async (c) => {
  const db = c.get('db');
  const { userId } = getAuthUser(c);

  // Parse and validate request body
  const body = await c.req.json();
  const parseResult = generateRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json(
      { error: 'Invalid request', details: parseResult.error.flatten() },
      400
    );
  }

  const { title, category, ingredients, style, recipeId } = parseResult.data;

  // Build the prompt
  const { positive, negative } = buildPrompt(
    { title, category, ingredients },
    style as ImageStyle
  );

  try {
    // Generate image with Stability AI
    const { imageBuffer, contentType } = await generateImage(
      c.env.STABILITY_API_KEY,
      {
        prompt: positive,
        negativePrompt: negative,
        aspectRatio: '1:1',
      }
    );

    // Generate R2 key (using userId for path)
    const imageId = crypto.randomUUID();
    const r2Key = `${userId}/generated/${imageId}.png`;

    // Upload to R2
    await c.env.R2_BUCKET.put(r2Key, imageBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    // Build public URL
    const imageUrl = `${c.env.R2_PUBLIC_URL}/${r2Key}`;

    // Insert into database (using userId as owner)
    const [inserted] = await db
      .insert(generatedImages)
      .values({
        id: imageId,
        householdId: userId,
        recipeId: recipeId || null,
        imageUrl,
        r2Key,
        prompt: positive,
        negativePrompt: negative,
        style: style as ImageStyle,
        aspectRatio: '1:1',
        sourceTitle: title,
        sourceCategory: category || null,
        sourceIngredients: ingredients ? JSON.stringify(ingredients) : null,
        fileSize: imageBuffer.byteLength,
        contentType,
      })
      .returning();

    return c.json({
      id: inserted.id,
      imageUrl: inserted.imageUrl,
      style: inserted.style,
      prompt: inserted.prompt,
      createdAt: inserted.createdAt,
    });
  } catch (error) {
    if (error instanceof StabilityAIError) {
      return c.json(
        { error: error.message, details: error.details },
        error.statusCode as 400 | 401 | 402 | 429 | 500
      );
    }
    console.error('Image generation failed:', error);
    return c.json({ error: 'Failed to generate image' }, 500);
  }
});

/**
 * GET /images
 * List all images for the authenticated user
 */
images.get('/', async (c) => {
  const db = c.get('db');
  const { userId } = getAuthUser(c);

  // Parse query parameters
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const parseResult = listQuerySchema.safeParse(query);

  if (!parseResult.success) {
    return c.json(
      { error: 'Invalid query parameters', details: parseResult.error.flatten() },
      400
    );
  }

  const { limit, offset, style, recipeId } = parseResult.data;

  // Build query conditions
  const conditions = [eq(generatedImages.householdId, userId)];

  if (style) {
    conditions.push(eq(generatedImages.style, style));
  }

  if (recipeId) {
    conditions.push(eq(generatedImages.recipeId, recipeId));
  }

  // Fetch images
  const results = await db
    .select({
      id: generatedImages.id,
      imageUrl: generatedImages.imageUrl,
      style: generatedImages.style,
      sourceTitle: generatedImages.sourceTitle,
      recipeId: generatedImages.recipeId,
      createdAt: generatedImages.createdAt,
    })
    .from(generatedImages)
    .where(and(...conditions))
    .orderBy(desc(generatedImages.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    images: results,
    pagination: {
      limit,
      offset,
      hasMore: results.length === limit,
    },
  });
});

/**
 * GET /images/:id
 * Get a single image by ID
 */
images.get('/:id', async (c) => {
  const db = c.get('db');
  const { userId } = getAuthUser(c);
  const imageId = c.req.param('id');

  // Validate UUID format
  if (!z.string().uuid().safeParse(imageId).success) {
    return c.json({ error: 'Invalid image ID format' }, 400);
  }

  const [image] = await db
    .select()
    .from(generatedImages)
    .where(
      and(
        eq(generatedImages.id, imageId),
        eq(generatedImages.householdId, userId)
      )
    )
    .limit(1);

  if (!image) {
    return c.json({ error: 'Image not found' }, 404);
  }

  return c.json({
    id: image.id,
    imageUrl: image.imageUrl,
    style: image.style,
    prompt: image.prompt,
    negativePrompt: image.negativePrompt,
    aspectRatio: image.aspectRatio,
    sourceTitle: image.sourceTitle,
    sourceCategory: image.sourceCategory,
    sourceIngredients: image.sourceIngredients
      ? JSON.parse(image.sourceIngredients)
      : null,
    recipeId: image.recipeId,
    fileSize: image.fileSize,
    contentType: image.contentType,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  });
});

/**
 * DELETE /images/:id
 * Delete an image
 */
images.delete('/:id', async (c) => {
  const db = c.get('db');
  const { userId } = getAuthUser(c);
  const imageId = c.req.param('id');

  // Validate UUID format
  if (!z.string().uuid().safeParse(imageId).success) {
    return c.json({ error: 'Invalid image ID format' }, 400);
  }

  // Fetch image to get R2 key
  const [image] = await db
    .select({ id: generatedImages.id, r2Key: generatedImages.r2Key })
    .from(generatedImages)
    .where(
      and(
        eq(generatedImages.id, imageId),
        eq(generatedImages.householdId, userId)
      )
    )
    .limit(1);

  if (!image) {
    return c.json({ error: 'Image not found' }, 404);
  }

  // Delete from R2
  try {
    await c.env.R2_BUCKET.delete(image.r2Key);
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    // Continue with database deletion even if R2 fails
  }

  // Delete from database
  await db
    .delete(generatedImages)
    .where(eq(generatedImages.id, imageId));

  return c.json({ success: true, deletedId: imageId });
});

export default images;
