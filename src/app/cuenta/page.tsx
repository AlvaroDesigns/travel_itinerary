'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import {
  User,
  Lock,
  Globe,
  Calendar,
  DollarSign,
  Bell,
  Check,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  AlertCircle,
  Save,
} from 'lucide-react';

type TabType = 'generales' | 'seguridad' | 'idioma' | 'fechahora' | 'divisa' | 'notificaciones';

interface UserPreferences {
  language: string;
  timezone: string;
  weekStart: 'domingo' | 'lunes';
  timeFormat: '24h' | '12h';
  dateFormat: 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd';
  decimals: 'coma' | 'punto';
  currencyPosition: 'inicio' | 'fin';
  currency: string;
  notifications: {
    newTrips: boolean;
    vouchers: boolean;
    clientReminders: boolean;
    weeklySummary: boolean;
    securityAlerts: boolean;
  };
}

export default function MiCuentaPage() {
  const { user, isLoading: isAuthLoading } = useTravel();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('generales');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  // Password data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences data (Matches Image 1)
  const [language, setLanguage] = useState('Español');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [weekStart, setWeekStart] = useState<'domingo' | 'lunes'>('lunes');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');
  const [dateFormat, setDateFormat] = useState<'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy/mm/dd'>('dd/mm/yyyy');
  const [decimals, setDecimals] = useState<'coma' | 'punto'>('coma');
  const [currencyPosition, setCurrencyPosition] = useState<'inicio' | 'fin'>('fin');
  const [currency, setCurrency] = useState('EUR');

  // Notification toggles
  const [notifNewTrips, setNotifNewTrips] = useState(true);
  const [notifVouchers, setNotifVouchers] = useState(true);
  const [notifClientReminders, setNotifClientReminders] = useState(true);
  const [notifWeeklySummary, setNotifWeeklySummary] = useState(false);
  const [notifSecurityAlerts, setNotifSecurityAlerts] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setCompany(data.company || '');

          if (data.preferences) {
            const p = data.preferences;
            if (p.language) setLanguage(p.language);
            if (p.timezone) setTimezone(p.timezone);
            if (p.weekStart) setWeekStart(p.weekStart);
            if (p.timeFormat) setTimeFormat(p.timeFormat);
            if (p.dateFormat) setDateFormat(p.dateFormat);
            if (p.decimals) setDecimals(p.decimals);
            if (p.currencyPosition) setCurrencyPosition(p.currencyPosition);
            if (p.currency) setCurrency(p.currency);
            if (p.notifications) {
              setNotifNewTrips(p.notifications.newTrips ?? true);
              setNotifVouchers(p.notifications.vouchers ?? true);
              setNotifClientReminders(p.notifications.clientReminders ?? true);
              setNotifWeeklySummary(p.notifications.weeklySummary ?? false);
              setNotifSecurityAlerts(p.notifications.securityAlerts ?? true);
            }
          }
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          company,
          preferences: {
            language,
            timezone,
            weekStart,
            timeFormat,
            dateFormat,
            decimals,
            currencyPosition,
            currency,
            notifications: {
              newTrips: notifNewTrips,
              vouchers: notifVouchers,
              clientReminders: notifClientReminders,
              weeklySummary: notifWeeklySummary,
              securityAlerts: notifSecurityAlerts,
            },
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      showNotification('success', 'Cambios guardados correctamente.');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar contraseña');

      showNotification('success', 'Contraseña actualizada con éxito');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for live formatted currency example
  const getFormattedExample = () => {
    const rawNumber = 123123.46;
    let numStr = decimals === 'coma' ? '123.123,46' : '123,123.46';
    if (currencyPosition === 'inicio') {
      return `${currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency} ${numStr}`;
    } else {
      return `${numStr} ${currency} ${currency === 'EUR' ? '€' : ''}`.trim();
    }
  };

  if (isAuthLoading || isLoading) {
    return <WanderlustLoader />;
  }

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'generales', label: 'Datos generales', icon: User },
    { id: 'seguridad', label: 'Cambiar contraseña', icon: Lock },
    { id: 'idioma', label: 'Idioma y región', icon: Globe },
    { id: 'fechahora', label: 'Fecha y hora', icon: Calendar },
    { id: 'divisa', label: 'Divisa y números', icon: DollarSign },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <DashboardShell activeMenu="cuenta">
      <div className="w-full space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
            Mi cuenta
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Personaliza tus datos personales, preferencias regionales, formatos y seguridad.
          </p>
        </div>

        {/* Global Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-semibold shadow-xs animate-scale-in ${
              feedback.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* HeroUI Segmented Tabs Capsule (Image 1) */}
        <div className="inline-flex max-w-full overflow-x-auto rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.03]'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area: Styled White Box */}
        <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs">
          {/* ========================================================= */}
          {/* TAB 1: DATOS GENERALES                                    */}
          {/* ========================================================= */}
          {activeTab === 'generales' && (
            <div className="space-y-8 divide-y divide-[#f2f4f7]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Perfil de usuario</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Información personal visible en propuestas e itinerarios.
                  </p>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#009688] text-xl font-extrabold text-white shadow-md">
                      {name ? name.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#101828]">{name || 'Sin nombre definido'}</p>
                      <p className="text-xs text-[#667085]">{email}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#00796b]">
                        <ShieldCheck className="h-3 w-3" />
                        {user?.role === 'admin' ? 'Administrador' : 'Agente / Propietario'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ej. Álvaro Gutiérrez"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full rounded-xl border border-[#eaecf0] bg-[#f9fafb] p-2.5 text-xs text-[#667085] cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">
                        Empresa o Agencia
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="ej. Wanderlust Travel Agency"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveProfile()}
                      className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 cursor-pointer"
                    >
                      Guardar datos generales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CAMBIAR CONTRASEÑA                                 */}
          {/* ========================================================= */}
          {activeTab === 'seguridad' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Seguridad de la cuenta</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Actualiza tu contraseña periódicamente para proteger el acceso a tus itinerarios.
                </p>
              </div>

              <div className="md:col-span-2 max-w-md space-y-4">
                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="mb-1 block font-bold text-[#344054]">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#344054]">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-[#344054]">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 cursor-pointer"
                    >
                      Actualizar contraseña
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: IDIOMA Y REGIÓN (Exact match to Image 1)           */}
          {/* ========================================================= */}
          {activeTab === 'idioma' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Idioma y región</h3>
                <p className="text-xs text-[#667085] mt-1">Elige tu idioma y región</p>
              </div>

              <div className="md:col-span-2 max-w-md space-y-4">
                {/* Select Idioma */}
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                    Idioma
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#155eef] focus:outline-hidden focus:ring-2 focus:ring-[#155eef]/20"
                  >
                    <option value="Español">Español</option>
                    <option value="English">English</option>
                    <option value="Français">Français</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="Italiano">Italiano</option>
                    <option value="Português">Português</option>
                  </select>
                </div>

                {/* Select Región */}
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                    Región
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#155eef] focus:outline-hidden focus:ring-2 focus:ring-[#155eef]/20"
                  >
                    <option value="Europe/Madrid">Europe/Madrid</option>
                    <option value="America/Mexico_City">America/Mexico_City</option>
                    <option value="America/Bogota">America/Bogota</option>
                    <option value="America/Buenos_Aires">America/Buenos_Aires</option>
                    <option value="America/Santiago">America/Santiago</option>
                    <option value="America/Lima">America/Lima</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#155eef] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1048b0] transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FECHA Y HORA (Exact match to Image 1)              */}
          {/* ========================================================= */}
          {activeTab === 'fechahora' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Fecha y hora</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Personaliza cómo se muestran la fecha y la hora
                </p>
              </div>

              <div className="md:col-span-2 max-w-md space-y-6">
                {/* Comienzo de la semana */}
                <div>
                  <p className="text-xs font-bold text-[#344054] mb-2">Comienzo de la semana</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="weekStart"
                        value="domingo"
                        checked={weekStart === 'domingo'}
                        onChange={() => setWeekStart('domingo')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Domingo</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="weekStart"
                        value="lunes"
                        checked={weekStart === 'lunes'}
                        onChange={() => setWeekStart('lunes')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Lunes</span>
                    </label>
                  </div>
                </div>

                {/* Formato de hora */}
                <div>
                  <p className="text-xs font-bold text-[#344054] mb-2">Formato de hora</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={timeFormat === '24h'}
                        onChange={() => setTimeFormat('24h')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>24 horas</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={timeFormat === '12h'}
                        onChange={() => setTimeFormat('12h')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>12 horas</span>
                    </label>
                  </div>
                </div>

                {/* Formato de fecha */}
                <div>
                  <p className="text-xs font-bold text-[#344054] mb-2">Formato de fecha</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="mm/dd/yyyy"
                        checked={dateFormat === 'mm/dd/yyyy'}
                        onChange={() => setDateFormat('mm/dd/yyyy')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>mm/dd/yyyy</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="dd/mm/yyyy"
                        checked={dateFormat === 'dd/mm/yyyy'}
                        onChange={() => setDateFormat('dd/mm/yyyy')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>dd/mm/yyyy</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="dateFormat"
                        value="yyyy/mm/dd"
                        checked={dateFormat === 'yyyy/mm/dd'}
                        onChange={() => setDateFormat('yyyy/mm/dd')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>yyyy/mm/dd</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#155eef] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1048b0] transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: DIVISA Y NÚMEROS (Exact match to Image 1)          */}
          {/* ========================================================= */}
          {activeTab === 'divisa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Divisa y números</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Personaliza cómo se muestran los números y los precios
                </p>
              </div>

              <div className="md:col-span-2 max-w-md space-y-6">
                {/* Decimales */}
                <div>
                  <p className="text-xs font-bold text-[#344054] mb-2">Decimales</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="decimals"
                        value="coma"
                        checked={decimals === 'coma'}
                        onChange={() => setDecimals('coma')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Coma (,)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="decimals"
                        value="punto"
                        checked={decimals === 'punto'}
                        onChange={() => setDecimals('punto')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Punto (.)</span>
                    </label>
                  </div>
                </div>

                {/* Posición símbolo de divisa */}
                <div>
                  <p className="text-xs font-bold text-[#344054] mb-2">Posición símbolo de divisa</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="currencyPosition"
                        value="inicio"
                        checked={currencyPosition === 'inicio'}
                        onChange={() => setCurrencyPosition('inicio')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Inicio</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                      <input
                        type="radio"
                        name="currencyPosition"
                        value="fin"
                        checked={currencyPosition === 'fin'}
                        onChange={() => setCurrencyPosition('fin')}
                        className="text-[#155eef] focus:ring-[#155eef]"
                      />
                      <span>Fin</span>
                    </label>
                  </div>
                </div>

                {/* Moneda */}
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#155eef] focus:outline-hidden focus:ring-2 focus:ring-[#155eef]/20"
                  >
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="USD">USD ($) - Dólar estadounidense</option>
                    <option value="GBP">GBP (£) - Libra esterlina</option>
                    <option value="MXN">MXN ($) - Peso mexicano</option>
                    <option value="COP">COP ($) - Peso colombiano</option>
                    <option value="ARS">ARS ($) - Peso argentino</option>
                    <option value="CLP">CLP ($) - Peso chileno</option>
                  </select>
                </div>

                {/* Input Ejemplo (Matches Image 1) */}
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                    Ejemplo
                  </label>
                  <input
                    type="text"
                    disabled
                    value={getFormattedExample()}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-[#f9fafb] px-3.5 py-3 text-xs font-mono text-right text-[#667085] cursor-default"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#155eef] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1048b0] transition-colors cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: NOTIFICACIONES                                     */}
          {/* ========================================================= */}
          {activeTab === 'notificaciones' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#101828]">Alertas y correos</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Controla qué notificaciones se envían a tu correo y a tus viajeros.
                </p>
              </div>

              <div className="md:col-span-2 max-w-md space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Nuevos viajes e itinerarios</p>
                      <p className="text-[11px] text-[#667085]">Recibir confirmación cuando se cree o duplique un viaje.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifNewTrips}
                      onChange={(e) => setNotifNewTrips(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Vouchers y documentos</p>
                      <p className="text-[11px] text-[#667085]">Avisos cuando se generen PDFs o vouchers para clientes.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifVouchers}
                      onChange={(e) => setNotifVouchers(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Recordatorios automáticos</p>
                      <p className="text-[11px] text-[#667085]">Envío automático de cuentas atrás e instrucciones previas al viaje.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifClientReminders}
                      onChange={(e) => setNotifClientReminders(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Resumen semanal de actividad</p>
                      <p className="text-[11px] text-[#667085]">Informe semanal con métricas de viajes y visualizaciones.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWeeklySummary}
                      onChange={(e) => setNotifWeeklySummary(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Alertas de seguridad</p>
                      <p className="text-[11px] text-[#667085]">Avisos de inicios de sesión y cambios de contraseña.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSecurityAlerts}
                      onChange={(e) => setNotifSecurityAlerts(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-colors cursor-pointer"
                  >
                    Guardar preferencias
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
