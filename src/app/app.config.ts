import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APP_BASE_HREF } from '@angular/common';
import { ScrollingModule, ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';

export const appConfig: ApplicationConfig = {
  providers: [
    ScrollDispatcher,
    ViewportRuler,
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withViewTransitions()), 
    provideClientHydration(), 
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    { provide: APP_BASE_HREF, useValue: '/' }
  ]
};
