import Hypher from 'hypher';
import german from 'hyphenation.de';
import type { Song, Section, Line, Recording } from '../stores/fileManager';
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

// Hypher-Instanz mit deutschen Silbentrennungsregeln
const hypher = new Hypher(german);

/**
 * Formats a date string to a localized date format
 * @param dateString - Date string or Date object
 * @param locale - Locale for formatting (defaults to 'de-DE')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | null | undefined, locale: string = 'de-DE'): string {
  if (!dateString) return '';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    error('Error formatting date:', error);
    return '';
  }
}

/**
 * Counts syllables in a text string using Hypher for accurate German syllabification
 * @param text - Text to count syllables in
 * @returns Number of syllables
 */
export function countSyllables(text: string): number {
  if (!text) return 0;
  
  // Text in Wörter aufteilen
  const words = text.trim().split(/\s+/);
  
  // Für jedes Wort die Silben zählen
  return words.reduce((count, word) => {
    // Sonderzeichen und Zahlen entfernen, da diese keine Silben haben
    const cleanWord = word.replace(/[0-9.,!?;:()[\]{}'"\/\\+\-_=<>@#$%^&*]/g, '').trim();
    
    if (!cleanWord) return count;
    
    try {
      // Mit Hypher das Wort mit Bindestrichen trennen
      const hyphenatedWord = hypher.hyphenate(cleanWord).join('-');
      
      // Die Anzahl der Silben ist die Anzahl der Bindestriche + 1
      const syllables = (hyphenatedWord.match(/-/g) || []).length + 1;
      return count + syllables;
    } catch (e) {
      warn('Fehler beim Zählen der Silben für Wort:', cleanWord, e);
      // Fallback: mindestens eine Silbe pro Wort
      return count + 1;
    }
  }, 0);
}

/**
 * Formats section counts for display
 * @param sections - Array of section objects
 * @returns Object with section types as keys and counts as values
 */
export function getSectionCounts(sections: Section[]): Record<string, number> {
  return sections.reduce((acc: Record<string, number>, section) => {
    acc[section.type] = (acc[section.type] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Truncates text to a specific length, adding ellipsis if needed
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
} 