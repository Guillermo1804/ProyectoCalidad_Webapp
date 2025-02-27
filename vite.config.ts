import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@angular/material/table',
      '@angular/common',
      'rxjs',
      'papaparse'
    ]
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'material': [
            '@angular/material/table',
            '@angular/material/form-field',
            '@angular/material/input',
            '@angular/material/paginator',
            '@angular/material/sort'
          ]
        }
      }
    }
  }
});