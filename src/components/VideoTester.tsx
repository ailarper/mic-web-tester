'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Grid,
  Sparkles,
  Download,
  X,
  Gauge,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VideoStreamMetrics } from '@/types/preflight';
import { simplifyAspectRatio } from '@/lib/utils';

interface VideoTesterProps {
  stream: MediaStream | null;
  onMetricsUpdate?: (metrics: VideoStreamMetrics) => void;
}

export const VideoTester: React.FC<VideoTesterProps> = ({ stream, onMetricsUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [aspectLock, setAspectLock] = useState<'16:9' | '4:3' | 'auto'>('16:9');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // Hardware metrics
  const [metrics, setMetrics] = useState<VideoStreamMetrics>({
    width: 0,
    height: 0,
    fps: 0,
    trueFps: 0,
    aspectRatio: '16:9',
    deviceLabel: 'No stream',
    isMirrored: true,
    isActive: false,
    hasTrack: false,
  });

  // Calculate True FPS dynamically using requestVideoFrameCallback or rAF
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || stream.getVideoTracks().length === 0) {
      setMetrics((prev) => ({
        ...prev,
        isActive: false,
        hasTrack: false,
        fps: 0,
        trueFps: 0,
      }));
      return;
    }

    video.srcObject = stream;
    video.play().catch(() => {});

    const videoTrack = stream.getVideoTracks()[0];
    const trackSettings = videoTrack.getSettings ? videoTrack.getSettings() : {};

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number | null = null;
    let callbackHandle: number | null = null;
    let isCancelled = false;

    const updateDimensions = () => {
      if (video.videoWidth && video.videoHeight) {
        const ratio = simplifyAspectRatio(video.videoWidth, video.videoHeight);
        const updated: VideoStreamMetrics = {
          width: video.videoWidth,
          height: video.videoHeight,
          fps: trackSettings.frameRate || 30,
          trueFps: 0,
          aspectRatio: ratio,
          facingMode: trackSettings.facingMode,
          deviceLabel: videoTrack.label || 'Webcam Stream',
          isMirrored,
          isActive: true,
          hasTrack: true,
        };
        setMetrics((prev) => ({
          ...prev,
          ...updated,
        }));
        if (onMetricsUpdate) onMetricsUpdate(updated);
      }
    };

    video.addEventListener('loadedmetadata', updateDimensions);

    // Dynamic True FPS measurement
    // Check if HTMLVideoElement.requestVideoFrameCallback is supported
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      type VideoFrameCallback = (now: DOMHighResTimeStamp, metadata: unknown) => void;
      const vfcTarget = video as unknown as {
        requestVideoFrameCallback: (cb: VideoFrameCallback) => number;
        cancelVideoFrameCallback: (handle: number) => void;
      };

      const onFrame: VideoFrameCallback = (now) => {
        if (isCancelled) return;
        frameCount++;
        const delta = now - lastTime;
        if (delta >= 1000) {
          const calculatedFps = Math.round((frameCount * 1000) / delta);
          frameCount = 0;
          lastTime = now;
          setMetrics((prev) => {
            const next = { ...prev, trueFps: calculatedFps, isActive: true };
            if (onMetricsUpdate) onMetricsUpdate(next);
            return next;
          });
        }
        callbackHandle = vfcTarget.requestVideoFrameCallback(onFrame);
      };

      callbackHandle = vfcTarget.requestVideoFrameCallback(onFrame);
    } else {
      // requestAnimationFrame fallback
      const loop = (time: DOMHighResTimeStamp) => {
        if (isCancelled) return;
        frameCount++;
        const delta = time - lastTime;
        if (delta >= 1000) {
          const calculatedFps = Math.round((frameCount * 1000) / delta);
          frameCount = 0;
          lastTime = time;
          setMetrics((prev) => {
            const next = { ...prev, trueFps: calculatedFps, isActive: true };
            if (onMetricsUpdate) onMetricsUpdate(next);
            return next;
          });
        }
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }

    return () => {
      isCancelled = true;
      video.removeEventListener('loadedmetadata', updateDimensions);
      if (callbackHandle !== null && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
        const vfcTarget = video as unknown as {
          cancelVideoFrameCallback: (handle: number) => void;
        };
        vfcTarget.cancelVideoFrameCallback(callbackHandle);
      }
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [stream, isMirrored, onMetricsUpdate]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Capture Snapshot Frame
  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setSnapshotUrl(dataUrl);
  }, [isMirrored]);

  const downloadSnapshot = useCallback(() => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `preflight-snapshot-${Date.now()}.jpg`;
    a.click();
  }, [snapshotUrl]);

  const aspectClass =
    aspectLock === '16:9'
      ? 'aspect-video'
      : aspectLock === '4:3'
      ? 'aspect-[4/3]'
      : 'aspect-auto';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col ${
        isFullscreen ? 'h-screen p-6' : 'shadow-2xl'
      }`}
    >
      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar / Viewport Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/70 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Webcam Diagnostics</span>
              {metrics.isActive && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  OPTICAL FEED
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs font-mono">
              {metrics.deviceLabel}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Aspect Ratio Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setAspectLock('16:9')}
              className={`px-2 py-1 rounded font-mono ${
                aspectLock === '16:9' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'hover:text-slate-200'
              }`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => setAspectLock('4:3')}
              className={`px-2 py-1 rounded font-mono ${
                aspectLock === '4:3' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'hover:text-slate-200'
              }`}
            >
              4:3
            </button>
          </div>

          {/* Grid Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Rule-of-Thirds framing grid"
            className={`p-2 rounded-lg border transition-colors ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Mirror Flip Toggle */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            title="Toggle horizontal mirror"
            className={`p-2 rounded-lg border transition-colors ${
              isMirrored
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Snapshot Button */}
          <button
            type="button"
            onClick={takeSnapshot}
            disabled={!metrics.isActive}
            title="Take diagnostic snapshot frame"
            className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle fullscreen preview"
            className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
        <div className={`relative w-full ${aspectClass} max-h-full flex items-center justify-center`}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-transform duration-200 ${
              isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
            }`}
          />

          {/* Standby placeholder when stream is inactive */}
          {!metrics.isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-slate-400 p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">
                  Webcam Optical Sensor Inactive
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click &ldquo;Start Preflight Test&rdquo; in the hardware routing bar above to open your camera stream.
                </p>
              </div>
            </div>
          )}

          {/* Rule of Thirds Grid Overlay */}
          {showGrid && metrics.isActive && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-cyan-400/30" />
              <div className="border-r border-b border-cyan-400/30" />
              <div className="border-b border-cyan-400/30" />
              <div className="border-r border-b border-cyan-400/30" />
              <div className="border-r border-b border-cyan-400/30" />
              <div className="border-b border-cyan-400/30" />
              <div className="border-r border-cyan-400/30" />
              <div className="border-r border-cyan-400/30" />
              <div />
              {/* Eye level guide */}
              <div className="absolute top-[33.3%] left-2 bg-cyan-900/60 text-cyan-300 px-1.5 py-0.5 text-[9px] font-mono rounded">
                Optimal Eye Level Line
              </div>
            </div>
          )}
        </div>

        {/* Snapshot Modal Preview */}
        {snapshotUrl && (
          <div className="absolute inset-4 z-30 rounded-xl bg-slate-900/95 border border-cyan-500/40 p-3 shadow-2xl flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Snapshot Test Frame Captured
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSnapshot}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium border border-cyan-500/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSnapshotUrl(null)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={snapshotUrl}
                alt="Webcam Diagnostic Snapshot"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Real-time Hardware Metrics HUD Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/95 border-t border-slate-800/80 font-mono text-xs">
        {/* Metric: Native Resolution */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Resolution</div>
            <div className="text-sm font-semibold text-slate-100">
              {metrics.width > 0 ? `${metrics.width} × ${metrics.height}` : '0 × 0'}
            </div>
          </div>
        </div>

        {/* Metric: Stream True FPS */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Stream FPS</div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>{metrics.trueFps > 0 ? metrics.trueFps : metrics.fps || 0}</span>
              <span className="text-[10px] text-slate-400 font-normal">FPS</span>
              {metrics.trueFps >= 24 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
              ) : metrics.trueFps > 0 ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 inline" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Metric: Native Aspect Ratio */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Aspect Ratio</div>
            <div className="text-sm font-semibold text-slate-100">
              {metrics.aspectRatio}
            </div>
          </div>
        </div>

        {/* Metric: Sensor Quality Grade */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Grade Tier</div>
            <div className="text-xs font-semibold text-slate-100">
              {metrics.width >= 1920
                ? 'Full HD 1080p'
                : metrics.width >= 1280
                ? 'HD 720p'
                : metrics.width > 0
                ? 'SD Standard'
                : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
