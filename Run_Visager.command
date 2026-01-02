#!/bin/bash
# One-Click Launcher for Visager
PROJECT_ROOT="/Users/arda/Documents/aprt"
cd "$PROJECT_ROOT/frontend"

echo "🚀 Starting Visager..."

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing..."
    npm install
fi

# Check for venv312
if [ ! -d "$PROJECT_ROOT/venv312" ]; then
    echo "⚠️ Warning: venv312 not found at $PROJECT_ROOT/venv312"
    echo "Please ensure the Python environment is set up correctly."
fi

npm run electron-dev
