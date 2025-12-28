# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Image Generation**: Stability AI SD3 API (primary), LocalAI with SDXL (legacy)
- **Worker Runtime**: Node.js + TypeScript
- **Job Queue**: BullMQ + Redis (for LocalAI worker)
- **Image Processing**: Sharp (resize, compress to WebP/JPEG/PNG)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Database**: PostgreSQL (Supabase-hosted, via raw SQL)
- **API** (planned): Hono on Cloudflare Workers
- **Testing**: Vitest

## Code Patterns

**Directory Structure**
- Shell scripts at root level for CLI usage
- `worker/src/` for Node.js worker service
- `localai-config/` for LocalAI model YAML configs

**Prompt Engineering**
- Three styles: `watercolor`, `pencil`, `photo`
- All prompts include negative prompts to avoid artifacts
- Style-specific prompt templates in `generate-stability.sh` and `worker/src/prompt-builder.ts`

**R2 Storage Pattern**
- Path: `recipes/{recipeId}/hero.{format}`
- Public URL: `{R2_PUBLIC_URL}/recipes/{recipeId}/hero.{format}`
- Cache: `public, max-age=31536000, immutable` (1 year)

## Development Commands

### Stability AI Generation (Primary)
```bash
export STABILITY_API_KEY="your-key"
./generate-stability.sh "cheeseburger with fries"           # watercolor (default)
STYLE=pencil ./generate-stability.sh "pepperoni pizza"      # pencil style
STYLE=photo ./generate-stability.sh "grilled salmon"        # photorealistic
```

### Worker Service (LocalAI)
```bash
cd worker
npm install
npm run dev          # Start worker with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled worker
npm test             # Run tests
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Architecture

**Two generation approaches:**

| Approach | Speed | Cost | Use Case |
|----------|-------|------|----------|
| Stability AI | ~5 sec | ~$0.03/image | Production, on-demand |
| LocalAI | ~30+ min | Free | Self-hosted, batch processing |

**Worker Pipeline (LocalAI):**
```
Redis Queue → worker.ts → LocalAI → Sharp → R2 → PostgreSQL
```

1. `prompt-builder.ts` - Recipe data → optimized prompt
2. `image-generator.ts` - Calls LocalAI (OpenAI-compatible)
3. `image-processor.ts` - Resize/compress with Sharp
4. `r2-uploader.ts` - Upload to Cloudflare R2
5. `database.ts` - Update `recipes.hero_image_url`

## Environment Variables

**Stability AI:**
- `STABILITY_API_KEY` - API key from platform.stability.ai

**Worker (LocalAI):**
- `LOCALAI_BASE_URL`, `LOCALAI_MODEL` - LocalAI connection
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis for BullMQ
- `DATABASE_URL` - PostgreSQL connection string
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

## Don't

- Don't commit `.env` files or API keys
- Don't use LocalAI for on-demand generation (too slow, use Stability AI)
- Don't skip negative prompts - they're essential for consistent style
- Don't hardcode R2 bucket paths - use environment variables
- Don't forget to set `STABILITY_API_KEY` before running shell scripts

## Current Focus

See [project_status.md](project_status.md) for current work and next steps.
