'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { AdUnitConfig } from '@/types/preflight';
import { SAMPLE_SPONSORS, SponsorCreative } from '@/lib/ad-config';

interface AdContainerProps {
  config: AdUnitConfig;
  className?: string;
  externalScriptSnippet?: string; // Optional drop-in external ad tag (AdSense, Adsterra, Prebid)
}

export const AdContainer: React.FC<AdContainerProps> = ({
  config,
  className = '',
  externalScriptSnippet,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [isVisible50Percent, setIsVisible50Percent] = useState<boolean>(false);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState<number>(0);

  // Listen to tab visibility state
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Viewability-Gated IntersectionObserver (>= 50% viewport intersection)
  useEffect(() => {
    const elem = containerRef.current;
    if (!elem || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Must be >= 50% visible per Coalition for Better Ads & MRC guidelines
        setIsVisible50Percent(entry.isIntersecting && entry.intersectionRatio >= config.minViewabilityRatio);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    observer.observe(elem);
    return () => observer.disconnect();
  }, [config.minViewabilityRatio]);

  // Viewability-Gated Auto-Refresh Timer (Runs silently in the background)
  // Runs ONLY IF: element is >= 50% visible AND tab is active
  useEffect(() => {
    if (!isVisible50Percent || !isTabVisible) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentCreativeIndex((idx) => (idx + 1) % SAMPLE_SPONSORS.length);
    }, config.refreshIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [isVisible50Percent, isTabVisible, config.refreshIntervalSec]);

  // Current creative
  const creative: SponsorCreative = SAMPLE_SPONSORS[currentCreativeIndex];

  return (
    <div
      ref={containerRef}
      id={config.id}
      className={`relative w-full my-6 flex flex-col items-center justify-center ${className}`}
    >
      {/* Clean, standard compliant micro-label with zero developer debug clutter */}
      <div className="flex items-center justify-between w-full max-w-[728px] px-1 mb-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
        <span>Sponsored</span>
      </div>

      {/* Main Ad Box */}
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-950 shadow-lg transition-all ${
          config.slotType === 'leaderboard'
            ? 'w-full max-w-[728px] min-h-[90px] p-3 sm:p-4'
            : 'w-[300px] min-h-[250px] p-5'
        }`}
      >
        {/* If an external ad tag snippet is provided, inject it */}
        {externalScriptSnippet ? (
          <div
            dangerouslySetInnerHTML={{ __html: externalScriptSnippet }}
            className="w-full h-full flex items-center justify-center"
          />
        ) : (
          /* High-dwell compliant mock creative with pro audio gear aesthetic */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 h-full">
            <div className="flex items-center gap-3.5 text-left">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 shrink-0 shadow-md"
                style={{ backgroundColor: creative.accentColor }}
              >
                <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-100 tracking-tight">
                    {creative.brand}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {creative.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 max-w-md">
                  {creative.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="#sponsor-redirect"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`[Sponsor Partner Redirect]: Linking to ${creative.brand} product page.`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ backgroundColor: creative.accentColor }}
              >
                <span>{creative.cta}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
