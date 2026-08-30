'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAutoFill = () => {
    setEmail('hello@alvarodesigns.com');
    setPassword('Itinerary2026$');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal. Por favor intenta de nuevo.');
      }

      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-ink-900 px-4 font-sans">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Image
            src="/wanderlust_horizontal_blanco.png"
            alt="Wanderlust"
            width={260}
            height={70}
            priority
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-lg font-bold tracking-tight text-white">Bienvenido de nuevo</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-ink-400">
              Planificador de viajes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 p-3.5 text-xs font-semibold text-white animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-ink-900 pl-11 pr-4 text-sm text-white placeholder-ink-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-white/10 bg-ink-900 pl-11 pr-11 text-sm text-white placeholder-ink-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-ink-400 transition-colors hover:text-white focus:outline-none"
                  disabled={isLoading}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-white text-sm font-bold text-ink-900 transition-all hover:bg-ink-100 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="mb-2.5 text-xs font-medium text-ink-500">¿Quieres probar rápido?</p>
            <button
              type="button"
              onClick={handleAutoFill}
              className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-ink-200 transition-all hover:border-white/30 hover:text-white"
            >
              <span>Autocompletar credenciales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
