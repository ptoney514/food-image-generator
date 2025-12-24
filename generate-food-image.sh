#!/bin/bash
# generate-food-image.sh - Generate a food image and save it
#
# Usage: ./generate-food-image.sh "cheeseburger and fries" [output-filename]
#
# Examples:
#   ./generate-food-image.sh "pepperoni pizza"
#   ./generate-food-image.sh "grilled salmon with vegetables" salmon.png
#   ./generate-food-image.sh "chocolate cake with raspberries" dessert.png

LOCALAI_URL="http://localhost:8080"
MODEL="sdxl-food"
OUTPUT_DIR="./generated-images"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 \"food description\" [output-filename]"
    echo ""
    echo "Examples:"
    echo "  $0 \"cheeseburger and fries\""
    echo "  $0 \"pepperoni pizza\" pizza.png"
    echo "  $0 \"grilled salmon\" salmon.png"
    exit 1
fi

FOOD_DESC="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="${2:-food-$TIMESTAMP.png}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build the prompt
PROMPT="professional food photography, $FOOD_DESC, white ceramic plate, overhead view, natural lighting, appetizing, high quality, 4K"

echo "Generating image for: $FOOD_DESC"
echo "Prompt: $PROMPT"
echo ""

# Check if LocalAI is running
if ! curl -s "$LOCALAI_URL/v1/models" > /dev/null 2>&1; then
    echo "Error: LocalAI is not running at $LOCALAI_URL"
    echo "Start it with: cd ~/LocalAI && ./local-ai --models-path=./models --address=:8080"
    exit 1
fi

# Generate image
echo "Generating image (this takes 10-20 seconds)..."
RESPONSE=$(curl -s "$LOCALAI_URL/v1/images/generations" \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"$MODEL\", \"prompt\": \"$PROMPT\", \"size\": \"1024x1024\"}")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "Error generating image:"
    echo "$RESPONSE" | jq '.error.message'
    exit 1
fi

# Extract image URL and download
IMAGE_URL=$(echo "$RESPONSE" | jq -r '.data[0].url')

if [ -z "$IMAGE_URL" ] || [ "$IMAGE_URL" = "null" ]; then
    echo "Error: No image URL in response"
    echo "$RESPONSE"
    exit 1
fi

# Download the image
curl -s "$IMAGE_URL" -o "$OUTPUT_DIR/$FILENAME"

if [ -f "$OUTPUT_DIR/$FILENAME" ]; then
    SIZE=$(ls -lh "$OUTPUT_DIR/$FILENAME" | awk '{print $5}')
    echo ""
    echo "Image saved: $OUTPUT_DIR/$FILENAME ($SIZE)"
    echo ""

    # Open the image
    open "$OUTPUT_DIR/$FILENAME"
else
    echo "Error: Failed to save image"
    exit 1
fi
