'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface LoopbackRecorderProps {
  stream: MediaStream | null;
  onLoopbackComplete?: (sizeBytes: number, codecUsed: string) => void;
}

export const LoopbackRecorder: React.FC<LoopbackRecorderProps> = ({
  stream,
  onLoopbackComplete,
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [countdown, setCountdown] = useState<number>(5);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [selectedCodec, setSelectedCodec] = useState<string>('');
  const [isSelfVerified, setIsSelfVerified] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

  // Negotiate best supported codec for MediaRecorder
  const getSupportedMimeType = useCallback((): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return '';
  }, []);

  // Cleanup object URLs to prevent browser memory leaks
  const cleanupBlobUrl = useCallback(() => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setVideoBlobUrl(null);
  }, []);

  // Start 5-second recording
  const startRecording = useCallback(() => {
    if (!stream || stream.getTracks().length === 0) return;

    cleanupBlobUrl();
    recordedChunksRef.current = [];
    setIsSelfVerified(false);

    const mimeType = getSupportedMimeType();
    setSelectedCodec(mimeType || 'browser-default');

    try {
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        activeBlobUrlRef.current = url;
        setVideoBlobUrl(url);
        setFileSizeBytes(blob.size);
        setStatus('recorded');

        if (onLoopbackComplete) {
          onLoopbackComplete(blob.size, finalType);
        }
      };

      recorder.start(100);
      setStatus('recording');
      setCountdown(5);

      // 5-second countdown timer
      let remaining = 5;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder initialization failed:', err);
      setStatus('idle');
    }
  }, [stream, cleanupBlobUrl, getSupportedMimeType, onLoopbackComplete]);

  // Cancel / Reset recording
  const resetRecording = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanupBlobUrl();
    setStatus('idle');
    setCountdown(5);
  }, [cleanupBlobUrl]);

  // Download recorded video clip
  const downloadClip = useCallback(() => {
    if (!videoBlobUrl) return;
    const ext = selectedCodec.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `preflight-loopback-${Date.now()}.${ext}`;
    a.click();
  }, [videoBlobUrl, selectedCodec]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      cleanupBlobUrl();
    };
  }, [cleanupBlobUrl]);

  const hasMedia = Boolean(stream && stream.getTracks().length > 0);

  // SVG Progress Ring calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((5 - countdown) / 5) * circumference;

  return (
    <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Echo & Self-Check Loopback Recorder</span>
              {status === 'recording' && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  RECORDING (5s)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Zero Server Uploads • In-Memory Buffer • Hear & See What Others Experience
            </p>
          </div>
        </div>

        {status === 'recorded' && (
          <button
            type="button"
            onClick={resetRecording}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-record</span>
          </button>
        )}
      </div>

      {/* Main Recording / Playback Viewport */}
      <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[260px]">
        {/* State 1: IDLE */}
        {status === 'idle' && (
          <div className="flex flex-col items-center text-center max-w-md space-y-4 py-3">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
              <Play className="w-7 h-7 ml-1 fill-current" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-100">
                5-Second Meeting Simulator
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Records a 5-second local video and audio clip so you can play it back to check your lip-sync, room reverberation, and voice clarity exactly as meeting participants will hear you.
              </p>
            </div>

            <button
              type="button"
              id="btn-start-loopback"
              onClick={startRecording}
              disabled={!hasMedia}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white text-sm font-semibold shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4 text-pink-200" />
              <span>Record 5-Second Test Take</span>
            </button>
            {!hasMedia && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                Initialize camera and mic above first
              </span>
            )}
          </div>
        )}

        {/* State 2: RECORDING WITH ANIMATED COUNTDOWN RING */}
        {status === 'recording' && (
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="relative flex items-center justify-center w-28 h-28">
              {/* SVG Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-pink-500 transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                  {countdown}
                </span>
                <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest">
                  Sec
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100 animate-pulse">
                Speaking Test in Progress...
              </p>
              <p className="text-xs text-slate-400">
                Say: &ldquo;Hello, can everyone hear and see me clearly today?&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* State 3: RECORDED & PLAYBACK */}
        {status === 'recorded' && videoBlobUrl && (
          <div className="w-full max-w-lg flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-video rounded-xl bg-black border border-slate-800 overflow-hidden shadow-2xl">
              <video
                ref={playbackVideoRef}
                src={videoBlobUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                LOOPBACK PLAYBACK ACTIVE
              </div>
            </div>

            {/* Playback Controls & Verification */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadClip}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Clip ({formatBytes(fileSizeBytes)})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSelfVerified(!isSelfVerified)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border font-medium transition-all ${
                  isSelfVerified
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${
                    isSelfVerified ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span>
                  {isSelfVerified ? 'Voice & Video Confirmed' : 'Confirm: Sound & Video OK'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
