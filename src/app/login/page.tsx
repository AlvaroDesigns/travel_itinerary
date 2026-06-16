'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Handle autofill when user clicks on credentials badge
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

      // Success - force context update and redirect
      // We can reload the page or route to home
      // Reloading ensures all provider states query the new active user session from server
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      {/* 1. Neon Radial Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/20 blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* 2. Floating interactive particles/shapes */}
      <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-indigo-500/30 blur-sm animate-bounce" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-10 right-10 w-6 h-6 rounded-full bg-purple-500/20 blur-sm animate-bounce" style={{ animationDuration: '6s' }} />

      {/* 3. Glassmorphic Card Container */}
      <div className="relative w-full max-w-md mx-4 z-10">
        <div className="bg-slate-900/75 border border-slate-800/80 shadow-2xl rounded-3xl p-8 backdrop-blur-xl font-sans">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 group cursor-pointer hover:rotate-12 transition-transform duration-300">
              <Compass className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              Wanderlust
            </h1>
            <p className="text-sm font-semibold text-slate-400 mt-1.5 uppercase tracking-wider text-xs">
              Planificador de Viajes Premium
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-950/70 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans text-sm h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-800 bg-slate-950/70 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans text-sm h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  disabled={isLoading}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 overflow-hidden font-sans text-sm cursor-pointer mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Tooltip */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium mb-2.5">¿Quieres probar rápido?</p>
            <button
              type="button"
              onClick={handleAutoFill}
              className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none"
            >
              <span>Autocompletar credenciales</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
