# Documentation du Projet

## Guide d'architecture

### Vue d'ensemble

Ce projet suit une **architecture 3-couches classique** :

```
┌─────────────────────────────────────┐
│  CLIENT (Navigateur)                │
│  HTTPS → http://localhost:3000      │
└──────────────────┬──────────────────┘
                   │
        ┌──────────▼─────────┐
        │   FRONTEND LAYER   │
        │                    │
        │  React 18 + Vite   │
        │  - UI Components   │
        │  - Routing         │
        │  - HTTP Client     │
        │                    │
        └──────────┬─────────┘
                   │
        ┌──────────▼──────────────┐
        │   BACKEND LAYER        │
        │                        │
        │  NestJS + TypeScript   │
        │  ┌──────────────────┐  │
        │  │ Guards & Pipes   │  │ ◄─── Security Layer
        │  │ JWT, Validation  │  │
        │  └──────────┬───────┘  │
        │  ┌──────────▼───────┐  │
        │  │  Controllers     │  │ ◄─── API Layer
        │  │  Auth, Files,    │  │
        │  │  Users           │  │
        │  └──────────┬───────┘  │
        │  ┌──────────▼───────┐  │
        │  │  Services        │  │ ◄─── Business Layer
        │  │  Logique métier  │  │
        │  └──────────┬───────┘  │
        │             │          │
        └─────────────┼──────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
   ┌────▼────┐  ┌────▼────┐  ┌─────▼──────┐
   │PostgreSQL│ │  Redis  │  │ Filesystem │
   │Database  │ │ (Cache) │  │ (Uploads)  │
   └──────────┘ └─────────┘  └────────────┘
```

### Responsabilités par couche

#### Couche Client (Browser)
- Point d'entrée initial
- Communique uniquement en HTTPS avec le frontend
- Affiche l'interface utilisateur rendue

#### Couche Frontend (React)
- **Responsabilités**
  - Gestion de l'interface utilisateur (UI)
  - Appels API au backend via Axios
  - Routing et navigation
  - Gestion d'état simple (Auth Context)

- **Technologies**
  - React 18 : composants et hooks
  - Vite : build tool ultra-rapide
  - React Router v6 : routing
  - Axios : HTTP client
  - TailwindCSS : styling

#### Couche Backend (NestJS)
- **Pipeline d'entrée**
  - Guards : Authentification JWT
  - Pipes : Validation class-validator
  - Intercepteurs : Transformation de données

- **API Controllers**
  - Auth : login, register, me
  - Users : CRUD utilisateurs
  - Files : upload, listing, download

- **Services (Business Logic)**
  - AuthService : logique d'authentification
  - UsersService : manipulation utilisateurs
  - FilesService : gestion fichiers

- **Tâches Planifiées**
  - Suppression quotidienne des fichiers expirés (Cron)

#### Persistance
- **PostgreSQL** : données structurées (users, files metadata)
- **Redis** : cache et rate limiting (optionnel)
- **Filesystem/S3** : stockage des fichiers uploadés

---

## Flux de données

### 1. Authentification (Login)

```
Frontend                          Backend
   │                                │
   ├─ POST /auth/login ────────────►│
   │  {email, password}             │
   │                                ├─ Validation
   │                                ├─ Hash check
   │                                ├─ JWT generation
   │◄─────────── {token, user} ─────┤
   │                                │
   └─ Store token (localStorage)    │
```

### 2. Requête Protégée (Upload fichier)

```
Frontend                          Backend
   │                                │
   ├─ POST /files/upload ──────────►│
   │  Header: Authorization: Bearer │
   │  Body: FormData(file)          │
   │                                ├─ JwtGuard
   │                                ├─ FileInterceptor
   │                                ├─ Validation
   │                                ├─ FilesService.create()
   │◄────────── {file data} ────────┤
   │                                │
```

### 3. Gestion des fichiers

```
FilesService
├─ Upload (POST)
│  └─ Save to disk + DB metadata
├─ List (GET)
│  └─ Fetch from DB (filter by userId)
├─ Download (GET :id/download)
│  └─ Stream file from disk
└─ Delete (DELETE :id)
   └─ Remove file + DB record
```

