import { defineConfig } from 'vite';
import { vitePlugin as remix } from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    remix({
      ssr: false,
    }),
    tsconfigPaths(),
  ],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
