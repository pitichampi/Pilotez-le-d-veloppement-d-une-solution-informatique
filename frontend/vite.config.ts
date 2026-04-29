/**
 * @file vite.config.ts
 * @description Configuration Vite pour DataShare Frontend
 *
 * Stack technique :
 * - Framework: React 18+ avec TypeScript
 * - Bundler: Vite 5.x
 * - CSS: TailwindCSS (via postcss.config.js)
 * - Build target: ES2020
 *
 * Points clés :
 * - Port 3000 (strictPort: true pour éviter les changements automatiques)
 * - Proxy API vers backend NestJS sur port 3001
 * - Chemins d'import raccourcis (@components, @api, etc.)
 * - Sourcemaps désactivées en production
 *
 * @author DataShare Team
 * @version 1.0.0
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  /**
   * Plugins Vite
   * @property {Plugin} react - Plugin React pour JSX/TSX et HMR (Hot Module Replacement)
   */
  plugins: [react()],

  /**
   * Configuration de résolution des modules
   * Définit les alias de chemins pour imports raccourcis
   */
  resolve: {
    alias: {
      /** Racine du dossier src */
      '@': path.resolve(__dirname, './src'),
      /** Composants réutilisables (Button, Card, Input, etc.) */
      '@components': path.resolve(__dirname, './src/components'),
      /** Pages principales (HomePage, DownloadPage, etc.) */
      '@pages': path.resolve(__dirname, './src/pages'),
      /** Client API Axios et endpoints (filesApi, authApi, etc.) */
      '@api': path.resolve(__dirname, './src/api'),
      /** Hooks personnalisés React (useAuth, useFileUpload, etc.) */
      '@hooks': path.resolve(__dirname, './src/hooks'),
      /** Types et interfaces TypeScript (User, File, etc.) */
      '@types': path.resolve(__dirname, './src/types'),
      /** Fonctions utilitaires et helpers */
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },

  /**
   * Configuration du serveur de développement
   * Vite utilise esbuild + Rollup pour le dev hot reload
   */
  server: {
    /** Port d'écoute du serveur dev - fixé sur 3000 */
    port: 3000,
    /**
     * strictPort: true force le port exact (sinon Vite cherche un autre port libre)
     * Important pour la cohérence avec le docker-compose et le proxy API
     */
    strictPort: true,
    /** Écoute sur 0.0.0.0 pour accepter les requêtes externes (Docker, réseau local) */
    host: '0.0.0.0',
    /**
     * Proxy HTTP pour rediriger les appels API vers le backend
     * Les requêtes POST/GET/DELETE vers /api/* sont redirigées vers backend:3001
     */
    proxy: {
      /**
       * Toutes les requêtes commençant par /api sont proxifiées
       * Exemple: fetch('/api/auth/login') → http://localhost:3001/auth/login
       * changeOrigin: true envoie l'header Host du target (évite les CORS issues)
       * rewrite: supprime le préfixe /api avant envoi au backend
       */
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  /**
   * Configuration de build (production)
   * Utilisée lors de: npm run build
   */
  build: {
    /**
     * Cible JavaScript ES2020
     * Support de features modernes: optional chaining, nullish coalescing, etc.
     * Compatible avec tous les navigateurs récents (> 2020)
     */
    target: 'ES2020',
    /** Dossier de sortie des bundles build (commité dans .gitignore) */
    outDir: 'dist',
    /** Désactive les sourcemaps en production pour réduire la taille des bundles */
    sourcemap: false,
  },
})

