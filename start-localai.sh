#!/bin/bash
# start-localai.sh - Start LocalAI service manually

set -e

# Configuration
LOCALAI_DIR="$HOME/LocalAI"
MODELS_PATH="$LOCALAI_DIR/models"
PORT=8080

echo "Starting LocalAI service..."
echo "Models path: $MODELS_PATH"
echo "Port: $PORT"
echo ""

# Check if LocalAI is installed
if [ ! -f "$LOCALAI_DIR/local-ai" ]; then
    echo "Error: LocalAI not found at $LOCALAI_DIR"
    echo "Please run setup-localai.sh first"
    exit 1
fi

# Check if models directory exists
if [ ! -d "$MODELS_PATH" ]; then
    echo "Error: Models directory not found at $MODELS_PATH"
    exit 1
fi

# Start LocalAI
cd "$LOCALAI_DIR"
./local-ai --models-path="$MODELS_PATH" --address=":$PORT" --debug=false

echo ""
echo "LocalAI stopped"
