# Food Image Generator - Project Summary

## Overview

A tool for generating high-quality food illustrations and photography for recipe apps using Stability AI's API.

## Problem Solved

Needed to generate food images for an iOS recipe app. Initial approach using LocalAI (local SDXL) was too slow (30+ minutes per image due to model loading and timeouts). Switched to Stability AI cloud API for fast, affordable generation (~5 seconds, ~$0.03/image).

## Journey

### Attempt 1: LocalAI (Local Generation)
- Installed LocalAI with SDXL-turbo model on M4 Mac
- Issues encountered:
  - Path spaces broke the build ("My Projects")
  - Model downloads took very long
  - GRPC timeouts on generation
  - 30+ minutes per image
- **Result:** Not viable for practical use

### Attempt 2: Stability AI (Cloud API)
- Fast generation (~5 seconds)
- Consistent quality
- Affordable (~$0.03/image)
- **Result:** Excellent solution

## Styles Developed

### 1. Watercolor (Default)
Artistic, hand-painted illustration style with soft washes and white background.

```
watercolor illustration of [SUBJECT], hand-painted, transparent washes,
subtle pigment granulation, soft edges, minimal ink linework, realistic
proportions, gentle cast shadow, clean white paper background, fine art
print, high detail, calm natural color palette, studio scan look
```

### 2. Colored Pencil
Fine texture with crisp edges, product illustration feel.

```
colored pencil and watercolor wash illustration of [SUBJECT], fine pencil
texture, soft watercolor shading, clean white background, subtle shadow,
crisp edges, minimal palette, product illustration style, high detail,
no background clutter
```

### 3. Photorealistic
Professional food photography style.

```
professional food photography of [SUBJECT], on white ceramic plate, soft
natural lighting, shallow depth of field, 50mm lens, appetizing, restaurant
quality, high detail, clean composition, food magazine style
```

## Usage

```bash
# Set API key
export STABILITY_API_KEY="your-key-here"

# Generate images
./generate-stability.sh "cheeseburger with fries"                    # watercolor
STYLE=pencil ./generate-stability.sh "pepperoni pizza"               # pencil
STYLE=photo ./generate-stability.sh "grilled salmon"                 # photo
```

## Files

```
food-image-generator/
├── generate-stability.sh    # Main generation script (Stability AI)
├── .env                     # API key (git-ignored)
├── .gitignore               # Git ignore rules
├── README-STABILITY.md      # Stability AI usage guide
├── PROJECT-SUMMARY.md       # This file
├── generated-images/        # Output directory
│   ├── burger-stability.png
│   ├── burger-watercolor.png
│   ├── burger-photo.png
│   ├── pizza-pencil.png
│   ├── chicken-salad.png
│   └── ...
│
├── # Legacy LocalAI files (for reference)
├── setup-localai.sh         # LocalAI installation script
├── start-localai.sh         # LocalAI startup script
├── test-localai.sh          # LocalAI test script
├── generate-food-image.sh   # LocalAI generation script
├── localai-config/          # LocalAI model configs
├── worker/                  # Node.js worker (for queue-based generation)
├── QUICKSTART.md            # LocalAI quickstart guide
└── README.md                # Original LocalAI readme
```

## Cost Analysis

| Quantity | Cost |
|----------|------|
| 1 image | ~$0.03 |
| 100 images | ~$3 |
| 1,000 images | ~$30 |

## Future Integration Options

### iOS App Integration
```
iOS App → Backend API → Stability AI → Store image URL in database
```

### MCP Server
Could build an MCP server exposing:
- `generate_food_image(subject, style)`
- `batch_generate(recipes[])`

## Key Learnings

1. **Local AI generation** on Mac has challenges with model loading times and timeouts
2. **Cloud APIs** are much more practical for on-demand generation
3. **Prompt engineering** matters - "food photography language" produces better results
4. **Illustration styles** (watercolor, pencil) often look more premium than photorealistic for apps
5. **Negative prompts** are essential for consistent style

## Test Results

All styles tested with various foods:
- Cheeseburger with fries
- Pepperoni pizza
- Crunchy poppy seed chicken salad
- Various other dishes

Quality is consistent and suitable for production use in recipe apps.
