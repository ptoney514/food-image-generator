#!/bin/bash
# setup-localai.sh - Install LocalAI on M4 Mac mini

set -e  # Exit on error

echo "======================================"
echo "LocalAI Installation Script for M4 Mac"
echo "======================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script is designed for macOS only."
    exit 1
fi

# Check for Xcode Command Line Tools
echo "Checking for Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "Please complete the Xcode installation and run this script again."
    exit 0
else
    echo "✓ Xcode Command Line Tools found"
fi

# Check for Homebrew
echo ""
echo "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✓ Homebrew found"
fi

# Install dependencies
echo ""
echo "Installing dependencies via Homebrew..."
brew install abseil cmake go grpc protobuf wget protoc-gen-go protoc-gen-go-grpc

# Check Go version
echo ""
echo "Checking Go version..."
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo "Go version: $GO_VERSION"

# Clone LocalAI repository
echo ""
echo "Cloning LocalAI repository..."
if [ -d "LocalAI" ]; then
    echo "LocalAI directory already exists. Pulling latest changes..."
    cd LocalAI
    git pull
else
    git clone https://github.com/mudler/LocalAI.git
    cd LocalAI
fi

# Build LocalAI with Metal support
echo ""
echo "Building LocalAI (this may take 10-15 minutes)..."
echo "Building with Metal acceleration for Apple Silicon..."
make build

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p models
mkdir -p models/loras
mkdir -p logs

# Install diffusers backend
echo ""
echo "Installing diffusers backend for Stable Diffusion..."
./local-ai backends install diffusers

# Verify installation
echo ""
echo "Verifying installation..."
if [ -f "./local-ai" ]; then
    echo "✓ LocalAI binary created successfully"
    ./local-ai --version
else
    echo "✗ Error: LocalAI binary not found"
    exit 1
fi

echo ""
echo "======================================"
echo "LocalAI Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Copy your model configuration to models/ directory"
echo "2. Start LocalAI: ./local-ai --models-path=./models --address=:8080"
echo "3. Test the API: curl http://localhost:8080/v1/models"
echo ""
echo "Note: The first time you use a model, it will be downloaded from HuggingFace."
echo "SDXL-turbo is ~7GB and may take some time to download."
echo ""