---

## Conventions de Commit

Ce projet respecte **Conventional Commits** pour structurer l'historique git.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type      | Utilisation |
|-----------|------------|
| `feat`    | Nouvelle fonctionnalité |
| `fix`     | Correction de bug |
| `docs`    | Documentation |
| `style`   | Formatage, lint (sans logique) |
| `refactor`| Refactorisation |
| `perf`    | Optimisations |
| `test`    | Tests |
| `chore`   | Dépendances, config |
| `ci`      | CI/CD |

### Scopes Recommandés

| Scope      | Module |
|-----------|--------|
| `frontend` | Tout le frontend React |
| `backend`  | Tout le backend NestJS |
| `auth`     | Module authentification |
| `users`    | Module utilisateurs |
| `files`    | Module fichiers |
| `docker`   | Configuration Docker |
| `deps`     | Dépendances npm |
| `config`   | Configuration générale |

### Exemples

```bash
# Nouvelle fonctionnalité
git commit -m "feat(auth): add JWT token validation"

# Correction
git commit -m "fix(files): resolve upload timeout issue"

# Documentation
git commit -m "docs(backend): update API endpoints"

# Refactorisation
git commit -m "refactor(users): simplify service logic"

# Dépendances
git commit -m "chore(deps): upgrade NestJS to v10"

# Docker
git commit -m "ci(docker): add health checks to compose"
```

---

## Configuration pour le Développement

### Variables d'environnement

Copier `.env.example` en `.env` et ajuster :

```bash
# Backend
DATABASE_URL=postgresql://user:password@postgres:5432/appdb
JWT_SECRET=dev-secret-key
REDIS_URL=redis://redis:6379
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Démarrage local

**Option 1 : Docker Compose (recommandé)**
```bash
docker-compose up
```

**Option 2 : Manuel**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - PostgreSQL (Docker)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=appdb \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## Services en Production

| Service    | Port  | URL |
|-----------|-------|-----|
| Frontend   | 3000  | http://localhost:3000 |
| Backend    | 3001  | http://localhost:3001 |
| PostgreSQL | 5432  | localhost:5432 |
| Redis      | 6379  | localhost:6379 |
| PGAdmin    | 5050  | http://localhost:5050 |

---

## Points d'accès API

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Infos utilisateur (protégé)
- `POST /api/auth/logout` - Déconnexion

### Users
- `GET /api/users` - Lister (protégé)
- `GET /api/users/:id` - Détails (protégé)
- `PATCH /api/users/:id` - Modifier (protégé)
- `DELETE /api/users/:id` - Supprimer (protégé)

### Files
- `GET /api/files` - Lister mes fichiers (protégé)
- `POST /api/files/upload` - Uploader (protégé)
- `GET /api/files/:id/download` - Télécharger (protégé)
- `DELETE /api/files/:id` - Supprimer (protégé)

---

## Extensibilité

### Ajouter un nouveau module

```bash
cd backend
nest g module modules/products
nest g controller modules/products
nest g service modules/products
```

### Ajouter un nouveau Guard

```typescript
// src/common/guards/new.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class NewGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Logique du guard
    return true
  }
}
```

### Ajouter une tâche Cron

```typescript
@Injectable()
export class TasksService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async myScheduledTask() {
    // Tâche asynchrone
  }
}
```

---

## Troubleshooting

### Port déjà utilisé
```bash
# Trouver le processus
lsof -i :3000

# Libérer le port
kill -9 <PID>
```

### PostgreSQL ne démarre pas
```bash
# Vérifier les logs
docker-compose logs postgres

# Réinitialiser
docker-compose down -v
docker-compose up
```

### Token expiré
- Le frontend détecte automatiquement les 401
- Redirection vers /login
- Supprimer le token du localStorage

---

## Ressources

- [NestJS Docs](https://docs.nestjs.com)
- [React Docs](https://react.dev)
- [TypeORM Docs](https://typeorm.io)
- [Conventional Commits](https://www.conventionalcommits.org)

