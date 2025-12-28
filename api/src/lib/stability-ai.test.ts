import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImage, StabilityAIError } from './stability-ai';

describe('generateImage', () => {
  const mockApiKey = 'test-api-key';
  const mockPrompt = 'watercolor illustration of pizza';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should successfully generate an image', async () => {
    const mockBase64Image = btoa('fake-image-data');
    const mockJsonResponse = { image: mockBase64Image };
    const mockResponse = new Response(JSON.stringify(mockJsonResponse), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    const result = await generateImage(mockApiKey, { prompt: mockPrompt });

    expect(result.imageBuffer).toBeDefined();
    expect(result.contentType).toBe('image/png');
    expect(fetch).toHaveBeenCalledOnce();

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.stability.ai/v2beta/stable-image/generate/sd3');
    expect(fetchCall[1]?.method).toBe('POST');
    expect(fetchCall[1]?.headers).toEqual({
      Authorization: `Bearer ${mockApiKey}`,
      Accept: 'application/json',
    });
  });

  it('should include negative prompt in request', async () => {
    const mockBase64Image = btoa('fake-image-data');
    const mockJsonResponse = { image: mockBase64Image };
    const mockResponse = new Response(JSON.stringify(mockJsonResponse), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    await generateImage(mockApiKey, {
      prompt: mockPrompt,
      negativePrompt: 'blurry, low quality',
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = fetchCall[1]?.body as FormData;

    expect(body).toBeInstanceOf(FormData);
  });

  it('should set aspect ratio in request', async () => {
    const mockBase64Image = btoa('fake-image-data');
    const mockJsonResponse = { image: mockBase64Image };
    const mockResponse = new Response(JSON.stringify(mockJsonResponse), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    await generateImage(mockApiKey, {
      prompt: mockPrompt,
      aspectRatio: '16:9',
    });

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should return image/png content type', async () => {
    const mockBase64Image = btoa('fake-image-data');
    const mockJsonResponse = { image: mockBase64Image };
    const mockResponse = new Response(JSON.stringify(mockJsonResponse), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    const result = await generateImage(mockApiKey, { prompt: mockPrompt });

    expect(result.contentType).toBe('image/png');
  });

  describe('error handling', () => {
    it('should throw StabilityAIError for 401 unauthorized', async () => {
      const mockResponse = new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
        expect.fail('Expected StabilityAIError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).statusCode).toBe(401);
        expect((error as StabilityAIError).message).toBe('Invalid Stability AI API key');
      }
    });

    it('should throw StabilityAIError for 402 payment required', async () => {
      const mockResponse = new Response('Payment Required', {
        status: 402,
        statusText: 'Payment Required',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).statusCode).toBe(402);
        expect((error as StabilityAIError).message).toBe('Insufficient Stability AI credits');
      }
    });

    it('should throw StabilityAIError for 429 rate limit', async () => {
      const mockResponse = new Response('Rate Limited', {
        status: 429,
        statusText: 'Too Many Requests',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).statusCode).toBe(429);
        expect((error as StabilityAIError).message).toBe('Stability AI rate limit exceeded');
      }
    });

    it('should throw StabilityAIError for 400 bad request', async () => {
      const mockResponse = new Response('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).statusCode).toBe(400);
        expect((error as StabilityAIError).message).toBe('Invalid request to Stability AI');
      }
    });

    it('should throw StabilityAIError for other errors', async () => {
      const mockResponse = new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).statusCode).toBe(500);
        expect((error as StabilityAIError).message).toBe('Stability AI error (500)');
      }
    });

    it('should include error details in StabilityAIError', async () => {
      const errorDetails = JSON.stringify({ error: 'Detailed error message' });
      const mockResponse = new Response(errorDetails, {
        status: 400,
        statusText: 'Bad Request',
      });

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await generateImage(mockApiKey, { prompt: mockPrompt });
      } catch (error) {
        expect(error).toBeInstanceOf(StabilityAIError);
        expect((error as StabilityAIError).details).toBe(errorDetails);
      }
    });
  });
});

describe('StabilityAIError', () => {
  it('should create error with correct properties', () => {
    const error = new StabilityAIError('Test error', 400, 'Details');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.details).toBe('Details');
    expect(error.name).toBe('StabilityAIError');
  });

  it('should extend Error', () => {
    const error = new StabilityAIError('Test', 500);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StabilityAIError);
  });
});
