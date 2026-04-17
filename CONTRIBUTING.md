# CONTRIBUTING.md

## Guide de Contribution

Ce document explique comment contribuer à ce projet en respectant les conventions établies.

## Avant de commencer

1. Forker le repository
2. Cloner votre fork localement
3. Créer une branche pour votre feature

```bash
git checkout -b feature/nom-de-la-feature
```

## Processus de développement

### 1. Respecter Conventional Commits

Chaque commit doit suivre le format :
```
<type>(<scope>): <subject>
```

**Types** : feat, fix, docs, style, refactor, perf, test, chore, ci

**Scopes** : frontend, backend, auth, files, users, docker, deps, config

**Exemples** :
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(files): resolve race condition in upload"
git commit -m "docs(backend): document new API endpoints"
```

### 2. Code Style

**Frontend (React/TypeScript)**
- Utiliser Prettier : `npm run format`
- Linter : `npm run lint`
- Indentation : 2 espaces
- Quotes : simples (`'`)

**Backend (NestJS/TypeScript)**
- Utiliser Prettier : `npm run format`
- Linter : `npm run lint`
- Indentation : 2 espaces
- Quotes : simples (`'`)

### 3. Principes d'Architecture

**Backend - Architecture en couches**
- Guards/Pipes → Validation et sécurité
- Controllers → Routing et orchestration
- Services → Logique métier
- Entities → Modèles de données

**Frontend - Séparation des responsabilités**
- Components → Présentation
- Hooks → Logique réutilisable
- Pages → Vues complètes
- API → Appels HTTP

### 4. Nommer les fichiers

**TypeScript**
- Classes : PascalCase (`UserService.ts`)
- Types/Interfaces : PascalCase (`User.interface.ts`)
- Utilitaires : camelCase (`helpers.ts`)
- DTOs : PascalCase (`CreateUserDto.ts`)

**React**
- Composants : PascalCase (`UserCard.tsx`)
- Hooks : camelCase (`useAuth.tsx`)
- Pages : PascalCase (`HomePage.tsx`)

## Faire un Pull Request

1. Pousser votre branche : `git push origin feature/...`
2. Créer un PR sur GitHub
3. Décrire les changements clairement
4. Lier les issues si applicable
5. Attendre la review

### PR Template

```markdown
## Description
Brève description du changement

## Type
- [ ] Nouvelle fonctionnalité (feat)
- [ ] Correction (fix)
- [ ] Documentation (docs)
- [ ] Refactorisation (refactor)

## Scope
- [ ] Frontend
- [ ] Backend
- [ ] Docker
- [ ] Autre

## Tests
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Testé localement

## Checklist
- [ ] Commits suivent Conventional Commits
- [ ] Code formaté et linté
- [ ] Documentation mise à jour
- [ ] Pas de secrets exposés
```

## Tests

### Frontend
```bash
cd frontend
npm run test
```

### Backend
```bash
cd backend
npm run test
npm run test:e2e
```

## Documentation

- Documenter les changements majeurs dans `ARCHITECTURE.md`
- Mettre à jour les READMEs si nécessaire
- Ajouter des commentaires pour du code complexe

## Questions?

Créer une issue avec le tag `question` pour discuter.

---

Merci de contribuer!

