# Plan de Tests - DataShare

## Vue d'ensemble

Ce document décrit le plan de tests complet pour l'application DataShare, un service de partage de fichiers sécurisé avec liens temporaires. Le plan couvre les fonctionnalités obligatoires du MVP avec une combinaison de tests unitaires (Jest) sur les services et de tests d'intégration (Supertest) sur les contrôleurs.

## Objectifs de couverture

- **Couverture cible :** 70% minimum
- **Métriques :** Couverture des lignes, branches et fonctions
- **Rapport :** Généré automatiquement via Jest avec `coverageDirectory: "coverage"`

## Architecture de tests

### Tests unitaires (Jest)
- **Services :** Isolation complète avec mocks des dépendances
- **Logique métier :** Validation des règles de domaine
- **Utilitaires :** Fonctions helpers et transformations

### Tests d'intégration (Supertest)
- **Contrôleurs :** Endpoints API complets
- **Middleware :** Authentification, validation, gestion d'erreurs
- **Base de données :** Interactions réelles avec PostgreSQL en mémoire

## Structure des tests

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.service.spec.ts          # Tests unitaires AuthService
│   │   ├── files/
│   │   │   ├── files.service.spec.ts         # Tests unitaires FilesService
│   │   │   └── files.service.us08-us09.spec.ts # Tests US08/US09
│   │   └── users/
│   │       └── users.service.spec.ts         # Tests unitaires UsersService
│   └── common/                               # Tests pipes, guards, interceptors
└── test/
    ├── auth.e2e-spec.ts                      # Tests e2e authentification
    ├── files.e2e-spec.ts                     # Tests e2e fichiers (upload/download)
    ├── files-expiration.e2e-spec.ts          # Tests e2e expiration
    ├── us08-tags.e2e-spec.ts                 # Tests e2e tags
    └── us09-password.e2e-spec.ts             # Tests e2e mots de passe
```

## Scénarios end-to-end prioritaires

### 1. Upload puis téléchargement via lien
**Objectif :** Valider le workflow complet de partage de fichiers

**Étapes :**
1. Inscription/connexion utilisateur
2. Upload d'un fichier valide
3. Récupération du token de partage
4. Accès aux métadonnées publiques (sans auth)
5. Téléchargement du fichier via lien public

**Critères de succès :**
- Upload réussi avec génération de token unique
- Métadonnées accessibles publiquement
- Téléchargement réussi avec contenu identique
- Headers HTTP corrects (Content-Type, Content-Disposition)

### 2. Tentative de téléchargement après expiration
**Objectif :** Valider la sécurité temporelle des liens

**Étapes :**
1. Upload avec expiration courte (1 jour)
2. Expiration manuelle du fichier (via DB directe en test)
3. Tentative d'accès aux métadonnées → 400 FILE_EXPIRED
4. Tentative de téléchargement → 400 FILE_EXPIRED

**Critères de succès :**
- Expiration détectée correctement
- Accès bloqué pour fichiers expirés
- Messages d'erreur appropriés
- Nettoyage automatique (cron) fonctionnel

### 3. Suppression d'un fichier par son propriétaire
**Objectif :** Valider la gestion des droits et la suppression sécurisée

**Étapes :**
1. Upload de fichier par utilisateur A
2. Tentative de suppression par utilisateur B → 403 FORBIDDEN
3. Suppression par propriétaire (utilisateur A) → 204 No Content
4. Vérification suppression physique et métadonnées

**Critères de succès :**
- Contrôle d'accès strict (user_id)
- Suppression complète (fichier + DB)
- Gestion d'erreurs pour fichiers inexistants
- Isolation entre utilisateurs

## Tests par User Story

### US01/US07 - Upload de fichiers
**Critères d'acceptation :**
- Taille max 1 Go
- Génération token UUID v4 unique
- Validation types MIME (interdiction .exe, .bat, .sh, .msi, .cmd, .ps1)
- Stockage sécurisé via StorageService

**Tests unitaires :**
- `files.service.spec.ts` : create(), validation taille/type
- `files.service.us08-us09.spec.ts` : createWithPassword()

**Tests e2e :**
- `files.e2e-spec.ts` : Upload success/error cases, anonymous upload
- `us08-tags.e2e-spec.ts` : Upload avec tags
- `us09-password.e2e-spec.ts` : Upload avec mot de passe

### US02 - Téléchargement via lien public
**Critères d'acceptation :**
- Endpoint POST pour sécurité (pas GET)
- Métadonnées publiques sans authentification
- Téléchargement avec mot de passe si protégé
- Gestion expiration automatique

**Tests unitaires :**
- `files.service.spec.ts` : getDownloadMetadata(), downloadFile(), isFileExpired()

**Tests e2e :**
- `files.e2e-spec.ts` : Download public, metadata access
- `files-expiration.e2e-spec.ts` : Download avec expiration
- `us09-password.e2e-spec.ts` : Download avec mot de passe

### US03/US04 - Authentification
**Critères d'acceptation :**
- Inscription avec email unique
- Connexion JWT stateless
- Mot de passe min 8 caractères
- Hashage bcrypt (coût 10)

**Tests unitaires :**
- `auth.service.spec.ts` : register(), login(), validateToken()

**Tests e2e :**
- `auth.e2e-spec.ts` : Register/login/me endpoints

### US05 - Historique des fichiers
**Critères d'acceptation :**
- Accès réservé au propriétaire
- Liste triée par date décroissante
- Filtrage expiration optionnel

**Tests unitaires :**
- `files.service.spec.ts` : findAll()

**Tests e2e :**
- `files.e2e-spec.ts` : GET /files, isolation utilisateurs
- `files-expiration.e2e-spec.ts` : Filtrage expiration

### US06 - Suppression de fichiers
**Critères d'acceptation :**
- Réservé au propriétaire uniquement
- Suppression physique + métadonnées
- Irréversible

**Tests unitaires :**
- `files.service.spec.ts` : remove()

**Tests e2e :**
- `files.e2e-spec.ts` : DELETE /files/:id, contrôle d'accès

### US08 - Gestion des tags
**Critères d'acceptation :**
- 0 à N tags par fichier
- Max 30 caractères par tag
- Déduplication automatique
- Stockage JSON en base

**Tests unitaires :**
- `files.service.us08-us09.spec.ts` : Validation tags, stockage JSON

**Tests e2e :**
- `us08-tags.e2e-spec.ts` : Upload avec tags, récupération en liste

### US09 - Sécurité par mot de passe
**Critères d'acceptation :**
- Mot de passe optionnel (6+ caractères)
- Hashage bcrypt (coût 10)
- Vérification au téléchargement
- Statut visible sans exposer hash

**Tests unitaires :**
- `files.service.us08-us09.spec.ts` : Hashage, comparaison bcrypt

**Tests e2e :**
- `us09-password.e2e-spec.ts` : Upload protégé, download avec mot de passe

### US10 - Expiration automatique
**Critères d'acceptation :**
- Durée 1-7 jours
- Purge automatique (cron quotidien)
- Accès bloqué après expiration
- Filtrage en historique

**Tests unitaires :**
- `files.service.spec.ts` : isFileExpired()

**Tests e2e :**
- `files-expiration.e2e-spec.ts` : Validation durée, accès expiré, historique

## Instructions d'exécution

### Prérequis
```bash
# Installation des dépendances
npm install

