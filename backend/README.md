# Backend - NestJS

Application backend avec NestJS (TypeScript), TypeORM, PostgreSQL, JWT et gestion de fichiers.

## Structure

```
src/
├── config/                    # Configuration globale
│   └── typeorm.config.ts     # Config TypeORM
├── common/                    # Utilitaires et services communs
│   ├── guards/               # Guards (JWT, Roles, etc.)
│   │   └── jwt.guard.ts      # Validation JWT
│   └── tasks/                # Tâches planifiées (Cron)
│       └── tasks.service.ts  # Suppression fichiers expirés
├── modules/                   # Modules métier
│   ├── auth/                 # Module authentification
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/                # Module utilisateurs
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── create-user.dto.ts
│   └── files/                # Module fichiers
│       ├── files.controller.ts
│       ├── files.service.ts
│       ├── files.module.ts
│       └── entities/
│           └── file.entity.ts
├── app.module.ts             # Module racine
└── main.ts                   # Point d'entrée

```

## Installation

```bash
npm install
```

## Développement

```bash
npm run start:dev
```

Le backend démarre sur http://localhost:3001

## Build

```bash
npm run build
```

## Variables d'environnement

Voir `.env.example`

## Architecture

### Pipeline d'entrée
- **JwtGuard** : Validation du token JWT
- **class-validator** : Validation des DTOs

### Modules

#### Auth
- Register / Login
- JWT token generation
- Validation

#### Users
- CRUD utilisateurs
- Filtrage (sans mots de passe)

#### Files
- Upload de fichiers
- Listing
- Téléchargement
- Suppression

### Tâches planifiées
- Suppression quotidienne des fichiers expirés via Cron

## Base de données

TypeORM avec PostgreSQL
- Entities synchronisées automatiquement en dev
- Migration support

## Points clés

- Architecture stricte en couches
- Validation robuste des entrées
- Authentification JWT
- Gestion des fichiers
- Tâches planifiées
- CORS activé

