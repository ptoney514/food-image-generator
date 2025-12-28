export function getLandingPageHTML(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Image Generator API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }
    header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 1.4rem;
    }
    h3 {
      color: #333;
      margin: 20px 0 10px;
      font-size: 1.1rem;
    }
    .endpoint {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #667eea;
    }
    .method {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-right: 10px;
    }
    .method.get { background: #28a745; color: white; }
    .method.post { background: #007bff; color: white; }
    .method.delete { background: #dc3545; color: white; }
    .path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.95rem;
    }
    .desc {
      color: #666;
      font-size: 0.9rem;
      margin-top: 5px;
    }
    pre {
      background: #1a1a2e;
      color: #eee;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    code {
      font-family: 'Monaco', 'Menlo', monospace;
    }
    .inline-code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .styles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .style-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .style-card h4 {
      color: #667eea;
      margin-bottom: 5px;
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      margin: 5px 5px 5px 0;
    }
    .links {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 20px;
    }
    .links a {
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      transition: background 0.2s;
    }
    .links a:hover {
      background: rgba(255,255,255,0.3);
    }
    footer {
      text-align: center;
      color: rgba(255,255,255,0.7);
      margin-top: 40px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🍽️ Food Image Generator API</h1>
      <p>Generate beautiful AI food images for your recipe apps</p>
      <div class="links">
        <a href="/docs">📖 API Documentation</a>
        <a href="/health">💚 Health Status</a>
      </div>
    </header>

    <div class="card">
      <h2>✨ Features</h2>
      <div class="badge">Stability AI SD3</div>
      <div class="badge">~5 sec generation</div>
      <div class="badge">3 art styles</div>
      <div class="badge">R2 storage</div>
      <div class="badge">JWT auth</div>

      <div class="styles">
        <div class="style-card">
          <h4>🎨 Watercolor</h4>
          <p>Artistic hand-painted style</p>
        </div>
        <div class="style-card">
          <h4>✏️ Pencil</h4>
          <p>Fine texture illustrations</p>
        </div>
        <div class="style-card">
          <h4>📷 Photo</h4>
          <p>Professional food photography</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>🔌 API Endpoints</h2>

      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/v1/images/generate</span>
        <p class="desc">Generate a new food image from recipe data</p>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/v1/images</span>
        <p class="desc">List all generated images for your household</p>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/v1/images/:id</span>
        <p class="desc">Get metadata for a specific image</p>
      </div>

      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/v1/images/:id</span>
        <p class="desc">Delete an image</p>
      </div>
    </div>

    <div class="card">
      <h2>🚀 Quick Start</h2>

      <h3>1. Authentication</h3>
      <p>Include your Supabase JWT token in the Authorization header:</p>
      <pre><code>Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN</code></pre>

      <h3>2. Generate an Image</h3>
      <pre><code>curl -X POST ${baseUrl}/v1/images/generate \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Grilled Salmon with Asparagus",
    "category": "dinner",
    "ingredients": ["salmon", "asparagus", "lemon"],
    "style": "watercolor"
  }'</code></pre>

      <h3>3. Response</h3>
      <pre><code>{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://pub-xxx.r2.dev/household-id/generated/image.png",
  "style": "watercolor",
  "prompt": "watercolor illustration of Grilled Salmon...",
  "createdAt": "2024-12-27T12:00:00Z"
}</code></pre>
    </div>

    <div class="card">
      <h2>📊 Rate Limits</h2>
      <p>To protect the service, rate limits are applied:</p>
      <ul style="margin-top: 10px; margin-left: 20px;">
        <li><strong>Image Generation:</strong> 10 requests per hour per user</li>
        <li><strong>Other Endpoints:</strong> 100 requests per minute</li>
      </ul>
      <p style="margin-top: 10px;">Rate limit headers are included in responses:</p>
      <pre><code>X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1703678400</code></pre>
    </div>

    <footer>
      <p>Food Image Generator API v1.0.0 • Powered by Stability AI & Cloudflare Workers</p>
    </footer>
  </div>
</body>
</html>`;
}
