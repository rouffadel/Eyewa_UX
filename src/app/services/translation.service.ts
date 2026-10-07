import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EN_DICTIONARY, AR_DICTIONARY } from './i18n-dictionaries';

export type LanguageCode = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  
  readonly currentLang = signal<LanguageCode>('en');
  readonly translations = signal<Record<string, any>>(EN_DICTIONARY);
  readonly isLoaded = signal<boolean>(true);

  private enDictionary: Record<string, any> = EN_DICTIONARY;
  private arDictionary: Record<string, any> = AR_DICTIONARY;

  constructor() {
    const savedLang = (localStorage.getItem('eyewa_pos_language') as LanguageCode) || 'en';
    this.setLanguage(savedLang);
    this.initTranslations(savedLang);
  }

  async initTranslations(initialLang: LanguageCode = 'en'): Promise<void> {
    try {
      // Background async update if asset files exist
      this.http.get<Record<string, any>>('/assets/i18n/en.json').subscribe({
        next: (en) => {
          if (en && Object.keys(en).length) {
            this.enDictionary = { ...EN_DICTIONARY, ...en };
            if (this.currentLang() === 'en') {
              this.translations.set(this.enDictionary);
            }
          }
        }
      });
      this.http.get<Record<string, any>>('/assets/i18n/ar.json').subscribe({
        next: (ar) => {
          if (ar && Object.keys(ar).length) {
            this.arDictionary = { ...AR_DICTIONARY, ...ar };
            if (this.currentLang() === 'ar') {
              this.translations.set(this.arDictionary);
            }
          }
        }
      });
    } catch {
      // Fallback already initialized synchronously
    }
  }

  setLanguage(lang: LanguageCode): void {
    this.currentLang.set(lang);
    try {
      localStorage.setItem('eyewa_pos_language', lang);
    } catch {
      // ignore
    }

    // Toggle document direction for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }

    const dict = lang === 'ar' ? this.arDictionary : this.enDictionary;
    this.translations.set(dict);
  }

  translate(key: string, params?: Record<string, any>): string {
    const dict = this.translations();
    if (!key) return '';

    const parts = key.split('.');
    let current: any = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key; // Fallback to key if string missing
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    let result = current;
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(params[paramKey]));
      });
    }

    return result;
  }

  t(key: string, params?: Record<string, any>): string {
    return this.translate(key, params);
  }
}
