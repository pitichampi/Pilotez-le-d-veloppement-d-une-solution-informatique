# Plan de Performance

## Vue d'ensemble

Ce document décrit les tests de performance et les budgets définis pour le MVP, couvrant les endpoints critiques du backend et les métriques de performance du frontend.

**Objectif :** Garantir que l'application répond rapidement et efficacement, avec des temps de réponse prévisibles et des bundles optimisés.

---

## 1. Tests de performance Backend

### 1.1 Outil : k6 (Load Testing)

#### Installation

```bash
# Installez k6 globalement
brew install k6

# Vérification
k6 version
```

#### Configuration de base

```javascript
// backend/tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Peak
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.1'],     // Moins de 10% d'erreurs
  },
};

export default function() {
  // Tests à implémenter
}
```

### 1.2 Scénarios de test critiques

#### Scénario 1 : Authentication (POST /api/auth/login)

```javascript
export function testLogin() {
  const url = 'http://localhost:3001/api/auth/login';
  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  });

  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 200ms': (r) => r.timings.duration < 200,
    'token présent': (r) => r.body.includes('access_token'),
  });

  sleep(1);
}
```

**Seuils attendus :**
- Temps de réponse moyen : < 200 ms
- 95e percentile : < 500 ms
- Taux d'erreur : < 1%

#### Scénario 2 : File Listing (GET /api/files)

```javascript
export function testFileListing() {
  const url = 'http://localhost:3001/api/files';
  
  const res = http.get(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(res, {
    'listing status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
    'payload JSON valide': (r) => r.body.includes('"data"'),
  });

  sleep(0.5);
}
```

**Seuils attendus :**
- Temps de réponse moyen : < 300 ms
- 95e percentile : < 800 ms
- Taux d'erreur : < 1%

#### Scénario 3 : File Upload (POST /api/files/upload)

```javascript
export function testFileUpload() {
  const url = 'http://localhost:3001/api/files/upload';
  
  const file = open('sample.txt', 'b');
  const formData = new FormData();
  formData.append('file', http.file(file, 'sample.txt'));

  const res = http.post(url, formData, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(res, {
    'upload status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
```

**Seuils attendus :**
- Temps de réponse moyen : < 1000 ms (selon taille fichier)
- 95e percentile : < 2000 ms
- Taux d'erreur : < 2%

### 1.3 Exécution des tests k6

```bash
# Depuis le backend
cd backend

# Test simple (pas de load)
k6 run tests/performance/load-test.js

# Test avec générations de rapports
k6 run --out csv=results.csv tests/performance/load-test.js

# Test en mode cloud (optionnel)
k6 cloud run tests/performance/load-test.js
```

### 1.4 Baselines de performance cibles

| Endpoint | Opération | Cible P95 | Cible P99 | Taux erreur |
|----------|-----------|-----------|-----------|-------------|
| `/api/auth/login` | Login | 500 ms | 900 ms | < 1% |
| `/api/auth/register` | Register | 400 ms | 800 ms | < 2% |
| `/api/files` | GET listing | 800 ms | 1500 ms | < 1% |
| `/api/files/upload` | Upload | 2000 ms | 4000 ms | < 2% |
| `/api/files/:id` | Download | Var. | Var. | < 1% |

---

## 2. Performance Frontend

### 2.1 Métriques Core Web Vitals

#### Outils de mesure

```bash
# Installation Lighthouse
npm install -g lighthouse

# Ou utiliser audit Chromium natif
```

#### Métriques cibles

| Métrique | Cible | Accepté | Critique |
|----------|-------|---------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 3.5s | > 4s |
| **FID** (First Input Delay) | < 100ms | < 200ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | > 0.5 |

### 2.2 Analyse du bundle

#### Installation

```bash
cd frontend
npm install --save-dev webpack-bundle-analyzer

# Intégration dans vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [visualizer()],
};
```

#### Exécution

```bash
# Build et rapport
npm run build
# Génère stats.html

# Ouvrir le rapport
open dist/stats.html
```

#### Seuils de taille

| Catégorie | Cible | Acceptable | Critique |
|-----------|-------|-----------|----------|
| **Bundle JS** | < 300 KB | < 400 KB | > 500 KB |
| **Bundle CSS** | < 80 KB | < 120 KB | > 150 KB |
| **Images** | < 200 KB total | < 300 KB | > 500 KB |
| **Gzip (tout)** | < 120 KB | < 180 KB | > 250 KB |

### 2.3 Lighthouse Performance Audit

```bash
# Audit local
lighthouse http://localhost:3000 --view

# Ou script auto
npm run lighthouse
```

#### Seuils d'acceptation

| Catégorie | Cible |
|-----------|-------|
| Performance | > 90 |
| Accessibility | > 85 |
| Best Practices | > 90 |
| SEO | > 90 |

### 2.4 Optimisations implémentées

#### React + Vite

✅ **Code Splitting**
```javascript
// Routes lazy-loaded
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
```

**Tree-shaking**
- Dépendances non utilisées supprimées
- Import nommés (pas default exports)

**Image Optimization**
- Images responsive (srcset)
- WebP avec fallback
- Lazy loading (native)

**CSS Optimization**
- PurgeCSS activé (Tailwind)
- Critical CSS inline
- Autres CSS défés async

---

## 3. Points de suivi

- [ ] k6 installé et tests baseline générés
- [ ] Lighthouse audit complet effectué (frontend)
- [ ] Bundle size analysis généré
- [ ] Rapports de performance archivés
- [ ] Seuils définis et communiqués
- [ ] Caching Redis configuré (optionnel)
- [ ] Pagination implémentée
- [ ] Compression gzip activée
- [ ] Monitoring en place

---

**Dernière mise à jour :** 17 avril 2026  
**Responsable :** Équipe Performance  
**Prochaine révision :** Après livraison du MVP

