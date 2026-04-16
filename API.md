# API Documentation

Base URL : `http://localhost:3001/api`

## Authentification

Tous les endpoints protégés nécessitent un header JWT :

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register (Créer un compte)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "secure_password123"
}
```

**Response (201)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Login (Se connecter)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

**Response (200)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Me (Infos utilisateur connecté) ⚡
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

---

### Logout (Déconnexion)
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "Logged out successfully"
}
```

---

## Users Endpoints

### Lister tous les utilisateurs ⚡
```http
GET /users
Authorization: Bearer <token>
```

**Response (200)**
```json
[
  {
    "id": "uuid",
    "email": "user1@example.com",
    "username": "user1",
    "role": "user",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  ...
]
```

---

### Obtenir un utilisateur ⚡
```http
GET /users/:id
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "role": "user",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### Modifier un utilisateur ⚡
```http
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

**Response (200)**
```json
{
  "id": "uuid",
  "email": "newemail@example.com",
  "username": "new_username",
  "role": "user",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### Supprimer un utilisateur ⚡
```http
DELETE /users/:id
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "User deleted successfully"
}
```

---

## Files Endpoints

### Lister mes fichiers ⚡
```http
GET /files
Authorization: Bearer <token>
```

**Response (200)**
```json
[
  {
    "id": "uuid",
    "name": "1705315200000-document.pdf",
    "originalName": "document.pdf",
    "mimetype": "application/pdf",
    "size": 1024000,
    "storageType": "local",
    "userId": "user-uuid",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  ...
]
```

---

### Uploader un fichier ⚡
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary data>
```

**Response (201)**
```json
{
  "id": "uuid",
  "name": "1705315200000-document.pdf",
  "originalName": "document.pdf",
  "mimetype": "application/pdf",
  "size": 1024000,
  "storageType": "local",
  "userId": "user-uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### Télécharger un fichier ⚡
```http
GET /files/:id/download
Authorization: Bearer <token>
```

**Response (200)**
- Content-Type: application/octet-stream
- Content-Disposition: attachment; filename="document.pdf"
- Body: <binary file content>

---

### Supprimer un fichier ⚡
```http
DELETE /files/:id
Authorization: Bearer <token>
```

**Response (200)**
```json
{
  "message": "File deleted successfully"
}
```

---

## Error Handling

### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 - Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Codes de Statut HTTP

| Code | Signification |
|------|--------------|
| 200  | OK - Requête réussie |
| 201  | Created - Ressource créée |
| 400  | Bad Request - Données invalides |
| 401  | Unauthorized - Token invalide/manquant |
| 403  | Forbidden - Accès refusé |
| 404  | Not Found - Ressource non trouvée |
| 409  | Conflict - Conflit (ex: email déjà utilisé) |
| 500  | Internal Server Error - Erreur serveur |

---

## Tests avec cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Lister fichiers
```bash
curl -X GET http://localhost:3001/api/files \
  -H "Authorization: Bearer <your_token>"
```

### Uploader fichier
```bash
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/file.pdf"
```

---

## Limitations et Considérations

- Taille max fichier : configurable (actuellement ilimitée)
- Durée token JWT : 3600s (1h)
- Rate limiting : non configuré (à ajouter)
- Expiration fichiers : suppression auto quotidienne (minuit)

