/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'material': [
            '@angular/material/table',
            '@angular/material/form-field',
            '@angular/material/input',
            '@angular/material/paginator',
            '@angular/material/sort'
          ],
          'vendor': [
            '@angular/core',
            '@angular/common',
            '@angular/platform-browser',
            '@angular/router'
          ]
        }
      }
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['@angular/material', '@angular/cdk'],
    exclude: ['papaparse']
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,csv}'],
        runtimeCaching: [
          {
            urlPattern: /\.csv$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'csv-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              }
            }
          }
        ]
      }
    })
  ]
});