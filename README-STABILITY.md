# Food Image Generator - Stability AI

Generate beautiful watercolor and pencil-style food illustrations for recipe apps using Stability AI's API.

## Quick Start

```bash
# Set your API key
export STABILITY_API_KEY="your-key-here"

# Generate a watercolor food image
./generate-stability.sh "grilled salmon with asparagus"

# Generate pencil style
STYLE=pencil ./generate-stability.sh "pepperoni pizza"
```

## Setup

### 1. Get a Stability AI API Key
1. Go to [platform.stability.ai](https://platform.stability.ai)
2. Create an account (includes free credits)
3. Generate an API key from your account settings

### 2. Configure
Add your key to `.env`:
```bash
STABILITY_API_KEY=sk-your-key-here
```

Or export it in your shell:
```bash
export STABILITY_API_KEY="sk-your-key-here"
```

## Usage

### Basic Usage
```bash
./generate-stability.sh "food description" [output-filename.png]
```

### Examples
```bash
# Simple
./generate-stability.sh "cheeseburger with fries"

# With custom filename
./generate-stability.sh "chocolate cake with raspberries" dessert.png

# Pencil style
STYLE=pencil ./generate-stability.sh "caesar salad"
```

### Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `watercolor` (default) | Soft, painterly washes, artistic feel | Warm, inviting food imagery |
| `pencil` | Fine texture, crisp edges, product illustration | Detailed, professional look |

## Prompt Templates

### Watercolor Style
```
watercolor illustration of [SUBJECT], hand-painted, transparent washes,
subtle pigment granulation, soft edges, minimal ink linework, realistic
proportions, gentle cast shadow, clean white paper background, fine art
print, high detail, calm natural color palette, studio scan look
```

### Colored Pencil Style
```
colored pencil and watercolor wash illustration of [SUBJECT], fine pencil
texture, soft watercolor shading, clean white background, subtle shadow,
crisp edges, minimal palette, product illustration style, high detail,
no background clutter
```

### Negative Prompt (both styles)
```
photorealistic, 3d render, CGI, plastic, glossy, neon, oversaturated,
high contrast, harsh shadows, HDR, text, logo, watermark, signature,
blurry, low detail, messy background
```

## Batch Generation

Create a `recipes.txt` file:
```
cheeseburger with sesame bun and golden fries
pepperoni pizza with melted mozzarella
grilled salmon with asparagus and lemon
chicken caesar salad with parmesan
chocolate lava cake with vanilla ice cream
```

Then batch generate:
```bash
#!/bin/bash
export STABILITY_API_KEY="your-key"
while IFS= read -r recipe; do
  filename=$(echo "$recipe" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').png
  ./generate-stability.sh "$recipe" "$filename"
  sleep 1  # Rate limiting
done < recipes.txt
```

## Cost

- **SD3 Model**: ~$0.03-0.04 per image
- **100 images**: ~$3-4
- **1000 images**: ~$30-40

## API Reference

The script uses Stability AI's SD3 endpoint:
```
POST https://api.stability.ai/v2beta/stable-image/generate/sd3
```

### Parameters Used
- `prompt`: The full styled prompt
- `negative_prompt`: Things to avoid
- `output_format`: png
- `aspect_ratio`: 1:1

## Integration Options

### Option 1: Backend API (Recommended for iOS)
Create a server endpoint that wraps the Stability AI call:

```
iOS App → Your Backend API → Stability AI
```

Benefits:
- API key stays secure on server
- Can add caching, rate limiting
- Can store images in your database/CDN

### Option 2: Serverless Function
Use AWS Lambda, Cloudflare Workers, or Vercel Edge Functions:

```typescript
// Example: Cloudflare Worker
export default {
  async fetch(request, env) {
    const { subject, style } = await request.json();

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.STABILITY_API_KEY}`,
          "Accept": "image/*",
        },
        body: formData,
      }
    );

    // Return image or upload to R2/S3
  }
};
```

### Option 3: MCP Server
Build an MCP server for Claude Code integration - see MCP section below.

## Troubleshooting

### "Invalid API key"
- Check your key is correct
- Ensure no extra spaces or quotes
- Verify key is active at platform.stability.ai

### "Insufficient credits"
- Add credits at platform.stability.ai/account/credits

### Image looks wrong
- Try adjusting the subject description
- Be specific about ingredients and presentation
- Add details like "on white plate" or "overhead view"

## Files

```
food-image-generator/
├── generate-stability.sh   # Main generation script
├── .env                    # API key (git-ignored)
├── generated-images/       # Output directory
└── README-STABILITY.md     # This guide
```
