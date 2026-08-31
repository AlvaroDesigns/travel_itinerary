'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';

type View = 'login' | 'request' | 'verify';

export default function Login() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const backToLogin = () => { setView('login'); setOtp(''); setNewPassword(''); setConfirmation(''); setChallengeId(''); setError(null); setNotice(null); };
  const inputClass = 'h-11 w-full rounded-xl border border-white/10 bg-ink-900 px-4 text-sm text-white placeholder-ink-500 transition-all focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40';

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setIsLoading(true);
    try { const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión'); window.location.href = '/'; }
    catch (err) { setError(err instanceof Error ? err.message : 'Error al iniciar sesión.'); setIsLoading(false); }
  };

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault(); setError(null); setNotice(null); setIsLoading(true);
    try { const res = await fetch('/api/auth/password-reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'No se pudo solicitar el código'); setChallengeId(data.challengeId); setView('verify'); setNotice('Si existe una cuenta activa, recibirás un código de seis dígitos en tu correo.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo solicitar el código.'); }
    finally { setIsLoading(false); }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null);
    if (newPassword !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setIsLoading(true);
    try { const res = await fetch('/api/auth/password-reset/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code: otp, password: newPassword }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'No se pudo restablecer la contraseña'); backToLogin(); setNotice('Contraseña restablecida. Ya puedes iniciar sesión.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.'); }
    finally { setIsLoading(false); }
  };

  const message = error ? <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 p-3.5 text-xs font-semibold text-white animate-shake"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div> : notice ? <div className="mb-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3.5 text-xs font-semibold leading-relaxed text-emerald-100">{notice}</div> : null;

  return <div className="relative flex min-h-screen w-full items-center justify-center bg-ink-900 px-4 font-sans"><div className="relative z-10 w-full max-w-md"><div className="mb-10 flex justify-center"><Image src="/wanderlust_horizontal_blanco.png" alt="Wanderlust" width={260} height={70} priority className="h-16 w-auto object-contain" /></div><div className="rounded-2xl border border-white/10 bg-ink-800/60 p-8"><div className="mb-8 text-center"><h1 className="text-lg font-bold tracking-tight text-white">{view === 'login' ? 'Bienvenido de nuevo' : view === 'request' ? 'Recupera tu acceso' : 'Introduce el código'}</h1><p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-ink-400">Planificador de viajes</p></div>{message}
    {view === 'login' && <form onSubmit={handleLogin} className="space-y-5"><label className="block space-y-1.5"><span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">Correo electrónico</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type="email" required placeholder="ejemplo@correo.com" className={`${inputClass} pl-11`} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} /></span></label><label className="block space-y-1.5"><span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">Contraseña</span><span className="relative block"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type={showPassword ? 'text' : 'password'} required className={`${inputClass} pl-11 pr-11`} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label><button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-ink-900 hover:bg-ink-100 disabled:opacity-50">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Iniciar sesión'}</button><button type="button" onClick={() => { setView('request'); setError(null); setNotice(null); }} className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-bold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"><KeyRound className="h-4 w-4" />¿Has olvidado tu contraseña?</button></form>}
    {view === 'request' && <form onSubmit={requestCode} className="space-y-5"><p className="text-sm leading-relaxed text-ink-300">Escribe tu correo y te enviaremos un código temporal para crear una nueva contraseña.</p><label className="block space-y-1.5"><span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">Correo electrónico</span><span className="relative block"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type="email" required className={`${inputClass} pl-11`} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} /></span></label><button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-ink-900 disabled:opacity-50">{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Enviar código</button><button type="button" onClick={backToLogin} className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-ink-300 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Volver al inicio de sesión</button></form>}
    {view === 'verify' && <form onSubmit={resetPassword} className="space-y-5"><p className="text-center text-sm leading-relaxed text-ink-300">Introduce el código recibido y elige una nueva contraseña.</p><div className="flex justify-center"><InputOTP value={otp} onChange={setOtp} maxLength={6} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" autoComplete="one-time-code" isDisabled={isLoading} inputClassName="text-white"><InputOTP.Group>{[0,1,2,3,4,5].map((index) => <InputOTP.Slot key={index} index={index} className="h-11 w-10 border border-white/20 bg-ink-900 text-lg font-bold text-white sm:w-11" />)}</InputOTP.Group></InputOTP></div><label className="block space-y-1.5"><span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">Nueva contraseña</span><span className="relative block"><KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type="password" minLength={12} required className={`${inputClass} pl-11`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></span></label><label className="block space-y-1.5"><span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-ink-400">Repite la contraseña</span><input type="password" minLength={12} required className={inputClass} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label><button type="submit" disabled={isLoading || otp.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-ink-900 disabled:opacity-50">{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}Guardar nueva contraseña</button><button type="button" disabled={isLoading} onClick={() => void requestCode()} className="block w-full text-xs font-semibold text-ink-300 hover:text-white">Reenviar código</button></form>}
    <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-ink-500">Usa las credenciales asignadas por un administrador. Las contraseñas se verifican de forma segura y nunca se guardan en texto plano.</p></div></div></div>;
}
