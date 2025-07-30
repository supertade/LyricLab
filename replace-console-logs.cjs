#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mappings für console-Methoden zu Logger-Methoden
const consoleMappings = {
  'console.log': 'debug',
  'console.info': 'info', 
  'console.warn': 'warn',
  'console.error': 'error'
};

// Spezialisierte Logger-Methoden basierend auf Dateiname oder Inhalt
const specializedLoggers = {
  'cloudStorage': 'sync',
  'collaboration': 'collaboration',
  'audio': 'audio',
  'auth': 'auth',
  'fileManager': 'storage',
  'recorder': 'audio'
};

function getLoggerMethod(filePath, originalMethod, logMessage) {
  const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  const fileContent = logMessage.toLowerCase();
  
  // Bestimme spezialisierten Logger basierend auf Dateiname
  for (const [keyword, method] of Object.entries(specializedLoggers)) {
    if (fileName.includes(keyword)) {
      return method;
    }
  }
  
  // Bestimme spezialisierten Logger basierend auf Inhalt
  if (fileContent.includes('collaborat') || fileContent.includes('session')) {
    return 'collaboration';
  }
  if (fileContent.includes('cloud') || fileContent.includes('sync') || fileContent.includes('firebase')) {
    return 'sync';
  }
  if (fileContent.includes('audio') || fileContent.includes('record') || fileContent.includes('playback')) {
    return 'audio';
  }
  if (fileContent.includes('auth') || fileContent.includes('login') || fileContent.includes('user')) {
    return 'auth';
  }
  if (fileContent.includes('storage') || fileContent.includes('save') || fileContent.includes('load')) {
    return 'storage';
  }
  
  // Fallback auf Standard-Mapping
  return consoleMappings[originalMethod] || 'debug';
}

function addLoggerImport(content, filePath) {
  const ext = path.extname(filePath);
  const isVue = ext === '.vue';
  
  // Überprüfe, ob Logger bereits importiert wurde
  if (content.includes('from \'@/utils/logger\'') || content.includes('from "@/utils/logger"')) {
    return content;
  }
  
  let importStatement = "import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'";
  
  if (isVue) {
    // Für Vue-Dateien: füge Import im <script> Tag hinzu
    const scriptMatch = content.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/);
    if (scriptMatch) {
      const existingImports = scriptMatch[2];
      const hasImports = existingImports.includes('import');
      
      if (hasImports) {
        const lastImportIndex = existingImports.lastIndexOf('import');
        const nextLineIndex = existingImports.indexOf('\n', lastImportIndex);
        
        if (nextLineIndex !== -1) {
          const beforeImport = existingImports.substring(0, nextLineIndex + 1);
          const afterImport = existingImports.substring(nextLineIndex + 1);
          
          const newScriptContent = beforeImport + importStatement + '\n' + afterImport;
          return content.replace(scriptMatch[2], newScriptContent);
        }
      } else {
        const newScriptContent = importStatement + '\n' + scriptMatch[2];
        return content.replace(scriptMatch[2], newScriptContent);
      }
    }
  } else {
    // Für TS/JS-Dateien: füge Import am Anfang hinzu
    const lines = content.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        insertIndex = i + 1;
      } else if (line.startsWith('//') || line.startsWith('/*') || line === '') {
        continue;
      } else {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }
  
  return content;
}

function replaceConsoleLogs(content, filePath) {
  let modified = content;
  let hasConsoleLog = false;
  
  // Einfache Regex für die häufigsten Fälle
  const patterns = [
    // console.log('message', args...)
    /console\.(log|info|warn|error)\s*\(\s*(['"`])([^'"]*)\2\s*,([^)]+)\)/g,
    // console.log('message')
    /console\.(log|info|warn|error)\s*\(\s*(['"`])([^'"]*)\2\s*\)/g,
    // console.log(variable)
    /console\.(log|info|warn|error)\s*\(/g
  ];
  
  patterns.forEach((pattern, index) => {
    if (index < 2) {
      // Für Patterns mit Nachrichten
      modified = modified.replace(pattern, (match, method, quote, message, args) => {
        hasConsoleLog = true;
        const loggerMethod = getLoggerMethod(filePath, `console.${method}`, message || '');
        if (args) {
          return `${loggerMethod}(${quote}${message}${quote},${args})`;
        } else {
          return `${loggerMethod}(${quote}${message}${quote})`;
        }
      });
    } else {
      // Für allgemeine console.log( Fälle
      modified = modified.replace(pattern, (match, method) => {
        hasConsoleLog = true;
        const loggerMethod = getLoggerMethod(filePath, `console.${method}`, '');
        return `${loggerMethod}(`;
      });
    }
  });
  
  // Füge Logger-Import hinzu, wenn console.logs ersetzt wurden
  if (hasConsoleLog) {
    modified = addLoggerImport(modified, filePath);
  }
  
  return modified;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modified = replaceConsoleLogs(content, filePath);
    
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);
  let processedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'android', 'ios', 'tmp'].includes(entry)) {
        continue;
      }
      processedCount += processDirectory(fullPath);
    } else if (stat.isFile()) {
      if (/\.(ts|js|vue)$/.test(fullPath)) {
        if (processFile(fullPath)) {
          processedCount++;
        }
      }
    }
  }
  
  return processedCount;
}

// Hauptausführung
console.log('🚀 Starting console.log replacement...');
console.log('📁 Processing src directory...');

const srcPath = path.join(__dirname, 'src');
if (!fs.existsSync(srcPath)) {
  console.error('❌ src directory not found!');
  process.exit(1);
}

const processedCount = processDirectory(srcPath);
console.log(`✅ Completed! Processed ${processedCount} files.`);
console.log('🧹 Professional logging system is now active!');
