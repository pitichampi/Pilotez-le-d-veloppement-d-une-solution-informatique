# Plan de Tests

## Vue d'ensemble

Ce document décrit la stratégie de test complète pour le projet, couvrant les tests unitaires, les tests d'intégration et les tests end-to-end (E2E).

**Objectif global :** Assurer la qualité et la stabilité du MVP avec un seuil de couverture de code minimal de **70%**.

---

## 1. Tests Unitaires

### 1.1 Backend (NestJS)

#### Fonctionnalités obligatoires testées :

- **AuthService**
  - Hachage des mots de passe (bcrypt)
  - Génération de JWT
  - Validation de JWT
  - Inscription utilisateur
  - Connexion utilisateur

- **UsersService**
  - Création d'utilisateur
  - Récupération d'utilisateurs (tous, par ID)
  - Mise à jour d'utilisateur
  - Suppression d'utilisateur

- **FilesService**
  - Upload de fichier
  - Listing des fichiers
  - Téléchargement de fichier
  - Suppression de fichier
  - Suppression des fichiers expirés (cron)

#### Framework de test :

```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
```

#### Structure des tests :

```typescript
// Exemple : src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      // ...
    });
  });
  
  describe('generateToken', () => {
    it('should generate a valid JWT', async () => {
      // ...
    });
  });
});
```

#### Exécution des tests :

```bash
cd backend
npm run test                    # Mode watch
npm run test:cov              # Avec rapport de couverture
```

---

### 1.2 Frontend (React)

#### Fonctionnalités obligatoires testées :

- **Composants principaux**
  - LoginPage : rendu, validation du formulaire, appel API
  - HomePage : affichage des fichiers, upload
  - ProtectedRoute : redirection utilisateur non authentifié

- **Hooks**
  - `useAuth()` : gestion du contexte d'authentification

- **API Client**
  - Intercepteur JWT
  - Gestion des erreurs

#### Framework de test :

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

#### Exécution des tests :

```bash
cd frontend
npm run test                   # Mode watch
npm run test:coverage         # Avec rapport de couverture
```

---

## 2. Tests d'Intégration

### 2.1 Backend - API Integration Tests

Tests des endpoints complets avec authentification et persistance.

**Endpoints critiques testés :**

| Endpoint | Méthode | Scénario |
|----------|---------|---------|
| `/api/auth/register` | POST | Création de compte valide, doublon, données invalides |
| `/api/auth/login` | POST | Connexion valide, identifiants invalides |
| `/api/auth/me` | GET | Récupération du profil (authentifié) |
| `/api/files/upload` | POST | Upload de fichier, validation, fichier existant |
| `/api/files` | GET | Listing des fichiers (paginé) |
| `/api/files/:id` | DELETE | Suppression de fichier (propriétaire uniquement) |

#### Framework :

```bash
npm install --save-dev @nestjs/testing supertest
```

#### Exécution :

```bash
cd backend
npm run test:e2e
```

---

## 3. Tests End-to-End (E2E)

### 3.1 Cypress - Scénarios critiques

Trois scénarios E2E minimum doivent être validés :

#### Scénario 1 : Inscription et authentification

```gherkin
Scenario: Utilisateur s'inscrit et se connecte
  Given l'utilisateur accède à la page login
  When il clique sur "Créer un compte"
  And il remplit le formulaire d'inscription (email, password)
  And il clique sur "S'inscrire"
  Then il est redirigé vers la page d'accueil
  And il est authentifié (JWT en localStorage)
```

#### Scénario 2 : Upload et listing de fichier

```gherkin
Scenario: Utilisateur authentifié upload un fichier
  Given l'utilisateur est authentifié et sur la page d'accueil
  When il sélectionne un fichier
  And il clique sur "Upload"
  Then le fichier apparaît dans la liste
  And une notification de succès s'affiche
```

#### Scénario 3 : Suppression de fichier

