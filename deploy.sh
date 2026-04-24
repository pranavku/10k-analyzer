#!/bin/bash
set -e

echo "========================================="
echo "  10-K Analyzer — Cloudflare Deployment"
echo "========================================="
echo ""

# Check wrangler
if ! command -v wrangler &> /dev/null; then
  echo "Installing wrangler..."
  npm install -g wrangler
fi

# Check login
echo "Checking Cloudflare auth..."
wrangler whoami 2>/dev/null || wrangler login

echo ""
echo "Step 1/2 — Deploying SEC EDGAR proxy..."
cd proxy
wrangler deploy
cd ..

echo ""
echo "Step 2/2 — Deploying 10-K Analyzer app..."
cd app
wrangler deploy
cd ..

echo ""
echo "========================================="
echo "  Deployment complete!"
echo ""
echo "  Proxy: https://sec-edgar-proxy.<subdomain>.workers.dev"
echo "  App:   https://10k-analyzer.<subdomain>.workers.dev"
echo ""
echo "  IMPORTANT: Update the PROXY variable in"
echo "  app/worker.mjs with your actual proxy URL,"
echo "  then run this script again."
echo "========================================="
