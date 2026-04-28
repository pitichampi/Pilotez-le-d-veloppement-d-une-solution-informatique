# 🔗 US02 - Download (Téléchargement via lien public)

## 📋 Résumé de l'implémentation

L'implémentation US02 permet aux utilisateurs de partager des fichiers via des liens publiques. Les destinataires peuvent:
1. Consulter les métadonnées du fichier (nom, taille, type, date d'expiration)
2. Télécharger le fichier avec validation de mot de passe optionnel

## 🏗️ Architecture

### Endpoints Créés

#### 1. GET `/api/files/share/:uploadToken/metadata`
Récupère les métadonnées d'un fichier pour téléchargement public.

**Authentification:** Non requise (lien public)

**Réponse (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "uploadToken": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "document.pdf",
  "size": 1024000,
  "mimetype": "application/pdf",
  "createdAt": "2026-04-23T10:00:00Z",
  "expiresAt": "2026-04-30T10:00:00Z",
  "isPasswordProtected": false
}
```

**Erreurs:**
- `404 Not Found`: Token invalide ou fichier n'existe pas
- `400 Bad Request`: Le lien a expiré

#### 2. POST `/api/files/share/:uploadToken/download`
Télécharge un fichier via son lien public avec validation de mot de passe optionnel.

**Authentification:** Non requise (lien public)

**Body (optionnel):**
```json
{
  "password": "SecureFilePassword123"  // Requis si filePasswordHash existe
}
```

**Response (200 OK):**
Le fichier est retourné en tant que stream binaire

**Headers de réponse:**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"
```

**Erreurs:**
- `404 Not Found`: Token invalide ou fichier n'existe pas
- `400 Bad Request`: 
  - Lien expiré
  - Mot de passe requis mais non fourni
  - Mot de passe incorrect

### DTOs Créés

#### `DownloadMetadataDto`
```typescript
{
  id: string                    // UUID du fichier
  uploadToken: string           // Token d'accès unique
  originalName: string          // Nom du fichier
  size: number                  // Taille en bytes
  mimetype: string              // Type MIME
  createdAt: Date               // Date de création
  expiresAt?: Date              // Date d'expiration (optionnel)
  isPasswordProtected: boolean  // Indicateur de protection
}
```

#### `DownloadFileDto`
```typescript
{
  password?: string  // Mot de passe optionnel (min 6 chars)
}
```

### Méthodes de Service

#### `getDownloadMetadata(uploadToken: string): Promise<DownloadMetadataDto>`
Récupère les métadonnées d'un fichier avec vérification d'expiration.

**Validations:**
- Token doit correspondre à un fichier existant
- Fichier ne doit pas être expiré

#### `downloadFile(uploadToken: string, password?: string): Promise<Buffer>`
Télécharge un fichier avec validation du mot de passe.

**Validations:**
- Token valide
- Fichier non expiré
- Mot de passe correct si filePasswordHash existe

#### `isFileExpired(file: File): boolean`
Vérifie si un fichier a expiré.

#### `createWithPassword(...): Promise<UploadResponseDto>`
Crée un fichier avec mot de passe optionnel (hachage Bcrypt).

## 🔒 Sécurité

### Validations de Sécurité Implémentées

1. **Expiration des fichiers**
   - Vérification automatique de `expiresAt`
   - Lien invalide après expiration
   - Gestion avec US10 (Cron purge)

2. **Mot de passe protégé**
   - Hash Bcrypt avec cost 10
   - Comparaison sécurisée avec `bcrypt.compare()`
   - Messages d'erreur génériques (pas de révélation d'info)

3. **Isolation des données**
   - Les métadonnées ne exposent que les infos nécessaires
   - Le chemin de stockage ne doit jamais être exposé
   - Le mot de passe hashé ne doit jamais être retourné

4. **Accès public**
   - Endpoints publics (pas de JwtGuard)
   - Accès via lien unique (UUID non prédictible)
   - Toute personne disposant du lien peut télécharger

## 🧪 Tests

### Tests Unitaires (`files.service.spec.ts`)

**Nouvelle suite: `US02 - Download`**

- ✅ `getDownloadMetadata`:
  - Retourne métadonnées valides
  - Retourne 404 si fichier invalide
  - Retourne 400 si fichier expiré
  - Indique l'état de protection par mot de passe

