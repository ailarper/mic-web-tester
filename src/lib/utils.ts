import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SystemDiagnosticReport } from '@/types/preflight';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDb(db: number): string {
  if (!isFinite(db) || db <= -100) return '-∞ dB';
  return `${db.toFixed(1)} dBFS`;
}

export function simplifyAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 21 / 9) < 0.08) return '21:9';
  return `${Math.round(ratio * 10) / 10}:1`;
}

export function detectBrowserAndOs(): { browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { browser: 'Server', os: 'Unknown OS' };
  }

  const userAgent = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // OS detection
  if (/Windows NT 10.0/i.test(userAgent)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(userAgent)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    os = 'macOS';
    if (/Mac OS X 14/i.test(userAgent)) os = 'macOS Sonoma';
    else if (/Mac OS X 13/i.test(userAgent)) os = 'macOS Ventura';
    else if (/Mac OS X 15/i.test(userAgent)) os = 'macOS Sequoia';
  } else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Browser detection
  if (/Edg\//i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(userAgent)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) browser = 'Apple Safari';
  else if (/Brave/i.test(userAgent)) browser = 'Brave';

  return { browser, os };
}

export function formatMarkdownReport(report: SystemDiagnosticReport): string {
  return `### 📋 Preflight Lab — Hardware & Audio Diagnostic Report
*Generated via Preflight Lab Studio (https://preflightlab.local)*

- **Diagnostic Timestamp:** ${report.timestamp}
- **Operating System:** ${report.platform}
- **Web Browser:** ${report.browserName}
- **Overall Readiness Tier:** ${report.readinessTier} (${report.readinessScore}% Score)

---

#### 📷 Webcam Stream Diagnostics
- **Active Camera Device:** \`${report.camera.label}\`
- **Native Resolution:** ${report.camera.resolution} (${report.camera.aspectRatio})
- **Frame Rate (True FPS):** ${report.camera.fps} FPS
- **Video Feed Status:** ${report.camera.status}

#### 🎙️ Microphone & Audio Analysis
- **Active Microphone Device:** \`${report.microphone.label}\`
- **Peak Signal Level:** ${report.microphone.peakDb}
- **Ambient Noise Floor:** ${report.microphone.noiseFloorDb}
- **Clipping Overload:** ${report.microphone.clippingDetected ? '⚠️ YES (Signal saturated > -3dBFS)' : '✅ None (Clean dynamic headroom)'}
- **Background Hum / Noise:** ${report.microphone.elevatedNoiseDetected ? '⚠️ Elevated background noise detected' : '✅ Optimal speech isolation'}
- **Audio Feed Status:** ${report.microphone.status}

#### 🔊 Stereo Headphone / Speaker Output
- **Audio Output Device:** \`${report.speaker.label}\`
- **Stereo Left/Right Balance:** ${report.speaker.stereoVerified ? '✅ Verified by listener' : '⚠️ Unverified'}
- **setSinkId Support:** ${report.speaker.sinkIdSupported ? 'Supported' : 'Native default routing (Safari/Mobile)'}
- **Speaker Status:** ${report.speaker.status}

#### 🔄 Echo & Self-Check Loopback Test
- **Audio/Video Loopback Playback:** ${report.loopback.completed ? '✅ Recorded & Verified' : '⚠️ Not recorded'}
- **Negotiated Codec:** \`${report.loopback.codecUsed || 'N/A'}\`
- **5-Second Clip Size:** ${report.loopback.fileSizeBytes > 0 ? formatBytes(report.loopback.fileSizeBytes) : 'N/A'}

---
*Client-Side Privacy Guarantee: All media streams processed locally in browser RAM with zero server relays.*
`;
}