```gherkin
Scenario: Utilisateur supprime son fichier
  Given l'utilisateur a des fichiers uploadés
  When il clique sur le bouton "Supprimer" d'un fichier
  And confirme la suppression
  Then le fichier disparaît de la liste
  And une notification de confirmation s'affiche
```

### 3.2 Installation et configuration Cypress

```bash
cd frontend
npm install --save-dev cypress
npx cypress open
```

**Fichiers de configuration :**

- `cypress.config.ts` - Configuration générale
- `cypress/e2e/` - Tests E2E
- `cypress/support/` - Commandes réutilisables

### 3.3 Exécution des tests E2E

```bash
# Mode interactif
npm run cypress:open

# Mode headless (CI)
npm run cypress:run
```

---

## 4. Critères d'acceptation

### Critères globaux

| Critère | Seuil | Status |
|---------|-------|--------|
| Couverture de code backend | 70% minimum | ⏳ À mesurer |
| Couverture de code frontend | 60% minimum | ⏳ À mesurer |
| Tests E2E critiques | 3 scénarios | ⏳ À implémenter |
| Tests d'intégration | Tous les endpoints | ⏳ À implémenter |
| Zéro warning ESLint | 100% | ⏳ À valider |

### Définition de "Prêt pour production"

- Tous les tests unitaires passent
- Tous les tests E2E passent
- Couverture >= 70%
- Aucun warning critique
- Audit de sécurité OK

---

## 5. Instructions d'exécution

### 5.1 Suite complète de tests (Backend)

```bash
cd backend

# Tests unitaires avec couverture
npm run test:cov

# Tests E2E (intégration)
npm run test:e2e

# Voir le rapport HTML
open coverage/lcov-report/index.html
```

### 5.2 Suite complète de tests (Frontend)

```bash
cd frontend

# Tests unitaires avec couverture
npm run test:coverage

# Tests E2E (Cypress)
npm run cypress:run

# Voir le rapport HTML
open coverage/index.html
```

### 5.3 Exécution locale complète

```bash
# À la racine du projet
docker-compose up -d

# Attendre que les services soient prêts (10-15s)
sleep 15

# Backend
cd backend && npm install && npm run test:cov && npm run test:e2e

# Frontend
cd ../frontend && npm install && npm run test:coverage && npm run cypress:run
```

---

## 6. Rapport de couverture

### Métriques cibles

```
Backend (NestJS + TypeORM) :
├─ Statements   : 70%+
├─ Branches     : 65%+
├─ Functions    : 70%+
└─ Lines        : 70%+

Frontend (React) :
├─ Statements   : 60%+
├─ Branches     : 55%+
├─ Functions    : 60%+
└─ Lines        : 60%+
```

### Génération du rapport

```bash
# Backend
cd backend && npm run test:cov
# Rapport : ./coverage/lcov-report/index.html

# Frontend
cd frontend && npm run test:coverage
# Rapport : ./coverage/index.html
```

---

## 7. Configuration en CI/CD

Un fichier `.github/workflows/test.yml` peut être ajouté pour l'intégration continue :

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test
      redis:
        image: redis:7-alpine

    steps:
      - uses: actions/checkout@v3
      
      - name: Backend Tests
        run: cd backend && npm ci && npm run test:cov && npm run test:e2e
      
      - name: Frontend Tests
        run: cd frontend && npm ci && npm run test:coverage && npm run cypress:run
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## 8. Points de suivi

- [ ] Structure de tests mise en place
- [ ] Tests unitaires backend implémentés (70% couverture)
- [ ] Tests unitaires frontend implémentés (60% couverture)
- [ ] Tests E2E (3 scénarios) implémentés
- [ ] Rapport de couverture généré et validé
- [ ] Pipeline CI/CD configuré
- [ ] Capture d'écran du rapport ajoutée

---

**Dernière mise à jour :** 17 avril 2026  
**Responsable :** Équipe Engineering  
**Prochaine révision :** Après livraison du MVP

