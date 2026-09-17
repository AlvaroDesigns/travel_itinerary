'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Globe,
  Star,
} from 'lucide-react';

export default function RegisterPage() {
  const [userType, setUserType] = useState<'agency' | 'particular'>('agency');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyType, setAgencyType] = useState('Agencia Emisora (Viajes a Medida)');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
          agencyName: userType === 'agency' ? agencyName : undefined,
          phone: userType === 'agency' ? phone : undefined,
          agencyType: userType === 'agency' ? agencyType : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al registrarse');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans flex flex-col selection:bg-[#0066FF]/20 selection:text-[#0052CC]">
      {/* ========================================================================= */}
      {/* 100% FULL-SCREEN 2-COLUMN SPLIT LAYOUT                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* LEFT COLUMN: PICTURESQUE TRAVEL IMAGE */}
        <div className="lg:col-span-5 xl:col-span-5 p-6 lg:p-10 hidden lg:flex flex-col justify-center bg-zinc-50/50 border-r border-zinc-100">
          <div className="relative w-full h-full min-h-[620px] rounded-[44px] overflow-hidden shadow-2xl group flex flex-col justify-between p-7">
            {/* Background Travel Image */}
            <Image
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85"
              alt="Destino Paraíso Wanderlust"
              fill
              className="object-cover group-hover:scale-103 transition-transform duration-1000 ease-out"
              priority
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-transparent" />

            {/* Top Badge */}
            <div className="relative z-10 self-start">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/40 flex items-center gap-2 text-xs font-bold text-zinc-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] animate-pulse" />
                <span>Prueba gratuita de 14 días</span>
              </div>
            </div>

            {/* Bottom Card */}
            <div className="relative z-10 p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0066FF]">
                  <Globe className="w-4 h-4 text-[#0066FF]" />
                  <span className="uppercase tracking-wider">Bora Bora & Polinesia</span>
                </div>
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                «Generamos presupuestos visuales e itinerarios interactivos que nuestros clientes confirman y pagan en el acto.»
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 text-[11px] font-semibold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Sin tarjeta de crédito obligatoria</span>
                </div>
                <span className="font-bold text-zinc-800">8 Días · 2 Viajeros</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 100% VIEWPORT HEIGHT REGISTRATION FORM */}
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

            {success ? (
              <div className="py-16 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-3xl bg-blue-100 text-[#0066FF] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-zinc-900">¡Cuenta creada con éxito!</h2>
                  <p className="text-sm text-zinc-600 mt-2 max-w-sm mx-auto">
                    Preparando tu entorno de trabajo... Te estamos redirigiendo a tu panel de viajes.
                  </p>
                </div>
                <div className="pt-4">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0066FF] mx-auto" />
                </div>
              </div>
            ) : (
              <>
                {/* Heading & Subtitle */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                    Crea tu cuenta
                  </h1>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Únete a cientos de agencias y viajeros para planificar, cotizar y compartir itinerarios interactivos.
                  </p>
                </div>

                {/* Profile Selector (Agency vs Particular) */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setUserType('agency')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      userType === 'agency'
                        ? 'border-[#0066FF] bg-blue-50/70 ring-2 ring-[#0066FF]/20 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Building2
                        className={`w-5 h-5 ${userType === 'agency' ? 'text-[#0066FF]' : 'text-zinc-500'}`}
                      />
                      {userType === 'agency' && <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />}
                    </div>
                    <div className="text-xs font-bold text-zinc-900">Soy Agencia / DMC</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Propuestas B2B, CRM y Stripe</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('particular')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      userType === 'particular'
                        ? 'border-[#0066FF] bg-blue-50/70 ring-2 ring-[#0066FF]/20 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <User
                        className={`w-5 h-5 ${userType === 'particular' ? 'text-[#0066FF]' : 'text-zinc-500'}`}
                      />
                      {userType === 'particular' && <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />}
                    </div>
                    <div className="text-xs font-bold text-zinc-900">Soy Particular</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Viajes personales y amigos</div>
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre completo *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Laura González"
                        style={{ backgroundColor: '#ffffff' }}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                      />
                    </div>
                  </div>

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
                        placeholder={
                          userType === 'agency' ? 'laura@viajeshorizonte.com' : 'laura.gonzalez@gmail.com'
                        }
                        style={{ backgroundColor: '#ffffff' }}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Dynamic Agency Fields */}
                  {userType === 'agency' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre de la Agencia *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            required
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder="Horizon Travel"
                            style={{ backgroundColor: '#ffffff' }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Teléfono / WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+34 600 000 000"
                            style={{ backgroundColor: '#ffffff' }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-white !bg-white shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
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

                  {/* Terms & Remember me */}
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

                    <Link href="/login" className="text-zinc-500 hover:text-[#0066FF] font-medium">
                      ¿Has olvidado la contraseña?
                    </Link>
                  </div>

                  {/* Submit CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{userType === 'agency' ? 'Registrar mi Agencia gratis' : 'Crear mi cuenta'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Google Social Button */}
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/api/auth/google?type=${userType}`;
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

                  {/* Sign In Footer */}
                  <div className="text-center pt-2 text-xs text-zinc-500">
                    <span>¿Ya tienes una cuenta registrada? </span>
                    <Link href="/login" className="font-bold text-[#0066FF] hover:underline">
                      Inicia sesión
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
