#!/bin/bash

# Script de démarrage du projet
# Usage: ./start.sh

echo "🚀 Démarrage de l'application..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Démarrer les services
echo "📦 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente de la disponibilité des services..."
sleep 10

# Afficher le statut
echo ""
echo "✅ Services démarrés !"
echo ""
echo "📍 Accès aux applications :"
echo "   Frontend  : http://localhost:3000"
echo "   Backend   : http://localhost:3001"
echo "   PGAdmin   : http://localhost:5050"
echo ""
echo "📋 Pour voir les logs : docker-compose logs -f"
echo "🛑 Pour arrêter      : docker-compose down"

