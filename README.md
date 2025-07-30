# LyricLab

Eine moderne App zum Erstellen und Verwalten von Songtexten mit automatischer Silbenzählung und Cloud-Synchronisation über Firebase.

## Features

- Erstellen und Bearbeiten von Songtexten
- Organisation in Abschnitte (Verse, Chorus, etc.)
- Audioaufnahmen für Melodie-Ideen
- Automatische Silbenzählung für deutsche Texte
- Einfache Drag & Drop Funktionalität
- Firebase Cloud-Synchronisation für Geräteübergreifende Nutzung
- Dark Mode

## Setup

### Voraussetzungen

- Node.js 16+
- NPM oder Yarn
- Android Studio (für Android-Builds)
- Xcode (für iOS-Builds)

### Installation

1. Repository klonen
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. Entwicklungsserver starten:
   ```
   npm run dev
   ```

### Firebase Cloud-Synchronisation konfigurieren

Für die Cloud-Synchronisation ist Firebase bereits vorkonfiguriert. Weitere Details finden Sie in `FIREBASE_SETUP.md`.

Um die Cloud-Synchronisation zu nutzen:
1. Firestore Database in der Firebase Console aktivieren
2. Sicherheitsregeln aus `firestore.rules` übernehmen
3. Einen Account in der App erstellen und Songs werden automatisch synchronisiert

## Build für Produktion

Um einen Build für die Produktion zu erstellen:

```
npm run build
```

## Mobile Apps mit Capacitor

Die App unterstützt Capacitor für iOS und Android Builds:

### Android APK erstellen

Um einen Android-Build zu erstellen und eine APK zu generieren:

1. Android Studio installieren
2. Build erstellen und Android Studio öffnen:
   ```
   npm run build:android
   ```
3. In Android Studio:
   - `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)` wählen
   - Nach Abschluss des Builds auf den Link "locate" klicken
   - Die .apk-Datei befindet sich im Verzeichnis `app/build/outputs/apk/debug/`

### Release-Build für den Play Store

1. Keystore erstellen (nur einmalig erforderlich):
   ```
   keytool -genkey -v -keystore lyriclab.keystore -alias lyriclab -keyalg RSA -keysize 2048 -validity 10000
   ```
   
2. Build-Variante in Android Studio auf "release" umstellen
3. Release-Build erstellen:
   ```
   npm run release:android
   ```
4. In Android Studio:
   - `Build` > `Generate Signed Bundle / APK` wählen
   - Keystore-Informationen eingeben
   - Build erstellen

Die fertige APK-Datei kann dann an Kunden weitergegeben oder im Play Store veröffentlicht werden.

## Lizenz

[MIT](LICENSE)
