-- Migration: Create generated_images table
-- Run this on your Supabase database

-- Create image style enum
CREATE TYPE image_style AS ENUM ('watercolor', 'pencil', 'photo');

-- Create generated_images table
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (household-based, matches PairDish pattern)
  household_id UUID NOT NULL,

  -- Optional link to recipe
  recipe_id UUID,

  -- Image details
  image_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,

  -- Generation parameters
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  style image_style NOT NULL DEFAULT 'watercolor',
  aspect_ratio TEXT DEFAULT '1:1',

  -- Source data (for audit/regeneration)
  source_title TEXT,
  source_category TEXT,
  source_ingredients TEXT, -- JSON array

  -- Metadata
  file_size INTEGER,
  content_type TEXT DEFAULT 'image/png',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_generated_images_household ON generated_images(household_id);
CREATE INDEX idx_generated_images_recipe ON generated_images(recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_generated_images_created ON generated_images(created_at DESC);
CREATE INDEX idx_generated_images_style ON generated_images(style);

-- Enable Row Level Security (RLS)
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access images from their household
-- Note: Adjust this policy based on your auth setup
CREATE POLICY "Users can view their household images"
  ON generated_images
  FOR SELECT
  USING (household_id IN (
    SELECT (raw_app_meta_data->>'household_id')::uuid
    FROM auth.users
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert images for their household"
  ON generated_images
  FOR INSERT
  WITH CHECK (household_id IN (
    SELECT (raw_app_meta_data->>'household_id')::uuid
    FROM auth.users
    WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their household images"
  ON generated_images
  FOR DELETE
  USING (household_id IN (
    SELECT (raw_app_meta_data->>'household_id')::uuid
    FROM auth.users
    WHERE id = auth.uid()
  ));

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
