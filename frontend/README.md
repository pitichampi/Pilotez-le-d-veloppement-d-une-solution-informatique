# Frontend - React + Vite

Application client React avec TypeScript, React Router, Axios et TailwindCSS.

## Structure

```
src/
├── api/                    # Clients API (Axios)
│   ├── client.ts          # Instance Axios configurée
│   └── index.ts           # Endpoints API
├── components/            # Composants réutilisables
│   ├── Layout.tsx         # Layout principal
│   └── ProtectedRoute.tsx # Route protégée par auth
├── hooks/                 # Hooks personnalisés
│   └── useAuth.tsx        # Hook d'authentification
├── pages/                 # Pages principales
│   ├── LoginPage.tsx      # Page de connexion
│   └── HomePage.tsx       # Page d'accueil
├── types/                 # Types TypeScript
├── utils/                 # Utilitaires
├── App.tsx               # Composant racine
└── main.tsx              # Point d'entrée

```

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'app démarre sur http://localhost:3000

## Build

```bash
npm run build
```

## Points clés

- **API Client** : Axios avec intercepteurs pour token JWT
- **Auth** : Context + Hook pour gestion de l'authentification
- **Routing** : React Router v6
- **Styling** : TailwindCSS
- **Build** : Vite (très rapide)

## Endpoints utilisés

- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `GET /auth/me` - Infos utilisateur
- `GET /files` - Lister les fichiers
- `POST /files/upload` - Upload fichier
- `GET /files/:id/download` - Télécharger fichier

