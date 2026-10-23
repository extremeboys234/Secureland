import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/auth/': 'http://127.0.0.1:8341',
      '/admin/stats.php': 'http://127.0.0.1:8341',
      '/documents/': 'http://127.0.0.1:8341',
      '/references/': 'http://127.0.0.1:8341',
    },
  },
});
