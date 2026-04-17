# Plan de Maintenance

## Vue d'ensemble

Ce document décrit les procédures de maintenance du projet, incluant la gestion des dépendances, les mises à jour et les risques associés.

**Objectif :** Assurer la stabilité, la sécurité et la performance du système en production à long terme.

---

## 1. Stratégie de mise à jour des dépendances

### 1.1 Classification des dépendances

#### Dépendances critiques (Tier 1)
```json
{
  "runtime": [
    "@nestjs/core",
    "@nestjs/common",
    "typeorm",
    "react",
    "react-router-dom"
  ],
  "security": [
    "@nestjs/jwt",
    "bcrypt",
    "class-validator"
  ]
}
```

**Fréquence :** Hebdomadaire (monitorer)  
**Délai d'application :** Urgent si sécurité, sinon 2-4 semaines  

#### Dépendances importantes (Tier 2)
```json
{
  "infrastructure": [
    "pg",
    "redis",
    "multer"
  ],
  "tooling": [
    "axios",
    "tailwindcss",
    "vite"
  ]
}
```

**Fréquence :** Mensuelle  
**Délai d'application :** 1-2 mois  

#### Dépendances de développement (Tier 3)
```json
{
  "devDependencies": [
    "@types/*",
    "typescript",
    "eslint",
    "prettier"
  ]
}
```

**Fréquence :** Mensuelle  
**Délai d'application :** 2-3 mois (peut attendre)  

### 1.2 Calendrier de maintenance

| Jour | Activité | Propriétaire |
|------|----------|--------------|
| **Lundi** | Scan npm audit global | DevOps |
| **Mercredi** | Revue des patches critiques | Lead Dev |
| **Vendredi** | Application des mises à jour mineures | Tech Lead |
| **Mensuel** | Revue complète des dépendances | Product Manager |
| **Trimestriel** | Audit de sécurité complet | Équipe Sécurité |

---

## 2. Procédure de mise à jour des dépendances

### 2.1 Avant la mise à jour

#### Étape 1 : Vérification de la stabilité actuelle

```bash
# Vérifier que tout passe en test
cd backend && npm run test:cov && npm run test:e2e
cd ../frontend && npm run test:coverage && npm run cypress:run

# Vérifier les audits de sécurité
npm audit --all
```

#### Étape 2 : Identification des dépendances à mettre à jour

```bash
# Vérifier les versions disponibles
npm outdated

# Exemple de sortie :
# Package           Current Wanted  Latest  Location
# @nestjs/common     10.2.1  10.2.3  10.2.3  backend
# typescript         5.2.2   5.3.3   5.3.3   backend
```

#### Étape 3 : Lecture des changelogs

Pour chaque dépendance majeure :

```bash
# Exemple : NestJS 11.0.0
# Vérifier : https://github.com/nestjs/nest/releases/tag/v11.0.0
# Points clés :
# - Breaking changes ?
# - Nouvelles dépendances ?
# - Migration guide requis ?
```

### 2.2 Pendant la mise à jour (Backend)

#### Mise à jour sécurisée

```bash
cd backend

# 1. Créer une branche
git checkout -b chore/update-dependencies

# 2. Mettre à jour package.json
npm update @nestjs/core @nestjs/common --save
npm install                              # Installer les dépendances

# 3. Supprimer node_modules et lock
rm -rf node_modules package-lock.json

# 4. Réinstaller proprement
npm ci

# 5. Compiler TypeScript
npm run build

# 6. Exécuter les tests
npm run test
npm run test:e2e

# 7. Vérifier audit de sécurité
npm audit
```

#### Mise à jour directe des versions mineures

```bash
# Mise à jour mineure/patch safe
npm install --save-dev @types/node@latest

# Ou pour plusieurs dépendances
npm update --save
```

### 2.3 Pendant la mise à jour (Frontend)

```bash
cd frontend

# Processus identique au backend
git checkout -b chore/update-dependencies

npm update react react-dom --save
rm -rf node_modules package-lock.json
npm ci

npm run build
npm run test:coverage
npm run cypress:run

npm audit
```

### 2.4 Après la mise à jour

#### Étape 1 : Tests complets

```bash
# Backend
cd backend
npm run lint
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run lint
npm run test:coverage
npm run cypress:run
```

#### Étape 2 : Tests d'intégration full-stack

```bash
# À la racine
docker-compose up -d
sleep 15

# Vérifier que l'app démarre
curl http://localhost:3000
curl http://localhost:3001/api/health

# Tester les scénarios critiques
npm run cypress:run --spec "cypress/e2e/critical/*.cy.ts"
```

#### Étape 3 : Commit et PR

```bash
git add package.json package-lock.json
git commit -m "chore: mise à jour des dépendances

- @nestjs/common: 10.2.1 → 10.2.3
- typescript: 5.2.2 → 5.3.3
- react: 18.2.0 → 18.3.0

Tests : tous les tests E2E passent ✅
Audit de sécurité : OK ✅
Bundle size : +2 KB (acceptable)

Closes #123"

git push origin chore/update-dependencies
```

