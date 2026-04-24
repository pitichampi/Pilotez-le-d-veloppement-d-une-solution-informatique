---
applyTo: '**'
description: 'Directives de développement pour agents IA - DataShare'
---

# AGENTS.md - DataShare Secure File Sharing

## 🎯 Mission du Projet
Service de partage de fichiers temporaire et sécurisé (NestJS + React + PostgreSQL).

## 🏗 Architecture Générale

### Stack Technique Confirmée
- **Backend:** NestJS 10.x (TypeScript) avec Express
- **Frontend:** React 18+ (Vite) + TailwindCSS
- **Base de données:** PostgreSQL + TypeORM (v0.3.x) avec migrations obligatoires
- **Cache:** Redis
- **Hachage:** Bcryptjs (cost 10)
- **Auth:** JWT Stateless (JwtModule NestJS)
- **Tests:** Jest + Supertest

### Organisation Modulaire NestJS
```
backend/src/
├── config/
│   └── typeorm.config.ts          (Factory TypeORM)
├── common/
│   ├── common.module.ts           (Exports JwtModule, JwtGuard)
│   ├── guards/
│   │   └── jwt.guard.ts           (CanActivate pour vérifier token)
│   └── tasks/
│       └── tasks.service.ts       (Cron pour expiration fichiers)
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts         (Imports: PassportModule, CommonModule, UsersModule)
│   │   ├── auth.service.ts        (register, login, generateToken)
│   │   ├── auth.controller.ts     (POST /register, /login, GET /me)
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       └── auth.dto.ts
│   ├── users/
│   │   ├── users.module.ts        (Imports: TypeOrmModule, CommonModule)
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   └── files/
│       ├── files.module.ts        (Imports: TypeOrmModule, CommonModule)
│       ├── files.service.ts
│       ├── files.controller.ts
│       └── entities/
│           └── file.entity.ts
├── migrations/
│   ├── 1704844800000-CreateUsersTable.ts
│   └── 1704844800001-CreateFilesTable.ts
├── app.module.ts                  (Root)
└── main.ts
```

## 🔑 Patterns Essentiels

### 1. DTOs avec Validation (class-validator)
- Tous les endpoints POST/PUT requièrent un DTO avec `@IsEmail`, `@MinLength`, etc.
- ValidationPipe global activé dans `main.ts`
- Exemple US03:
```typescript
export class RegisterDto {
  @IsEmail() email: string
  @MinLength(8) password: string
  @MinLength(3) username: string
}
```

### 2. Imports de Modules (CRITIQUE pour éviter erreurs DI)
- **AuthModule imports:** `[PassportModule, CommonModule, UsersModule]`
- **UsersModule imports:** `[TypeOrmModule.forFeature([User]), CommonModule]`
- **FilesModule imports:** `[TypeOrmModule.forFeature([File]), CommonModule]` ⚠️ **Pas** AuthModule (boucle)
- **CommonModule exports:** `[JwtModule, JwtGuard]`

### 3. JWT & Tokens
- **Config:** `JwtModule.registerAsync()` dans `common.module.ts`
- **Secret & Expiration:** Variables d'env `JWT_SECRET`, `JWT_EXPIRATION` (en secondes)
- **Payload:** `{ sub: userId, email }`
- **Header:** `Authorization: Bearer <token>`

### 4. JwtGuard - Points Sensibles
- Extrait token du header avec `.replace('Bearer ', '')`
- Lance `UnauthorizedException` si absent/invalide
- Stocke payload dans `request.user` pour les handlers
- ⚠️ Disponible uniquement si module importe `CommonModule`

### 5. Gestion Erreurs
- `BadRequestException` (400) - validation/logique
- `UnauthorizedException` (401) - auth échouée
- `ForbiddenException` (403) - accès refusé
- Messages génériques pour sécurité (ex: "Invalid credentials" au lieu de "Email not found")

### 6. Bcryptjs & Mots de Passe
- Import: `import * as bcrypt from 'bcryptjs'`
- Hash: `await bcrypt.hash(password, 10)`
- Vérif: `await bcrypt.compare(password, hashedPassword)`
- **Jamais** logger/retourner le mot de passe

### 7. TypeORM & Entités
- Entities dans dossier `entities/`
- Toute nouvelle table = migration + entity + `TypeOrmModule.forFeature([Entity])`
- Relations via `@OneToMany`, `@ManyToOne` avec cascade
- `@Column()` défaut required - utiliser `{ nullable: true }` si optionnel

## 📝 Convention de Nommage
- Routes: kebab-case (`/api/auth/register`)
- DTOs: `*Dto` (RegisterDto, LoginDto)
- Services: `*Service` (AuthService, UsersService)
- Entities: PascalCase (User, File)
- Tests: `*.spec.ts` (co-localisés avec source)
- E2E: `test/` dossier

## 🔒 Sécurité - Points Clés
- Validation stricte (class-validator + ValidationPipe)
- Fichiers: vérifier MIME type avec `file-type` (pas juste extension)
- Extensions interdites: `.exe, .bat, .sh, .msi, .cmd, .ps1`
- Tokens JWT: vérifier en JwtGuard AVANT handler
- Rate limiting: à implémenter via `@nestjs/throttler`
- CORS: configurer dans `main.ts` si frontend ≠ backend

## 🧪 Tests & Couverture
- Tests unitaires: `npm run test`
- Couverture: `npm run test:cov` (cible 70%)
- E2E: `npm run test:e2e` (nécessite DB en cours)
- Mock pattern Jest: `jest.mocked(service.method).mockResolvedValue(...)`

## 🚀 Démarrage Local
```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Docker Compose (complet)
docker-compose up
```

## 🐛 Troubleshooting Courant
- **"Nest can't resolve dependencies":** Vérifier imports module (CommonModule manquant)
- **"Invalid token":** JWT payload format (`{ sub, email }`) ou secret incohérent
- **PostCSS error en frontend:** `postcss.config.js` doit utiliser `export default` (ES module)
- **TypeORM path aliases:** Vérifier `tsconfig.json` paths + `baseUrl` backend
- **npm ci vs npm install:** Docker utilise `npm ci` - mettre à jour `package-lock.json` après modifs

## 📋 User Stories Validées
- ✅ US03: Inscription - Email unique, mot de passe 8+ chars, Bcrypt, JWT retourné
- ✅ US04: Connexion - Authentification par email/password, JWT retourné
- 🟡 US01/07: Upload (à venir) - Token UUID, taille max 1 Go
- 🟡 US02: Download - POST endpoint avec mot de passe optionnel
- 🟡 US05/06: Historique/Suppression - Vérifier `user_id` propriétaire
- 🟡 US08: Tags - 0-N tags, 30 chars max
- 🟡 US09: Sécurité fichier - Mot de passe optionnel 6+ chars
- 🟡 US10: Expiration - 1-7 jours, purge via Cron

## 📚 Fichiers Référence Clés
- `AGENTS.md` (ce fichier)
- `AGENTS.md.instructions.md` (règles projet détaillées)
- `TESTING_US03_US04.md` (procédure test complète)
- `docker-compose.yml` (services locaux)
- `backend/src/app.module.ts` (racine NestJS)
- `backend/src/common/common.module.ts` (JWT & guards)
