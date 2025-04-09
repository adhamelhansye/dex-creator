import { defineConfig, presetUno, presetWebFonts, presetIcons } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: "Inter:400,500,600,700",
      },
    }),
    presetIcons(),
  ],
  theme: {
    colors: {
      // Primary palette
      primary: {
        DEFAULT: "rgb(89, 91, 255)",
        light: "rgb(125, 125, 255)",
      },
      secondary: {
        DEFAULT: "rgb(157, 78, 221)",
        light: "rgb(187, 118, 242)",
      },
      // Background shades
      background: {
        DEFAULT: "rgb(12, 14, 30)",
        card: "rgba(22, 24, 48, 0.3)",
        light: "rgb(22, 24, 48)",
        dark: "rgb(8, 10, 20)",
      },
      // Teal accent
      teal: {
        DEFAULT: "rgb(0, 209, 255)",
        light: "rgb(129, 229, 247)",
      },
    },
    extend: {
      backgroundImage: {
        // Gradients for buttons
        "gradient-primaryButton":
          "linear-gradient(135deg, rgba(89, 91, 255, 0.9), rgba(157, 78, 221, 0.9))",
        "gradient-primaryButtonHover":
          "linear-gradient(135deg, rgba(125, 125, 255, 1), rgba(187, 118, 242, 1))",
        "gradient-secondaryButton":
          "linear-gradient(135deg, rgba(22, 24, 48, 0.8), rgba(12, 14, 30, 0.8))",
      },
      boxShadow: {
        glow: "0 0 10px rgba(89, 91, 255, 0.2)",
        "glow-hover": "0 0 15px rgba(89, 91, 255, 0.3)",
      },
    },
  },
  shortcuts: {
    // Layout
    "page-container":
      "min-h-screen bg-background-DEFAULT text-white font-sans p-8",
    "section-container": "max-w-6xl mx-auto py-12",

    // Button styles
    btn: "rounded-full py-2 px-6 font-medium transition-all duration-200 cursor-pointer border-none",
    "btn-connect":
      "bg-gradient-primaryButton text-white shadow-glow hover:bg-gradient-primaryButtonHover hover:shadow-glow-hover hover:transform hover:-translate-y-0.5",
    "btn-auth":
      "bg-gradient-primaryButton text-white shadow-glow hover:bg-gradient-primaryButtonHover hover:shadow-glow-hover hover:transform hover:-translate-y-0.5",
    "btn-disconnect": "bg-red-500 text-white hover:opacity-90",
    "btn-secondary":
      "bg-gradient-secondaryButton text-white border border-primary-light/30 hover:border-primary-light/50",

    // Card styles
    card: "rounded-xl bg-background-card backdrop-blur-sm border border-primary-light/10 p-6 shadow-lg",

    // Text styles
    "gradient-text":
      "bg-gradient-to-r from-primary-light to-secondary-light bg-clip-text text-transparent",

    // Address display
    "address-display": "text-sm text-gray-300 mb-1",
    "address-authenticated": "text-primary-light font-medium",

    // Container styles
    "wallet-container": "relative font-sans",
    "button-group": "flex flex-col gap-2 mt-2",

    // Error message
    "error-message": "text-red-500 text-sm mt-2",

    // Effects
    "glow-effect":
      "relative after:absolute after:inset-0 after:rounded-full after:bg-primary/20 after:blur-lg after:transform after:scale-110 after:-z-10",
  },
});