---

## 3. Gestion des risques de mise à jour

### 3.1 Matrice de risque

| Type de mise à jour | Risque | Impact | Procédure |
|---------------------|--------|--------|-----------|
| Patch (1.2.3 → 1.2.4) | Très bas | Sécurité/bugs | Directe |
| Mineure (1.2.0 → 1.3.0) | Bas | Nouvelles features | Branche + tests |
| Majeure (1.0.0 → 2.0.0) | **Haut** | Breaking changes | Étude + staging |
| Sécurité critique | **Très haut** | CVE bloquant | Immédiate |

### 3.2 Procédure pour mises à jour majeures

#### Étape 1 : Isoler et tester en branche

```bash
git checkout -b feature/update-nestjs-11

# Mise à jour majeure
npm install @nestjs/core@11 --save
npm install

# Installer les nouvelles dépendances peer
npm install @nestjs/passport@11 --save
```

#### Étape 2 : Identifier les breaking changes

```bash
# Compiler pour voir les erreurs TypeScript
npm run build

# Exemple erreur :
# TS2322: Type 'string' is not assignable to type 'number | undefined'
```

#### Étape 3 : Migrer le code

```typescript
// Exemple : NestJS 10 → 11
// Avant (NestJS 10)
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})

// Après (NestJS 11) - si breaking change
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  global: true,  // Nouvelle option
})
```

#### Étape 4 : Tests approfondis

```bash
npm run test:cov
npm run test:e2e
docker-compose up -d && npm run cypress:run
npm audit
```

#### Étape 5 : Fusion progressive

```bash
git rebase main              # Pour merge propre
git push origin feature/update-nestjs-11

# Créer PR, revue complète
# Une fois approuvée, merge progressivement
```

### 3.3 Stratégie de rollback

#### Cas 1 : Erreur en développement

```bash
# Simple : revenir à la version précédente
git reset --hard HEAD~1

# Ou, plus spécifiquement
npm install @nestjs/core@10 --save
npm install
```

#### Cas 2 : Erreur en production

```bash
# Étape 1 : Rollback rapide
git revert <commit-sha>      # Crée un nouveau commit pour rollback

# Étape 2 : Déployer la version stable
docker-compose pull
docker-compose up -d

# Étape 3 : Analyser l'incident
# - Quelle erreur ?
# - Comment on l'a raté ?
```

---

## 4. Processus de maintenance quotidienne

### 4.1 Vérifications quotidiennes

```bash
# Script de health check
#!/bin/bash

# Backend
curl -s http://localhost:3001/api/health || echo "Backend down!"

# Frontend
curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>" || echo "Frontend down!"

# Database
pg_isready -h localhost -p 5432 || echo "Database down!"

# Redis (optionnel)
redis-cli ping || echo "Redis down!"
```

### 4.2 Nettoyage des fichiers expirés

```typescript
// backend/src/common/tasks/tasks.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  constructor(private filesService: FilesService) {}

  @Cron('0 2 * * *')  // 2h du matin chaque jour
  async deleteExpiredFiles() {
    const deleted = await this.filesService.deleteExpiredFiles();
    console.log(`Deleted ${deleted.count} expired files`);
  }
}
```

---

## 5. Procédures d'urgence

### 5.1 Incident critique (production down)

```bash
# 1. Isoler le problème
docker-compose logs backend | tail -50
docker-compose logs postgres | tail -50

# 2. Vérifier les logs
tail -100 /var/log/app/error.log

# 3. Rollback si récente déploiement
docker-compose down
git revert <last-deploy-commit>
docker-compose up -d

# 4. Notifier
# - Slack channel #incidents
# - Email aux stakeholders
```

### 5.2 Fuite de performance

```bash
# Profiler la requête lente
npm run perf:profile

# Analyser les logs
grep "duration: [0-9]{4,}" app.log | sort -rn

# Exemple : requête prenant 5s
# [2026-04-17 15:30:22] GET /api/files - 5420ms ⚠️
# → Vérifier le cache Redis
```

### 5.3 Fuite de sécurité

```bash
# 1. Notification immédiate
# - Email équipe sécurité
# - Slack #security

# 2. Assess l'impact
# - Quels données exposées ?
# - Combien d'utilisateurs affectés ?

# 3. Mitigation rapide
# - Patch ou rollback
# - Invalider les sessions si nécessaire
# - Audit les accès anormaux

# 4. Communication
# - Notifier les utilisateurs
# - Publier CVE advisory
```

---

## 6. Points de suivi

- [ ] Calendrier de maintenance défini
- [ ] Scripts de health check implémentés
- [ ] Procédures d'escalade documentées
- [ ] Équipe formée aux procédures
- [ ] Monitoring en place
- [ ] Rollback procedure testée
- [ ] Contacts d'urgence définis
- [ ] Logs centralisés configurés

---

**Dernière mise à jour :** 17 avril 2026  
**Responsable :** DevOps / Lead Dev  
**Prochaine révision :** Mensuel (1er du mois)

