'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 ${className}`}>
        <span className="w-4 h-4" />
      </div>
    );
  }

  const isLight = theme === 'light';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleTheme}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`transition-all duration-200 interactive-press cursor-pointer flex items-center justify-center ${
        showLabel
          ? 'inline-flex gap-2 px-3 py-1.5 rounded-full text-[11px] tracking-[0.16em] uppercase font-medium'
          : 'w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0 shrink-0'
      } ${
        isLight
          ? 'bg-black/[0.05] hover:bg-black/10 border border-black/15 text-zinc-800 shadow-xs'
          : 'bg-white/[0.06] hover:bg-white/12 border border-white/15 text-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.04)]'
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center justify-center"
      >
        {isLight ? (
          <Sun className="w-4 h-4 text-amber-600 fill-amber-500/20" />
        ) : (
          <Moon className="w-4 h-4 text-blue-300 fill-blue-300/20" />
        )}
      </motion.div>

      {showLabel && (
        <span className="text-[10px] tracking-wider">
          {isLight ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </motion.button>
  );
}
