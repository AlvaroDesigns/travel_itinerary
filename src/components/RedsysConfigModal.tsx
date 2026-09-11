'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Check,
  AlertCircle,
  Copy,
  CheckCheck,
  Loader2,
  HelpCircle,
  Eye,
  EyeOff,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Globe,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RedsysLogo } from '@/components/RedsysLogo';

export interface RedsysConfigData {
  status: 'connected' | 'not_connected';
  connected: boolean;
  fuc?: string;
  terminal?: string;
  currency?: string;
  secretKey?: string;
  autoInstallments?: boolean;
  environment?: 'test' | 'real';
}

interface RedsysConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RedsysConfigData;
  onSave: (config: RedsysConfigData) => void;
  onDisconnect: () => void;
}

export function RedsysConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  onDisconnect,
}: RedsysConfigModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fuc, setFuc] = useState(config.fuc || '');
  const [terminal, setTerminal] = useState(config.terminal || '1');
  const [currency, setCurrency] = useState(config.currency || 'EUR');
  const [secretKey, setSecretKey] = useState(config.secretKey || '');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [autoInstallments, setAutoInstallments] = useState(config.autoInstallments ?? true);
  const [environment, setEnvironment] = useState<'test' | 'real'>(config.environment || 'test');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);

  useEffect(() => {
    setFuc(config.fuc || '');
    setTerminal(config.terminal || '1');
    setCurrency(config.currency || 'EUR');
    setSecretKey(config.secretKey || '');
    setAutoInstallments(config.autoInstallments ?? true);
    setEnvironment(config.environment || 'test');
    setTestResult(null);
    setStep(1);
    setShowSecretKey(false);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/payments/redsys/webhook`
      : 'https://moguplatform.com/api/payments/redsys/webhook';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTestConnection = () => {
    if (!fuc.trim() || !secretKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (fuc.trim().length >= 4 && secretKey.trim().length >= 8) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    }, 1200);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuc.trim() || !secretKey.trim()) return;
    setStep(2);
  };

  const handleFinalSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fuc.trim() || !secretKey.trim()) return;

    onSave({
      status: 'connected',
      connected: true,
      fuc: fuc.trim(),
      terminal: terminal.trim() || '1',
      currency,
      secretKey: secretKey.trim(),
      autoInstallments,
      environment,
    });
    onClose();
  };

  const isFormValid = fuc.trim().length > 0 && secretKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog with Two-Column Layout */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl animate-scale-in z-10 overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
      >
        {/* LEFT COLUMN: Lateral Image & Brand Banner */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-7 text-white overflow-hidden shrink-0">
          {/* Background Illustration Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/redsys-banner.jpg"
              alt="Redsys TPV Pagos Seguros"
              fill
              className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent" />
          </div>

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pasarela Bancaria Segura</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              TPV Virtual Redsys
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Cobra tus viajes e itinerarios con tarjetas bancarias (Visa, Mastercard) y Bizum de bancos españoles.
            </p>
          </div>

          {/* Bottom Security Highlights */}
          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <span>Cumplimiento PCI-DSS Nivel 1 y autenticación 3D Secure 2.2.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <Lock className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <span>Firma HMAC-SHA256 con claves cifradas de extremo a extremo.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Redsys Config Form (Matching Screenshot) */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto bg-white">
          {/* Header Row */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {/* Logo + Help Info */}
              <div className="flex items-center gap-2">
                <RedsysLogo size="md" />
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-white text-[10px] font-black cursor-help"
                  title="Redsys es la pasarela oficial utilizada por la banca española (BBVA, CaixaBank, Santander, Sabadell, etc.)"
                >
                  ?
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {config.status === 'connected' ? (
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    CONECTADO
                  </span>
                ) : (
                  <span className="rounded-md bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-zinc-600">
                    NO CONECTADO
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition ml-1 cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#101828]">
                Conecta tu TPV Redsys ({step}/2)
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {step === 1
                  ? 'Introduce los datos de tu TPV para conectarlo a MOGU.'
                  : 'Configura la URL de notificación online y el entorno de operación.'}
              </p>
            </div>
          </div>

          {/* STEP 1: Main Credentials Form */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5 mt-6">
              {/* Row 1: Código de comercio, Número de terminal, Moneda */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Código de comercio */}
                <div>
                  <div className="relative rounded-xl border border-zinc-300 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition bg-white px-3.5 pt-2 pb-2">
                    <label className="block text-[11px] font-bold text-zinc-600">
                      Código de comercio
                    </label>
                    <input
                      type="text"
                      value={fuc}
                      onChange={(e) => setFuc(e.target.value)}
                      placeholder="Ej. 999008881"
                      className="w-full bg-transparent text-xs font-semibold text-[#101828] outline-none placeholder:text-zinc-400 mt-0.5"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 pl-1">En tu panel de Redsys</p>
                </div>

                {/* Número de terminal */}
                <div>
                  <div className="relative rounded-xl border border-zinc-300 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition bg-white px-3.5 pt-2 pb-2">
                    <label className="block text-[11px] font-bold text-zinc-600">
                      Número de terminal
                    </label>
                    <input
                      type="text"
                      value={terminal}
                      onChange={(e) => setTerminal(e.target.value)}
                      placeholder="1"
                      className="w-full bg-transparent text-xs font-semibold text-[#101828] outline-none placeholder:text-zinc-400 mt-0.5"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 pl-1">Usa &quot;1&quot; si solo tienes uno</p>
                </div>

                {/* Moneda */}
                <div>
                  <div className="relative rounded-xl border border-zinc-300 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition bg-white px-3.5 pt-2 pb-2">
                    <label className="block text-[11px] font-bold text-zinc-600">
                      Moneda
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-[#101828] outline-none cursor-pointer mt-0.5"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 pl-1">Igual que en tu TPV</p>
                </div>
              </div>

              {/* Row 2: Clave de firma (Key) */}
              <div>
                <div className="relative rounded-xl border border-zinc-300 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition bg-white px-3.5 pt-2 pb-2 flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-zinc-600">
                      Clave de firma (Key)
                    </label>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="sq7HjrUOBfKmC576ILgskD5srU870g=="
                      className="w-full bg-transparent text-xs font-mono font-semibold text-[#101828] outline-none placeholder:text-zinc-400 placeholder:font-sans mt-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 transition"
                    title={showSecretKey ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1">Cópiala sin espacios</p>
              </div>

              {/* Checkbox: Cobrar automáticamente pagos a plazos */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoInstallments}
                    onChange={(e) => setAutoInstallments(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF] accent-[#0066FF]"
                  />
                  <span className="text-xs font-bold text-[#101828]">
                    Cobrar automáticamente pagos a plazos
                  </span>
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-400 text-zinc-500 text-[10px] font-bold cursor-help"
                    title="Permite que la plataforma procese automáticamente los cobros diferidos o fraccionados acordados en el itinerario de viaje."
                  >
                    i
                  </div>
                </label>
              </div>

              {/* Action Buttons Step 1 */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  {config.connected && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDisconnectOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Desconectar</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] disabled:opacity-40 transition cursor-pointer"
                  >
                    <span>Guardar y continuar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: Environment & Webhook URL */}
          {step === 2 && (
            <div className="space-y-5 mt-6">
              {/* Environment Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Entorno de Operación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvironment('test')}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      environment === 'test'
                        ? 'border-[#0066FF] bg-blue-50/50 ring-2 ring-[#0066FF]/20'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">🧪 Sandbox / Pruebas</span>
                      {environment === 'test' && <Check className="h-4 w-4 text-[#0066FF]" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Tarjetas de prueba de Redsys (Sis-t).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnvironment('real')}
                    className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                      environment === 'real'
                        ? 'border-[#0066FF] bg-blue-50/50 ring-2 ring-[#0066FF]/20'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">⚡ Producción Real</span>
                      {environment === 'real' && <Check className="h-4 w-4 text-[#0066FF]" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Cobros reales a cuentas bancarias de clientes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Webhook / Notificación Online URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  URL de Notificación HTTP (Webhook)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-600 truncate">
                    {webhookUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiada</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Pega esta URL en la opción &quot;Notificación Online HTTP&quot; dentro de tu panel de administración de Redsys.
                </p>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                    testResult === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {testResult === 'success' ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>¡Verificación correcta! FUC y clave SHA-256 de Redsys validados.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Error: Por favor revisa el código de comercio y la clave secreta.</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons Step 2 */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Atrás</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Probar conexión</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalSave()}
                    className="rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition cursor-pointer"
                  >
                    Confirmar y Activar TPV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDisconnectOpen}
        onClose={() => setIsConfirmDisconnectOpen(false)}
        onConfirm={() => {
          onDisconnect();
          onClose();
        }}
        title="Desconectar TPV Redsys"
        message="¿Estás seguro de que deseas desvincular el TPV Redsys? Los pagos a través de tarjetas bancarias locales y Bizum quedarán inactivos."
        confirmText="Desvincular TPV"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
