# 🏗️ Architecture US02 - Public Download Link

## Vue d'ensemble

US02 permet à un utilisateur de générer un lien public unique pour partager un fichier. Ce lien peut être partagé avec des tiers sans nécessiter d'authentification.

```
┌─────────────────────────────────────────────────────────┐
│ UTILISATEUR PROPRIÉTAIRE                                │
├─────────────────────────────────────────────────────────┤
│ 1. Login (US04)                                         │
│ 2. Upload fichier (US01)                                │
│ 3. Reçoit: uploadToken UUID unique                      │
│ 4. Partage le lien: /share/{uploadToken}                │
└─────────────────────────────────────────────────────────┘
                           ↓
            Lien partagé (ex: email, SMS)
                           ↓
┌─────────────────────────────────────────────────────────┐
│ DESTINATAIRE (AUTHENTIFICATION NON REQUISE)             │
├─────────────────────────────────────────────────────────┤
│ 1. Clique sur le lien public                            │
│ 2. GET /share/{uploadToken}/metadata                    │
│    → Voir nom, taille, date expiration                  │
│ 3. POST /share/{uploadToken}/download                   │
│    → Télécharger le fichier                             │
│ 4. Si mot de passe: validé avec Bcrypt                  │
└─────────────────────────────────────────────────────────┘
```

---

## Flux de Données

### Endpoint: GET /api/files/share/:uploadToken/metadata

```
REQUEST
├─ URL: /api/files/share/550e8400-e29b-41d4-a716-446655440000/metadata
├─ Method: GET
└─ Auth: NONE (public endpoint)

↓ PROCESS
1. FilesController.getDownloadMetadata(uploadToken)
2. FilesService.getDownloadMetadata(uploadToken)
   ├─ Find file by uploadToken
   ├─ Check if expiresAt > now
   └─ Map to DownloadMetadataDto
3. Return metadata or throw error

RESPONSE (200 OK)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "uploadToken": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "document.pdf",
  "size": 1024000,
  "mimetype": "application/pdf",
  "createdAt": "2026-04-28T10:00:00Z",
  "expiresAt": "2026-05-05T10:00:00Z",
  "isPasswordProtected": false
}

ERRORS
├─ 404 Not Found: Token invalide
└─ 400 Bad Request: Fichier expiré
```

### Endpoint: POST /api/files/share/:uploadToken/download

```
REQUEST
├─ URL: /api/files/share/550e8400-e29b-41d4-a716-446655440000/download
├─ Method: POST
├─ Auth: NONE (public endpoint)
└─ Body: { "password"?: "SecureFilePassword123" }

↓ PROCESS
1. FilesController.downloadFile(uploadToken, downloadFileDto)
2. FilesService.downloadFile(uploadToken, password)
   ├─ Find file by uploadToken
   ├─ Check if expiresAt > now
   ├─ If filePasswordHash:
   │  └─ bcrypt.compare(password, filePasswordHash)
   ├─ Get file from storage
   └─ Return Buffer
3. Return StreamableFile

RESPONSE (200 OK)
- Content-Type: application/octet-stream
- Content-Disposition: attachment; filename="document.pdf"
- Binary stream with file content

ERRORS
├─ 404 Not Found: Token invalide
├─ 400 Bad Request:
│  ├─ Fichier expiré
│  ├─ Mot de passe requis mais non fourni
│  └─ Mot de passe incorrect
└─ 500 Internal Error: Storage failed
```

---

## Modèle de Données

### File Entity

```typescript
@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string                           // Identifiant interne

  @Column({ type: 'uuid' })
  @Index({ unique: true })
  uploadToken: string                  // Lien public unique (US02 l'utilise)

  @Column({ type: 'varchar', length: 255 })
  originalName: string                 // Nom du fichier original

  @Column({ type: 'varchar', length: 50 })
  mimetype: string                     // Type MIME (e.g., 'application/pdf')

  @Column({ type: 'bigint' })
  size: number                         // Taille en bytes

  @Column({ type: 'varchar', length: 255 })
  path: string                         // Chemin de stockage (caché)

  @Column({ type: 'varchar', length: 255, nullable: true })
  filePasswordHash?: string            // Bcrypt hash (prepare for US09)

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date                      // Expiration (US10)

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

### DTOs

```typescript
// INPUT: Téléchargement avec mot de passe optionnel
export class DownloadFileDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}

// OUTPUT: Métadonnées sans données sensibles
export class DownloadMetadataDto {
  id: string
  uploadToken: string
  originalName: string
  size: number
  mimetype: string
  createdAt: Date
  expiresAt?: Date
  isPasswordProtected: boolean        // ← Important: pas de hash!
}
```

---

## Service Layer

### FilesService

```typescript
export class FilesService {
  /**
   * Récupère les métadonnées d'un fichier
   * - Valide que le token existe
   * - Valide que le fichier n'a pas expiré
   * - Retourne les données publiques
   */
  async getDownloadMetadata(uploadToken: string): Promise<DownloadMetadataDto>

