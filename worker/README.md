# Food Image Worker

Worker service for generating food images using LocalAI and Stable Diffusion.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual credentials:

```bash
# LocalAI - should be running on your M4 Mac mini
LOCALAI_BASE_URL=http://localhost:8080/v1
LOCALAI_MODEL=sdxl-food

# Redis - for job queue
REDIS_HOST=localhost
REDIS_PORT=6379

# Database - your recipe database
DATABASE_URL=postgresql://user:password@host:5432/recipes

# R2 - Cloudflare R2 storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=recipe-images
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### 3. Start Worker

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Architecture

The worker processes jobs from a Redis queue using BullMQ:

```
Job Queue → Worker → LocalAI → Image Processing → R2 Upload → Database Update
```

### Job Flow

1. **Receive Job** - Worker picks up `GenerateRecipeImage` job from queue
2. **Build Prompt** - Creates optimized food photography prompt from recipe data
3. **Generate Image** - Calls LocalAI API to generate 1024×1024 image
4. **Process Image** - Resizes and compresses to WebP format
5. **Upload to R2** - Stores image in Cloudflare R2
6. **Update Database** - Updates recipe with image URL

## Job Data Format

Jobs should be enqueued with the following data:

```typescript
{
  recipeId: string;      // Unique recipe ID
  title: string;         // Recipe title (e.g., "Cheddar and Herb Chaffle")
  category?: string;     // Category (e.g., "keto/breakfast/waffle")
  ingredients: string[]; // List of ingredient names
}
```

## Enqueuing Jobs

From your backend, enqueue jobs like this:

```typescript
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
});

const imageQueue = new Queue('GenerateRecipeImage', { connection });

// After creating a recipe
await imageQueue.add('generate', {
  recipeId: recipe.id,
  title: recipe.title,
  category: recipe.category,
  ingredients: recipe.ingredients.map(i => i.name),
});
```

## Monitoring

### View Logs

```bash
# Development
npm run dev

# Production (if using PM2)
pm2 logs food-image-worker
```

### Check Job Status

```bash
# Connect to Redis
redis-cli

# List completed jobs
LRANGE bull:GenerateRecipeImage:completed 0 -1

# List failed jobs
LRANGE bull:GenerateRecipeImage:failed 0 -1

# Get job details
HGETALL bull:GenerateRecipeImage:JOB_ID
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Troubleshooting

### Worker can't connect to LocalAI

```bash
# Check if LocalAI is running
curl http://localhost:8080/v1/models

# If not, start it
cd ~/LocalAI
./local-ai --models-path=./models --address=:8080
```

### Worker can't connect to Redis

```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
```

### R2 upload fails

```bash
# Verify R2 credentials
# Test with AWS CLI
aws s3 ls --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com
```

### Database connection fails

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

## Performance

Expected performance on M4 Mac mini:

| Step | Time | Notes |
|------|------|-------|
| Prompt building | < 1ms | Very fast |
| Image generation | 10-20s | Using SDXL-turbo |
| Image processing | < 1s | Sharp is optimized |
| R2 upload | 1-3s | Depends on internet |
| Database update | < 100ms | Simple UPDATE query |
| **Total** | **15-30s** | End-to-end |

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build project
npm run build

# Start with PM2
pm2 start dist/worker.js --name food-image-worker

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/food-image-worker.service`:

```ini
[Unit]
Description=Food Image Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/worker
ExecStart=/usr/bin/node dist/worker.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable food-image-worker
sudo systemctl start food-image-worker
```

## License

MIT
