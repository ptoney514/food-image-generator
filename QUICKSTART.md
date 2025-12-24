# Quick Start Guide - Food Image Generator

Get your food image generation system up and running in 30 minutes!

## Prerequisites

- M4 Mac mini (or any Apple Silicon Mac)
- macOS 13.0 or later
- At least 20GB free disk space
- Internet connection (for downloading models)

## Step 1: Install LocalAI (15 minutes)

```bash
cd /Users/pernelltoney/My\ Projects/02-development/food-image-generator

# Run installation script
./setup-localai.sh
```

This will:
- Install Xcode Command Line Tools (if needed)
- Install Homebrew dependencies
- Build LocalAI with Metal acceleration
- Install diffusers backend

**Note:** The build takes 10-15 minutes. Grab a coffee! ☕

## Step 2: Configure Models (2 minutes)

```bash
# Copy model configs to LocalAI
cp localai-config/sdxl-food.yaml ~/LocalAI/models/
cp localai-config/sdxl-food-hq.yaml ~/LocalAI/models/
```

## Step 3: Start LocalAI (1 minute)

```bash
# Start LocalAI
./start-localai.sh
```

Keep this terminal open. LocalAI will run in the foreground.

**First run:** The SDXL-turbo model (~7GB) will download automatically. This takes 5-10 minutes depending on your internet speed.

## Step 4: Test Image Generation (2 minutes)

Open a new terminal:

```bash
cd /Users/pernelltoney/My\ Projects/02-development/food-image-generator

# Run test
./test-localai.sh
```

You should see:
- ✓ LocalAI is running
- ✓ Image generated successfully
- The test image will open automatically

**Success!** LocalAI is working! 🎉

## Step 5: Set Up Worker Service (5 minutes)

```bash
cd worker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # or use your favorite editor
```

Edit `.env` and fill in:
- `DATABASE_URL` - Your PostgreSQL connection string
- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key
- `R2_SECRET_ACCESS_KEY` - Your R2 secret key
- `R2_BUCKET_NAME` - Your R2 bucket name
- `R2_PUBLIC_URL` - Your R2 public URL

Leave LocalAI settings as-is (they're already configured for localhost).

## Step 6: Start Worker (1 minute)

Make sure Redis is running:
```bash
# Install Redis if you don't have it
brew install redis

# Start Redis
redis-server
```

In another terminal, start the worker:
```bash
cd worker
npm run dev
```

You should see:
```
🚀 Food Image Worker started
   LocalAI: http://localhost:8080/v1
   Model: sdxl-food
   Redis: localhost:6379
   Waiting for jobs...
```

**Success!** Worker is ready! 🎉

## Step 7: Test End-to-End (5 minutes)

### Option A: Manual Test (Quick)

Create a test job in Redis:

```bash
# In a new terminal
redis-cli

# Enqueue a test job
LPUSH bull:GenerateRecipeImage:waiting '{"recipeId":"test-123","title":"Cheddar and Herb Chaffle","category":"keto/breakfast/waffle","ingredients":["cheddar cheese","eggs","almond flour","fresh herbs"]}'

# Exit Redis CLI
exit
```

Watch the worker terminal - you should see it process the job!

### Option B: From Your Backend

Add this to your recipe creation endpoint:

```typescript
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({ host: 'localhost', port: 6379 });
const imageQueue = new Queue('GenerateRecipeImage', { connection });

// After saving recipe
await imageQueue.add('generate', {
  recipeId: recipe.id,
  title: recipe.title,
  category: recipe.category,
  ingredients: recipe.ingredients.map(i => i.name),
});
```

## Running as Services (Optional)

### LocalAI as Background Service

```bash
# Copy plist to LaunchAgents
cp localai-config/com.localai.service.plist ~/Library/LaunchAgents/

# Load service
launchctl load ~/Library/LaunchAgents/com.localai.service.plist

# LocalAI will now start automatically on boot
```

### Worker as Background Service

Using PM2:
```bash
# Install PM2
npm install -g pm2

# Build worker
cd worker
npm run build

# Start with PM2
pm2 start dist/worker.js --name food-image-worker

# Save config
pm2 save

# Auto-start on boot
pm2 startup
```

## Troubleshooting

### LocalAI won't build

```bash
# Install Xcode from App Store
# Then set correct path
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Image generation is slow

- Make sure you're using `sdxl-food` (turbo) not `sdxl-food-hq`
- Check that Metal acceleration is enabled (look for "Using Metal" in logs)
- Close other GPU-intensive apps

### Worker can't connect to LocalAI

```bash
# Check if LocalAI is running
curl http://localhost:8080/v1/models

# If not, start it
./start-localai.sh
```

### Worker can't connect to Redis

```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
```

## Next Steps

1. ✅ LocalAI installed and tested
2. ✅ Worker service running
3. 🔗 Integrate with your backend
4. 📱 Test from your iOS app
5. 🚀 Deploy to production

## Performance Expectations

On M4 Mac mini:
- **Image generation:** 10-20 seconds (SDXL-turbo)
- **Image processing:** < 1 second
- **R2 upload:** 1-3 seconds
- **Total:** 15-30 seconds per recipe

## Getting Help

- Check the main [README.md](README.md)
- Check the worker [README.md](worker/README.md)
- Review the [implementation plan](../brain/de9c3892-a2ef-4b15-b73b-7ecd5f65981b/localai_implementation_plan.md)

Happy cooking! 👨‍🍳🖼️
