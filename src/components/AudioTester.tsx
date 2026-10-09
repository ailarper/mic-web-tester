'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  Activity,
  BarChart3,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { AudioStreamMetrics } from '@/types/preflight';
import { formatDb } from '@/lib/utils';

interface AudioTesterProps {
  stream: MediaStream | null;
  onMetricsUpdate?: (metrics: AudioStreamMetrics) => void;
}

export const AudioTester: React.FC<AudioTesterProps> = ({ stream, onMetricsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio nodes and animation references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // States
  const [visualizerMode, setVisualizerMode] = useState<'waveform' | 'frequency'>('frequency');
  const [peakHoldDb, setPeakHoldDb] = useState<number>(-60);
  const peakHoldRef = useRef<number>(-60);

  // Rolling noise floor tracking
  const noiseFloorAccumulatorRef = useRef<number[]>([]);
  const lastMetricsUpdateRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<AudioStreamMetrics>({
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

  const resetPeak = useCallback(() => {
    peakHoldRef.current = -60;
    setPeakHoldDb(-60);
  }, []);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      // Clean up previous context if any
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setMetrics({
        instantDb: -60,
        peakDb: -60,
        noiseFloorDb: -60,
        isClipping: false,
        elevatedNoise: false,
        isSpeaking: false,
        dominantFrequency: 0,
        hasHumDetected: false,
        sampleRate: 48000,
      });
      return;
    }

    // Initialize native AudioContext
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const timeDomainData = new Float32Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const canvasCtx = canvas ? canvas.getContext('2d') : null;

    let isRunning = true;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      analyser.getFloatTimeDomainData(timeDomainData);
      analyser.getByteFrequencyData(frequencyData);

      // 1. Calculate RMS & Decibels (dBFS)
      let sumSquares = 0;
      let peakSample = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = timeDomainData[i];
        const absVal = Math.abs(val);
        if (absVal > peakSample) peakSample = absVal;
        sumSquares += val * val;
      }

      const rms = Math.sqrt(sumSquares / bufferLength);
      // Convert to dBFS (0 dBFS is full-scale, min clamped to -60 dB)
      const instantDb = rms > 0.00001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
      const peakSampleDb = peakSample > 0.00001 ? Math.max(-60, 20 * Math.log10(peakSample)) : -60;

      // Update peak hold
      if (peakSampleDb > peakHoldRef.current) {
        peakHoldRef.current = peakSampleDb;
      } else {
        // Slow natural decay for peak indicator
        peakHoldRef.current = Math.max(-60, peakHoldRef.current - 0.05);
      }

      const isClipping = peakSampleDb > -3.0; // > -3 dB is hard clipping danger zone
      const isSpeaking = instantDb > -35.0;

      // Rolling noise floor calculation when user is not speaking
      if (!isSpeaking && instantDb > -60) {
        noiseFloorAccumulatorRef.current.push(instantDb);
        if (noiseFloorAccumulatorRef.current.length > 60) {
          noiseFloorAccumulatorRef.current.shift();
        }
      }

      const avgNoiseFloor =
        noiseFloorAccumulatorRef.current.length > 0
          ? noiseFloorAccumulatorRef.current.reduce((a, b) => a + b, 0) /
            noiseFloorAccumulatorRef.current.length
          : -50;

      const elevatedNoise = avgNoiseFloor > -40.0; // Alert if ambient floor > -40 dB

      // Check for 50Hz / 60Hz power mains electrical hum in lower frequency bins
      const binWidth = ctx.sampleRate / analyser.fftSize;
      const bin50 = Math.round(50 / binWidth);
      const bin60 = Math.round(60 / binWidth);
      const energy50 = frequencyData[bin50] || 0;
      const energy60 = frequencyData[bin60] || 0;
      const hasHum = !isSpeaking && (energy50 > 90 || energy60 > 90);

      // Throttled UI state updates to keep React smooth at 60 FPS
      if (timestamp - lastMetricsUpdateRef.current > 66) {
        lastMetricsUpdateRef.current = timestamp;
        setPeakHoldDb(peakHoldRef.current);
        const updatedMetrics: AudioStreamMetrics = {
          instantDb,
          peakDb: peakHoldRef.current,
          noiseFloorDb: avgNoiseFloor,
          isClipping,
          elevatedNoise,
          isSpeaking,
          dominantFrequency: 0,
          hasHumDetected: hasHum,
          humFrequency: energy60 > energy50 ? 60 : 50,
          sampleRate: ctx.sampleRate,
        };
        setMetrics(updatedMetrics);
        if (onMetricsUpdate) onMetricsUpdate(updatedMetrics);
      }

      // 2. Render Canvas Visualizer (Waveform or Frequency Spectrum)
      if (canvas && canvasCtx) {
        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.clearRect(0, 0, width, height);

        // Dark background grid
        canvasCtx.fillStyle = 'rgba(8, 13, 24, 0.95)';
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
        canvasCtx.beginPath();
        // Horizontal reference lines
        canvasCtx.moveTo(0, height * 0.25);
        canvasCtx.lineTo(width, height * 0.25);
        canvasCtx.moveTo(0, height * 0.5);
        canvasCtx.lineTo(width, height * 0.5);
        canvasCtx.moveTo(0, height * 0.75);
        canvasCtx.lineTo(width, height * 0.75);
        canvasCtx.stroke();

        if (visualizerMode === 'waveform') {
          // Render Oscilloscope
          canvasCtx.lineWidth = 2.5;
          const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#10b981');
          gradient.addColorStop(1, '#3b82f6');
          canvasCtx.strokeStyle = gradient;

          canvasCtx.beginPath();
          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = timeDomainData[i] * 1.5; // Gain magnification
            const y = (0.5 + v * 0.45) * height;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          canvasCtx.stroke();
        } else {
          // Render Frequency Spectrum Bars
          const barCount = 64;
          const barWidth = (width / barCount) - 1.5;
          const step = Math.floor(bufferLength / (barCount * 2));

          for (let i = 0; i < barCount; i++) {
            const value = frequencyData[i * step] || 0;
            const percent = value / 255;
            const barHeight = Math.max(3, percent * (height - 12));
            const x = i * (barWidth + 1.5);
            const y = height - barHeight;

            // Frequency gradient color
            const barGradient = canvasCtx.createLinearGradient(0, height, 0, y);
            if (percent > 0.85) {
              barGradient.addColorStop(0, '#10b981');
              barGradient.addColorStop(0.7, '#f59e0b');
              barGradient.addColorStop(1, '#ef4444');
            } else if (percent > 0.5) {
              barGradient.addColorStop(0, '#06b6d4');
              barGradient.addColorStop(1, '#10b981');
            } else {
              barGradient.addColorStop(0, '#1e3a8a');
              barGradient.addColorStop(1, '#06b6d4');
            }

            canvasCtx.fillStyle = barGradient;
            canvasCtx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, [stream, visualizerMode, onMetricsUpdate]);

  // Convert dBFS (-60 to 0) to percentage (0% to 100%)
  const meterPercent = Math.min(100, Math.max(0, ((metrics.instantDb + 60) / 60) * 100));
  const peakPercent = Math.min(100, Math.max(0, ((peakHoldDb + 60) / 60) * 100));

  // Determine meter zone color
  let meterColorClass = 'bg-emerald-500';
  let zoneLabel = 'Quiet / Room Ambience';

  if (metrics.instantDb > -3.0) {
    meterColorClass = 'bg-red-500';
    zoneLabel = '⚠️ CLIPPING OVERLOAD';
  } else if (metrics.instantDb > -6.0) {
    meterColorClass = 'bg-amber-400';
    zoneLabel = 'Near Peak (-6 to -3 dB)';
  } else if (metrics.instantDb > -18.0) {
    meterColorClass = 'bg-emerald-400';
    zoneLabel = 'Optimal Broadcast Speech (-18 to -6 dB)';
  } else if (metrics.instantDb > -35.0) {
    meterColorClass = 'bg-cyan-500';
    zoneLabel = 'Normal Voice / Intelligible';
  }

  return (
    <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Acoustic & Microphone Analyzer</span>
              {stream && stream.getAudioTracks().length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  RAW 48kHz
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Native AnalyserNode • 2048 FFT • Real-time Peak Hold
            </p>
          </div>
        </div>

        {/* Visualizer Mode Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetPeak}
            title="Reset peak hold meter"
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Peak</span>
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setVisualizerMode('frequency')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono ${
                visualizerMode === 'frequency'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Spectrum</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode('waveform')}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono ${
                visualizerMode === 'waveform'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Waveform</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[180px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full object-cover"
        />

        {(!stream || stream.getAudioTracks().length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-slate-500 p-6 text-center space-y-2">
            <Volume2 className="w-7 h-7 text-slate-600" />
            <p className="text-xs text-slate-400">
              Microphone feed is inactive. Start test to view live waveform telemetry.
            </p>
          </div>
        )}

        {/* Ambient Noise / Hum Warning Overlay */}
        {metrics.elevatedNoise && (
          <div className="absolute top-3 left-3 bg-amber-950/80 border border-amber-500/40 text-amber-200 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md flex items-center gap-2 shadow-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Elevated ambient noise: <strong>{formatDb(metrics.noiseFloorDb)}</strong> (Fan, AC, or Traffic)
            </span>
          </div>
        )}

        {metrics.hasHumDetected && (
          <div className="absolute top-3 right-3 bg-red-950/80 border border-red-500/40 text-red-200 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md flex items-center gap-2 shadow-lg">
            <Zap className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>
              {metrics.humFrequency}Hz Ground Loop / Mains Power Hum Detected
            </span>
          </div>
        )}
      </div>

      {/* Professional Decibel Meter (-60 dB to 0 dB) */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800/80 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-slate-100">Decibel Peak Meter:</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-md ${
              metrics.isClipping
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold animate-pulse'
                : 'text-slate-400 bg-slate-800/60'
            }`}>
              {zoneLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Instant: <strong className="text-slate-100">{formatDb(metrics.instantDb)}</strong>
            </span>
            <span className="text-slate-400">
              Peak Hold: <strong className="text-cyan-400">{formatDb(peakHoldDb)}</strong>
            </span>
          </div>
        </div>

        {/* Meter Gauge Bar */}
        <div className="relative w-full h-4 bg-slate-950 rounded-lg p-0.5 border border-slate-800 overflow-hidden flex items-center">
          {/* Optimal Zone Guideline Indicators */}
          <div
            className="absolute top-0 bottom-0 border-l border-emerald-500/40 z-10"
            style={{ left: `${(( -18 + 60) / 60) * 100}%` }}
            title="Optimal Speech Min (-18 dBFS)"
          />
          <div
            className="absolute top-0 bottom-0 border-l border-amber-500/40 z-10"
            style={{ left: `${(( -6 + 60) / 60) * 100}%` }}
            title="Optimal Speech Max (-6 dBFS)"
          />
          <div
            className="absolute top-0 bottom-0 border-l border-red-500/60 z-10"
            style={{ left: `${(( -3 + 60) / 60) * 100}%` }}
            title="Clipping Danger (-3 dBFS)"
          />

          {/* Dynamic Fill Bar */}
          <div
            className={`h-full rounded-md transition-all duration-75 ${meterColorClass} ${
              metrics.isClipping ? 'animate-peak-flash' : ''
            }`}
            style={{ width: `${meterPercent}%` }}
          />

          {/* Peak Hold Needle Marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.9)] z-20 pointer-events-none transition-all duration-150"
            style={{ left: `${peakPercent}%` }}
          />
        </div>

        {/* Meter Scale Markings */}
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
          <span>-60 dB</span>
          <span className="text-slate-400">-40 dB</span>
          <span className="text-emerald-400">-18 dB (Nominal)</span>
          <span className="text-amber-400">-6 dB</span>
          <span className="text-red-400">-3 dB (Clip)</span>
          <span className="text-red-500 font-bold">0 dBFS</span>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 block uppercase">Background Hum</span>
            <span className={`text-xs font-semibold ${metrics.elevatedNoise ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatDb(metrics.noiseFloorDb)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 block uppercase">Headroom</span>
            <span className="text-xs font-semibold text-slate-200">
              {metrics.peakDb < 0 ? `${Math.abs(metrics.peakDb).toFixed(1)} dB` : '0 dB'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 block uppercase">Clipping Status</span>
            <span className={`text-xs font-semibold ${metrics.isClipping ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
              {metrics.isClipping ? 'OVERLOAD DETECTED' : 'Clean Headroom'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 block uppercase">Speech Status</span>
            <span className="text-xs font-semibold text-cyan-400">
              {metrics.isSpeaking ? 'Voice Detected' : 'Silent / Standby'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
