const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface GenerateImageResult {
  imageBuffer: ArrayBuffer;
  contentType: string;
}

export class StabilityAIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'StabilityAIError';
  }
}

/**
 * Generate an image using Stability AI SD3 API
 */
export async function generateImage(
  apiKey: string,
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { prompt, negativePrompt, aspectRatio = '1:1' } = options;

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');
  formData.append('aspect_ratio', aspectRatio);

  if (negativePrompt) {
    formData.append('negative_prompt', negativePrompt);
  }

  const response = await fetch(STABILITY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Stability AI API error`;

    switch (response.status) {
      case 401:
        errorMessage = 'Invalid Stability AI API key';
        break;
      case 402:
        errorMessage = 'Insufficient Stability AI credits';
        break;
      case 429:
        errorMessage = 'Stability AI rate limit exceeded';
        break;
      case 400:
        errorMessage = 'Invalid request to Stability AI';
        break;
      default:
        errorMessage = `Stability AI error (${response.status})`;
    }

    throw new StabilityAIError(errorMessage, response.status, errorText);
  }

  const imageBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/png';

  return {
    imageBuffer,
    contentType,
  };
}
