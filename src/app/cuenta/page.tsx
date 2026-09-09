'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { AvatarPickerModal, UserAvatarDisplay } from '@/components/AvatarPickerModal';
import { StripeConfigModal, StripeConfigData } from '@/components/StripeConfigModal';
import { RedsysConfigModal, RedsysConfigData } from '@/components/RedsysConfigModal';
import { RedsysLogo } from '@/components/RedsysLogo';
import { ConfirmModal } from '@/components/ConfirmModal';
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
  Pencil,
  Trash2,
  Sparkles,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Palette,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  Landmark,
  Layers,
  Zap,
  CheckCircle2,
  Settings,
  Loader2,
} from 'lucide-react';

type TabType =
  | 'detalles'
  | 'apariencia'
  | 'pagos'
  | 'reservas'
  | 'legal'
  | 'viajes';

interface PaymentProviderStatus {
  stripe: StripeConfigData;
  redsys: RedsysConfigData;
  inespay: {
    status: 'connected' | 'not_connected';
    connected: boolean;
  };
}

function MiCuentaConfiguracionContent() {
  const { user, isLoading: isAuthLoading } = useTravel();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabQuery = searchParams.get('tab') as TabType | null;
  const stripeParam = searchParams.get('stripe');
  const [activeTab, setActiveTab] = useState<TabType>(tabQuery || 'detalles');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isStripeConfigModalOpen, setIsStripeConfigModalOpen] = useState(false);
  const [isRedsysModalOpen, setIsRedsysModalOpen] = useState(false);

  // Custom Styled Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Profile data (Image 1)
  const [name, setName] = useState('Alvaro');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [avatar, setAvatar] = useState<string>('traveler-girl-teal');

  // Password data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Payment Providers data
  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderStatus>({
    stripe: {
      status: 'in_progress',
      connected: false,
      email: 'alvaro.bonilla1990@gmail.com',
      testMode: true,
    },
    redsys: {
      status: 'not_connected',
      connected: false,
      terminal: '001',
      environment: 'test',
    },
    inespay: {
      status: 'not_connected',
      connected: false,
    },
  });

  // Regional & Trip Preferences (Options from before restored)
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

  // Appearance settings
  const [brandColor, setBrandColor] = useState('#009688');
  const [defaultTheme, setDefaultTheme] = useState('classic');

  // Booking policies
  const [depositPercent, setDepositPercent] = useState(30);
  const [dueDaysBeforeTrip, setDueDaysBeforeTrip] = useState(15);

  // Legal
  const [agencyCif, setAgencyCif] = useState('');
  const [termsText, setTermsText] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.agencyName) setCompany(user.agencyName);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  useEffect(() => {
    if (tabQuery && ['detalles', 'apariencia', 'pagos', 'reservas', 'legal', 'viajes'].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setName(data.name || 'Alvaro');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setCompany(data.company || '');
          setAvatar(data.avatar || 'traveler-girl-teal');

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
            if (p.avatar) setAvatar(p.avatar);
            if (p.brandColor) setBrandColor(p.brandColor);
            if (p.defaultTheme) setDefaultTheme(p.defaultTheme);
            if (p.depositPercent !== undefined) setDepositPercent(p.depositPercent);
            if (p.dueDaysBeforeTrip !== undefined) setDueDaysBeforeTrip(p.dueDaysBeforeTrip);
            if (p.agencyCif) setAgencyCif(p.agencyCif);
            if (p.termsText) setTermsText(p.termsText);

            if (p.paymentProviders) {
              setPaymentProviders({
                stripe: {
                  status: p.paymentProviders.stripe?.status || 'in_progress',
                  connected: !!p.paymentProviders.stripe?.connected,
                  email: p.paymentProviders.stripe?.email || data.email || 'alvaro.bonilla1990@gmail.com',
                  publishableKey: p.paymentProviders.stripe?.publishableKey || '',
                  secretKey: p.paymentProviders.stripe?.secretKey || '',
                  webhookSecret: p.paymentProviders.stripe?.webhookSecret || '',
                  testMode: p.paymentProviders.stripe?.testMode ?? true,
                },
                redsys: {
                  status: p.paymentProviders.redsys?.status || 'not_connected',
                  connected: !!p.paymentProviders.redsys?.connected,
                  fuc: p.paymentProviders.redsys?.fuc || '',
                  terminal: p.paymentProviders.redsys?.terminal || '001',
                  secretKey: p.paymentProviders.redsys?.secretKey || '',
                  environment: p.paymentProviders.redsys?.environment || 'test',
                },
                inespay: {
                  status: p.paymentProviders.inespay?.status || 'not_connected',
                  connected: !!p.paymentProviders.inespay?.connected,
                },
              });
            }

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

  const handleSaveProfile = async (overrideAvatar?: string, overridePayments?: PaymentProviderStatus) => {
    setIsSaving(true);
    const activeAvatar = overrideAvatar !== undefined ? overrideAvatar : avatar;
    const activePayments = overridePayments || paymentProviders;

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
            avatar: activeAvatar,
            brandColor,
            defaultTheme,
            depositPercent,
            dueDaysBeforeTrip,
            agencyCif,
            termsText,
            paymentProviders: activePayments,
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

  const handleSelectAvatar = (newAvatar: string) => {
    setAvatar(newAvatar);
    handleSaveProfile(newAvatar);
    showNotification('success', 'Foto de perfil actualizada.');
  };

  const handleRemoveAvatar = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar foto de perfil',
      message: '¿Estás seguro de que deseas eliminar tu avatar de perfil? Volverás a mostrar tus iniciales por defecto.',
      confirmText: 'Eliminar foto',
      variant: 'danger',
      onConfirm: () => {
        setAvatar('');
        handleSaveProfile('');
        showNotification('success', 'Foto de perfil eliminada.');
      },
    });
  };

  // Check URL params for Stripe return status
  useEffect(() => {
    if (stripeParam === 'success') {
      showNotification('success', '¡Cuenta de Stripe vinculada con éxito a través de Stripe Connect!');
    } else if (stripeParam === 'refresh') {
      showNotification('error', 'Proceso de vinculación de Stripe pendiente. Puedes volver a iniciarlo cuando desees.');
    }
  }, [stripeParam]);

  // Real Stripe Connect Onboarding Flow (Redirects to official Stripe portal)
  const handleConnectStripeReal = async () => {
    setIsConnectingStripe(true);
    try {
      const res = await fetch('/api/payments/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar conexión con Stripe');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al conectar con Stripe');
      setIsConnectingStripe(false);
    }
  };

  const handleSaveStripeConfig = (newConfig: StripeConfigData) => {
    const updated: PaymentProviderStatus = {
      ...paymentProviders,
      stripe: newConfig,
    };
    setPaymentProviders(updated);
    handleSaveProfile(undefined, updated);
    showNotification('success', 'Configuración de Stripe guardada.');
  };

  const handleDisconnectStripe = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Desconectar cuenta de Stripe',
      message: '¿Estás seguro de que deseas desconectar tu cuenta de Stripe? Los cobros automáticos de reservas e itinerarios quedarán pausados.',
      confirmText: 'Desconectar cuenta',
      variant: 'danger',
      onConfirm: () => {
        const updated: PaymentProviderStatus = {
          ...paymentProviders,
          stripe: {
            status: 'not_connected',
            connected: false,
            email: '',
            publishableKey: '',
            secretKey: '',
            webhookSecret: '',
            testMode: true,
          },
        };
        setPaymentProviders(updated);
        handleSaveProfile(undefined, updated);
        showNotification('success', 'Stripe se ha desconectado correctamente.');
      },
    });
  };

  // Redsys Handlers
  const handleSaveRedsysConfig = (newConfig: RedsysConfigData) => {
    const updated: PaymentProviderStatus = {
      ...paymentProviders,
      redsys: newConfig,
    };
    setPaymentProviders(updated);
    handleSaveProfile(undefined, updated);
    showNotification('success', 'TPV Redsys configurado y activado.');
  };

  const handleDisconnectRedsys = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Desconectar TPV Redsys',
      message: '¿Estás seguro de que deseas desconectar el TPV Redsys? Se desactivarán los cobros mediante tarjetas bancarias locales y Bizum.',
      confirmText: 'Desvincular TPV',
      variant: 'danger',
      onConfirm: () => {
        const updated: PaymentProviderStatus = {
          ...paymentProviders,
          redsys: {
            status: 'not_connected',
            connected: false,
            fuc: '',
            terminal: '001',
            secretKey: '',
            environment: 'test',
          },
        };
        setPaymentProviders(updated);
        handleSaveProfile(undefined, updated);
        showNotification('success', 'TPV Redsys desconectado.');
      },
    });
  };

  // Password update
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

  // Live formatted price example
  const getFormattedExample = () => {
    const sym =
      currency === 'EUR'
        ? '€'
        : currency === 'USD'
        ? '$'
        : currency === 'GBP'
        ? '£'
        : currency === 'BRL'
        ? 'R$'
        : currency === 'CHF'
        ? 'CHF'
        : '$';
    const num = decimals === 'coma' ? '1.250,50' : '1,250.50';
    return currencyPosition === 'inicio' ? `${sym} ${num}` : `${num} ${sym}`;
  };

  if (isAuthLoading) {
    return <WanderlustLoader />;
  }

  // Active tabs matching requirements (MOGU AI and Suscripción removed as requested)
  const tabs: { id: TabType; label: string; hasAlert?: boolean }[] = [
    { id: 'detalles', label: 'Detalles de la cuenta' },
    { id: 'apariencia', label: 'Apariencia' },
    { id: 'pagos', label: 'Pagos', hasAlert: paymentProviders.stripe.status !== 'connected' && paymentProviders.redsys.status !== 'connected' },
    { id: 'reservas', label: 'Reservas' },
    { id: 'legal', label: 'Legal' },
    { id: 'viajes', label: 'Viajes' },
  ];

  return (
    <DashboardShell activeMenu="cuenta">
      <div className="w-full space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
            Configuración
          </h1>
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

        {/* Top Horizontal Tabs */}
        <div className="border-b border-zinc-200">
          <nav className="flex space-x-6 overflow-x-auto [scrollbar-width:none]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? 'border-[#009688] text-[#009688]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.hasAlert && (
                    <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: DETALLES DE LA CUENTA                              */}
          {/* ========================================================= */}
          {activeTab === 'detalles' && (
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-8">
              {/* Profile Avatar Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Foto de perfil</h3>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {/* Circular Avatar */}
                  <div
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="group relative cursor-pointer"
                    title="Haz clic para cambiar avatar"
                  >
                    <UserAvatarDisplay avatar={avatar} name={name} size="xl" />
                    <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Pencil className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Edit & Delete Action Icons */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      title="Cambiar foto de perfil"
                      className="p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-full transition cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      title="Eliminar foto de perfil"
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-500">
                  Selecciona uno de nuestros avatares vectoriales de viaje o sube el logotipo de tu agencia.
                </p>
              </div>

              <hr className="border-[#eaecf0]" />

              {/* Personal Info Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Información personal y de contacto</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Estos datos se mostrarán en la cabecera de tus itinerarios y comunicaciones.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#344054]">Nombre completo</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#344054]">Correo electrónico</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full rounded-xl border border-[#d0d5dd] bg-[#f9fafb] p-2.5 text-xs text-[#667085] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#344054]">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#344054]">Nombre de la agencia / Empresa</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="ej. Wanderlust Travel Agency"
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                  >
                    Guardar información
                  </button>
                </div>
              </div>

              <hr className="border-[#eaecf0]" />

              {/* Password Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Seguridad y contraseña</h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Modifica tu clave de acceso para mantener la cuenta segura.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#344054]">Contraseña actual</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">Nueva contraseña</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#344054]">Confirmar contraseña</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSaving || !newPassword}
                      className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      Actualizar contraseña
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: APARIENCIA                                         */}
          {/* ========================================================= */}
          {activeTab === 'apariencia' && (
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#009688]">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828]">Marca & Apariencia</h3>
                  <p className="text-xs text-[#667085]">Personaliza la identidad visual de tus itinerarios para clientes.</p>
                </div>
              </div>

              <div className="max-w-xl space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    Color corporativo principal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-14 rounded-lg border border-zinc-300 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-700 font-semibold">{brandColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    Tema por defecto para nuevos itinerarios
                  </label>
                  <select
                    value={defaultTheme}
                    onChange={(e) => setDefaultTheme(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                  >
                    <option value="classic">Classic (Equilibrado y Moderno)</option>
                    <option value="elegant">Elegant (Editorial Serif)</option>
                    <option value="bold">Bold (Alto impacto)</option>
                    <option value="minimal">Minimal (Línea de tiempo limpia)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                  >
                    Guardar apariencia
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PAGOS (Stripe & Redsys Comprehensive Management)    */}
          {/* ========================================================= */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#101828]">
                  Proveedor de pagos
                </h2>
                <span className="rounded-md bg-[#00bcd4]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#00838f]">
                  NUEVO
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-600 -mt-3 mb-2">
                <span>Configura y gestiona tus pasarelas de pago para cobrar reservas e itinerarios</span>
                {paymentProviders.stripe.status !== 'connected' && paymentProviders.redsys.status !== 'connected' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    !
                  </span>
                )}
              </div>

              {/* Providers List Container */}
              <div className="space-y-5">
                {/* 1. STRIPE CARD */}
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4 transition hover:border-zinc-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-[#635bff] tracking-tight">stripe</span>
                      <span className="rounded-md bg-[#635bff]/10 px-2 py-0.5 text-[10px] font-bold text-[#635bff]">
                        Tarjetas, Apple Pay, Google Pay
                      </span>
                      <HelpCircle className="h-4 w-4 text-zinc-400" />
                    </div>

                    {/* Status Badge */}
                    {paymentProviders.stripe.status === 'connected' ? (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        CONECTADO
                      </span>
                    ) : paymentProviders.stripe.status === 'in_progress' ? (
                      <span className="rounded-md bg-[#e0f2fe] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#0284c7]">
                        EN PROGRESO
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-zinc-600">
                        NO CONECTADO
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {paymentProviders.stripe.status === 'connected'
                      ? `Cuenta conectada (${paymentProviders.stripe.email || email}). Modo: ${paymentProviders.stripe.testMode ? 'Pruebas (Test Mode)' : 'Producción (En vivo)'}. Lista para cobrar depósitos y reservas automáticamente.`
                      : 'Acepta pagos internacionales con tarjeta de crédito/débito, Apple Pay, Google Pay y transferencias con máxima seguridad PCI Nivel 1.'}
                  </p>

                  {/* Connected details metadata */}
                  {paymentProviders.stripe.status === 'connected' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-700 font-mono">
                        Email: {paymentProviders.stripe.email || email}
                      </span>
                      <span className={`rounded-md px-2.5 py-1 font-bold ${
                        paymentProviders.stripe.testMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {paymentProviders.stripe.testMode ? '🧪 Modo Pruebas' : '⚡ Producción'}
                      </span>
                      {paymentProviders.stripe.publishableKey && (
                        <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-600 font-mono">
                          Key: {paymentProviders.stripe.publishableKey.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100">
                    {paymentProviders.stripe.status === 'connected' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsStripeConfigModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Gestionar credenciales & API Keys</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConnectingStripe}
                          onClick={handleConnectStripeReal}
                          className="flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {isConnectingStripe && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          <span>Reabrir portal Stripe Connect</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={handleDisconnectStripe}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Desconectar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isConnectingStripe}
                          onClick={handleConnectStripeReal}
                          className="flex items-center gap-1.5 rounded-xl bg-[#009688] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                        >
                          {isConnectingStripe && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          <span>Conectar con Stripe</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsStripeConfigModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Configurar manualmente API Keys</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. REDSYS CARD */}
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4 transition hover:border-zinc-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <RedsysLogo size="md" />
                      </div>
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#009688] border border-teal-200/60">
                        Bancos Españoles & Bizum
                      </span>
                      <HelpCircle className="h-4 w-4 text-zinc-400" />
                    </div>

                    {paymentProviders.redsys.status === 'connected' ? (
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        CONECTADO
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-zinc-600">
                        NO CONECTADO
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {paymentProviders.redsys.status === 'connected'
                      ? `TPV Redsys activo (FUC: ${paymentProviders.redsys.fuc}, Terminal: ${paymentProviders.redsys.terminal || '001'}). Entorno: ${paymentProviders.redsys.environment === 'real' ? '⚡ Producción' : '🧪 Sandbox'}.`
                      : 'Si ya tienes un TPV virtual contratado con tu banco (BBVA, Santander, CaixaBank, Sabadell, etc.), vincúlalo directamente mediante FUC y clave SHA-256.'}
                  </p>

                  {/* Connected details metadata */}
                  {paymentProviders.redsys.status === 'connected' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-700 font-mono">
                        FUC: {paymentProviders.redsys.fuc}
                      </span>
                      <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-700 font-mono">
                        Terminal: {paymentProviders.redsys.terminal || '001'}
                      </span>
                      <span className={`rounded-md px-2.5 py-1 font-bold ${
                        paymentProviders.redsys.environment === 'real' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {paymentProviders.redsys.environment === 'real' ? '⚡ Producción' : '🧪 Pruebas'}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setIsRedsysModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#009688] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{paymentProviders.redsys.status === 'connected' ? 'Gestionar TPV Redsys' : 'Conecta tu TPV Redsys'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>

                    {paymentProviders.redsys.status === 'connected' && (
                      <button
                        type="button"
                        onClick={handleDisconnectRedsys}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Desconectar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. INESPAY CARD */}
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-4 transition hover:border-zinc-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          <span className="h-4 w-2 rounded-sm bg-[#00bcd4]" />
                          <span className="h-4 w-2 rounded-sm bg-[#0288d1]" />
                        </div>
                        <span className="text-base font-extrabold text-[#101828]">inespay</span>
                      </div>
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#00838f] border border-teal-200/60">
                        Transferencias Online
                      </span>
                      <HelpCircle className="h-4 w-4 text-zinc-400" />
                    </div>

                    <span className="rounded-md bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-zinc-600">
                      PRÓXIMAMENTE
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Acepta pagos por transferencia bancaria instantánea e irrevocable con comisión fija reducida del 0.1%.
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => showNotification('success', 'Próximamente disponible la integración de Inespay.')}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#009688] hover:underline cursor-pointer"
                    >
                      <span>Más información</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: RESERVAS & POLÍTICAS                               */}
          {/* ========================================================= */}
          {activeTab === 'reservas' && (
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-[#101828]">Condiciones y Depósitos de Reserva</h3>
              <p className="text-xs text-[#667085]">Define el porcentaje inicial de reserva y los plazos de pago para los clientes.</p>

              <div className="max-w-xl space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    Depósito inicial exigido (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">Porcentaje que debe abonar el cliente al confirmar el viaje.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    Plazo de pago restante (días antes del viaje)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={dueDaysBeforeTrip}
                    onChange={(e) => setDueDaysBeforeTrip(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">Fecha límite para abonar el saldo pendiente antes de la salida.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                  >
                    Guardar condiciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: LEGAL & PRIVACIDAD                                 */}
          {/* ========================================================= */}
          {activeTab === 'legal' && (
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-[#101828]">Información Legal de la Agencia</h3>
              <p className="text-xs text-[#667085]">Aparecerá en el pie de página de las propuestas, contratos y dossiers entregados a viajeros.</p>

              <div className="max-w-xl space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    NIF / CIF de la agencia
                  </label>
                  <input
                    type="text"
                    value={agencyCif}
                    onChange={(e) => setAgencyCif(e.target.value)}
                    placeholder="ej. B-12345678"
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">
                    Texto de Términos y Condiciones Generales
                  </label>
                  <textarea
                    rows={4}
                    value={termsText}
                    onChange={(e) => setTermsText(e.target.value)}
                    placeholder="Incluye aquí la política de cancelaciones, coberturas de seguro, derechos de desistimiento y garantías legales."
                    className="w-full rounded-xl border border-[#d0d5dd] p-3 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveProfile()}
                    className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                  >
                    Guardar datos legales
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: VIAJES, IDIOMA & FORMATOS (Restored Full Options)  */}
          {/* ========================================================= */}
          {activeTab === 'viajes' && (
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-8 divide-y divide-[#f2f4f7]">
              {/* 1. Idioma y Región */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Idioma y región</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Configura el idioma principal y la zona horaria para tus itinerarios.
                  </p>
                </div>

                <div className="md:col-span-2 max-w-md space-y-4">
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                      Idioma
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    >
                      <option value="Español">Español</option>
                      <option value="English">English</option>
                      <option value="Français">Français</option>
                      <option value="Deutsch">Deutsch</option>
                      <option value="Italiano">Italiano</option>
                      <option value="Português">Português</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                      Zona horaria
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    >
                      <option value="Europe/Madrid">Europe/Madrid (GMT+1 / GMT+2)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">America/New_York (EST / EDT)</option>
                      <option value="America/Bogota">America/Bogota (COT)</option>
                      <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                      <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (ART)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Fecha y Hora */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Fecha y hora</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Personaliza cómo se muestran los calendarios, días y horas en las rutas.
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
                          className="text-[#009688] focus:ring-[#009688]"
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
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>Lunes</span>
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
                          value="dd/mm/yyyy"
                          checked={dateFormat === 'dd/mm/yyyy'}
                          onChange={() => setDateFormat('dd/mm/yyyy')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>dd/mm/yyyy (24/10/2026)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="dateFormat"
                          value="mm/dd/yyyy"
                          checked={dateFormat === 'mm/dd/yyyy'}
                          onChange={() => setDateFormat('mm/dd/yyyy')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>mm/dd/yyyy (10/24/2026)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="dateFormat"
                          value="yyyy/mm/dd"
                          checked={dateFormat === 'yyyy/mm/dd'}
                          onChange={() => setDateFormat('yyyy/mm/dd')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>yyyy/mm/dd (2026/10/24)</span>
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
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>24 horas (18:30)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="timeFormat"
                          value="12h"
                          checked={timeFormat === '12h'}
                          onChange={() => setTimeFormat('12h')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>12 horas (6:30 PM)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Divisa y Números */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Divisa y números</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Personaliza cómo se muestran los precios, decimales y símbolos monetarios.
                  </p>
                </div>

                <div className="md:col-span-2 max-w-md space-y-6">
                  {/* Decimales */}
                  <div>
                    <p className="text-xs font-bold text-[#344054] mb-2">Separador de decimales</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="decimals"
                          value="coma"
                          checked={decimals === 'coma'}
                          onChange={() => setDecimals('coma')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>Coma (1.250,50)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="decimals"
                          value="punto"
                          checked={decimals === 'punto'}
                          onChange={() => setDecimals('punto')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>Punto (1,250.50)</span>
                      </label>
                    </div>
                  </div>

                  {/* Posición símbolo */}
                  <div>
                    <p className="text-xs font-bold text-[#344054] mb-2">Posición del símbolo de divisa</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="currencyPosition"
                          value="inicio"
                          checked={currencyPosition === 'inicio'}
                          onChange={() => setCurrencyPosition('inicio')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>Inicio (ej. € 100)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-[#344054] cursor-pointer">
                        <input
                          type="radio"
                          name="currencyPosition"
                          value="fin"
                          checked={currencyPosition === 'fin'}
                          onChange={() => setCurrencyPosition('fin')}
                          className="text-[#009688] focus:ring-[#009688]"
                        />
                        <span>Fin (ej. 100 €)</span>
                      </label>
                    </div>
                  </div>

                  {/* Selector Moneda */}
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                      Moneda por defecto
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    >
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="USD">USD ($) - Dólar estadounidense</option>
                      <option value="GBP">GBP (£) - Libra esterlina</option>
                      <option value="MXN">MXN ($) - Peso mexicano</option>
                      <option value="COP">COP ($) - Peso colombiano</option>
                      <option value="ARS">ARS ($) - Peso argentino</option>
                      <option value="CLP">CLP ($) - Peso chileno</option>
                      <option value="BRL">BRL (R$) - Real brasileño</option>
                      <option value="CHF">CHF (CHF) - Franco suizo</option>
                    </select>
                  </div>

                  {/* Dynamic Formatted Live Sample */}
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-semibold text-[#667085]">
                      Vista previa de formato
                    </label>
                    <input
                      type="text"
                      disabled
                      value={getFormattedExample()}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-[#f9fafb] px-3.5 py-3 text-sm font-mono font-bold text-right text-[#101828] cursor-default"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Notificaciones y Alertas de Viaje */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Alertas y notificaciones</h3>
                  <p className="text-xs text-[#667085] mt-1">
                    Controla qué notificaciones automáticas se generan para tus viajes.
                  </p>
                </div>

                <div className="md:col-span-2 max-w-md space-y-3">
                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Nuevos viajes e itinerarios</p>
                      <p className="text-[11px] text-[#667085]">Avisos al crear, importar o duplicar un viaje.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifNewTrips}
                      onChange={(e) => setNotifNewTrips(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Vouchers y documentos</p>
                      <p className="text-[11px] text-[#667085]">Confirmaciones al generar PDFs y bonos de reserva.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifVouchers}
                      onChange={(e) => setNotifVouchers(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Recordatorios automáticos para viajeros</p>
                      <p className="text-[11px] text-[#667085]">Envío de cuenta atrás e instrucciones previas a la salida.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifClientReminders}
                      onChange={(e) => setNotifClientReminders(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Resumen semanal de actividad</p>
                      <p className="text-[11px] text-[#667085]">Informe periódico con métricas y visualizaciones.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWeeklySummary}
                      onChange={(e) => setNotifWeeklySummary(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-[#eaecf0] p-3.5 hover:bg-[#f9fafb] transition cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-[#101828]">Alertas de seguridad</p>
                      <p className="text-[11px] text-[#667085]">Avisos sobre inicios de sesión y modificaciones críticas.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSecurityAlerts}
                      onChange={(e) => setNotifSecurityAlerts(e.target.checked)}
                      className="rounded border-[#d0d5dd] text-[#009688] focus:ring-[#009688]"
                    />
                  </label>
                </div>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveProfile()}
                  className="rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal (Image 1) */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatar}
        userName={name}
        onSelectAvatar={handleSelectAvatar}
      />

      {/* Stripe Advanced Config Modal (Keys, Test Mode, Webhook) */}
      <StripeConfigModal
        isOpen={isStripeConfigModalOpen}
        onClose={() => setIsStripeConfigModalOpen(false)}
        config={paymentProviders.stripe}
        onSave={handleSaveStripeConfig}
        onDisconnect={handleDisconnectStripe}
      />

      {/* Redsys Config Modal (FUC, Terminal, SHA-256 Key, Webhook) */}
      <RedsysConfigModal
        isOpen={isRedsysModalOpen}
        onClose={() => setIsRedsysModalOpen(false)}
        config={paymentProviders.redsys}
        onSave={handleSaveRedsysConfig}
        onDisconnect={handleDisconnectRedsys}
      />

      {/* Global Styled Confirmation Modal (Replaces browser confirm) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant || 'danger'}
      />
    </DashboardShell>
  );
}

export default function MiCuentaConfiguracionPage() {
  return (
    <React.Suspense fallback={<WanderlustLoader />}>
      <MiCuentaConfiguracionContent />
    </React.Suspense>
  );
}
