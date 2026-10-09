'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DeviceSelector } from '@/components/DeviceSelector';
import { VideoTester } from '@/components/VideoTester';
import { AudioTester } from '@/components/AudioTester';
import { SpeakerTester } from '@/components/SpeakerTester';
import { LoopbackRecorder } from '@/components/LoopbackRecorder';
import { ReadinessSummary } from '@/components/ReadinessSummary';
import { FaqSection } from '@/components/FaqSection';
import { AdContainer } from '@/components/ads/AdContainer';
import { StructuredData } from '@/components/StructuredData';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { AD_CONFIGS } from '@/lib/ad-config';
import {
  VideoStreamMetrics,
  AudioStreamMetrics,
  PreflightChecklist,
} from '@/types/preflight';

export default function PreflightLabPage() {
  const {
    devices,
    microphones,
    cameras,
    speakers,
    selectedMicId,
    selectedCameraId,
    selectedSpeakerId,
    setSelectedMicId,
    setSelectedCameraId,
    setSelectedSpeakerId,
    permissionStatus,
    errorState,
    videoStream,
    audioStream,
    isSinkIdSupported,
    requestPermissions,
    stopAllMedia,
    clearError,
    refreshDevices,
    isStreamActive,
  } = useMediaDevices();

  // Metrics state
  const [videoMetrics, setVideoMetrics] = useState<VideoStreamMetrics>({
    width: 0,
    height: 0,
    fps: 0,
    trueFps: 0,
    aspectRatio: '16:9',
    deviceLabel: '',
    isMirrored: true,
    isActive: false,
    hasTrack: false,
  });

  const [audioMetrics, setAudioMetrics] = useState<AudioStreamMetrics>({
    instantDb: -60,
    peakDb: -60,
    noiseFloorDb: -55,
    isClipping: false,
    elevatedNoise: false,
    isSpeaking: false,
    dominantFrequency: 0,
    hasHumDetected: false,
    sampleRate: 48000,
  });

  // Stereo speaker verification states
  const [speakerLeftVerified, setSpeakerLeftVerified] = useState<boolean>(false);
  const [speakerRightVerified, setSpeakerRightVerified] = useState<boolean>(false);

  // Loopback state
  const [loopbackComplete, setLoopbackComplete] = useState<boolean>(false);
  const [loopbackCodec, setLoopbackCodec] = useState<string>('');
  const [loopbackSize, setLoopbackSize] = useState<number>(0);

  // Computed Preflight Checklist
  const checklist: PreflightChecklist = useMemo(() => {
    return {
      cameraActive: Boolean(videoMetrics.isActive && videoMetrics.width > 0),
      cameraFpsTargetMet: Boolean((videoMetrics.trueFps >= 24) || (videoMetrics.fps >= 24 && videoMetrics.isActive)),
      micActive: Boolean(audioMetrics.peakDb > -58),
      micNoClipping: !audioMetrics.isClipping,
      speakerLeftVerified,
      speakerRightVerified,
      loopbackTested: loopbackComplete,
    };
  }, [videoMetrics, audioMetrics, speakerLeftVerified, speakerRightVerified, loopbackComplete]);

  // Selected device info lookups
  const selectedCamera = useMemo(
    () => cameras.find((c) => c.deviceId === selectedCameraId),
    [cameras, selectedCameraId]
  );
  const selectedMic = useMemo(
    () => microphones.find((m) => m.deviceId === selectedMicId),
    [microphones, selectedMicId]
  );
  const selectedSpeaker = useMemo(
    () => speakers.find((s) => s.deviceId === selectedSpeakerId),
    [speakers, selectedSpeakerId]
  );

  const handleSpeakerVerification = useCallback((left: boolean, right: boolean) => {
    setSpeakerLeftVerified(left);
    setSpeakerRightVerified(right);
  }, []);

  const handleLoopbackDone = useCallback((sizeBytes: number, codec: string) => {
    setLoopbackComplete(true);
    setLoopbackSize(sizeBytes);
    setLoopbackCodec(codec);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Structured Data for SEO / Rich Snippets */}
      <StructuredData />

      {/* Top App Header */}
      <Header />

      {/* Clean, Human-Friendly Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-900/60 bg-gradient-to-b from-slate-950 via-[#070b12] to-[#070b12]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-28 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Test Your Mic &amp; Camera in Seconds
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Make sure you look and sound clear before your Zoom, Google Meet, or Teams call. 100% private, runs entirely in your browser.
          </p>
        </div>
      </section>

      {/* Main Studio Body - Testing tools placed immediately below hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Device Selection & Quick Controls */}
        <DeviceSelector
          microphones={microphones}
          cameras={cameras}
          speakers={speakers}
          selectedMicId={selectedMicId}
          selectedCameraId={selectedCameraId}
          selectedSpeakerId={selectedSpeakerId}
          onSelectMic={setSelectedMicId}
          onSelectCamera={setSelectedCameraId}
          onSelectSpeaker={setSelectedSpeakerId}
          permissionStatus={permissionStatus}
          errorState={errorState}
          isStreamActive={isStreamActive}
          isSinkIdSupported={isSinkIdSupported}
          onRequestPermissions={requestPermissions}
          onStopMedia={stopAllMedia}
          onRefreshDevices={refreshDevices}
          onClearError={clearError}
        />

        {/* 2. Primary Live Diagnostic Testing Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Webcam Live Preview & Self-Check Clip */}
          <div className="space-y-6">
            <VideoTester
              stream={videoStream}
              onMetricsUpdate={setVideoMetrics}
            />

            <LoopbackRecorder
              stream={isStreamActive ? videoStream : null}
              onLoopbackComplete={handleLoopbackDone}
            />
          </div>

          {/* Right Column: Microphone Level Meter & Speaker Test */}
          <div className="space-y-6">
            <AudioTester
              stream={audioStream}
              onMetricsUpdate={setAudioMetrics}
            />

            <SpeakerTester
              selectedSpeakerId={selectedSpeakerId}
              isSinkIdSupported={isSinkIdSupported}
              onVerificationChange={handleSpeakerVerification}
            />

            {/* Post-Diagnostic Rail Ad */}
            <AdContainer config={AD_CONFIGS.postDiagnosticRail} />
          </div>
        </div>

        {/* Top Leaderboard Ad placed cleanly below the primary tools */}
        <AdContainer config={AD_CONFIGS.topLeaderboard} />

        {/* 3. Exportable Readiness Summary & IT Report */}
        <ReadinessSummary
          checklist={checklist}
          videoMetrics={videoMetrics}
          audioMetrics={audioMetrics}
          selectedCamera={selectedCamera}
          selectedMic={selectedMic}
          selectedSpeaker={selectedSpeaker}
          loopbackComplete={loopbackComplete}
          loopbackCodec={loopbackCodec}
          loopbackSize={loopbackSize}
        />

        {/* 4. Troubleshooting Guide & FAQ */}
        <FaqSection />

        {/* Bottom Banner Sponsor Slot */}
        <AdContainer config={AD_CONFIGS.bottomBanner} />
      </main>

      {/* Studio Footer */}
      <Footer />
    </div>
  );
}
