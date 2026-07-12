import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AppConfigService } from './services/app-config.service';
import { KeyboardViewportService } from './services/keyboard-viewport.service';
import { AuthService } from './features/auth/services/auth.service';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';

export function initializeApp(
  appConfigService: AppConfigService,
  authService: AuthService,
  keyboardViewport: KeyboardViewportService,
) {
  const env = document.location.hostname.includes('localhost') ? 'dev' : 'prod';
  return () =>
    keyboardViewport.init().then(() =>
      appConfigService.loadConfig(env).then(() => {
        void authService.refreshAccessTokenIfNeeded();
      }),
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfigService, AuthService, KeyboardViewportService],
      multi: true,
    },
  ],
};
