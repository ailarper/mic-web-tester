import React from 'react';
import { FAQ_DATA } from '@/components/FaqSection';

export const StructuredData: React.FC = () => {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Preflight Lab — Mic, Webcam & Audio Readiness Studio',
    alternateName: 'Preflight Lab',
    url: 'https://preflightlab.local',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows 10, Windows 11, macOS, Linux, ChromeOS, iOS, Android',
    browserRequirements: 'Requires modern browser with WebRTC (getUserMedia) and Web Audio API support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Production-grade browser utility for deep webcam frame rate, native microphone FFT frequency analysis, clipping detection, and speaker stereo balance diagnostics before Zoom and Google Meet calls.',
    featureList: [
      'Hardware webcam resolution and dynamic True FPS calculation via requestVideoFrameCallback',
      'Web Audio AnalyserNode 2048 FFT waveform and frequency spectrum visualizer',
      'Precise Decibel / Peak Meter with -18 to -6 dBFS optimal speech guidelines and clipping overload warning',
      'Ambient noise floor and 50Hz/60Hz mains electrical hum detector',
      'Left/Right synthesized pure tone stereo speaker verification with StereoPannerNode',
      '5-second local echo loopback recorder with in-memory buffer and zero server upload',
      'Exportable Markdown IT support diagnostic certificate',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.replace(/\*\*/g, '').replace(/`/g, ''),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};
