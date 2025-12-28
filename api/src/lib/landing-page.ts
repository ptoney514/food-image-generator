export function getLandingPageHTML(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Food Image Generator API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-cream: #FDF8F3;
      --color-warm-white: #FFFBF7;
      --color-burgundy: #722F37;
      --color-burgundy-light: #8B3D47;
      --color-burgundy-dark: #5A252C;
      --color-gold: #C9A962;
      --color-gold-light: #E8D5A3;
      --color-charcoal: #2D2A26;
      --color-stone: #847769;
      --color-stone-light: #B8AFA6;
      --color-sage: #7A8B6E;
      --color-terracotta: #C4684A;
      --font-display: 'Fraunces', Georgia, serif;
      --font-body: 'DM Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', 'Monaco', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(2deg); }
    }

    body {
      font-family: var(--font-body);
      line-height: 1.7;
      color: var(--color-charcoal);
      background: var(--color-cream);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Subtle grain texture overlay */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      z-index: 1000;
    }

    .hero {
      background: linear-gradient(165deg, var(--color-burgundy) 0%, var(--color-burgundy-dark) 100%);
      padding: 80px 24px 100px;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(201, 169, 98, 0.15) 0%, transparent 70%);
      animation: float 15s ease-in-out infinite;
    }

    .hero::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
      animation: float 20s ease-in-out infinite reverse;
    }

    .hero-content {
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      animation: fadeUp 0.8s ease-out;
    }

    .hero-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-gold);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hero-eyebrow::before {
      content: '';
      width: 40px;
      height: 1px;
      background: var(--color-gold);
    }

    .hero h1 {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 600;
      color: var(--color-warm-white);
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }

    .hero h1 span {
      color: var(--color-gold);
      font-style: italic;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      color: rgba(255, 255, 255, 0.8);
      max-width: 500px;
      margin-bottom: 36px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 28px;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--color-gold);
      color: var(--color-charcoal);
    }

    .btn-primary:hover {
      background: var(--color-gold-light);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-warm-white);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .section {
      padding: 80px 0;
    }

    .section-header {
      margin-bottom: 48px;
      animation: fadeUp 0.6s ease-out;
    }

    .section-label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--color-burgundy);
      margin-bottom: 8px;
    }

    .section-title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-charcoal);
      letter-spacing: -0.01em;
    }

    /* Features Section */
    .features-section {
      background: var(--color-warm-white);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .feature-card {
      padding: 32px;
      background: var(--color-cream);
      border-radius: 16px;
      border: 1px solid rgba(132, 119, 105, 0.1);
      transition: all 0.4s ease;
      animation: fadeUp 0.6s ease-out backwards;
    }

    .feature-card:nth-child(1) { animation-delay: 0.1s; }
    .feature-card:nth-child(2) { animation-delay: 0.2s; }
    .feature-card:nth-child(3) { animation-delay: 0.3s; }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(45, 42, 38, 0.08);
      border-color: var(--color-gold-light);
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .feature-icon.watercolor {
      background: linear-gradient(135deg, #E8D5D1 0%, #F5EDE9 100%);
    }

    .feature-icon.pencil {
      background: linear-gradient(135deg, #E5E5E5 0%, #F5F5F5 100%);
    }

    .feature-icon.photo {
      background: linear-gradient(135deg, #D4DDD0 0%, #EBF0E8 100%);
    }

    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-charcoal);
      margin-bottom: 8px;
    }

    .feature-card p {
      color: var(--color-stone);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
      padding: 40px 24px;
      background: var(--color-charcoal);
    }

    .stat {
      text-align: center;
      animation: fadeIn 0.8s ease-out backwards;
    }

    .stat:nth-child(1) { animation-delay: 0.1s; }
    .stat:nth-child(2) { animation-delay: 0.2s; }
    .stat:nth-child(3) { animation-delay: 0.3s; }
    .stat:nth-child(4) { animation-delay: 0.4s; }

    .stat-value {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-gold);
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--color-stone-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Endpoints Section */
    .endpoints-section {
      background: var(--color-cream);
    }

    .endpoint {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 24px 0;
      border-bottom: 1px solid rgba(132, 119, 105, 0.12);
      animation: fadeUp 0.5s ease-out backwards;
    }

    .endpoint:last-child {
      border-bottom: none;
    }

    .endpoint:nth-child(1) { animation-delay: 0.1s; }
    .endpoint:nth-child(2) { animation-delay: 0.15s; }
    .endpoint:nth-child(3) { animation-delay: 0.2s; }
    .endpoint:nth-child(4) { animation-delay: 0.25s; }

    .method {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      min-width: 60px;
      text-align: center;
      text-transform: uppercase;
    }

    .method.get {
      background: rgba(122, 139, 110, 0.15);
      color: var(--color-sage);
    }

    .method.post {
      background: rgba(114, 47, 55, 0.12);
      color: var(--color-burgundy);
    }

    .method.delete {
      background: rgba(196, 104, 74, 0.12);
      color: var(--color-terracotta);
    }

    .endpoint-details {
      flex: 1;
    }

    .endpoint-path {
      font-family: var(--font-mono);
      font-size: 0.95rem;
      color: var(--color-charcoal);
      margin-bottom: 4px;
    }

    .endpoint-desc {
      font-size: 0.9rem;
      color: var(--color-stone);
    }

    /* Code Section */
    .code-section {
      background: var(--color-warm-white);
    }

    .code-block {
      position: relative;
      margin: 24px 0;
      animation: fadeUp 0.6s ease-out backwards;
    }

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--color-charcoal);
      border-radius: 12px 12px 0 0;
    }

    .code-title {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-stone-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .code-dots {
      display: flex;
      gap: 6px;
    }

    .code-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .code-dot:nth-child(1) { background: #FF5F56; }
    .code-dot:nth-child(2) { background: #FFBD2E; }
    .code-dot:nth-child(3) { background: #27CA40; }

    pre {
      background: #1C1B1A;
      padding: 24px;
      border-radius: 0 0 12px 12px;
      overflow-x: auto;
      margin: 0;
    }

    code {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.7;
      color: #E8E4DF;
    }

    .code-comment { color: #6B6660; }
    .code-string { color: #C9A962; }
    .code-key { color: #9FAFB5; }
    .code-url { color: #B8AFA6; }

    .step-label {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-charcoal);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .step-number {
      width: 28px;
      height: 28px;
      background: var(--color-burgundy);
      color: var(--color-warm-white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .step-desc {
      color: var(--color-stone);
      font-size: 0.95rem;
      margin-bottom: 16px;
    }

    /* Rate Limits Section */
    .limits-section {
      background: var(--color-cream);
    }

    .limits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .limit-card {
      padding: 32px;
      background: var(--color-warm-white);
      border-radius: 16px;
      border: 1px solid rgba(132, 119, 105, 0.1);
      animation: fadeUp 0.6s ease-out backwards;
    }

    .limit-card:nth-child(1) { animation-delay: 0.1s; }
    .limit-card:nth-child(2) { animation-delay: 0.2s; }

    .limit-card h3 {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-charcoal);
      margin-bottom: 8px;
    }

    .limit-value {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-burgundy);
      margin-bottom: 4px;
    }

    .limit-unit {
      font-size: 0.9rem;
      color: var(--color-stone);
    }

    .limit-card p {
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--color-stone);
    }

    /* Footer */
    footer {
      background: var(--color-charcoal);
      padding: 48px 24px;
      text-align: center;
    }

    .footer-brand {
      font-family: var(--font-display);
      font-size: 1.25rem;
      color: var(--color-warm-white);
      margin-bottom: 12px;
    }

    .footer-powered {
      font-size: 0.85rem;
      color: var(--color-stone-light);
      margin-bottom: 24px;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .footer-link {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-gold);
      text-decoration: none;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: color 0.3s ease;
    }

    .footer-link:hover {
      color: var(--color-gold-light);
    }

    @media (max-width: 640px) {
      .hero { padding: 60px 20px 80px; }
      .hero h1 { font-size: 2rem; }
      .hero-actions { flex-direction: column; }
      .btn { width: 100%; justify-content: center; }
      .section { padding: 60px 0; }
      .stats-bar { gap: 32px; }
      .endpoint { flex-direction: column; gap: 12px; }
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <div class="hero-eyebrow">REST API v1.0</div>
      <h1>Food Image<br/>Generator <span>API</span></h1>
      <p class="hero-subtitle">Transform recipe descriptions into stunning AI-generated food imagery. Three distinct artistic styles, lightning-fast generation.</p>
      <div class="hero-actions">
        <a href="/docs" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
            <path d="M10 9H8"/>
          </svg>
          API Documentation
        </a>
        <a href="/health" class="btn btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Health Status
        </a>
      </div>
    </div>
  </section>

  <div class="stats-bar">
    <div class="stat">
      <div class="stat-value">~5s</div>
      <div class="stat-label">Generation</div>
    </div>
    <div class="stat">
      <div class="stat-value">SD3</div>
      <div class="stat-label">Stability AI</div>
    </div>
    <div class="stat">
      <div class="stat-value">3</div>
      <div class="stat-label">Art Styles</div>
    </div>
    <div class="stat">
      <div class="stat-value">R2</div>
      <div class="stat-label">Edge Storage</div>
    </div>
  </div>

  <section class="section features-section">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Artistic Styles</div>
        <h2 class="section-title">Three Distinct Aesthetics</h2>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon watercolor">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#722F37" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
            </svg>
          </div>
          <h3>Watercolor</h3>
          <p>Soft, flowing brushstrokes with delicate color washes. Perfect for cookbooks, editorial content, and artisanal branding.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon pencil">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5A5A5A" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </div>
          <h3>Pencil</h3>
          <p>Fine cross-hatching and detailed linework. Ideal for recipe cards, instructional content, and minimalist design.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon photo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A8B6E" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <h3>Photo-Realistic</h3>
          <p>Professional food photography aesthetics. Studio lighting, shallow depth of field, magazine-ready compositions.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section endpoints-section">
    <div class="container">
      <div class="section-header">
        <div class="section-label">REST Endpoints</div>
        <h2 class="section-title">API Reference</h2>
      </div>
      <div class="endpoints-list">
        <div class="endpoint">
          <span class="method post">POST</span>
          <div class="endpoint-details">
            <div class="endpoint-path">/v1/images/generate</div>
            <div class="endpoint-desc">Generate a new food image from recipe metadata</div>
          </div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <div class="endpoint-details">
            <div class="endpoint-path">/v1/images</div>
            <div class="endpoint-desc">List all generated images for your household</div>
          </div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <div class="endpoint-details">
            <div class="endpoint-path">/v1/images/:id</div>
            <div class="endpoint-desc">Retrieve metadata for a specific image</div>
          </div>
        </div>
        <div class="endpoint">
          <span class="method delete">DELETE</span>
          <div class="endpoint-details">
            <div class="endpoint-path">/v1/images/:id</div>
            <div class="endpoint-desc">Remove an image from storage</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section code-section">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Getting Started</div>
        <h2 class="section-title">Quick Start Guide</h2>
      </div>

      <div class="step-label">
        <span class="step-number">1</span>
        Authentication
      </div>
      <p class="step-desc">Include your Supabase JWT token in the Authorization header</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-title">Header</span>
          <div class="code-dots">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
          </div>
        </div>
        <pre><code>Authorization: Bearer <span class="code-string">YOUR_SUPABASE_JWT_TOKEN</span></code></pre>
      </div>

      <div class="step-label" style="margin-top: 40px;">
        <span class="step-number">2</span>
        Generate an Image
      </div>
      <p class="step-desc">Send recipe data to create a beautiful food image</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-title">Request</span>
          <div class="code-dots">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
          </div>
        </div>
        <pre><code><span class="code-comment"># Generate a watercolor-style food image</span>
curl -X POST <span class="code-url">${baseUrl}/v1/images/generate</span> \\
  -H <span class="code-string">"Authorization: Bearer YOUR_TOKEN"</span> \\
  -H <span class="code-string">"Content-Type: application/json"</span> \\
  -d '{
    <span class="code-key">"title"</span>: <span class="code-string">"Grilled Salmon with Asparagus"</span>,
    <span class="code-key">"category"</span>: <span class="code-string">"dinner"</span>,
    <span class="code-key">"ingredients"</span>: [<span class="code-string">"salmon"</span>, <span class="code-string">"asparagus"</span>, <span class="code-string">"lemon"</span>],
    <span class="code-key">"style"</span>: <span class="code-string">"watercolor"</span>
  }'</code></pre>
      </div>

      <div class="step-label" style="margin-top: 40px;">
        <span class="step-number">3</span>
        Response
      </div>
      <p class="step-desc">Receive the generated image URL and metadata</p>
      <div class="code-block">
        <div class="code-header">
          <span class="code-title">JSON Response</span>
          <div class="code-dots">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
          </div>
        </div>
        <pre><code>{
  <span class="code-key">"id"</span>: <span class="code-string">"550e8400-e29b-41d4-a716-446655440000"</span>,
  <span class="code-key">"imageUrl"</span>: <span class="code-string">"https://pub-xxx.r2.dev/household-id/generated/image.png"</span>,
  <span class="code-key">"style"</span>: <span class="code-string">"watercolor"</span>,
  <span class="code-key">"prompt"</span>: <span class="code-string">"watercolor illustration of Grilled Salmon..."</span>,
  <span class="code-key">"createdAt"</span>: <span class="code-string">"2024-12-27T12:00:00Z"</span>
}</code></pre>
      </div>
    </div>
  </section>

  <section class="section limits-section">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Usage Limits</div>
        <h2 class="section-title">Rate Limiting</h2>
      </div>
      <div class="limits-grid">
        <div class="limit-card">
          <h3>Image Generation</h3>
          <div class="limit-value">10</div>
          <div class="limit-unit">requests per hour</div>
          <p>Per user limit on image generation to manage API costs</p>
        </div>
        <div class="limit-card">
          <h3>Read Operations</h3>
          <div class="limit-value">100</div>
          <div class="limit-unit">requests per minute</div>
          <p>Standard rate limit for listing and retrieving images</p>
        </div>
      </div>
      <div class="code-block" style="margin-top: 32px;">
        <div class="code-header">
          <span class="code-title">Response Headers</span>
          <div class="code-dots">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
          </div>
        </div>
        <pre><code><span class="code-key">X-RateLimit-Limit</span>: 10
<span class="code-key">X-RateLimit-Remaining</span>: 9
<span class="code-key">X-RateLimit-Reset</span>: 1703678400</code></pre>
      </div>
    </div>
  </section>

  <footer>
    <div class="footer-brand">Food Image Generator API</div>
    <p class="footer-powered">Powered by Stability AI SD3 & Cloudflare Workers</p>
    <div class="footer-links">
      <a href="/docs" class="footer-link">Documentation</a>
      <a href="/openapi.json" class="footer-link">OpenAPI Spec</a>
      <a href="/health" class="footer-link">Status</a>
    </div>
  </footer>
</body>
</html>`;
}
