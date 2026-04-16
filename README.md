# Application Web 3-Couches

Architecture web classique avec séparation claire des responsabilités : client, frontend React, backend NestJS.

## Stack Technique

- **Frontend** : React 18 + Vite + TailwindCSS + React Router + Axios
- **Backend** : NestJS (TypeScript) + TypeORM + PostgreSQL
- **Cache** : Redis (optionnel)
- **Stockage** : Filesystem local ou AWS S3
- **Orchestration** : Docker Compose

## Démarrage Rapide

```bash
docker-compose up
```

Le projet démarre en une seule commande. Accédez à l'application via `https://localhost:3000`.

## Structure du Projet

```
.
├── frontend/          # Application React + Vite
├── backend/           # Application NestJS
├── docker-compose.yml # Orchestration des services
└── README.md
```

## Convention des Commits

Ce projet respecte **Conventional Commits** :

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types autorisés

- **feat** : nouvelle fonctionnalité
- **fix** : correction de bug
- **docs** : documentation
- **style** : formatage, lint (pas de changement logique)
- **refactor** : refactorisation du code
- **perf** : optimisations de performance
- **test** : ajout ou modification de tests
- **chore** : dépendances, configuration, etc.
- **ci** : CI/CD

### Scopes recommandés

- `frontend` : changements frontend
- `backend` : changements backend
- `auth` : module authentification
- `files` : gestion des fichiers
- `users` : gestion des utilisateurs
- `docker` : configuration Docker
- `deps` : dépendances
- `config` : configuration générale

### Exemples

```
feat(auth): add JWT token validation
fix(files): resolve upload timeout issue
docs(backend): update API endpoints
refactor(users): simplify service logic
chore(deps): upgrade NestJS to v10
ci(docker): add health checks to compose
```

## Accès aux Services

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379
- **pgAdmin** (optionnel) : http://localhost:5050

## Développement

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

## Détails Architecture

### Couche Frontend
- Gestion de l'interface utilisateur
- Appels API via Axios
- Routing avec React Router
- Styling avec TailwindCSS

### Couche Backend

#### Pipeline d'entrée
- **Guards** : Authentification JWT
- **Pipes** : Validation avec class-validator

#### Controllers & Services
- **Auth** : authentification et autorisation
- **Files** : gestion des uploads et stockage
- **Users** : gestion des utilisateurs

#### Composants Transverses
- **Multer** : upload de fichiers
- **@nestjs/schedule** : tâches planifiées (ex: suppression fichiers expirés)

#### Persistance
- **PostgreSQL** : base de données principale (users, files, tags)
- **Redis** : cache et rate limiting (optionnel)
- **Stockage fichiers** : filesystem local ou AWS S3

## Flux de Données

1. Client HTTPS → Frontend React
2. Frontend → API REST (Backend)
3. Backend traite via : Guards/Pipes → Controllers → Services
4. Services interagissent avec : PostgreSQL, Redis, Stockage
5. Réponses JSON au Frontend → rendu UI

## License

MIT

