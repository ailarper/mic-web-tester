import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Test Your Mic & Camera in Seconds | Preflight Lab',
  description:
    'Make sure you look and sound clear before your Zoom, Google Meet, or Teams call. 100% private, runs entirely in your browser.',
  keywords: [
    'mic test',
    'webcam test',
    'microphone test',
    'camera fps tester',
    'decibel meter online',
    'audio visualizer',
    'preflight lab',
    'zoom audio test',
    'google meet mic check',
    'stereo speaker test',
    'noise floor detector',
  ],
  authors: [{ name: 'Preflight Lab Engineering' }],
  creator: 'Preflight Lab',
  publisher: 'Preflight Lab',
  metadataBase: new URL('https://preflightlab.local'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Preflight Lab — Mic, Webcam & Audio Readiness Studio',
    description:
      'Developer-grade hardware telemetry and diagnostic suite for cameras, microphones, and speakers. 100% client-side privacy.',
    url: 'https://preflightlab.local',
    siteName: 'Preflight Lab',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preflight Lab — Mic, Webcam & Audio Readiness Studio',
    description:
      'Run deep audio frequency, true stream FPS, and decibel clipping tests before live broadcast calls.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#070b12',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#070b12] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