# Base de données de test (Docker)
docker-compose up -d postgres

# Variables d'environnement
cp .env.example .env.test
# Configurer DATABASE_URL pour tests
```

### Tests unitaires
```bash
# Exécution complète
npm run test

# Avec couverture
npm run test:cov

# Tests spécifiques
npm run test -- auth.service.spec.ts
npm run test -- files.service.spec.ts

# Mode watch
npm run test:watch
```

### Tests e2e
```bash
# Démarrage stack de test
npm run docker:test

# Exécution complète
npm run test:e2e

# Avec couverture
npm run test:e2e:cov

# Tests spécifiques
npm run test:e2e -- --grep "US08"

# Debug mode
npm run test:e2e -- --verbose
```

### Tests combinés
```bash
# Tous les tests
npm run test:all

# Avec rapport couverture complet
npm run test:all:cov
```

### CI/CD
```yaml
# GitHub Actions example
- name: Run tests
  run: |
    npm run test:all:cov
    # Coverage threshold check
    npx jest-coverage-thresholds-bumper --coverage-summary-path ./coverage/coverage-summary.json --threshold 70
```

## Rapports et métriques

### Génération de rapports
```bash
# HTML coverage report
open coverage/lcov-report/index.html

# JSON pour CI
cat coverage/coverage-summary.json
```

### Métriques cibles
- **Lignes :** ≥70%
- **Branches :** ≥65%
- **Fonctions :** ≥75%
- **Instructions :** ≥70%

### Alertes couverture
- Fichiers <50% : Revue obligatoire
- Nouvelles fonctionnalités : Tests avant merge
- Régression : Blocage CI

## Maintenance des tests

### Bonnes pratiques
- **Isolation :** Chaque test indépendant
- **Données de test :** Fabriques cohérentes
- **Mocks :** Simuler dépendances externes
- **Assertions :** Spécifiques et lisibles

### Mise à jour
- **Nouvelles US :** Tests avant implémentation
- **Refactoring :** Tests mis à jour en priorité
- **Bugs :** Tests de régression ajoutés

### Performance
- **Parallélisation :** Tests e2e peuvent être lents
- **Base de test :** Réinitialisation complète
- **Time-sensitive :** Mocks pour dates/expiration

## Résolution des problèmes courants

### Tests e2e lents
- Augmenter timeout Jest
- Optimiser setup/teardown
- Utiliser base en mémoire si possible

### Couverture instable
- Éviter mocks excessifs
- Tester chemins d'erreur
- Vérifier conditions de branche

### Flakiness
- Isolation parfaite des tests
- Pas de dépendances temporelles
- Gestion d'état déterministe