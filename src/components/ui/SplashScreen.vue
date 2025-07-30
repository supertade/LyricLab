<template>
  <div class="fixed inset-0 flex flex-col items-center justify-start z-50 splash-screen">
    <!-- Logo and Name Container -->
    <div class="logo-wrapper">
      <!-- Logo -->
      <div class="logo">
        <svg class="note-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path class="note-stem" d="M8 4L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path class="note-head" d="M8 16C8 17.6569 6.65685 19 5 19C3.34315 19 2 17.6569 2 16C2 14.3431 3.34315 13 5 13C6.65685 13 8 14.3431 8 16Z" stroke="currentColor" stroke-width="2"/>
          <path class="note-tail" d="M8 4L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path class="lyric-line-1" d="M12 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path class="lyric-line-2" d="M14 14H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      
      <!-- App Name with Sound Waves -->
      <div class="app-name-container">
        <h1 class="app-name">LyricLab</h1>
      </div>
    </div>
    
    <!-- Loading Text Animation -->
    <div class="loading-container">
      <!-- Visual Song Loading Animation -->
      <div class="visual-loading">
        <!-- Documents/Songs that appear -->
        <div class="song-document doc1">
          <div class="doc-lines">
            <div class="doc-line"></div>
            <div class="doc-line"></div>
            <div class="doc-line"></div>
          </div>
          <div class="doc-note"></div>
        </div>
        <div class="song-document doc2">
          <div class="doc-lines">
            <div class="doc-line"></div>
            <div class="doc-line"></div>
            <div class="doc-line"></div>
          </div>
          <div class="doc-note"></div>
        </div>
        <div class="song-document doc3">
          <div class="doc-lines">
            <div class="doc-line"></div>
            <div class="doc-line"></div>
            <div class="doc-line"></div>
          </div>
          <div class="doc-note"></div>
        </div>
        
        <!-- Floating Music Notes -->
        <div class="floating-notes">
          <div class="float-note note1">♪</div>
          <div class="float-note note2">♫</div>
          <div class="float-note note3">♪</div>
          <div class="float-note note4">♫</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No automatic dark mode detection to respect user preferences
</script>

<style scoped>
/**
 * Main splash screen container with background and text colors
 * Includes transition for smooth theme switching
 */
.splash-screen {
  background-color: var(--background);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/**
 * Light theme color variables
 */
:root {
  --background: #ffffff;
  --text: #000000;
  --accent: #0055cc;
  --secondary: #0066dd;
  --gradient-start: #0055cc;
  --gradient-end: #0077ee;
}

/**
 * Dark theme color variables
 */
:deep(.dark) {
  --background: #000000;
  --text: #ffffff;
  --accent: #4180db;
  --secondary: #5f68c3;
  --gradient-start: #4180db;
  --gradient-end: #7e61dc;
}

/**
 * Logo and app name container
 */
.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin-top: 25vh;
}

.logo {
  width: 140px;
  height: 140px;
  position: relative;
}

.note-icon {
  width: 100%;
  height: 100%;
  color: var(--accent);
}

/**
 * Animated SVG paths for drawing the music note
 * Each part has its own animation timing
 */
.note-stem {
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  animation: drawLine 0.7s ease forwards;
}

.note-head {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: drawLine 0.7s ease 0.3s forwards;
}

.note-tail {
  stroke-dasharray: 10;
  stroke-dashoffset: 10;
  animation: drawLine 0.5s ease 0.6s forwards;
}

.lyric-line-1 {
  stroke-dasharray: 10;
  stroke-dashoffset: 10;
  animation: drawLine 0.5s ease 0.9s forwards;
}

.lyric-line-2 {
  stroke-dasharray: 10;
  stroke-dashoffset: 10;
  animation: drawLine 0.5s ease 1.2s forwards;
}

/**
 * Animation for drawing SVG paths
 */
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.app-name-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.app-name {
  font-size: 38px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.5px;
}

:deep(.dark) .app-name {
  color: var(--accent);
  text-shadow: 0 0 20px rgba(65, 128, 219, 0.3);
}

/**
 * Loading animation container 
 * Positioned at the bottom of the screen
 */
.loading-container {
  position: absolute;
  bottom: 15%;
  left: 0;
  right: 0;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 180px;
  height: 100px;
}

/**
 * Container for the visual loading animations
 */
.visual-loading {
  position: relative;
  width: 100%;
  height: 70px;
  display: flex;
  justify-content: center;
}

/**
 * Song document animations
 * Small document icons that appear with animation
 */
.song-document {
  position: absolute;
  width: 26px;
  height: 32px;
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  overflow: hidden;
}

:deep(.dark) .song-document {
  background-color: #222;
  box-shadow: 0 2px 5px rgba(255, 255, 255, 0.1);
}

/**
 * Animation timing for each document appearance
 */
.doc1 {
  left: 35px;
  animation: docAppear 0.4s ease-out 0.3s forwards;
}

.doc2 {
  left: 77px;
  animation: docAppear 0.4s ease-out 0.4s forwards;
}

.doc3 {
  left: 120px;
  animation: docAppear 0.4s ease-out 0.5s forwards;
}

/**
 * Document content - lines representing text
 */
.doc-lines {
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.doc-line {
  height: 2px;
  background-color: #aaa;
  border-radius: 1px;
  width: 70%;
}

:deep(.dark) .doc-line {
  background-color: #444;
}

.doc-line:nth-child(2) {
  width: 60%;
}

.doc-line:nth-child(3) {
  width: 40%;
}

/**
 * Music note indicator in each document
 */
.doc-note {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0;
  animation: fadeIn 0.2s ease 0.1s forwards;
}

/**
 * Floating music note animations
 */
.floating-notes {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: 100%;
}

.float-note {
  position: absolute;
  font-size: 14px;
  color: var(--accent);
  opacity: 0;
}

/**
 * Position and animation timing for each floating note
 */
.note1 {
  top: 40px;
  left: 15px;
  animation: floatNoteToDoc 3s ease-in-out 0.6s infinite;
}

.note2 {
  top: 50px;
  left: 50px;
  animation: floatNoteToDoc 2.8s ease-in-out 0.7s infinite;
}

.note3 {
  top: 45px;
  left: 95px;
  animation: floatNoteToDoc 3.2s ease-in-out 0.8s infinite;
}

.note4 {
  top: 50px;
  left: 150px;
  animation: floatNoteToDoc 2.5s ease-in-out 0.9s infinite;
}

/**
 * Animation for floating notes movement
 */
@keyframes floatNoteToDoc {
  0% {
    opacity: 0;
    transform: translateY(10px) translateX(0);
  }
  20% {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
  60% {
    opacity: 1;
    transform: translateY(-15px) translateX(var(--target-x, 0)) rotate(5deg);
  }
  80% {
    opacity: 0;
    transform: translateY(-20px) translateX(var(--target-x, 0)) scale(0.8) rotate(10deg);
  }
  100% {
    opacity: 0;
    transform: translateY(10px) translateX(0) scale(1) rotate(0);
  }
}

/**
 * Target position for each note's X movement
 */
.note1 {
  --target-x: 30px;
}

.note2 {
  --target-x: 30px;
}

.note3 {
  --target-x: -10px;
}

.note4 {
  --target-x: -20px;
}

/**
 * Animation for document appearance
 */
@keyframes docAppear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/**
 * Animation for fading in text elements
 */
@keyframes fadeInLetters {
  from { opacity: 0; }
  to { opacity: 1; }
}

/**
 * Animation for pulsing dot elements
 */
@keyframes pulseDot {
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.3);
  }
}
</style> 