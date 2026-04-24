---
applyTo: '**'
description: 'Directives de développement, stack technique et User Stories pour le projet DataShare'
---

# CONTEXTE PROJET : DATASHARE
Service de partage de fichiers sécurisé avec liens temporaires. L'agent IA doit agir comme un développeur senior sous la supervision de l'humain.

## STACK TECHNIQUE
- **Backend :** NestJS (TypeScript).
- **Frontend :** React 18+ (Vite) + TailwindCSS.
- **Base de données :** PostgreSQL + TypeORM (Migrations obligatoires).
- **Cache :** Redis.
- **Stockage :** Système de fichiers local (FS) via un `StorageService` abstrait.
- **Qualité :** Jest & Supertest (Couverture cible : 70%).

## USER STORIES & LOGIQUE MÉTIER
- **US01/07 (Upload) :** Taille max 1 Go. Génération d'un token UUID v4 unique.
- **US02 (Download) :** L'endpoint final de téléchargement doit être un **POST** (sécurisation du mot de passe).
- **US03/04 (Auth) :** Inscription (email unique) et Connexion via JWT Stateless (8 car. min pour le mot de passe).
- **US05/06 (Gestion) :** Accès à l'historique et suppression réservés au propriétaire (vérification `user_id`).
- **US08 (Tags) :** 0 à N tags par fichier (30 car. max par tag).
- **US09 (Sécurité) :** Mot de passe fichier optionnel (6 car. min) haché avec Bcrypt.
- **US10 (Expiration) :** Durée de vie entre 1 et 7 jours. Purge automatique via tâche Cron quotidienne.

## SÉCURITÉ & RÈGLES DE CODE
- **Validation :** Utilisation de `class-validator` avec `ValidationPipe` global.
- **Vérification Fichiers :** Contrôle des types MIME via `file-type` (pas seulement l'extension).
- **Extensions interdites :** .exe, .bat, .sh, .msi, .cmd, .ps1.
- **Hachage :** Bcrypt (cost 10) pour tous les secrets.
- **Architecture :** Isoler la logique de stockage dans un service dédié pour faciliter une future migration S3.
- **Commits :** Respecter strictement la norme **Conventional Commits**.

## INSTRUCTIONS DE GÉNÉRATION
1. Préférer l'architecture modulaire NestJS.
2. Toujours inclure les DTOs de validation pour les nouveaux endpoints.
3. Accompagner les services critiques de leurs tests unitaires `.spec.ts`.
4. En cas d'ambiguïté sur la sécurité, prioriser la solution la plus restrictive.