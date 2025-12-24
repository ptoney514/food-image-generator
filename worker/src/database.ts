import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const pool = new Pool({
    connectionString: config.database.url,
});

/**
 * Update recipe with generated image URL
 */
export async function updateRecipeImage(
    recipeId: string,
    imageUrl: string
): Promise<void> {
    console.log(`Updating recipe ${recipeId} with image URL`);

    await pool.query(
        'UPDATE recipes SET hero_image_url = $1, updated_at = NOW() WHERE id = $2',
        [imageUrl, recipeId]
    );

    console.log(`Recipe ${recipeId} updated successfully`);
}

export async function closeDatabase(): Promise<void> {
    await pool.end();
}
