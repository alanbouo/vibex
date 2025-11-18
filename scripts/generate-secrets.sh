#!/bin/bash

# Generate Secrets for Coolify Deployment
# Usage: ./scripts/generate-secrets.sh

echo "========================================"
echo "🔐 Vibex Deployment Secrets Generator"
echo "========================================"
echo ""
echo "Copy these values to your Coolify environment variables:"
echo ""

echo "----------------------------------------"
echo "JWT_SECRET"
echo "----------------------------------------"
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET"
echo ""

echo "----------------------------------------"
echo "REFRESH_TOKEN_SECRET"
echo "----------------------------------------"
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
echo "$REFRESH_TOKEN_SECRET"
echo ""

echo "----------------------------------------"
echo "MONGO_PASSWORD"
echo "----------------------------------------"
MONGO_PASSWORD=$(openssl rand -base64 24)
echo "$MONGO_PASSWORD"
echo ""

echo "========================================"
echo "✅ Secrets Generated Successfully!"
echo "========================================"
echo ""
echo "📋 Quick Copy Format:"
echo "========================================"
echo "JWT_SECRET=$JWT_SECRET"
echo "REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET"
echo "MONGO_PASSWORD=$MONGO_PASSWORD"
echo ""
echo "⚠️  IMPORTANT: Store these securely!"
echo "   Never commit these to Git."
echo ""
