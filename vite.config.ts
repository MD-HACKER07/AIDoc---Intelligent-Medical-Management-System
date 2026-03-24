import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (/\.(png|jpe?g|gif|svg|ico)$/i.test(name)) {
            return `assets/images/[name]-[hash][ext]`;
          }
          return `assets/[name]-[hash][ext]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'lucide-react'
          ],
          'chat': [
            './src/components/Chat.tsx',
            './src/services/chatService.ts',
            './src/services/api.ts'
          ],
          'ui': [
            './src/components/Footer.tsx',
            './src/context/SiteContext.tsx',
            './src/context/ChatContext.tsx'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

