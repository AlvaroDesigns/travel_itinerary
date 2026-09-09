import React from 'react';

interface RedsysLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RedsysLogo({ className = '', showText = true, size = 'md' }: RedsysLogoProps) {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Redsys Iconic Swirl / Vortex Symbol */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizes[size]} shrink-0`}
      >
        <circle cx="24" cy="24" r="23" fill="url(#redsys-grad)" />
        <path
          d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C30.2 40 35.56 36.48 38.2 31.32C36.8 33 33.6 34.2 30 34.2C22.27 34.2 16 27.93 16 20.2C16 14.8 19.1 10.1 23.6 8.05C23.73 8.02 23.86 8 24 8Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        <circle cx="31.5" cy="18.5" r="5.5" fill="#FFFFFF" fillOpacity="0.95" />
        <path
          d="M27.5 24C27.5 28.1421 24.1421 31.5 20 31.5C18.2 31.5 16.55 30.86 15.25 29.8C16.8 32.3 19.6 34 22.8 34C27.66 34 31.6 30.06 31.6 25.2C31.6 22.5 30.4 20.1 28.5 18.5C28.2 20.2 27.5 22 27.5 24Z"
          fill="#FFB300"
        />
        <defs>
          <linearGradient id="redsys-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9800" />
            <stop offset="0.55" stopColor="#F57C00" />
            <stop offset="1" stopColor="#E65100" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <span className={`font-black tracking-tight text-[#1e293b] flex items-center leading-none ${textSizes[size]}`}>
          <span>Red</span>
          <span className="text-[#1e293b]">s</span>
          <span className="relative">
            <span className="text-[#1e293b]">y</span>
            <span className="absolute -top-1.5 right-[1px] text-[10px] text-[#e11d48] font-black leading-none transform rotate-12">
              ′
            </span>
          </span>
          <span className="text-[#1e293b]">s</span>
        </span>
      )}
    </div>
  );
}
