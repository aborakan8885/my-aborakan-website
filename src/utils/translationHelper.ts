import { TRANSLATIONS } from '../data/mockData';
import { Language } from '../types';

/**
 * Safely retrieves a translation string with fallback support.
 * Prevents crashes if a key is missing or TRANSLATIONS object is corrupted.
 */
export function getSafeTranslation(lang: Language, key: string, fallback?: string): string {
  try {
    const translations = TRANSLATIONS[lang] || TRANSLATIONS['ar'];
    const value = (translations as any)[key];
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    if (fallback) return fallback;
    
    // Attempt to get from Arabic as ultimate fallback
    const arFallback = (TRANSLATIONS['ar'] as any)[key];
    if (arFallback !== undefined) return String(arFallback);
    
    return `[${key}]`;
  } catch (err) {
    console.error('Translation error for key:', key, err);
    return fallback || `[${key}]`;
  }
}
