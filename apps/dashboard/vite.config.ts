import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Single source of truth: root /.env (same file compose + the api/workers use).
const repoRoot = resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  const apiTarget = env.VITE_API_TARGET ?? 'http://localhost:3001';
  // Mirrors infra/nginx/default.conf.template: in prod nginx injects this
  // header; in dev we do it here so the SPA never has to know the key.
  const proxyHeaders = env.KIOSK_API_KEY ? { 'x-api-key': env.KIOSK_API_KEY } : undefined;

  return {
    plugins: [vanillaExtractPlugin(), react()],
    envDir: repoRoot,
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          headers: proxyHeaders,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  };
});
