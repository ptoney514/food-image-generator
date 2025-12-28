import type { ImageStyle } from '../db/schema';

export interface RecipeData {
  title: string;
  category?: string;
  ingredients?: string[];
}

export interface PromptResult {
  positive: string;
  negative: string;
}

/**
 * Build style-specific prompts for food image generation
 */
export function buildPrompt(recipe: RecipeData, style: ImageStyle = 'watercolor'): PromptResult {
  const { title, category, ingredients } = recipe;

  // Extract top 3 visual ingredients
  const visualIngredients = ingredients?.slice(0, 3).join(', ') || '';

  switch (style) {
    case 'watercolor':
      return buildWatercolorPrompt(title, visualIngredients);
    case 'pencil':
      return buildPencilPrompt(title, visualIngredients);
    case 'photo':
      return buildPhotoPrompt(title, category, visualIngredients);
    default:
      return buildWatercolorPrompt(title, visualIngredients);
  }
}

function buildWatercolorPrompt(title: string, ingredients: string): PromptResult {
  const positive = [
    `watercolor illustration of ${title}`,
    ingredients ? `featuring ${ingredients}` : '',
    'hand-painted, transparent washes, subtle pigment granulation',
    'soft edges, minimal ink linework, realistic proportions',
    'gentle cast shadow, clean white paper background',
    'fine art print, high detail, calm natural color palette',
    'studio scan look',
  ]
    .filter(Boolean)
    .join(', ');

  const negative = [
    'photorealistic, 3d render, CGI, plastic, glossy',
    'neon, oversaturated, high contrast, harsh shadows, HDR',
    'text, logo, watermark, signature',
    'blurry, low detail, messy background',
  ].join(', ');

  return { positive, negative };
}

function buildPencilPrompt(title: string, ingredients: string): PromptResult {
  const positive = [
    `colored pencil and watercolor wash illustration of ${title}`,
    ingredients ? `featuring ${ingredients}` : '',
    'fine pencil texture, soft watercolor shading',
    'clean white background, subtle shadow',
    'crisp edges, minimal palette',
    'product illustration style, high detail',
    'no background clutter',
  ]
    .filter(Boolean)
    .join(', ');

  const negative = [
    'photorealistic, 3d render, CGI, plastic, glossy',
    'neon, oversaturated, high contrast, harsh shadows, HDR',
    'text, logo, watermark, signature',
    'blurry, low detail, messy background',
  ].join(', ');

  return { positive, negative };
}

function buildPhotoPrompt(title: string, category?: string, ingredients?: string): PromptResult {
  // Determine plating style based on category
  const platingStyle = determinePlatingStyle(category);

  const positive = [
    `professional food photography of ${title}`,
    ingredients ? `featuring ${ingredients}` : '',
    platingStyle,
    'on white ceramic plate',
    'soft natural lighting, window light',
    'shallow depth of field, f/2.8, 50mm lens',
    'appetizing, fresh, vibrant colors',
    'food magazine quality, clean composition',
    '4K, high resolution',
  ]
    .filter(Boolean)
    .join(', ');

  const negative = [
    'illustration, drawing, painting, cartoon, sketch, watercolor',
    'artificial, fake, low quality, blurry',
    'text, logo, watermark',
    'hands, people, utensils in frame',
    'overexposed, underexposed, harsh shadows',
    'messy, cluttered, unappetizing',
  ].join(', ');

  return { positive, negative };
}

function determinePlatingStyle(category?: string): string {
  if (!category) return 'elegant plating, restaurant quality';

  const cat = category.toLowerCase();

  if (cat.includes('breakfast')) {
    return 'rustic breakfast plating, morning light';
  }
  if (cat.includes('dessert') || cat.includes('sweet')) {
    return 'elegant dessert plating, garnished';
  }
  if (cat.includes('salad')) {
    return 'fresh, colorful salad presentation';
  }
  if (cat.includes('keto') || cat.includes('low-carb') || cat.includes('healthy')) {
    return 'modern healthy plating, clean presentation';
  }
  if (cat.includes('soup') || cat.includes('stew')) {
    return 'rustic bowl presentation, steam rising';
  }
  if (cat.includes('appetizer') || cat.includes('snack')) {
    return 'stylish appetizer plating, shareable presentation';
  }

  return 'elegant plating, restaurant quality';
}
