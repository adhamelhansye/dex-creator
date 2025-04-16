import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import UnoCSS from "unocss/vite";

export default defineConfig({
  plugins: [
    UnoCSS(),
    remix({
      ssr: false,
    }),
    tsconfigPaths(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills needed for specific libraries
      include: ["buffer", "process", "util", "stream", "events"],
    }),
  ],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
    },
  },
  publicDir: "public",
  build: {
    outDir: "dist",
    // Configure proper WASM support
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       wasm: [
    //         "@jsquash/jpeg",
    //         "@jsquash/png",
    //         "@jsquash/webp",
    //         "@jsquash/resize",
    //       ],
    //     },
    //   },
    // },
  },
  // Configure proper WASM file loading
  optimizeDeps: {
    exclude: [
      "@jsquash/jpeg",
      "@jsquash/png",
      "@jsquash/webp",
      "@jsquash/resize",
    ],
  },
});