- ✅ `downloadFile`:
  - Télécharge fichier sans mot de passe
  - Retourne 404 si fichier invalide
  - Retourne 400 si fichier expiré
  - Requiert mot de passe si protégé
  - Rejette mot de passe incorrect
  - Accepte mot de passe correct

- ✅ `isFileExpired`:
  - Retourne false si pas d'expiration
  - Retourne false si expiration future
  - Retourne true si expiration passée

- ✅ `createWithPassword`:
  - Crée fichier avec mot de passe hashé
  - Crée fichier sans mot de passe si optionnel
  - Retourne 400 si no file

### Tests E2E (`test/files.e2e-spec.ts`)

**Nouvelle suite: `US02 - Download Public Link`**

- ✅ GET `/api/files/share/:uploadToken/metadata`:
  - Récupère métadonnées sans auth
  - Retourne 404 pour token invalide

- ✅ POST `/api/files/share/:uploadToken/download`:
  - Télécharge fichier sans auth
  - Retourne 404 pour token invalide
  - Peut être étendu avec protection par mot de passe

## 🔄 Intégration avec Autres US

### US09 (Sécurité fichier - Mot de passe)
La logique de gestion du mot de passe est prête:
- `filePasswordHash` stocke le mot de passe hashé
- `createWithPassword()` permet de créer un fichier protégé
- `downloadFile()` valide le mot de passe avec Bcrypt

**À implémenter dans l'upload:**
```typescript
// Dans le DTO d'upload
@IsOptional()
@IsString()
@MinLength(6)
filePassword?: string

// Dans le controller
async upload(..., @Body() createFileDto: CreateFileDto) {
  return this.filesService.createWithPassword(file, req.user.sub, createFileDto)
}
```

### US10 (Expiration - Purge Cron)
La vérification d'expiration est implémentée:
- `expiresAt` vérifié à chaque tentative de download
- La purge côté tâche Cron devra supprimer les fichiers expirés

### US05/US06 (Historique/Suppression)
- L'endpoint `/api/files/share/:uploadToken/download` est public
- Les endpoints `/api/files/:id/download` et DELETE restent protégés par JwtGuard

## 📝 Exemple d'Utilisation

### Flux Complet de Partage

```bash
# 1. Utilisateur upload un fichier
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.pdf" \
  -F "expirationDays=7"

# Réponse:
# {
#   "uploadToken": "550e8400-e29b-41d4-a716-446655440000",
#   "originalName": "document.pdf",
#   "size": 1024000,
#   "createdAt": "2026-04-23T10:00:00Z",
#   "expiresAt": "2026-04-30T10:00:00Z"
# }

# 2. Utilisateur partage le lien publique
# https://myapp.com/share/550e8400-e29b-41d4-a716-446655440000

# 3. Destinataire récupère les métadonnées
curl -X GET http://localhost:3001/api/files/share/550e8400-e29b-41d4-a716-446655440000/metadata

# Réponse:
# {
#   "originalName": "document.pdf",
#   "size": 1024000,
#   "isPasswordProtected": false,
#   "expiresAt": "2026-04-30T10:00:00Z"
# }

# 4. Destinataire télécharge le fichier
curl -X POST http://localhost:3001/api/files/share/550e8400-e29b-41d4-a716-446655440000/download \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output document.pdf
```

## 🚀 Prochaines Étapes

1. **US09 (Sécurité):** Intégrer `filePassword` dans le DTO d'upload
2. **US10 (Expiration):** Implémenter la tâche Cron de purge des fichiers expirés
3. **Frontend:** Créer les composants de partage et téléchargement
4. **Rate Limiting:** Ajouter `@nestjs/throttler` pour éviter les abus

## 📚 Références

- Fichiers modifiés:
  - `backend/src/modules/files/files.service.ts`
  - `backend/src/modules/files/files.controller.ts`
  - `backend/src/modules/files/dto/download-metadata.dto.ts` (nouveau)
  - `backend/src/modules/files/dto/download-file.dto.ts` (nouveau)

- Tests:
  - `backend/src/modules/files/files.service.spec.ts`
  - `backend/test/files.e2e-spec.ts`

