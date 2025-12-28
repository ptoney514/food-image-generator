# Food Image Generator - Project Status

## Tracking

**GitHub Repo**: [ptoney514/food-image-generator](https://github.com/ptoney514/food-image-generator)

> This file is a high-level overview. For detailed task tracking, see GitHub Issues.

---

## Current Phase

Building a **Hono API on Cloudflare Workers** to expose food image generation to multiple clients (recipe website, iOS app).

---

## Status Overview

### Complete

- Stability AI integration (~5 sec, ~$0.03/image)
- Three image styles: watercolor, pencil, photorealistic
- Prompt engineering with negative prompts
- LocalAI worker with BullMQ queue (legacy approach)
- R2 upload patterns established
- Sharp image processing (resize, compress)

### In Progress

| Feature | Status |
|---------|--------|
| Hono API for multi-client access | Planning |

### Up Next

- Create Hono API structure with routes:
  - `POST /images/generate` - Generate image from recipe data
  - `GET /images/:id` - Get image metadata
  - `GET /images` - List user's images
  - `DELETE /images/:id` - Remove image
- Add Drizzle ORM schema for images table
- Integrate Supabase Auth middleware
- Deploy to Cloudflare Workers
- Connect to existing PairDish infrastructure

---

## Architecture Target

```
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE AUTH                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        ┌─────────────┐                 ┌─────────────────┐
        │   Recipe    │                 │    iOS Mobile   │
        │   Website   │                 │       App       │
        └─────────────┘                 └─────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
        ┌─────────────────────────────────────────────────┐
        │      FOOD IMAGE GENERATOR API                   │
        │      (Hono on Cloudflare Workers)               │
        │                                                 │
        │  POST /images/generate  →  Stability AI         │
        │  GET  /images/:id       →  Get metadata         │
        │  GET  /images           →  List images          │
        └─────────────────────────────────────────────────┘
                │               │               │
                ▼               ▼               ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │ STABILITY AI  │  │ CLOUDFLARE R2 │  │   SUPABASE    │
    │  (Generate)   │  │   (Storage)   │  │   POSTGRES    │
    └───────────────┘  └───────────────┘  └───────────────┘
```

---

## Development Workflow

### Quick Commands

```bash
# Generate test image
./generate-stability.sh "test food"

# Run worker (LocalAI approach)
cd worker && npm run dev

# Run tests
cd worker && npm test
```

### Branch Naming

```
feat/{description}     # New features
fix/{description}      # Bug fixes
chore/{description}    # Maintenance
```

---

*Last updated: 2024-12-27*
