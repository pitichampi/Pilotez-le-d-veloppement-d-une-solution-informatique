/**
 * Configuration Tailwind CSS pour DataShare
 * Design system complet basé sur le design Figma
 *
 * Palette primaire :
 * - Orange warm : #e27f29 (boutons, accents)
 * - Crème : #f3eeea (fonds, arrière-plans)
 * - Blancs et gris : Hiérarchie de texte
 *
 * États :
 * - Hover/Active : nuances orange plus sombres
 * - Erreur/Danger : rouge (#c62020, #f14343)
 * - Succès : vert (#10b981)
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette primaire DataShare
        'orange-warm': '#e27f29',
        'orange-accent': '#ff812d',
        'orange-light': '#ffc191',
        'cream': '#f3eeea',
        'cream-light': '#fff8f3',

        // Gris neutres pour texte et bordures
        'neutral-dark': '#1e1e1e',
        'neutral-medium': '#2c2c2c',
        'neutral-light': '#b3b3b3',

        // États
        'error-primary': '#c62020',
        'error-light': '#ffe2e2',
        'error-bright': '#f14343',
        'success': '#10b981',
        'warning': '#ff5e00',
      },

      backgroundColor: {
        'cream': '#f3eeea',
        'cream-light': '#fff8f3',
      },

      textColor: {
        'neutral-dark': '#1e1e1e',
        'neutral-medium': '#2c2c2c',
      },

      // Ombres cohérentes avec design
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },

      // Rayons de bordure
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
    },
  },
  plugins: [],
}

