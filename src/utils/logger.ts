// Professional Logging System für LyricLab
// Verschiedene Logger für verschiedene App-Bereiche

// Logger-Level Konfiguration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

// Aktuelle Log-Level (reduziert für weniger Spam in der Konsole)
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;

// Quiet Mode - reduziert verbose Cloud/Storage Nachrichten
const QUIET_MODE = true; // Ändere auf false für vollständige Logs

// Base Logger-Funktion
const createLogger = (category: string, color: string) => {
  return {
    debug: (message: string, ...args: any[]) => {
      if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
        console.log(`%c[${category}]`, `color: ${color}; font-weight: bold`, message, ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      // Filtere häufige Cloud/Storage Nachrichten im Quiet Mode
      if (QUIET_MODE && (category === 'SYNC' || category === 'STORAGE')) {
        if (message.includes('synced') || 
            message.includes('saved') || 
            message.includes('loaded') ||
            message.includes('updated existing song') ||
            message.includes('Background sync') ||
            message.includes('Auto-syncing') ||
            message.includes('Successfully') ||
            message.includes('Cloud sync enabled')) {
          return; // Unterdrücke diese Nachrichten
        }
      }
      
      if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
        console.info(`%c[${category}]`, `color: ${color}; font-weight: bold`, message, ...args);
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
        console.warn(`%c[${category}]`, `color: ${color}; font-weight: bold`, message, ...args);
      }
    },
    error: (message: string, ...args: any[]) => {
      if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
        console.error(`%c[${category}]`, `color: ${color}; font-weight: bold`, message, ...args);
      }
    }
  };
};

// Spezialisierte Logger für verschiedene App-Bereiche
const loggers = {
  general: createLogger('GENERAL', '#6366f1'),
  collaboration: createLogger('COLLAB', '#10b981'),
  storage: createLogger('STORAGE', '#f59e0b'),
  audio: createLogger('AUDIO', '#ef4444'),
  auth: createLogger('AUTH', '#8b5cf6'),
  sync: createLogger('SYNC', '#06b6d4')
};

// Helper Funktion für kombinierte Funktions/Objekt-Logger
const createCombinedLogger = (logger: any) => {
  // Hauptfunktion für direkte Aufrufe: logger('message')
  const mainFunc = (message: string, ...args: any[]) => logger.info(message, ...args);
  
  // Objekt-Eigenschaften für spezifische Aufrufe: logger.info('message')
  mainFunc.debug = logger.debug;
  mainFunc.info = logger.info;
  mainFunc.warn = logger.warn;
  mainFunc.error = logger.error;
  
  return mainFunc;
};

// Allgemeine Logger-Funktionen
export const debug = (message: string, ...args: any[]) => loggers.general.debug(message, ...args);
export const info = (message: string, ...args: any[]) => loggers.general.info(message, ...args);
export const warn = (message: string, ...args: any[]) => loggers.general.warn(message, ...args);
export const error = (message: string, ...args: any[]) => loggers.general.error(message, ...args);

// Spezialisierte Logger - unterstützen sowohl direkte Aufrufe als auch Objekt-Methoden
export const collaboration = createCombinedLogger(loggers.collaboration);
export const storage = createCombinedLogger(loggers.storage);
export const audio = createCombinedLogger(loggers.audio);
export const auth = createCombinedLogger(loggers.auth);
export const sync = createCombinedLogger(loggers.sync);

// Logger Management
export const setLogLevel = (level: keyof typeof LOG_LEVELS) => {
  // Für zukünftige Erweiterungen
  console.info(`Log level set to: ${level}`);
};

// Performance Logging
export const performance = {
  start: (label: string) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.time(`⏱️ ${label}`);
    }
  },
  end: (label: string) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
};

// Gruppe für zusammengehörige Log-Nachrichten
export const group = {
  start: (label: string) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.group(`📦 ${label}`);
    }
  },
  end: () => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.groupEnd();
    }
  }
}; 