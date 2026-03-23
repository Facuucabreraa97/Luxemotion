import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      strictPort: true,
      host: '0.0.0.0',
    },
    plugins: [react()],
    // API keys removed from frontend bundle for security - use server-side proxy instead
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    optimizeDeps: {
      include: ['react-i18next', 'i18next']
    }
  };
});
