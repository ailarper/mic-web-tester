'use client';

import React from 'react';
import {
  Camera,
  Mic,
  Volume2,
  RefreshCw,
  AlertTriangle,
  Radio,
  PowerOff,
  Sparkles,
  Lock,
} from 'lucide-react';
import { DeviceInfoItem, HardwareErrorState, PermissionStatusType } from '@/types/preflight';

interface DeviceSelectorProps {
  microphones: DeviceInfoItem[];
  cameras: DeviceInfoItem[];
  speakers: DeviceInfoItem[];
  selectedMicId: string;
  selectedCameraId: string;
  selectedSpeakerId: string;
  onSelectMic: (id: string) => void;
  onSelectCamera: (id: string) => void;
  onSelectSpeaker: (id: string) => void;
  permissionStatus: PermissionStatusType;
  errorState: HardwareErrorState | null;
  isStreamActive: boolean;
  isSinkIdSupported: boolean;
  onRequestPermissions: () => void;
  onStopMedia: () => void;
  onRefreshDevices: () => void;
  onClearError: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  microphones,
  cameras,
  speakers,
  selectedMicId,
  selectedCameraId,
  selectedSpeakerId,
  onSelectMic,
  onSelectCamera,
  onSelectSpeaker,
  permissionStatus,
  errorState,
  isStreamActive,
  isSinkIdSupported,
  onRequestPermissions,
  onStopMedia,
  onRefreshDevices,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-slate-100">
              Select Devices
            </h2>
            {isStreamActive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Ready
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Choose which camera, microphone, and speaker to test.</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">🔒 100% Private (No data leaves your device)</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshDevices}
            title="Scan for connected devices"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isStreamActive ? (
            <button
              type="button"
              id="btn-init-test"
              onClick={onRequestPermissions}
              disabled={permissionStatus === 'requesting'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all disabled:opacity-50"
            >
              {permissionStatus === 'requesting' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Start Test</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              id="btn-stop-test"
              onClick={onStopMedia}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium transition-all active:scale-98"
            >
              <PowerOff className="w-4 h-4" />
              <span>Stop Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle clean inline indicator when idle instead of large intrusive card */}
      {permissionStatus !== 'granted' && !errorState && (
        <div className="mt-3 flex md:hidden items-center gap-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl">
          <span>🔒 100% Private (No data leaves your device)</span>
        </div>
      )}

      {/* Explicit Error State Banner */}
      {errorState && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-red-300 text-sm flex items-center gap-2">
                <span>{errorState.title}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 border border-red-500/30">
                  {errorState.code}
                </span>
              </h3>
              <p className="text-xs text-red-200/90 leading-relaxed">
                {errorState.message}
              </p>
              <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-red-500/20">
                <span className="font-semibold text-red-400">Quick Fix: </span>
                {errorState.solution}
              </div>
            </div>
          </div>

          {errorState.remediationSteps.length > 0 && (
            <div className="pl-8 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-slate-400">Unblocking steps:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {errorState.remediationSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hardware Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Webcam Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {cameras.length} available
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedCameraId}
              onChange={(e) => onSelectCamera(e.target.value)}
              disabled={cameras.length === 0}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50 appearance-none cursor-pointer truncate pr-8"
            >
              {cameras.length === 0 ? (
                <option value="">No cameras found</option>
              ) : (
                cameras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>
                    {c.label || 'Default Camera'}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Microphone Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Microphone</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {microphones.length} available
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedMicId}
              onChange={(e) => onSelectMic(e.target.value)}
              disabled={microphones.length === 0}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50 appearance-none cursor-pointer truncate pr-8"
            >
              {microphones.length === 0 ? (
                <option value="">No microphones found</option>
              ) : (
                microphones.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || 'Default Microphone'}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <Mic className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Audio Output / Speaker Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Speaker / Headphones</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {speakers.length > 0 ? `${speakers.length} available` : 'System default'}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedSpeakerId}
              onChange={(e) => onSelectSpeaker(e.target.value)}
              disabled={speakers.length === 0}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 appearance-none cursor-pointer truncate pr-8"
            >
              {speakers.length === 0 ? (
                <option value="">System Default Speaker</option>
              ) : (
                speakers.map((s) => (
                  <option key={s.deviceId} value={s.deviceId}>
                    {s.label || 'Default Output'}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          </div>
          {!isSinkIdSupported && (
            <p className="text-[10px] text-slate-500">
              Note: Safari uses system-wide audio output routing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
