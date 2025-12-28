import { pgTable, text, integer, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

// Image style enum
export const imageStyleEnum = pgEnum('image_style', ['watercolor', 'pencil', 'photo']);

// Generated images table
export const generatedImages = pgTable('generated_images', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Ownership (household-based, matches PairDish pattern)
  householdId: uuid('household_id').notNull(),

  // Optional link to recipe (if generated for a specific recipe)
  recipeId: uuid('recipe_id'),

  // Image details
  imageUrl: text('image_url').notNull(),
  r2Key: text('r2_key').notNull(),

  // Generation parameters
  prompt: text('prompt').notNull(),
  negativePrompt: text('negative_prompt'),
  style: imageStyleEnum('style').notNull().default('watercolor'),
  aspectRatio: text('aspect_ratio').default('1:1'),

  // Source data (for audit/regeneration)
  sourceTitle: text('source_title'),
  sourceCategory: text('source_category'),
  sourceIngredients: text('source_ingredients'), // JSON array

  // Metadata
  fileSize: integer('file_size'),
  contentType: text('content_type').default('image/png'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type NewGeneratedImage = typeof generatedImages.$inferInsert;
export type ImageStyle = 'watercolor' | 'pencil' | 'photo';
