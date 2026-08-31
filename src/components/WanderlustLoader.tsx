'use client';

import React from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface WanderlustLoaderProps {
  label?: string;
}

export function WanderlustLoader({ label = 'Cargando...' }: WanderlustLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center bg-[#fafafa] px-4">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#009688]/15 blur-[100px] animate-pulse" />

      {/* Main Logo & Concentric Loaders Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer Ring 1: Smooth rotating gradient ring */}
        <div className="absolute h-28 w-28 rounded-full border-2 border-transparent border-t-[#009688] border-r-[#009688]/80 animate-spin" />

        {/* Outer Ring 2: Counter-rotating dashed ring */}
        <div
          className="absolute h-32 w-32 rounded-full border border-dashed border-[#009688]/30 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '6s' }}
        />

        {/* Inner Ring: Expanding radar ripple */}
        <div className="absolute h-24 w-24 rounded-full border border-[#009688]/40 animate-ping opacity-25" />

        {/* Central Circular Glass Surface for Logo */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#009688]/30 bg-white/90 shadow-xl shadow-teal-500/10 backdrop-blur-md">
          {/* Subtle inner rotating micro-ring inside the logo circle */}
          <div
            className="absolute inset-1 rounded-full border border-t-[#009688]/60 border-r-transparent border-b-transparent border-l-transparent animate-spin"
            style={{ animationDuration: '1.5s' }}
          />

          <Image
            src="/wanderlust_icono_negro.png"
            alt="Wanderlust"
            width={44}
            height={44}
            priority
            className="relative z-10 h-11 w-auto animate-pulse-subtle object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* HeroUI Pro Text Pill Below */}
      <div className="mt-8 flex items-center gap-2.5 rounded-full border border-zinc-200/90 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
        <Loader2 className="h-4 w-4 animate-spin text-[#009688]" />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-700">
          {label}
        </span>
      </div>
    </div>
  );
}
