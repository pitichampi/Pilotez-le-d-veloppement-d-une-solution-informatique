---
applyTo: '**'
description: 'Directives de développement, stack technique et User Stories pour le projet DataShare'
---

# CONTEXTE PROJET : DATASHARE
Service de partage de fichiers sécurisé avec liens temporaires. L'agent IA doit agir comme un développeur senior sous la supervision de l'humain.

## STACK TECHNIQUE
- **Backend :** NestJS (TypeScript).
- **Frontend :** React 18+ (Vite) + TailwindCSS.
- **Base de données :** PostgreSQL + TypeORM (Migrations obligatoires).
- **Cache :** Redis.
- **Stockage :** Système de fichiers local (FS) via un `StorageService` abstrait.
- **Qualité :** Jest & Supertest (Couverture cible : 70%).

## USER STORIES & LOGIQUE MÉTIER
- **US01/07 (Upload) :** Taille max 1 Go. Génération d'un token UUID v4 unique.
- **US02 (Download) :** L'endpoint final de téléchargement doit être un **POST** (sécurisation du mot de passe).
- **US03/04 (Auth) :** Inscription (email unique) et Connexion via JWT Stateless (8 car. min pour le mot de passe).
- **US05/06 (Gestion) :** Accès à l'historique et suppression réservés au propriétaire (vérification `user_id`).
- **US08 (Tags) :** 0 à N tags par fichier (30 car. max par tag).
- **US09 (Sécurité) :** Mot de passe fichier optionnel (6 car. min) haché avec Bcrypt.
- **US10 (Expiration) :** Durée de vie entre 1 et 7 jours. Purge automatique via tâche Cron quotidienne.

