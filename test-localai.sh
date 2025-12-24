#!/bin/bash
# test-localai.sh - Test LocalAI image generation

set -e

LOCALAI_URL="http://localhost:8080"
MODEL_NAME="sdxl-food"
OUTPUT_FILE="test-output.png"

echo "Testing LocalAI image generation..."
echo "URL: $LOCALAI_URL"
echo "Model: $MODEL_NAME"
echo ""

# Check if LocalAI is running
echo "Checking if LocalAI is running..."
if ! curl -s "$LOCALAI_URL/v1/models" > /dev/null; then
    echo "Error: LocalAI is not running at $LOCALAI_URL"
    echo "Please start LocalAI first: ./start-localai.sh"
    exit 1
fi

echo "✓ LocalAI is running"
echo ""

# List available models
echo "Available models:"
curl -s "$LOCALAI_URL/v1/models" | jq -r '.data[].id'
echo ""

# Generate test image
echo "Generating test image..."
echo "Prompt: professional food photography, golden waffle on white plate, overhead view, natural lighting"
echo ""

curl -s "$LOCALAI_URL/v1/images/generations" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL_NAME\",
    \"prompt\": \"professional food photography, golden waffle on white plate, overhead view, natural lighting, appetizing, 4K\",
    \"size\": \"1024x1024\"
  }" | jq -r '.data[0].b64_json' | base64 -d > "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
    echo "✓ Image generated successfully: $OUTPUT_FILE"
    echo ""
    echo "Opening image..."
    open "$OUTPUT_FILE"
else
    echo "✗ Error: Image generation failed"
    exit 1
fi
