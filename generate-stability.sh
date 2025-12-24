#!/bin/bash
# generate-stability.sh - Generate food illustrations using Stability AI
#
# Usage: ./generate-stability.sh "cheeseburger with fries" [output-filename]
#
# Set your API key:
#   export STABILITY_API_KEY="your-key-here"

STABILITY_API_KEY="${STABILITY_API_KEY:-}"
OUTPUT_DIR="./generated-images"
STYLE="${STYLE:-watercolor}"  # watercolor, pencil, or photo

if [ -z "$STABILITY_API_KEY" ]; then
    echo "Error: STABILITY_API_KEY environment variable not set"
    echo "Run: export STABILITY_API_KEY=\"your-key-here\""
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: $0 \"food subject\" [output-filename]"
    echo ""
    echo "Examples:"
    echo "  $0 \"cheeseburger with fries\""
    echo "  $0 \"grilled salmon with asparagus\" salmon.png"
    echo ""
    echo "Styles (set with STYLE env var):"
    echo "  STYLE=watercolor $0 \"pizza\"   # artistic watercolor"
    echo "  STYLE=pencil $0 \"pizza\"       # colored pencil illustration"
    echo "  STYLE=photo $0 \"pizza\"        # photorealistic food photo"
    exit 1
fi

SUBJECT="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="${2:-food-$TIMESTAMP.png}"

mkdir -p "$OUTPUT_DIR"

# Build prompt based on style
if [ "$STYLE" = "pencil" ]; then
    PROMPT="colored pencil and watercolor wash illustration of $SUBJECT, fine pencil texture, soft watercolor shading, clean white background, subtle shadow, crisp edges, minimal palette, product illustration style, high detail, no background clutter"
    NEGATIVE="photorealistic, 3d render, CGI, plastic, glossy, neon, oversaturated, high contrast, harsh shadows, HDR, text, logo, watermark, signature, blurry, low detail, messy background"
elif [ "$STYLE" = "photo" ]; then
    PROMPT="professional food photography of $SUBJECT, on white ceramic plate, soft natural lighting, shallow depth of field, 50mm lens, appetizing, restaurant quality, high detail, clean composition, food magazine style"
    NEGATIVE="illustration, drawing, painting, cartoon, sketch, watercolor, artificial, fake, low quality, blurry, text, logo, watermark"
else
    PROMPT="watercolor illustration of $SUBJECT, hand-painted, transparent washes, subtle pigment granulation, soft edges, minimal ink linework, realistic proportions, gentle cast shadow, clean white paper background, fine art print, high detail, calm natural color palette, studio scan look"
    NEGATIVE="photorealistic, 3d render, CGI, plastic, glossy, neon, oversaturated, high contrast, harsh shadows, HDR, text, logo, watermark, signature, blurry, low detail, messy background"
fi

echo "Generating: $SUBJECT"
echo "Style: $STYLE"
echo "Output: $OUTPUT_DIR/$FILENAME"
echo ""

# Call Stability AI API (using SD3)
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$OUTPUT_DIR/$FILENAME" \
    -X POST "https://api.stability.ai/v2beta/stable-image/generate/sd3" \
    -H "Authorization: Bearer $STABILITY_API_KEY" \
    -H "Accept: image/*" \
    -F "prompt=$PROMPT" \
    -F "negative_prompt=$NEGATIVE" \
    -F "output_format=png" \
    -F "aspect_ratio=1:1")

if [ "$HTTP_CODE" = "200" ]; then
    SIZE=$(ls -lh "$OUTPUT_DIR/$FILENAME" | awk '{print $5}')
    echo "Success! Image saved: $OUTPUT_DIR/$FILENAME ($SIZE)"
    open "$OUTPUT_DIR/$FILENAME"
else
    echo "Error: API returned HTTP $HTTP_CODE"
    cat "$OUTPUT_DIR/$FILENAME"  # Show error message
    rm -f "$OUTPUT_DIR/$FILENAME"
    exit 1
fi
