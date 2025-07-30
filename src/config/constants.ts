import type { AppSettings } from './appConfig';

/**
 * Sektionstyp-Definition
 */
export interface SectionType {
  value: string;
  label: string;
}

/**
 * Defines the available section types for songs
 */
export const SECTION_TYPES: SectionType[] = [
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'pre-chorus', label: 'Pre' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'note', label: 'Note' }
];

/**
 * Gradient classes for visual styling
 */
export const GRADIENTS: string[] = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500'
];

/**
 * Typing für ein leeres Lied
 */
export interface NewSongTemplate {
  title: string;
  bpm?: string;
  key?: string;
  sections: {
    type: string;
    title: string;
    lines: {
      text: string;
      syllables: number;
    }[];
    recording: null;
  }[];
  createdAt: null;
  updatedAt: null;
}

/**
 * Template for a new empty song
 */
export const NEW_SONG_TEMPLATE: NewSongTemplate = {
  title: 'New Song',
  bpm: '',
  key: '',
  sections: [
    {
      type: 'verse',
      title: 'Verse 1',
      lines: [
        { text: '', syllables: 0 },
        { text: '', syllables: 0 },
        { text: '', syllables: 0 },
        { text: '', syllables: 0 }
      ],
      recording: null
    }
  ],
  createdAt: null,
  updatedAt: null
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  SONGS: 'lyrics_app_songs',
  CURRENT_SONG_ID: 'lyrics_app_current_song_id',
  DARK_MODE: 'lyrics_app_dark_mode',
  APP_SETTINGS: 'lyrics_app_settings'
};

/**
 * App settings with defaults
 */
export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  fontSize: 'medium', // 'small', 'medium', 'large'
  language: 'en-US',
  autoSave: true,
  showSyllableCount: true
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AUDIO_PERMISSION_DENIED: 'Microphone access was denied. Please allow access in your browser settings.',
  AUDIO_DEVICE_NOT_FOUND: 'No microphone found. Please make sure a microphone is connected.',
  AUDIO_GENERAL_ERROR: 'An error occurred during recording.',
  STORAGE_ERROR: 'Error saving data. Please try again.'
};

/**
 * Maximum values
 */
export const LIMITS = {
  MAX_SONGS: 500,
  MAX_SECTIONS_PER_SONG: 50,
  MAX_LINES_PER_SECTION: 100,
  MAX_RECORDING_TIME: 300 // seconds
}; 