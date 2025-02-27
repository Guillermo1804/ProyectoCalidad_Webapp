import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@angular/material/table',
      '@angular/common',
      'rxjs',
      'papaparse'
    ]
  }
});