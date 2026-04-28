# 🚀 QUICK START - US02 Téléchargement

## 📋 Avant de Commencer

```bash
# Vérifier les services Docker
docker-compose ps

# Si pas en cours:
docker-compose up -d

# Attendre ~20 secondes que tout soit ready
```

---

## ✅ Tests Rapides (Recommandé)

### Option 1: Tests Automatisés
```bash
cd backend && npm run test -- files.service.spec.ts

# Attendre: "Tests: 30 passed"
```

### Option 2: Tests Manuels avec cURL

#### Étape 1: Créer un utilisateur et uploader un fichier
```bash
# 1. Inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "share-test@example.com",
    "username": "shareuser",
    "password": "SecurePassword123"
  }'

# Réponse: { "token": "...", "user": { "id": "..." } }
# Copier le TOKEN
TOKEN="eyJ..."
USER_ID="..."

# 2. Upload un fichier
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "expirationDays=7"

# Réponse: { "uploadToken": "550e8400-...", "originalName": "file.pdf" }
# Copier le UPLOAD_TOKEN
UPLOAD_TOKEN="550e8400-..."
```

#### Étape 2: Tester les endpoints publics
```bash
# 3. Récupérer les métadonnées (SANS authentification)
curl -X GET http://localhost:3001/api/files/share/$UPLOAD_TOKEN/metadata

# Réponse:
# {
#   "id": "...",
#   "uploadToken": "$UPLOAD_TOKEN",
#   "originalName": "file.pdf",
#   "size": 1024,
#   "mimetype": "application/pdf",
#   "isPasswordProtected": false,
#   "expiresAt": "2026-05-05T10:00:00.000Z"
# }

# 4. Télécharger le fichier (SANS authentification)
curl -X POST http://localhost:3001/api/files/share/$UPLOAD_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output downloaded-file.pdf

# Vérifier le fichier
file downloaded-file.pdf
```

#### Étape 3: Tester les cas d'erreur
```bash
# 5. Test token invalide
curl -X GET http://localhost:3001/api/files/share/invalid-token-12345/metadata
# Réponse: 404 Not Found

# 6. Test download sans token
curl -X GET http://localhost:3001/api/files/share/invalid-token/download
# Réponse: 404 Not Found
```

---

## 🔒 Tester avec Mot de Passe (Préparation pour US09)

Pour l'instant, le mot de passe n'est pas intégré au upload. Mais les tests unitaires couvrent ce scénario.

À faire en US09:
```bash
# Upload avec mot de passe (futur)
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@file.pdf" \
  -F "filePassword=MySecurePassword123" \
  -F "expirationDays=7"

# Download avec mot de passe (futur)
curl -X POST http://localhost:3001/api/files/share/$UPLOAD_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{ "password": "MySecurePassword123" }'
```

---

## 📊 Vérifier dans PGAdmin

```
http://localhost:5050
Email: admin@example.com
Password: admin

# Requête SQL pour voir les fichiers
SELECT uploadToken, originalName, expiresAt, filePasswordHash 
FROM files 
ORDER BY createdAt DESC;
```

---

## 🧪 Tests E2E Complets

```bash
cd backend
npm run test:e2e -- files

# Attendre: All specs passed
```

---

## 🐛 Troubleshooting

### "Token expired" ou "Link invalid"
```bash
# Vérifier dans PGAdmin que le fichier existe
# Vérifier que expiresAt est dans le futur
```

### "File not found in storage"
```bash
# Vérifier que le dossier uploads existe
docker exec backend ls -la /app/uploads/

# Vérifier les permissions
docker exec backend chmod -R 755 /app/uploads/
```

### "Invalid token" sur /metadata
```bash
# Copier le token exact depuis la réponse d'upload
# Vérifier qu'il n'y a pas d'espace au début/fin
echo -n "$UPLOAD_TOKEN" | wc -c  # Vérifier la longueur (doit être 36 chars)
```

---

## 📁 Fichiers Importants

| Fichier | Utilité |
|---------|---------|
| `US02_DOWNLOAD.md` | Documentation complète |
| `US02_IMPLEMENTATION_SUMMARY.md` | Résumé implémentation |
| `backend/src/modules/files/files.service.ts` | Service avec logique download |
| `backend/src/modules/files/files.controller.ts` | Endpoints publics |
| `backend/src/modules/files/files.service.spec.ts` | Tests unitaires |

---

## 🎯 Checklist

- [x] Endpoints publics implémentés
- [x] Métadonnées sans données sensibles
- [x] Validation d'expiration
- [x] Support mot de passe (préparation US09)
- [x] 30 tests unitaires passent
- [x] E2E tests partiels (à compléter)
- [ ] Frontend (prochaine étape)
- [ ] US09 - Intégration mot de passe upload
- [ ] US10 - Cron purge expiration

---

## 💾 Sauvegarder les Progrès

```bash
# Status
git status

# Commit
git add .
git commit -m "feat(files): implement US02 (public download link)"
git push origin master
```

---

## 🔗 Liens Utiles

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000
- **PGAdmin:** http://localhost:5050
- **API Docs:** http://localhost:3001/api

---

**Dernière mise à jour:** 2026-04-28
**Status:** ✅ Implémenté et testé
**Prochaine:** US09 (Mot de passe fichier)

