'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Volume2,
  Headphones,
  CheckCircle2,
  Play,
  Square,
  Radio,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react';

interface SpeakerTesterProps {
  selectedSpeakerId: string;
  isSinkIdSupported: boolean;
  onVerificationChange?: (leftVerified: boolean, rightVerified: boolean) => void;
}

export const SpeakerTester: React.FC<SpeakerTesterProps> = ({
  selectedSpeakerId,
  isSinkIdSupported,
  onVerificationChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<'left' | 'right' | 'both' | null>(null);
  const [leftVerified, setLeftVerified] = useState<boolean>(false);
  const [rightVerified, setRightVerified] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync verification with parent
  const toggleLeftVerified = useCallback(() => {
    const next = !leftVerified;
    setLeftVerified(next);
    if (onVerificationChange) onVerificationChange(next, rightVerified);
  }, [leftVerified, rightVerified, onVerificationChange]);

  const toggleRightVerified = useCallback(() => {
    const next = !rightVerified;
    setRightVerified(next);
    if (onVerificationChange) onVerificationChange(leftVerified, next);
  }, [leftVerified, rightVerified, onVerificationChange]);

  // Stop active sounds cleanly
  const stopTone = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    activeOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    activeOscillatorsRef.current = [];

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsPlaying(false);
    setActiveChannel(null);
  }, []);

  // Play synthesized tone with pan, freq, and envelope
  const playTone = useCallback(
    async (
      freq: number,
      pan: number,
      durationMs: number,
      channel: 'left' | 'right' | 'both'
    ) => {
      stopTone();

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Handle custom sink ID routing if setSinkId is supported
      if (selectedSpeakerId && isSinkIdSupported && audioElementRef.current) {
        try {
          const dest = ctx.createMediaStreamDestination();
          audioElementRef.current.srcObject = dest.stream;
          const targetElem = audioElementRef.current as unknown as { setSinkId?: (id: string) => Promise<void> };
          if (targetElem.setSinkId) {
            await targetElem.setSinkId(selectedSpeakerId);
          }
          await audioElementRef.current.play().catch(() => {});
        } catch {
          // Fall back to default context output
        }
      }

      setIsPlaying(true);
      setActiveChannel(channel);

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Smooth attack and decay envelope to prevent click artifacts
      const now = ctx.currentTime;
      const attackTime = 0.04;
      const releaseTime = 0.08;
      const durationSec = durationMs / 1000;

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.7), now + attackTime);
      gainNode.gain.setValueAtTime(Math.max(0.001, volume * 0.7), now + durationSec - releaseTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      // Panning logic: use StereoPannerNode or ChannelMergerNode
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, ctx.currentTime);
        osc.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(ctx.destination);
      } else {
        // Fallback for older browsers
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + durationSec);
      activeOscillatorsRef.current.push(osc);

      stopTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        setActiveChannel(null);
      }, durationMs + 50);
    },
    [stopTone, volume, selectedSpeakerId, isSinkIdSupported]
  );

  // Left Channel Test: 440 Hz (A4) panned 100% Left
  const testLeftChannel = useCallback(() => {
    playTone(440, -1, 1500, 'left');
  }, [playTone]);

  // Right Channel Test: 880 Hz (A5) panned 100% Right
  const testRightChannel = useCallback(() => {
    playTone(880, 1, 1500, 'right');
  }, [playTone]);

  // Ping-Pong Stereo Test: Left chime followed by Right chime
  const testPingPong = useCallback(() => {
    stopTone();
    // First Left
    playTone(440, -1, 1000, 'left');
    stopTimeoutRef.current = setTimeout(() => {
      // Then Right
      playTone(880, 1, 1000, 'right');
    }, 1100);
  }, [stopTone, playTone]);

  // Frequency Sweep (80 Hz to 6000 Hz)
  const testSweep = useCallback(() => {
    stopTone();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    setIsPlaying(true);
    setActiveChannel('both');

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    const duration = 2.5;

    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(6000, now + duration);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + 0.1);
    gainNode.gain.setValueAtTime(volume * 0.4, now + duration - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
    activeOscillatorsRef.current.push(osc);

    stopTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
      setActiveChannel(null);
    }, duration * 1000 + 50);
  }, [stopTone, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTone();
    };
  }, [stopTone]);

  return (
    <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Hidden audio element for setSinkId routing */}
      <audio ref={audioElementRef} className="hidden" playsInline />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Speaker & Stereo Balance Test</span>
              {isPlaying && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  EMITTING
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Web Audio Synthesizer • Stereo Panner • Pure Sine Chimes
            </p>
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Vol:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-indigo-500 cursor-pointer bg-slate-800 rounded"
          />
          <span className="text-slate-300 font-mono text-[10px] w-6 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Interactive Stereo Visualizer Stage */}
      <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-6">
        {/* Headphone / Speaker Graphic with Animated Audio Waves */}
        <div className="relative flex items-center justify-center w-full max-w-sm py-4">
          {/* Left Earcup / Channel */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`relative flex items-center justify-center w-20 h-20 rounded-2xl border transition-all duration-300 ${
                activeChannel === 'left' || activeChannel === 'both'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.6)] scale-105'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}
            >
              <Volume2 className="w-8 h-8" />
              {(activeChannel === 'left' || activeChannel === 'both') && (
                <div className="absolute -left-3 -top-3 w-4 h-4 rounded-full bg-cyan-400 animate-ping" />
              )}
            </div>
            <div className="text-center font-mono">
              <span className="text-xs font-semibold text-slate-200 block">LEFT EAR</span>
              <span className="text-[10px] text-cyan-400">440 Hz (A4)</span>
            </div>
          </div>

          {/* Central Headband Arch & Soundwaves */}
          <div className="flex-1 flex flex-col items-center px-4">
            <div className="w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full opacity-60 mb-2" />
            <div className="flex items-center gap-1.5">
              <Radio
                className={`w-5 h-5 transition-colors ${
                  isPlaying ? 'text-indigo-400 animate-pulse' : 'text-slate-600'
                }`}
              />
              <span className="text-[11px] font-mono text-slate-400">
                {activeChannel === 'left'
                  ? '← Left Only'
                  : activeChannel === 'right'
                  ? 'Right Only →'
                  : activeChannel === 'both'
                  ? '↔ Stereo Center'
                  : 'Channel Standby'}
              </span>
            </div>
          </div>

          {/* Right Earcup / Channel */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`relative flex items-center justify-center w-20 h-20 rounded-2xl border transition-all duration-300 ${
                activeChannel === 'right' || activeChannel === 'both'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.6)] scale-105'
                  : 'bg-slate-900/80 border-slate-800 text-slate-500'
              }`}
            >
              <Volume2 className="w-8 h-8" />
              {(activeChannel === 'right' || activeChannel === 'both') && (
                <div className="absolute -right-3 -top-3 w-4 h-4 rounded-full bg-purple-400 animate-ping" />
              )}
            </div>
            <div className="text-center font-mono">
              <span className="text-xs font-semibold text-slate-200 block">RIGHT EAR</span>
              <span className="text-[10px] text-purple-400">880 Hz (A5)</span>
            </div>
          </div>
        </div>

        {/* Tone Generator Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-lg">
          <button
            type="button"
            onClick={testLeftChannel}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              activeChannel === 'left'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-850'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Left (440Hz)</span>
          </button>

          <button
            type="button"
            onClick={testRightChannel}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              activeChannel === 'right'
                ? 'bg-purple-500 text-slate-950 font-bold border-purple-400'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-purple-500/50 hover:bg-slate-850'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Right (880Hz)</span>
          </button>

          <button
            type="button"
            onClick={testPingPong}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              isPlaying && (activeChannel === 'left' || activeChannel === 'right')
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-850'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ping-Pong Test</span>
          </button>

          <button
            type="button"
            onClick={isPlaying ? stopTone : testSweep}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              isPlaying && activeChannel === 'both'
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-red-400" />
                <span>Stop Tone</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Freq Sweep</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Checkboxes */}
        <div className="w-full max-w-lg p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Listener Verification:</span>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLeftVerified}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                leftVerified
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  leftVerified ? 'bg-emerald-500 border-emerald-400' : 'border-slate-600'
                }`}
              >
                {leftVerified && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
              </div>
              <span>Left Ear OK</span>
            </button>

            <button
              type="button"
              onClick={toggleRightVerified}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                rightVerified
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  rightVerified ? 'bg-emerald-500 border-emerald-400' : 'border-slate-600'
                }`}
              >
                {rightVerified && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
              </div>
              <span>Right Ear OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
