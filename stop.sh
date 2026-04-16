#!/bin/bash

# Script d'arrêt du projet
# Usage: ./stop.sh

echo "🛑 Arrêt de l'application..."
docker-compose down

echo "✅ Services arrêtés !"

