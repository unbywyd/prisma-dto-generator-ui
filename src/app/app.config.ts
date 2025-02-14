import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ApplicationConfig, importProvidersFrom, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiModule, Configuration } from '../generated/openapi';
import { provideAnimations, } from '@angular/platform-browser/animations';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import * as prismaLanguage from './prismaLang';


import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';

export function apiConfigurationFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
  });
}
export function onMonacoLoad() {
  const monaco = (window as any).monaco as any;

  // Регистрация языка Prisma
  monaco.languages.register({ id: 'prisma' });

  // Установка Monarch-токенизации
  monaco.languages.setMonarchTokensProvider('prisma', prismaLanguage.language);

  // Установка конфигурации языка (автозакрытие скобок и т.д.)
  monaco.languages.setLanguageConfiguration('prisma', prismaLanguage.config);

  // Регистрация автодополнения
  monaco.languages.registerCompletionItemProvider('prisma', {
    provideCompletionItems: (model: any, position: any) => {
      const wordInfo = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn
      );

      // Автодополнение
      const suggestions = prismaLanguage.suggestions.map((suggestion: any) => ({
        ...suggestion,
        range,
      }));
      return { suggestions };
    },
  });

}
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      MonacoEditorModule.forRoot({
        onMonacoLoad
      }),
      ApiModule.forRoot(apiConfigurationFactory)),
  ]
};
