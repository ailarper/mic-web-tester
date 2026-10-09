import { AdUnitConfig } from '@/types/preflight';

export const AD_CONFIGS: Record<string, AdUnitConfig> = {
  topLeaderboard: {
    id: 'preflight-top-leaderboard',
    title: 'Hardware & Meeting Tools Sponsor',
    slotType: 'leaderboard',
    width: 728,
    height: 90,
    refreshIntervalSec: 45,
    minViewabilityRatio: 0.5,
  },
  postDiagnosticRail: {
    id: 'preflight-post-diagnostic',
    title: 'Recommended Audio Gear & Tech',
    slotType: 'medium-rectangle',
    width: 300,
    height: 250,
    refreshIntervalSec: 45,
    minViewabilityRatio: 0.5,
  },
  bottomBanner: {
    id: 'preflight-bottom-sponsor',
    title: 'Remote Collaboration Solutions',
    slotType: 'leaderboard',
    width: 728,
    height: 90,
    refreshIntervalSec: 45,
    minViewabilityRatio: 0.5,
  },
};

export interface SponsorCreative {
  brand: string;
  tagline: string;
  cta: string;
  category: string;
  badge: string;
  accentColor: string;
}

export const SAMPLE_SPONSORS: SponsorCreative[] = [
  {
    brand: 'StudioMic Broadcast Pro',
    tagline: 'Ultra-low noise XLR & USB broadcast microphone with analog limiter.',
    cta: 'Explore Hardware',
    category: 'Pro Audio Tech',
    badge: 'Hardware Partner',
    accentColor: '#38bdf8',
  },
  {
    brand: 'ClearBeam 4K HDR Webcam',
    tagline: '60 FPS sensor with hardware AI low-light enhancement and privacy shutter.',
    cta: 'View Benchmarks',
    category: 'Webcam Hardware',
    badge: 'Featured Gear',
    accentColor: '#10b981',
  },
  {
    brand: 'EchoGuard Noise Canceling',
    tagline: 'Eliminate dog barks, keyboard clatter, and AC hum in any video meeting app.',
    cta: 'Try Free Trial',
    category: 'Software Audio AI',
    badge: 'Productivity Tool',
    accentColor: '#818cf8',
  },
  {
    brand: 'AcousticFoam Pro Acoustic Panels',
    tagline: 'High-density bevelled sound absorbing tiles for home office studio setups.',
    cta: 'Check Room Kits',
    category: 'Room Acoustics',
    badge: 'Studio Setup',
    accentColor: '#f59e0b',
  },
];
