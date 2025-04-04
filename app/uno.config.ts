import { defineConfig, presetUno, presetWebFonts } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      fonts: {
        sans: 'Inter',
      },
    }),
  ],
  theme: {
    colors: {
      // Orderly color palette (refined)
      primary: {
        DEFAULT: '#7C3AED', // Purple
        light: '#9F67FF',
        dark: '#6025D9',
      },
      secondary: {
        DEFAULT: '#2563EB', // Blue
        light: '#3B82F6',
        dark: '#1E40AF',
      },
      background: {
        DEFAULT: '#0F0823', // Dark purple/blue background
        light: '#1A1333',
        dark: '#080415',
        card: 'rgba(26, 19, 51, 0.5)',
      },
      gradient: {
        purple: 'linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)',
        blue: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
        purpleBlue: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        // Button gradient like "Build with Orderly"
        primaryButton: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)',
        // Button gradient like "Trade on Orderly" (darker)
        secondaryButton:
          'linear-gradient(90deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
      },
      teal: {
        DEFAULT: '#06B6D4',
        light: '#22D3EE',
      },
    },
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
    },
    extend: {
      boxShadow: {
        glow: '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  shortcuts: {
    // Layout
    'page-container':
      'min-h-screen bg-background-DEFAULT text-white font-sans p-8',
    'section-container': 'max-w-6xl mx-auto py-12',

    // Button styles
    btn: 'rounded-full py-2 px-6 font-medium transition-all duration-200 cursor-pointer border-none',
    'btn-connect':
      'bg-gradient-primaryButton text-white shadow-glow hover:opacity-90',
    'btn-auth':
      'bg-gradient-primaryButton text-white shadow-glow hover:opacity-90',
    'btn-disconnect': 'bg-red-500 text-white hover:opacity-90',
    'btn-secondary':
      'bg-gradient-secondaryButton text-white border border-primary-light/30 hover:border-primary-light/50',

    // Card styles
    card: 'rounded-xl bg-background-card backdrop-blur-sm border border-primary-light/10 p-6 shadow-lg',

    // Text styles
    'gradient-text':
      'bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent',

    // Address display
    'address-display': 'text-sm text-gray-300 mb-1',
    'address-authenticated': 'text-primary-light font-medium',

    // Container styles
    'wallet-container': 'relative font-sans',
    'button-group': 'flex flex-col gap-2 mt-2',

    // Error message
    'error-message': 'text-red-500 text-sm mt-2',

    // Effects
    'glow-effect':
      'relative after:absolute after:inset-0 after:rounded-full after:bg-primary/20 after:blur-lg after:transform after:scale-110 after:-z-10',
  },
});
