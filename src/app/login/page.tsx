'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Shield,
  Sparkles,
  Compass,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';

type View = 'login' | 'request' | 'verify';

type Invitation = { challengeId: string; code: string };

function readInvitationFromFragment(): Invitation | null {
  if (typeof window === 'undefined') return null;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const challengeId = fragment.get('challengeId');
  const code = fragment.get('code');
  if (
    fragment.get('welcome') !== '1' ||
    !challengeId ||
    !/^[0-9a-f-]{36}$/i.test(challengeId) ||
    !code ||
    !/^\d{6}$/.test(code)
  ) {
    return null;
  }
  return { challengeId, code };
}

export default function Login() {
  const [invitation] = useState(readInvitationFromFragment);
  const [view, setView] = useState<View>(invitation ? 'verify' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtp] = useState(invitation?.code ?? '');
  const [challengeId, setChallengeId] = useState(invitation?.challengeId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    invitation ? 'Bienvenido. Elige una contraseña para activar tu cuenta.' : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isInvitation, setIsInvitation] = useState(Boolean(invitation));

  useEffect(() => {
    if (invitation) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, [invitation]);

  const backToLogin = () => {
    setView('login');
    setOtp('');
    setNewPassword('');
    setConfirmation('');
    setChallengeId('');
    setError(null);
    setNotice(null);
    setIsInvitation(false);
  };

  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return '/viajes';
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/viajes';
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión');
      window.location.href = getRedirectUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
      setIsLoading(false);
    }
  };

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    setIsInvitation(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo solicitar el código');
      setChallengeId(data.challengeId);
      setView('verify');
      setNotice(
        'Si existe una cuenta activa, recibirás un código de seis dígitos en tu correo.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo solicitar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          code: otp,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo restablecer la contraseña');
      backToLogin();
      setNotice(
        isInvitation
          ? 'Cuenta activada. Ya puedes iniciar sesión.'
          : 'Contraseña restablecida. Ya puedes iniciar sesión.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const message = error ? (
    <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in duration-200">
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
      <span>{error}</span>
    </div>
  ) : notice ? (
    <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold leading-relaxed text-emerald-800 animate-in fade-in duration-200">
      <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
      <span>{notice}</span>
    </div>
  ) : null;

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans flex flex-col selection:bg-[#0066FF]/20 selection:text-[#0052CC]">
      {/* ========================================================================= */}
      {/* 100% FULL-SCREEN 2-COLUMN SPLIT LAYOUT                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* LEFT COLUMN: 100% HEIGHT PICTURESQUE TRAVEL IMAGE WITH CURVED SHAPE */}
        <div className="lg:col-span-5 xl:col-span-5 p-6 lg:p-10 hidden lg:flex flex-col justify-center bg-zinc-50/50 border-r border-zinc-100">
          <div className="relative w-full h-full min-h-[620px] rounded-[44px] overflow-hidden shadow-2xl group flex flex-col justify-between p-7">
            {/* Background Travel Image */}
            <Image
              src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=85"
              alt="Destino Pintoresco Santorini Wanderlust"
              fill
              className="object-cover group-hover:scale-103 transition-transform duration-1000 ease-out"
              priority
            />

            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-transparent" />

            {/* Top Badge */}
            <div className="relative z-10 self-start">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/40 flex items-center gap-2 text-xs font-bold text-zinc-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] animate-pulse" />
                <span>Acceso Seguro a tu Panel</span>
              </div>
            </div>

            {/* Bottom Testimonial / Features Card */}
            <div className="relative z-10 p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0066FF]">
                  <Globe className="w-4 h-4 text-[#0066FF]" />
                  <span className="uppercase tracking-wider">Santorini & Islas Cícladas</span>
                </div>
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                «Gestionamos todas las cotizaciones, itinerarios interactivos y cobros con Stripe desde un panel centralizado e intuitivo.»
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-[11px] font-semibold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Seguridad SSL · Cifrado bancario</span>
                </div>
                <span className="font-bold text-zinc-800">10 Días · Exclusivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 100% VIEWPORT HEIGHT LOGIN FORM */}
        <div className="lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
          <div className="w-full max-w-lg space-y-6">
            {/* Volver a la home on the left */}
            <div className="pb-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors py-1 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Volver a la home</span>
              </Link>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {view === 'login'
                  ? 'Inicia sesión'
                  : view === 'request'
                  ? 'Recupera tu acceso'
                  : isInvitation
                  ? 'Crea tu contraseña'
                  : 'Introduce el código'}
              </h1>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {view === 'login'
                  ? 'Introduce tus credenciales para acceder a tu panel de viajes de Wanderlust.'
                  : view === 'request'
                  ? 'Escribe tu correo electrónico y te enviaremos las instrucciones de recuperación.'
                  : 'Completa la verificación para establecer tu nueva contraseña.'}
              </p>
            </div>

            {message}

            {/* VIEW 1: LOGIN FORM */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Correo electrónico *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      disabled={isLoading}
                      style={{ backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Contraseña *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      style={{ backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0066FF] focus:ring-[#0066FF] accent-[#0066FF] border-zinc-300"
                    />
                    <span>Recordarme en este equipo</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setView('request');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-zinc-500 hover:text-[#0066FF] font-medium cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit Primary CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Google Social Sign-in Button */}
                <button
                  type="button"
                  onClick={() => {
                    const redirect = getRedirectUrl();
                    const url = redirect !== '/viajes' ? `/api/auth/google?redirect=${encodeURIComponent(redirect)}` : '/api/auth/google';
                    window.location.href = url;
                  }}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 shadow-xs hover:border-zinc-300 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                {/* Sign Up Footer */}
                <div className="text-center pt-2 text-xs text-zinc-500">
                  <span>¿Aún no tienes una cuenta? </span>
                  <Link href="/registro" className="font-bold text-[#0066FF] hover:underline">
                    Regístrate gratis
                  </Link>
                </div>
              </form>
            )}

            {/* VIEW 2: REQUEST PASSWORD RESET */}
            {view === 'request' && (
              <form onSubmit={requestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Correo electrónico *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      disabled={isLoading}
                      style={{ backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enviar código de recuperación</span>}
                </button>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 pt-2 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </form>
            )}

            {/* VIEW 3: VERIFY OTP AND SET PASSWORD */}
            {view === 'verify' && (
              <form onSubmit={resetPassword} className="space-y-4">
                {!isInvitation && (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <span className="text-xs font-bold text-zinc-600">Código de 6 dígitos</span>
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      isDisabled={isLoading}
                    >
                      <InputOTP.Group>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTP.Slot
                            key={index}
                            index={index}
                            style={{ backgroundColor: '#ffffff' }}
                            className="h-12 w-11 rounded-xl border border-zinc-200 bg-white !bg-white text-lg font-bold text-zinc-900 focus:border-[#0066FF]"
                          />
                        ))}
                      </InputOTP.Group>
                    </InputOTP>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nueva contraseña *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      minLength={6}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={{ backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Repite la contraseña *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      minLength={6}
                      required
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="Repite la contraseña"
                      style={{ backgroundColor: '#ffffff' }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isInvitation ? 'Activar mi cuenta' : 'Guardar nueva contraseña'}</span>}
                </button>

                {!isInvitation && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void requestCode()}
                    className="block w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 cursor-pointer pt-1"
                  >
                    Reenviar código
                  </button>
                )}

                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 pt-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
