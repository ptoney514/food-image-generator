export interface RecipeData {
    title: string;
    category?: string;
    ingredients: string[];
}

export interface PromptResult {
    positive: string;
    negative: string;
}

/**
 * Build optimized prompts for food photography
 */
export function buildPrompt(recipe: RecipeData): PromptResult {
    const { title, category, ingredients } = recipe;

    // Extract key visual elements from ingredients
    const visualIngredients = ingredients
        .slice(0, 3)  // Top 3 ingredients
        .join(', ');

    // Determine plating style from category
    const platingStyle = determinePlatingStyle(category);

    // Build positive prompt
    const positive = [
        'professional food photography,',
        `${title},`,
        visualIngredients ? `featuring ${visualIngredients},` : '',
        platingStyle,
        'overhead view, 45-degree angle,',
        'white ceramic plate,',
        'natural soft lighting, window light,',
        'shallow depth of field, f/2.8,',
        'appetizing, fresh, vibrant colors,',
        '4K, high resolution,',
        'food magazine quality,',
        'clean composition, minimalist',
    ].filter(Boolean).join(' ');

    // Build negative prompt
    const negative = [
        'blurry, out of focus,',
        'overexposed, underexposed,',
        'artificial lighting, harsh shadows,',
        'messy, cluttered,',
        'low quality, low resolution,',
        'watermark, text, logo,',
        'hands, people, utensils in frame,',
        'unappetizing, burnt, raw,',
        'plastic, fake, CGI',
    ].join(' ');

    return { positive, negative };
}

function determinePlatingStyle(category?: string): string {
    if (!category) return 'elegant plating,';

    const cat = category.toLowerCase();

    if (cat.includes('breakfast')) {
        return 'rustic breakfast plating, morning light,';
    }
    if (cat.includes('dessert')) {
        return 'elegant dessert plating, garnished,';
    }
    if (cat.includes('salad')) {
        return 'fresh, colorful salad presentation,';
    }
    if (cat.includes('keto') || cat.includes('low-carb')) {
        return 'modern healthy plating, clean presentation,';
    }

    return 'elegant plating, restaurant quality,';
}
