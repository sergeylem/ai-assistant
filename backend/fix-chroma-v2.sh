#!/bin/bash

echo "🔧 Fixing ChromaDB v2 tenant issue..."
echo "====================================="

# Check if ChromaDB is running
if ! curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo "❌ ChromaDB is not running. Please start it with: docker-compose up -d chroma"
    exit 1
fi

echo "✅ ChromaDB is running"

# Initialize ChromaDB v2
echo "🚀 Initializing ChromaDB v2..."
cd backend
node init-chroma-v2.js

echo ""
echo "✅ ChromaDB v2 initialization complete!"
echo "   You can now restart your NestJS application and try uploading files again." 