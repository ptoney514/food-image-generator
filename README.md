# LocalAI Food Image Generator

A local food image generation system for your recipe app, running on M4 Mac mini with LocalAI and Stable Diffusion XL.

## Overview

This system automatically generates professional food photography for recipes using:
- **LocalAI** - OpenAI-compatible API running locally
- **SDXL-turbo** - Fast, high-quality image generation (10-20s per image)
- **Worker Service** - Node.js/TypeScript service that processes jobs
- **Cloudflare R2** - Image storage and CDN

## Project Structure

```
food-image-generator/
├── setup-localai.sh              # LocalAI installation script
├── start-localai.sh              # Start LocalAI manually
├── test-localai.sh               # Test image generation
├── localai-config/               # LocalAI configuration
│   ├── sdxl-food.yaml           # Fast model config (SDXL-turbo)
│   ├── sdxl-food-hq.yaml        # High-quality model config
│   └── com.localai.service.plist # LaunchAgent service config
└── worker/                       # Worker service (to be created)
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── config.ts
        ├── prompt-builder.ts
        ├── image-generator.ts
        ├── image-processor.ts
        ├── r2-uploader.ts
        ├── database.ts
        └── worker.ts
```

## Quick Start

### 1. Install LocalAI

```bash
# Make script executable
chmod +x setup-localai.sh

# Run installation (takes 10-15 minutes)
./setup-localai.sh
```

This will:
- Install Xcode Command Line Tools (if needed)
- Install Homebrew dependencies
- Clone and build LocalAI with Metal acceleration
- Install diffusers backend for Stable Diffusion

### 2. Configure Models

```bash
# Copy model configs to LocalAI
cp localai-config/sdxl-food.yaml ~/LocalAI/models/
cp localai-config/sdxl-food-hq.yaml ~/LocalAI/models/
```

### 3. Start LocalAI

```bash
# Make script executable
chmod +x start-localai.sh

# Start LocalAI (runs in foreground)
./start-localai.sh
```

Or run directly:
```bash
cd ~/LocalAI
./local-ai --models-path=./models --address=:8080
```

### 4. Test Image Generation

In a new terminal:

```bash
# Make script executable
chmod +x test-localai.sh

# Run test
./test-localai.sh
```

This will generate a test food image and open it automatically.

## Model Configurations

### sdxl-food (Fast - Recommended)
- Model: `stabilityai/sdxl-turbo`
- Generation time: ~10-20 seconds on M4
- Steps: 4
- Quality: Good for production use

### sdxl-food-hq (High Quality)
- Model: `stabilityai/stable-diffusion-xl-base-1.0`
- Generation time: ~60-90 seconds on M4
- Steps: 30
- Quality: Excellent, but slower

## Running as a Service

To run LocalAI automatically on boot:

```bash
# Copy plist to LaunchAgents
cp localai-config/com.localai.service.plist ~/Library/LaunchAgents/

# Load service
launchctl load ~/Library/LaunchAgents/com.localai.service.plist

# Check status
launchctl list | grep localai

# View logs
tail -f ~/LocalAI/logs/localai.log
```

To stop the service:
```bash
launchctl unload ~/Library/LaunchAgents/com.localai.service.plist
```

## API Usage

### List Models
```bash
curl http://localhost:8080/v1/models
```

### Generate Image
```bash
curl http://localhost:8080/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sdxl-food",
    "prompt": "professional food photography, pasta carbonara, overhead view, natural lighting",
    "size": "1024x1024"
  }'
```

### With Negative Prompt
```bash
curl http://localhost:8080/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sdxl-food",
    "prompt": "professional food photography, chocolate cake|blurry, low quality",
    "size": "1024x1024"
  }'
```

## Next Steps

1. ✅ Install and test LocalAI
2. 📦 Set up worker service (see `worker/` directory)
3. 🔗 Integrate with your backend
4. 🚀 Deploy and monitor

## Troubleshooting

### LocalAI won't start
```bash
# Check if port 8080 is in use
lsof -i :8080

# Check Xcode path
xcode-select --print-path

# Should be: /Applications/Xcode.app/Contents/Developer
# If not, run:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Image generation is slow
- Ensure you're using `sdxl-food` (turbo) not `sdxl-food-hq`
- Check that Metal acceleration is enabled (look for "Using Metal" in logs)
- Close other GPU-intensive applications

### Out of memory errors
- Reduce image size to 512x512
- Use `sdxl-food` instead of `sdxl-food-hq`
- Ensure you have at least 16GB RAM

## Performance Benchmarks (M4 Mac Mini)

| Model | Size | Steps | Time | Quality |
|-------|------|-------|------|---------|
| sdxl-food | 1024×1024 | 4 | 10-20s | Good |
| sdxl-food-hq | 1024×1024 | 30 | 60-90s | Excellent |
| sdxl-food | 512×512 | 4 | 5-10s | Good |

## Resources

- [LocalAI Documentation](https://localai.io/)
- [SDXL-turbo on HuggingFace](https://huggingface.co/stabilityai/sdxl-turbo)
- [Implementation Plan](../brain/de9c3892-a2ef-4b15-b73b-7ecd5f65981b/localai_implementation_plan.md)

## License

MIT
