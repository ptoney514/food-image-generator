export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Food Image Generator API',
    description: 'Generate beautiful AI food images for recipe apps using Stability AI SD3.',
    version: '1.0.0',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'https://food-image-api.pernell.workers.dev',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Images', description: 'Image generation and management' },
    { name: 'Health', description: 'API health and status' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'food-image-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/images/generate': {
      post: {
        tags: ['Images'],
        summary: 'Generate a food image',
        description: 'Generate a new food image from recipe data using Stability AI SD3.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateImageRequest',
              },
              examples: {
                watercolor: {
                  summary: 'Watercolor style',
                  value: {
                    title: 'Grilled Salmon with Asparagus',
                    category: 'dinner',
                    ingredients: ['salmon', 'asparagus', 'lemon'],
                    style: 'watercolor',
                  },
                },
                photo: {
                  summary: 'Photo style',
                  value: {
                    title: 'Chocolate Lava Cake',
                    category: 'dessert',
                    ingredients: ['chocolate', 'butter', 'eggs'],
                    style: 'photo',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Image generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GeneratedImage',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/v1/images': {
      get: {
        tags: ['Images'],
        summary: 'List images',
        description: 'List all generated images for the authenticated household.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of images to return (max 100)',
            schema: { type: 'integer', default: 20, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of images to skip',
            schema: { type: 'integer', default: 0 },
          },
          {
            name: 'style',
            in: 'query',
            description: 'Filter by image style',
            schema: { type: 'string', enum: ['watercolor', 'pencil', 'photo'] },
          },
          {
            name: 'recipeId',
            in: 'query',
            description: 'Filter by recipe ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'List of images',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    images: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ImageSummary' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'integer' },
                        offset: { type: 'integer' },
                        hasMore: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/v1/images/{id}': {
      get: {
        tags: ['Images'],
        summary: 'Get image details',
        description: 'Get detailed metadata for a specific image.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Image ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Image details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ImageDetails' },
              },
            },
          },
          '404': {
            description: 'Image not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Images'],
        summary: 'Delete image',
        description: 'Delete an image from storage and database.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Image ID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Image deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    deletedId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Image not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token',
      },
    },
    schemas: {
      GenerateImageRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            description: 'Recipe title or food description',
            example: 'Grilled Salmon with Asparagus',
            maxLength: 200,
          },
          category: {
            type: 'string',
            description: 'Recipe category for plating style',
            example: 'dinner',
            maxLength: 100,
          },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of ingredients (top 3 used in prompt)',
            example: ['salmon', 'asparagus', 'lemon'],
            maxItems: 20,
          },
          style: {
            type: 'string',
            enum: ['watercolor', 'pencil', 'photo'],
            default: 'watercolor',
            description: 'Art style for the generated image',
          },
          recipeId: {
            type: 'string',
            format: 'uuid',
            description: 'Optional recipe ID to link the image',
          },
        },
      },
      GeneratedImage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          imageUrl: { type: 'string', format: 'uri' },
          style: { type: 'string', enum: ['watercolor', 'pencil', 'photo'] },
          prompt: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ImageSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          imageUrl: { type: 'string', format: 'uri' },
          style: { type: 'string', enum: ['watercolor', 'pencil', 'photo'] },
          sourceTitle: { type: 'string' },
          recipeId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ImageDetails: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          imageUrl: { type: 'string', format: 'uri' },
          style: { type: 'string', enum: ['watercolor', 'pencil', 'photo'] },
          prompt: { type: 'string' },
          negativePrompt: { type: 'string' },
          aspectRatio: { type: 'string' },
          sourceTitle: { type: 'string' },
          sourceCategory: { type: 'string', nullable: true },
          sourceIngredients: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
          recipeId: { type: 'string', format: 'uuid', nullable: true },
          fileSize: { type: 'integer' },
          contentType: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
  },
};

export function getSwaggerUIHTML(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Image API - Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${specUrl}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    });
  </script>
</body>
</html>`;
}
