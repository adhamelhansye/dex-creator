import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { cjsInterop } from "vite-plugin-cjs-interop";
import UnoCSS from "unocss/vite";

const isProduction = process.env.NODE_ENV === "production";
const noExternal = [/^@orderly.*$/, "@uiw/react-split"];
if (isProduction) {
  noExternal.push("ethers");
}

export default defineConfig({
  plugins: [
    UnoCSS(),
    remix({
      ssr: false,
    }),
    tsconfigPaths(),
    nodePolyfills({
      protocolImports: true,
      include: ["buffer", "process", "util", "stream", "events", "crypto"],
    }),
    cjsInterop({
      dependencies: ["bs58", "@coral-xyz/anchor", "lodash"],
    }),
  ],
  server: {
    open: true,
  },
  ssr: {
    noExternal,
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
