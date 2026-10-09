'use client';

import React from 'react';
import { ShieldCheck, Cpu, Terminal, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-200 font-semibold">
            <span>Preflight Lab — Mic, Webcam & Audio Readiness Studio</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-md">
            Zero backend media relays. All streams, FFT spectrums, and loopback recordings are executed directly in browser Web Audio &amp; WebRTC pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>API Health Check</span>
          </a>
          <span className="text-slate-800">•</span>
          <span className="flex items-center gap-1 text-emerald-400/90">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Data Stored</span>
          </span>
          <span className="text-slate-800">•</span>
          <span className="text-slate-400">
            Coalition for Better Ads Compliant
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
        <p>© 2026 Preflight Lab Studio. Engineering grade browser utilities.</p>
        <p className="flex items-center gap-1">
          Designed for remote teams, broadcasters, podcasters &amp; engineers.
        </p>
      </div>
    </footer>
  );
};
