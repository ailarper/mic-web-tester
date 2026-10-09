'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search, ShieldCheck, Terminal, AlertTriangle, Monitor, Apple, Bluetooth } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
  category: 'camera' | 'mic' | 'macos' | 'windows' | 'bluetooth' | 'privacy';
  icon?: string;
  tags: string[];
}

export const FAQ_DATA: FaqItem[] = [
  {
    category: 'windows',
    tags: ['windows 11', 'black screen', 'camera', 'chrome', 'teams'],
    question: 'Why is my webcam black or blank in Google Chrome and Windows 11?',
    answer: `A black camera screen in Windows 11 is almost always caused by one of three reasons:
1. **Windows 11 OS Privacy Toggle:** Open Windows Settings > Privacy & security > Camera. Ensure both "Camera access" and "Let desktop apps access your camera" are toggled ON.
2. **Hardware Privacy Shutter:** Many modern laptops (Lenovo ThinkPad, HP Spectre, Dell Latitude) feature physical sliding plastic shutters or dedicated keyboard privacy keys (often F8, F9, or F10) that physically cut the optical sensor feed.
3. **Hardware Lock by Background Meeting Apps:** Windows webcams cannot be shared across multiple desktop applications simultaneously. If Zoom, Microsoft Teams, Slack huddle, or OBS Studio is running in the system tray, close it completely via Task Manager, then click "Start Preflight Test" again.`,
  },
  {
    category: 'macos',
    tags: ['macos sonoma', 'macos ventura', 'microphone permissions', 'safari', 'terminal'],
    question: 'How do I unblock microphone and camera permissions on macOS Ventura / Sonoma / Sequoia?',
    answer: `On macOS Ventura and newer, camera and mic permissions are strictly sandboxed at the operating system level:
1. Click the **Apple Menu () > System Settings > Privacy & Security**.
2. Select **Microphone** from the list. Verify that Google Chrome, Brave, Arc, or Safari has a blue checkmark or active toggle next to it.
3. Select **Camera** from the list and do the same.
4. **Terminal Reset Remedy:** If the browser never prompts you for permission, open the macOS Terminal app and execute:
   \`tccutil reset Microphone\` and \`tccutil reset Camera\`
   Then restart your browser.`,
  },
  {
    category: 'bluetooth',
    tags: ['bluetooth', 'muffled', 'airpods', 'sony wh-1000xm', 'hands-free ag'],
    question: 'Why does my Bluetooth headset microphone sound muffled and low-quality ("underwater")?',
    answer: `This is a fundamental limitation of the Bluetooth protocol (HFP/HSP profiles):
- Bluetooth headphones offer two profiles: **A2DP** (high-fidelity stereo playback) and **HFP (Hands-Free Profile)** (bi-directional voice + low-bitrate mono audio).
- As soon as an application activates your Bluetooth microphone, Windows and macOS drop audio bandwidth from 48kHz stereo down to 8kHz or 16kHz mono telephone quality so voice and output fit in the narrow Bluetooth channel.
- **Pro Audio Solution:** Set your **Input/Microphone** in meeting apps to your laptop's built-in array microphone or a separate USB desktop mic, while leaving your **Audio Output/Speaker** routed to your Bluetooth headphones. This keeps your headphones in full high-fidelity stereo mode!`,
  },
  {
    category: 'mic',
    tags: ['clipping', 'distortion', 'gain staging', 'zoom', 'google meet'],
    question: 'What is microphone clipping and how do I prevent harsh audio distortion?',
    answer: `Clipping happens when the acoustic sound wave arriving at your microphone diaphragm exceeds the maximum analog-to-digital converter (ADC) voltage limit (0 dBFS). When audio clips, the wave crests are flatlined, causing harsh, fatiguing crackle and distortion for your listeners.
- **Target Optimal Zone:** Your normal speaking voice should land between **-18 dBFS and -6 dBFS** on the Preflight Lab decibel meter.
- **Fix:** If your meter shows the red "CLIPPING OVERLOAD" alert, lower the physical gain knob on your microphone (or decrease input volume in your OS Sound Settings to ~65-75%), and speak about 4 to 6 inches away with a pop filter.`,
  },
  {
    category: 'privacy',
    tags: ['privacy', 'client-side', 'zero upload', 'security', 'hipaa'],
    question: 'Are my audio or video streams uploaded or recorded on Preflight Lab servers?',
    answer: `**Never.** Preflight Lab runs 100% locally inside your browser's sandboxed JavaScript runtime. 
- All media streams obtained via \`getUserMedia()\` stay in your client machine's memory (RAM).
- Audio analysis is computed via the client-side Web Audio API \`AnalyserNode\` FFT pipeline.
- The 5-second Loopback Recorder creates temporary in-memory Blobs and immediately invokes \`URL.revokeObjectURL()\` upon component cleanup.
- Zero audio bytes or video frames are ever transmitted to any external server, cloud database, or third-party AI model.`,
  },
  {
    category: 'camera',
    tags: ['framing', 'rule of thirds', 'lighting', 'eye level', 'fps'],
    question: 'How do I achieve professional broadcast framing for executive meetings and webinars?',
    answer: `1. **Eye Level Placement:** Toggle on the **Grid (Rule of Thirds)** button in our video tester. Elevate your webcam so your eyes align with the upper horizontal third line. Looking slightly up or level projects confidence compared to looking down into a laptop.
2. **Lighting Key:** Place your primary light source (window or ring light) directly in front of or at a 45-degree angle to your face. Backlighting creates silhouette washouts.
3. **Stream FPS:** Ensure your True FPS counter reports at least 24 to 30 FPS. If it drops to 15 FPS, check room lighting, as webcam auto-exposure increases sensor shutter duration in dim environments.`,
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="w-full mt-10 mb-8 pt-8 border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>KNOWLEDGE BASE & TROUBLESHOOTING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Hardware Diagnostics & Meeting Audio Engineering Guide
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Step-by-step technical solutions for webcam black screens, macOS permissions, and Bluetooth audio degradation.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search problems: black screen, Bluetooth muffled, macOS permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-mono text-xs">
            {['all', 'windows', 'macos', 'bluetooth', 'mic', 'privacy'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg uppercase text-[11px] font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No matching troubleshooting guides found. Try searching for &ldquo;permissions&rdquo; or &ldquo;Bluetooth&rdquo;.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.question}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-900/90 border-cyan-500/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-md bg-slate-800 text-cyan-400 mt-0.5">
                        {faq.category === 'windows' && <Monitor className="w-3.5 h-3.5" />}
                        {faq.category === 'macos' && <Apple className="w-3.5 h-3.5" />}
                        {faq.category === 'bluetooth' && <Bluetooth className="w-3.5 h-3.5" />}
                        {faq.category === 'privacy' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        {faq.category === 'mic' && <Terminal className="w-3.5 h-3.5 text-amber-400" />}
                        {faq.category === 'camera' && <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-100">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 mt-1 ${
                        isOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 whitespace-pre-line font-normal">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
