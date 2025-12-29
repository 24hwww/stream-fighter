#!/bin/bash
# StreamFighter Cleanup Script
# Removes all stopped containers, unused networks, and dangling images.

echo "🧹 Cleaning up inactive Docker resources..."

# Remove all stopped containers
docker container prune -f

# Remove all unused networks
docker network prune -f

# Remove all dangling images (optional: add -a to remove all unused images)
docker image prune -f

# Optional: Cleanup build cache if space is low
# docker builder prune -f

echo "✅ Cleanup complete!"
