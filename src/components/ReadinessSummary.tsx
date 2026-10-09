'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Share2,
  Award,
  Sparkles,
  Terminal,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PreflightChecklist,
  SystemDiagnosticReport,
  VideoStreamMetrics,
  AudioStreamMetrics,
  DeviceInfoItem,
} from '@/types/preflight';
import { detectBrowserAndOs, formatMarkdownReport, formatDb } from '@/lib/utils';

interface ReadinessSummaryProps {
  checklist: PreflightChecklist;
  videoMetrics: VideoStreamMetrics;
  audioMetrics: AudioStreamMetrics;
  selectedCamera: DeviceInfoItem | undefined;
  selectedMic: DeviceInfoItem | undefined;
  selectedSpeaker: DeviceInfoItem | undefined;
  loopbackComplete: boolean;
  loopbackCodec: string;
  loopbackSize: number;
}

export const ReadinessSummary: React.FC<ReadinessSummaryProps> = ({
  checklist,
  videoMetrics,
  audioMetrics,
  selectedCamera,
  selectedMic,
  selectedSpeaker,
  loopbackComplete,
  loopbackCodec,
  loopbackSize,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Calculate score and status
  const checklistItems = useMemo(() => [
    {
      id: 'cam-signal',
      label: 'Camera Signal Active',
      status: checklist.cameraActive,
      detail: videoMetrics.width > 0 ? `${videoMetrics.width}x${videoMetrics.height}` : 'No signal',
    },
    {
      id: 'cam-fps',
      label: 'Camera Frame Rate Target',
      status: checklist.cameraFpsTargetMet,
      detail: `${videoMetrics.trueFps > 0 ? videoMetrics.trueFps : videoMetrics.fps} FPS (Target: ≥24)`,
    },
    {
      id: 'mic-signal',
      label: 'Microphone Active & Receiving',
      status: checklist.micActive,
      detail: `Peak ${formatDb(audioMetrics.peakDb)}`,
    },
    {
      id: 'mic-clip',
      label: 'Headroom & No Hard Clipping',
      status: checklist.micNoClipping,
      detail: audioMetrics.isClipping ? 'Clipping Detected' : 'Clean Headroom',
    },
    {
      id: 'speaker-stereo',
      label: 'Speaker / Headphone Stereo Verified',
      status: checklist.speakerLeftVerified && checklist.speakerRightVerified,
      detail: checklist.speakerLeftVerified && checklist.speakerRightVerified ? 'Left & Right Confirmed' : 'Needs Tone Verification',
    },
    {
      id: 'loopback',
      label: 'Self-Check 5-Second Loopback',
      status: loopbackComplete,
      detail: loopbackComplete ? 'Clip Verified' : 'Not Recorded',
    },
  ], [checklist, videoMetrics, audioMetrics, loopbackComplete]);

  const passedCount = checklistItems.filter((i) => i.status).length;
  const totalCount = checklistItems.length;
  const scorePercent = Math.round((passedCount / totalCount) * 100);

  // Trigger celebration once 100% is reached
  if (scorePercent === 100 && !hasCelebrated) {
    setHasCelebrated(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch {}
  }

  // Construct diagnostic report
  const generateReport = useCallback((): SystemDiagnosticReport => {
    const { browser, os } = detectBrowserAndOs();
    const readinessTier = scorePercent === 100 ? 'READY' : scorePercent >= 65 ? 'WARNING' : 'FAILED';

    return {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: os,
      browserName: browser,
      readinessScore: scorePercent,
      readinessTier,
      camera: {
        label: selectedCamera?.label || videoMetrics.deviceLabel || 'Default Camera',
        resolution: `${videoMetrics.width}x${videoMetrics.height}`,
        fps: videoMetrics.trueFps || videoMetrics.fps,
        aspectRatio: videoMetrics.aspectRatio,
        status: checklist.cameraActive ? 'Active & Calibrated' : 'Inactive',
      },
      microphone: {
        label: selectedMic?.label || 'Default Microphone',
        peakDb: formatDb(audioMetrics.peakDb),
        noiseFloorDb: formatDb(audioMetrics.noiseFloorDb),
        clippingDetected: audioMetrics.isClipping,
        elevatedNoiseDetected: audioMetrics.elevatedNoise,
        status: checklist.micActive ? 'Active & Monitored' : 'Inactive',
      },
      speaker: {
        label: selectedSpeaker?.label || 'Default Audio Output',
        stereoVerified: checklist.speakerLeftVerified && checklist.speakerRightVerified,
        sinkIdSupported: typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype,
        status: checklist.speakerLeftVerified && checklist.speakerRightVerified ? 'Verified' : 'Unverified',
      },
      loopback: {
        completed: loopbackComplete,
        codecUsed: loopbackCodec,
        fileSizeBytes: loopbackSize,
      },
    };
  }, [
    scorePercent,
    selectedCamera,
    selectedMic,
    selectedSpeaker,
    videoMetrics,
    audioMetrics,
    checklist,
    loopbackComplete,
    loopbackCodec,
    loopbackSize,
  ]);

  // Copy Markdown Diagnostic Report to Clipboard
  const handleCopyReport = useCallback(async () => {
    const report = generateReport();
    const markdown = formatMarkdownReport(report);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }, [generateReport]);

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Top Banner with Score Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-mono font-bold text-lg ${
              scorePercent === 100
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : scorePercent >= 65
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {scorePercent}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-100">
                Preflight Readiness Certificate
              </h3>
              {scorePercent === 100 ? (
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MEETING READY
                </span>
              ) : scorePercent >= 65 ? (
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  ADVISORY
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  INCOMPLETE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {passedCount} of {totalCount} diagnostic milestones cleared
            </p>
          </div>
        </div>

        {/* Copy IT Support Summary Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-copy-it-report"
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 hover:border-cyan-500/40 text-xs font-medium shadow-md transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Report Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Copy IT Support Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all ${
              item.status
                ? 'bg-slate-950/60 border-emerald-500/20'
                : 'bg-slate-950/30 border-slate-800/80'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {item.status ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-200 block">
                  {item.label}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block truncate">
                  {item.detail}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IT Ticket Export Preview Callout */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">
            Ready to paste into Jira, Slack, or ServiceNow IT tickets for hardware troubleshooting.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
          Markdown Compatible
        </span>
      </div>
    </div>
  );
};
