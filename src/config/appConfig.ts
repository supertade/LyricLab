import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

/**
 * Represents the application settings
 */
export interface AppSettings {
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  autoSave: boolean;
  showSyllableCount: boolean;
  [key: string]: any;
}

/**
 * Loads app settings from localStorage, using defaults for missing settings
 * @returns App settings
 */
export function loadAppSettings(): AppSettings {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!storedSettings) return DEFAULT_SETTINGS as AppSettings;
    
    const parsedSettings = JSON.parse(storedSettings);
    return { ...DEFAULT_SETTINGS, ...parsedSettings } as AppSettings;
  } catch (error) {
    storage('Error loading app settings:', error);
    return DEFAULT_SETTINGS as AppSettings;
  }
}

/**
 * Saves app settings to localStorage
 * @param settings - App settings to save
 * @returns Success status
 */
export function saveAppSettings(settings: Partial<AppSettings>): boolean {
  try {
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(mergedSettings));
    return true;
  } catch (error) {
    error('Error saving app settings:', error);
    return false;
  }
}

/**
 * Gets the user's preferred dark mode setting, checking localStorage, OS preference, and defaults
 * @returns Whether dark mode should be enabled
 */
export function getPreferredDarkMode(): boolean {
  try {
    // Check localStorage first
    const savedDarkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    }
    
    // Then check OS preferences
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    error('Error determining dark mode preference:', error);
    return (DEFAULT_SETTINGS as AppSettings).darkMode;
  }
}

/**
 * Updates the dark mode preference in both localStorage and app settings
 * @param isDarkMode - Dark mode state
 */
export function updateDarkModePreference(isDarkMode: boolean): void {
  try {
    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDarkMode.toString());
    
    // Update app settings
    const settings = loadAppSettings();
    settings.darkMode = isDarkMode;
    saveAppSettings(settings);
    
    // Apply to DOM
    document.documentElement.classList.toggle('dark', isDarkMode);
  } catch (error) {
    error('Error updating dark mode preference:', error);
  }
}

/**
 * App metadata and information
 */
export const APP_INFO = {
  name: 'LyricsApp',
  version: '1.0.0',
  developer: 'Tade Jürgensen',
  website: 'https://lyricsapp.com',
  supportEmail: 'support@lyricsapp.com',
  copyright: `© ${new Date().getFullYear()} LyricsApp`
}; 