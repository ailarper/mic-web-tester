'use client';

import React from 'react';
import { Activity, Lock } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-mono">
                Preflight<span className="text-cyan-400">Lab</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Mic &amp; Camera Readiness Check
            </p>
          </div>
        </div>

        {/* Center Meeting App Compat Badges */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Works with:</span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            Zoom
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            Google Meet
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            Microsoft Teams
          </span>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">100% Private (Runs Locally)</span>
            <span className="font-medium sm:hidden">Private</span>
          </div>
        </div>
      </div>
    </header>
  );
};