## SÉCURITÉ & RÈGLES DE CODE
- **Validation :** Utilisation de `class-validator` avec `ValidationPipe` global.
- **Vérification Fichiers :** Contrôle des types MIME via `file-type` (pas seulement l'extension).
- **Extensions interdites :** .exe, .bat, .sh, .msi, .cmd, .ps1.
- **Hachage :** Bcrypt (cost 10) pour tous les secrets.
- **Architecture :** Isoler la logique de stockage dans un service dédié pour faciliter une future migration S3.
- **Commits :** Respecter strictement la norme **Conventional Commits**.

## INSTRUCTIONS DE GÉNÉRATION
1. Préférer l'architecture modulaire NestJS.
2. Toujours inclure les DTOs de validation pour les nouveaux endpoints.
3. Accompagner les services critiques de leurs tests unitaires `.spec.ts`.
4. En cas d'ambiguïté sur la sécurité, prioriser la solution la plus restrictive.

## CONTRAT INTERFACE
# Contrat d'interface — DataShare API

## Stack technique retenu

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | **React 18 + Vite** | SPA fluide, ecosystème riche, option valide selon specs |
| Backend | **NestJS (TypeScript)** | Le plus structuré et léger des choix JS imposés — modules, DI, decorators natifs |
| ORM | **TypeORM** | Intégration native NestJS, migrations, support PostgreSQL complet |
| Base de données | **PostgreSQL** | Robustesse, UUID natif, transactions ACID |
| Stockage | **Local FS (MVP) → abstraction StorageService** | Simple à déployer ; interface swappable vers S3 sans toucher aux controllers |
| Auth | **@nestjs/jwt + bcrypt** | JWT stateless, bcrypt pour hash mots de passe (coût configurable) |
| Upload | **Multer (via @nestjs/platform-express)** | Intégré NestJS, validation taille/type via FileInterceptor |
| Scheduler | **@nestjs/schedule** | Cron embarqué, zéro dépendance externe (pas de Celery/Redis nécessaires) |
| Validation | **class-validator + class-transformer** | Pipes NestJS natifs, DTOs typés |
| CSS | **TailwindCSS** | Fidélité maquettes (palette orange/warm `#e27f29`, fonds crème `#f3eeea`) |
| Tests | **Jest + Supertest** | Stack test natif NestJS |
| Containerisation | **Docker + Docker Compose** | PostgreSQL + app en un seul `docker compose up` |

---

## Conventions générales

- **Base URL** : `/api/v1` (préfixe global NestJS via `app.setGlobalPrefix('api/v1')`)
- **Port** : `3000` (NestJS default)
- **Format** : JSON exclusivement (sauf téléchargement = `application/octet-stream`)
- **Authentification** : Header `Authorization: Bearer <jwt>`
- **Dates** : ISO 8601 UTC (`2025-04-22T10:00:00Z`)
- **IDs** : UUID v4 (`crypto.randomUUID()`)
- **Erreurs** : objet NestJS standard `{ "statusCode": N, "message": "...", "error": "SNAKE_CASE" }`
- **Validation** : `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` global

---

## Endpoints

### Auth

#### `POST /auth/register`
Créer un compte.

**Body (RegisterDto)**
```json
{ "email": "alice@example.com", "password": "S3cur3Pass!" }
```

**Réponse 201**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "alice@example.com", "created_at": "..." }
}
```

Erreurs : `409 EMAIL_TAKEN`, `422` (class-validator)

---

#### `POST /auth/login`
**Body (LoginDto)** : `{ "email": "...", "password": "..." }`

**Réponse 200** : même structure qu'au register.

Erreurs : `401 INVALID_CREDENTIALS`

---

#### `GET /auth/me` 🔒
Profil de l'utilisateur courant.

**Réponse 200** : `{ "id", "email", "created_at" }`

---

### Files

#### `POST /files` 🔒
Upload d'un fichier (utilisateur authentifié).

**Content-Type** : `multipart/form-data`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `file` | binary | ✅ | max 1 Go ; types interdits : `.exe .bat .sh .msi .cmd .ps1` |
| `expires_in_days` | integer | ❌ | 1–7, défaut 7 |
| `password` | string | ❌ | min 6 caractères ; hashé bcrypt côté serveur |
| `tags` | string[] | ❌ | max 30 chars/tag ; dédoublonnés automatiquement |

**Réponse 201**
```json
{
  "id": "uuid",
  "token": "a1b2c3d4_non_predictible",
  "download_url": "http://localhost:3000/d/a1b2c3d4",
  "original_name": "rapport.pdf",
  "size_bytes": 204800,
  "mime_type": "application/pdf",
  "expires_at": "2025-04-22T10:00:00Z",
  "has_password": false,
  "tags": ["projet", "Q4"]
}
```

Erreurs : `400 FILE_TOO_LARGE`, `400 FORBIDDEN_FILE_TYPE`, `401`

---

#### `POST /files/anonymous`
Upload sans compte (non authentifié uniquement).

Règles identiques à `/files` — `user_id` reste `null` en BDD. Pas d'historique.

Erreurs : `400`, `403` (si token JWT présent dans la requête)

---

#### `GET /files` 🔒
Historique des fichiers de l'utilisateur.

**Query** : `include_expired=false` (défaut — n'affiche que les fichiers valides)

**Réponse 200** : tableau de `FileListItem` trié par `created_at DESC`.

---

#### `GET /files/{token}`
Métadonnées avant téléchargement (public, pas d'auth).

**Réponse 200**
```json
{
  "original_name": "rapport.pdf",
  "size_bytes": 204800,
  "mime_type": "application/pdf",
  "expires_at": "2025-04-22T10:00:00Z",
  "has_password": true
}
```

Erreurs : `404`, `410 FILE_EXPIRED`

---

#### `POST /files/{token}/download`
Télécharger le fichier.

> Méthode **POST** (non GET) — le mot de passe transite dans le body, jamais dans l'URL ni les logs.

**Body** (uniquement si fichier protégé) :
```json
{ "password": "monsecret" }
```

**Réponse 200** : stream binaire
```
Content-Disposition: attachment; filename="rapport.pdf"
Content-Type: application/pdf
```

Erreurs : `401 WRONG_PASSWORD`, `404`, `410 FILE_EXPIRED`

---

#### `DELETE /files/{id}` 🔒
Supprimer un fichier (propriétaire uniquement).

Suppression physique fichier + toutes métadonnées BDD. Irréversible.
Confirmation côté front requise avant appel.

**Réponse 204** : no content

Erreurs : `403 FORBIDDEN`, `404`

---

## Codes d'erreur métier

| Code | HTTP | Signification |
|---|---|---|
| `EMAIL_TAKEN` | 409 | Email déjà enregistré |
| `INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `FILE_TOO_LARGE` | 400 | Taille dépasse 1 Go |
| `FORBIDDEN_FILE_TYPE` | 400 | Extension non autorisée |
| `FILE_EXPIRED` | 410 | Lien expiré |
| `WRONG_PASSWORD` | 401 | Mot de passe de fichier incorrect |
| `FORBIDDEN` | 403 | Action non autorisée sur cette ressource |

---

## Points d'implémentation NestJS clés

**Structure des modules :**
```
src/
  auth/           AuthModule (guards, strategies Passport, service)
  files/          FilesModule (controller, service, cron, storage.service)
  users/          UsersModule (entity, repository)
  common/         Filtres d'exception globaux, intercepteurs
  config/         ConfigModule (.env validation avec Joi)
```

**Guard JWT :** `@UseGuards(JwtAuthGuard)` sur tous les endpoints 🔒. Le guard expose `req.user` avec `{ id, email }`.

**Upload :** `@UseInterceptors(FileInterceptor('file', multerOptions))` — `multerOptions` valide la taille (1 Go) et le mime type avant même d'atteindre le service.

**Cron de purge :** `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` dans `FilesService` — supprime fichiers + entrées BDD expirés.

**Streaming téléchargement :** `res.setHeader(...)` + `createReadStream(path).pipe(res)` — pas de chargement en mémoire.

**Sécurité :** Validation systématique côté serveur (ValidationPipe global) indépendamment des contrôles front. Extension interdite vérifiée via mime-type détecté par `file-type` (et non seulement le nom du fichier fourni par le client).
