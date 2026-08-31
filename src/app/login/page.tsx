'use client';

import React, { useEffect, useState } from 'react';
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
  KeyRound,
  Shield,
  Sparkles,
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

  const inputClass =
    'h-11 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-4 text-sm text-white placeholder-zinc-500 transition-all focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10';

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
      window.location.href = '/';
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
    <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-200 animate-shake">
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
      <span>{error}</span>
    </div>
  ) : notice ? (
    <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold leading-relaxed text-emerald-200">
      <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
      <span>{notice}</span>
    </div>
  ) : null;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-zinc-950 px-4 font-sans selection:bg-[#009688] selection:text-white">
      {/* HeroUI Pro Ambient Mesh Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-[#009688]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[400px] w-[500px] rounded-full bg-teal-700/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="mb-8 flex flex-col items-center justify-center gap-2">
          <Image
            src="/wanderlust_horizontal_blanco.png"
            alt="Wanderlust"
            width={260}
            height={70}
            priority
            className="h-14 w-auto object-contain"
          />
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-950/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-300 backdrop-blur-md">
            <Shield className="h-3 w-3 text-teal-400" />
            Acceso seguro
          </span>
        </div>

        {/* HeroUI Pro Auth Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-7 shadow-2xl backdrop-blur-2xl sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {view === 'login'
                ? 'Bienvenido de nuevo'
                : view === 'request'
                ? 'Recupera tu acceso'
                : isInvitation
                ? 'Crea tu contraseña'
                : 'Introduce el código'}
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Planificador de itinerarios
            </p>
          </div>

          {message}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Correo electrónico
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    className={`${inputClass} pl-11`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Contraseña
                </span>
                <span className="relative block">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`${inputClass} pl-11 pr-11`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="wanderlust-primary-button mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('request');
                  setError(null);
                  setNotice(null);
                }}
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>¿Has olvidado tu contraseña?</span>
              </button>
            </form>
          )}

          {view === 'request' && (
            <form onSubmit={requestCode} className="space-y-4">
              <p className="text-xs leading-relaxed text-zinc-300">
                Escribe tu correo y te enviaremos un código temporal para crear una nueva contraseña.
              </p>
              <label className="block space-y-1.5">
                <span className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Correo electrónico
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    className={`${inputClass} pl-11`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </span>
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar código
              </button>
              <button
                type="button"
                onClick={backToLogin}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al inicio de sesión</span>
              </button>
            </form>
          )}

          {view === 'verify' && (
            <form onSubmit={resetPassword} className="space-y-4">
              <p className="text-center text-xs leading-relaxed text-zinc-300">
                {isInvitation
                  ? 'Elige una contraseña segura para activar tu cuenta.'
                  : 'Introduce el código recibido y elige una nueva contraseña.'}
              </p>
              {!isInvitation && (
                <div className="flex justify-center py-2">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    isDisabled={isLoading}
                    inputClassName="text-white"
                  >
                    <InputOTP.Group>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTP.Slot
                          key={index}
                          index={index}
                          className="h-11 w-10 rounded-xl border border-white/20 bg-zinc-950 text-lg font-bold text-white sm:w-11"
                        />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                </div>
              )}
              <label className="block space-y-1.5">
                <span className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Nueva contraseña
                </span>
                <span className="relative block">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="password"
                    minLength={12}
                    required
                    className={`${inputClass} pl-11`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Repite la contraseña
                </span>
                <input
                  type="password"
                  minLength={12}
                  required
                  className={inputClass}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isInvitation ? 'Activar mi cuenta' : 'Guardar nueva contraseña'}
              </button>
              {!isInvitation && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void requestCode()}
                  className="block w-full text-center text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Reenviar código
                </button>
              )}
            </form>
          )}

          <p className="mt-6 border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-zinc-500">
            Usa las credenciales asignadas por un administrador. Las contraseñas se verifican de forma segura.
          </p>
        </div>
      </div>
    </div>
  );
}
