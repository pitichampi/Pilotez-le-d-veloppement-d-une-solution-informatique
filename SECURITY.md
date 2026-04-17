# Plan de Sécurité

## Vue d'ensemble

Ce document couvre les mesures de sécurité mises en place pour le projet, incluant les scans de dépendances, les analyses de vulnérabilités et les décisions de sécurité.

**Objectif :** Garantir que le MVP répond aux standards de sécurité minimaux et que les dépendances ne contiennent pas de vulnérabilités critiques.

---

## 1. Scan de sécurité des dépendances

### 1.1 Outils utilisés

#### NPM Audit

```bash
# Audit global de toutes les dépendances
npm audit

# Backend
cd backend && npm audit

# Frontend  
cd frontend && npm audit
```

#### Snyk (Optionnel mais recommandé)

```bash
npm install -g snyk
snyk auth
snyk test --all-projects
```

### 1.2 Seuils d'acceptation

| Niveau | Seuil | Action |
|--------|-------|--------|
| **Critical** | 0 accepté | Bloquer le déploiement |
| **High** | 0 accepté | Bloquer le déploiement |
| **Medium** | 1-2 max | Approuver si patch non dispo |
| **Low** | Gérer au cas par cas | Planifier correction |

### 1.3 Procédure de scan

```bash
# À la racine du projet
./scripts/security-scan.sh
```

---

## 2. Résultats du scan (Baseline)

### 2.1 Dépendances critiques à monitorer

#### Backend (NestJS)

```json
{
  "dependencies": {
    "@nestjs/common": "10.x",
    "@nestjs/jwt": "11.x",
    "@nestjs/passport": "10.x",
    "typeorm": "0.3.x",
    "pg": "8.x",
    "bcrypt": "5.x",
    "class-validator": "0.14.x",
    "class-transformer": "0.5.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "@types/node": "20.x"
  }
}
```

**Status :** À mesurer lors du setup

#### Frontend (React)

```json
{
  "dependencies": {
    "react": "18.x",
    "react-dom": "18.x",
    "react-router-dom": "6.x",
    "axios": "1.x",
    "tailwindcss": "3.x"
  },
  "devDependencies": {
    "vite": "5.x",
    "typescript": "5.x"
  }
}
```

**Status :** À mesurer lors du setup

---

## 3. Vulnérabilités connues et décisions

### 3.1 Format de rapport

```markdown
| CVE | Package | Version | Sévérité | Décision | Justification |
|-----|---------|---------|----------|----------|---------------|
| CVE-XXXX-YYYY | npm-package | 1.2.3 | High | Patch | Patch disponible, non-bloquant |
| CVE-XXXX-ZZZZ | autre-package | 2.0.0 | Low | Ignore | Impact minime, dépendance transitive |
```

### 3.2 Template de triage des vulnérabilités

Pour chaque vulnérabilité détectée :

1. **Évaluation du risque**
   - Impact sur le MVP ?
   - Surface d'exposition ?
   - Peut être atténué ?

2. **Décision**
   - Patcher immédiatement (Critical/High)
   - Planifier correction (Medium)
   - Ignorer (Low, acceptable)

3. **Trace**
   - Documenter la décision
   - Ajouter au `.npmrc` si nécessaire
   - Planifier follow-up

---

## 4. Mesures de sécurité implémentées

### 4.1 Backend (NestJS)

#### Authentification et autorisation

**JWT avec signatures**
- Secret robuste (min 32 caractères)
- Expiration courte (15 min access token, 7 jours refresh)
- Rotation des secrets en production

**Hachage des mots de passe**
- Bcrypt avec `rounds: 10`
- Jamais stocker en clair
- Validation stricte

**Guards et middlewares**
- `JwtAuthGuard` sur les endpoints protégés
- Validation des rôles
- Rate limiting sur `/api/auth/login`

#### Validation des données

**Class-validator**
- Validation stricte de tous les DTOs
- Pas d'injection SQL (TypeORM paramétrisé)
- Contrôle des types

**Multer (upload de fichiers)**
- Limite de taille : 100 MB
- Types autorisés : whitelist
- Stockage dans répertoire isolé
- Noms de fichiers renommés (UUID)

#### Gestion des secrets

**Variables d'environnement**
- `.env` local (jamais commité)
- `.env.example` pour template
- Secrets distincts dev/staging/prod

### 4.2 Frontend (React)

#### Protection contre les attaques courantes

**XSS (Cross-Site Scripting)**
- React échappe automatiquement les contenus
- Pas de `dangerouslySetInnerHTML` sans validation
- CSP headers recommandés

**CSRF (Cross-Site Request Forgery)**
- Tokens CSRF inclus dans les formulaires
- Vérification Same-Site cookies

**JWT Storage**
- Stockage en localStorage (accessible mais protégé par HTTPS)
- Destruction à la déconnexion
- Intercepteur pour injection automatique

#### Sécurité HTTPS

**Obligation HTTPS**
- Mode développement : HTTP autorisé
- Production : HTTPS obligatoire
- Redirect automatique HTTP → HTTPS

### 4.3 Niveau infrastructure

**Base de données**
- Connexion PostgreSQL avec mot de passe robuste
- Isolation réseau (Docker)
- Backups chiffrés

**Stockage de fichiers**
- Répertoire d'upload hors racine web
- Noms aléatoires (UUID v4)
- Checksums optionnels

**Logs et monitoring**
- Aucune info sensible dans les logs
- Redaction des secrets automatique
- Audit des actions sensibles

---

## 5. Points de suivi

- [ ] Audit npm complet effectué (backend + frontend)
- [ ] Zéro vulnérabilité critique acceptée
- [ ] Rapport d'audit généré et archivé
- [ ] Headers de sécurité configurés
- [ ] Secrets gérés via .env (jamais commité)
- [ ] JWT secret robuste généré
- [ ] Rate limiting activé sur endpoints sensibles
- [ ] Tests de sécurité en CI/CD

---

**Dernière mise à jour :** 17 avril 2026  
**Responsable :** Équipe Sécurité  
**Prochaine révision :** Avant livraison du MVP