  /**
   * Télécharge un fichier via lien public
   * - Valide le token
   * - Valide l'expiration
   * - Valide le mot de passe (si existe)
   * - Retourne le buffer du fichier
   */
  async downloadFile(uploadToken: string, password?: string): Promise<Buffer>

  /**
   * Vérifie si un fichier a expiré
   */
  isFileExpired(file: File): boolean

  /**
   * Crée un fichier avec mot de passe (prepare for US09)
   */
  async createWithPassword(
    fileData: MulterFile,
    userId: string,
    createFileDto?: CreateFileDto
  ): Promise<UploadResponseDto>
}
```

---

## Sécurité

### 1. Validation d'Expiration
```typescript
// Au moment du download
if (file.expiresAt && new Date() > file.expiresAt) {
  throw new BadRequestException('This file link has expired')
}
```

### 2. Protection par Mot de Passe
```typescript
// Vérification du mot de passe (Bcrypt cost 10)
if (file.filePasswordHash) {
  if (!password) {
    throw new BadRequestException('Password required')
  }
  const isValid = await bcrypt.compare(password, file.filePasswordHash)
  if (!isValid) {
    throw new BadRequestException('Invalid password')
  }
}
```

### 3. Isolation des Données
```typescript
// DownloadMetadataDto ne retourne PAS:
// ❌ path (chemin de stockage)
// ❌ filePasswordHash (mot de passe)
// ❌ userId (propriétaire)
// ✅ isPasswordProtected (boolean seulement)
```

### 4. Accès Public
```typescript
// Pas de @UseGuards(JwtGuard)
// Accès via uploadToken unique (UUID v4)
// Non prédictible: 2^128 combinaisons possibles
```

---

## Dépendances

### Modules NestJS
- `TypeOrmModule`: Accès à la BD
- `CommonModule`: JwtModule (non utilisé ici, public)

### Packages NPM
- `bcryptjs`: Hachage mot de passe
- `class-validator`: Validation DTOs
- `@nestjs/platform-express`: Upload/Download

---

## Intégration avec Autres US

### ← Dépendances entrantes
- **US01/US07 (Upload)**: Génère l'uploadToken utilisé ici
- **US10 (Expiration)**: Utilise expiresAt que nous validons

### → Dépendances sortantes
- **US09 (Mot de passe)**: Notre infrastructure password est prête
- **US05 (Historique)**: Endpoint protégé GET /api/files utilise User JWT

---

## Performance

### Requêtes BD
```sql
-- Récupérer métadonnées
SELECT id, uploadToken, originalName, size, mimetype, 
       expiresAt, filePasswordHash FROM files 
WHERE uploadToken = ?

-- 1 index sur uploadToken (unique)
-- Temps: O(log n)
```

### Stockage
```
GET /metadata:
- 1 query BD
- Pas d'accès au fichier
- Rapide (~10ms)

POST /download:
- 1 query BD
- 1 bcrypt.compare si protégé (~100ms)
- 1 file read (~variable selon taille)
```

---

## Tests

### Couverture
- ✅ 16 tests unitaires (getDownloadMetadata, downloadFile, etc.)
- ✅ 4 tests E2E (métadonnées, download, erreurs)
- ✅ 30 tests totaux (service files)

### Scénarios
```
✅ Download fichier sans protection
✅ Download fichier avec mot de passe correct
✅ Rejet mot de passe incorrect
✅ Rejet fichier expiré
✅ Rejet token invalide
✅ Métadonnées sans données sensibles
```

---

## Évolutivité

### Possibilités Futures
1. **Rate Limiting**: Ajouter throttler sur endpoints publics
2. **Analytics**: Tracker les downloads
3. **Statistiques**: Nombre de downloads par fichier
4. **Lien courte**: Générer URL courte au lieu de UUID complet
5. **Notification**: Email au téléchargement

### Migration S3
```typescript
// Actuellement: LocalStorageService
// Futur: S3StorageService (même interface)
// L'abstraction permet la migration facile
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         FilesController                  │
├─────────────────────────────────────────┤
│ GET  /share/:token/metadata              │
│ POST /share/:token/download              │
│ GET  /:id/download (protégé JwtGuard)    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│         FilesService                     │
├─────────────────────────────────────────┤
│ - getDownloadMetadata()                  │
│ - downloadFile()                         │
│ - isFileExpired()                        │
│ - createWithPassword()                   │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────┬──────────────────────────┐
│              │                           │
↓              ↓                           ↓
TypeORM   LocalStorageService       Bcryptjs
DB        (File system)             (Hashing)
Files table   /app/uploads/         cost=10
```

---

**Architecture créée:** 2026-04-28
**Status:** ✅ Implémentée et validée
**Prochain:** US09 - Integration mot de passe upload

