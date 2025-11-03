#!/bin/bash

echo "⚠️  WARNING: This will delete all data!"
read -p "Are you sure? (yes/no) " -n 3 -r
echo

if [[ $REPLY == "yes" ]]; then
  echo "🗑️  Stopping and removing containers..."
  docker-compose down -v
  
  echo "🧹 Cleaning up..."
  rm -rf node_modules
  rm -rf packages/*/node_modules
  rm -rf apps/*/node_modules
  
  echo "✅ Environment reset complete"
  echo "Run ./dev.sh to start fresh"
else
  echo "❌ Reset cancelled"
fi
