#!/bin/bash

# 🚀 Script de démarrage du backend DataShare
# Utilise le mode production (pas de watch mode qui cause EMFILE sur macOS)

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║              🚀 DataShare Backend - Mode Production              ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/pierre/Documents/Formation/03/Travail/backend

echo "📦 Build..."
npm run build --silent
if [ $? -ne 0 ]; then
  echo "❌ Build échoué"
  exit 1
fi
echo "✅ Build réussi"
echo ""

echo "🚀 Démarrage du serveur..."
echo "   Adresse: http://localhost:3000"
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""

npm run start:prod

