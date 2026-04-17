# QUICKSTART.md

## Démarrage Rapide

Démarrez l'application entière en une seule commande !

### Prérequis

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git**

### Démarrage en 2 étapes

```bash
# 1. Cloner le projet
git clone <repository-url>
cd Travail

# 2. Démarrer tous les services
docker-compose up
```

C'est tout !

---

## Accès aux services

| Service | URL | Identifiants |
|---------|-----|------------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:3001 | - |
| PGAdmin | http://localhost:5050 | admin@example.com / admin |
| Redis Commander | - | redis:6379 |

---

## Tester rapidement

### 1. S'inscrire
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "username": "demouser",
    "password": "demo123456"
  }'
```

Vous recevrez un **token JWT**. Copiez-le.

### 2. Uploader un fichier
```bash
TOKEN="<your_token_here>"
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/any/file.pdf"
```

### 3. Lister les fichiers
```bash
TOKEN="<your_token_here>"
curl -X GET http://localhost:3001/api/files \
  -H "Authorization: Bearer $TOKEN"
```

---

## Commandes courantes

```bash
# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Arrêter les services
docker-compose down

# Arrêter ET supprimer les données
docker-compose down -v

# Relancer après modification
docker-compose restart backend

# Entrer dans le conteneur backend
docker exec -it backend bash

# Vérifier le statut
docker-compose ps
```

---

## Troubleshooting

### Les ports sont déjà utilisés
```bash
# Libérer le port
sudo lsof -i :3000  # Voir quel processus utilise le port
sudo kill -9 <PID>
```

### PostgreSQL ne démarre pas
```bash
# Réinitialiser les volumes
docker-compose down -v
docker-compose up
```

### Erreur de connexion au backend
```bash
# Vérifier que les services sont prêts
docker-compose ps

# Voir les logs du backend
docker-compose logs backend

# Attendre 10s et réessayer (les services mettent un peu de temps)
```

### Problème de permission sur Linux
```bash
# Relancer avec sudo
sudo docker-compose up
```

---

## Structure rapide

```
Travail/
├── frontend/      # React + Vite (port 3000)
├── backend/       # NestJS (port 3001)
├── docker-compose.yml    # Orchestration
├── .env          # Variables d'environnement
└── README.md     # Ce fichier
```

---

## Informations utiles

### Base de données
- **Type** : PostgreSQL
- **Host** : postgres
- **Port** : 5432
- **User** : user
- **Password** : password
- **Database** : appdb

### JWT Token
- **Durée de vie** : 3600 secondes (1 heure)
- **Secret** : `your-secret-key-change-in-production` (à changer en prod)

### Stockage de fichiers
- **Type** : Local filesystem
- **Chemin** : `/app/uploads`
- **Expiration** : Suppression auto quotidienne

---

## Pour aller plus loin

- **Architecture complète** : voir `ARCHITECTURE.md`
- **Documentation API** : voir `API.md`
- **Contribuer** : voir `CONTRIBUTING.md`

---

## Conseils

1. **Développement** : Les hot reloads sont activés, vos changements prennent effet instantanément
2. **Debug** : Consultez les logs avec `docker-compose logs -f`
3. **Production** : Changez `JWT_SECRET`, `NODE_ENV`, et les secrets dans `.env`
4. **Commits** : Respectez Conventional Commits (feat:, fix:, etc.)

---

## Checklist de démarrage

- [ ] Docker installé et en fonctionnement
- [ ] `docker-compose up` exécuté
- [ ] Services prêts (attendre 30s)
- [ ] Frontend accessible sur http://localhost:3000
- [ ] Compte créé via l'interface
- [ ] Fichier uploadé avec succès

Bon développement !

