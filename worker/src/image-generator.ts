import OpenAI from 'openai';
import { config } from './config.js';

const openai = new OpenAI({
    baseURL: config.localai.baseUrl,
    apiKey: config.localai.apiKey,
});

export interface GenerateImageOptions {
    prompt: string;
    negativePrompt?: string;
    size?: '256x256' | '512x512' | '1024x1024';
    steps?: number;
}

/**
 * Generate image using LocalAI (OpenAI-compatible API)
 */
export async function generateImage(
    options: GenerateImageOptions
): Promise<Buffer> {
    const { prompt, negativePrompt, size = '1024x1024', steps = 4 } = options;

    // Combine positive and negative prompts (LocalAI format)
    const fullPrompt = negativePrompt
        ? `${prompt}|${negativePrompt}`
        : prompt;

    console.log('Generating image with prompt:', fullPrompt);

    try {
        const response = await openai.images.generate({
            model: config.localai.model,
            prompt: fullPrompt,
            size,
            n: 1,
            response_format: 'b64_json',
            // @ts-ignore - LocalAI supports additional parameters
            step: steps,
        });

        const b64Image = response.data[0].b64_json;
        if (!b64Image) {
            throw new Error('No image data returned from LocalAI');
        }

        // Decode base64 to buffer
        return Buffer.from(b64Image, 'base64');
    } catch (error) {
        console.error('Image generation failed:', error);
        throw new Error(`Failed to generate image: ${error}`);
    }
}
