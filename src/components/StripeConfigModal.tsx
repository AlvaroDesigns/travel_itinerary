'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, AlertCircle, Copy, CheckCheck, Loader2, HelpCircle, ArrowUpRight, Trash2, Key, Zap } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';

export interface StripeConfigData {
  status: 'connected' | 'in_progress' | 'not_connected';
  connected: boolean;
  email?: string;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
}

interface StripeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StripeConfigData;
  onSave: (config: StripeConfigData) => void;
  onDisconnect: () => void;
}

export function StripeConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  onDisconnect,
}: StripeConfigModalProps) {
  const [email, setEmail] = useState(config.email || '');
  const [publishableKey, setPublishableKey] = useState(config.publishableKey || '');
  const [secretKey, setSecretKey] = useState(config.secretKey || '');
  const [webhookSecret, setWebhookSecret] = useState(config.webhookSecret || '');
  const [testMode, setTestMode] = useState<boolean>(config.testMode ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);

  useEffect(() => {
    setEmail(config.email || '');
    setPublishableKey(config.publishableKey || '');
    setSecretKey(config.secretKey || '');
    setWebhookSecret(config.webhookSecret || '');
    setTestMode(config.testMode ?? true);
    setTestResult(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/payments/stripe/webhook`
    : 'https://moguplatform.com/api/payments/stripe/webhook';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleConnectStripeLive = async () => {
    setIsConnectingLive(true);
    try {
      const res = await fetch('/api/payments/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar con Stripe');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setTestResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al conectar con Stripe',
      });
      setIsConnectingLive(false);
    }
  };

  const handleTestConnection = async () => {
    if (!secretKey.trim()) {
      setTestResult({
        type: 'error',
        message: 'Introduce tu Clave Secreta (sk_test_... o sk_live_...) para verificar la conexión.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/payments/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al verificar con Stripe');

      setTestResult({
        type: 'success',
        message: `¡Conexión verificada con éxito con la API oficial de Stripe! (Modo: ${data.livemode ? '⚡ Producción' : '🧪 Pruebas'})`,
      });
    } catch (err) {
      setTestResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'No se pudo conectar con Stripe',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      status: 'connected',
      connected: true,
      email: email.trim(),
      publishableKey: publishableKey.trim(),
      secretKey: secretKey.trim(),
      webhookSecret: webhookSecret.trim(),
      testMode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-scale-in z-10 max-h-[90vh] overflow-y-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#009688]">
              <span className="font-black text-xl tracking-tight">S</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#101828]">Configuración de Stripe</h3>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase text-[#009688] border border-teal-200/60">
                  Stripe Payments
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Acepta pagos con tarjeta de crédito/débito, Apple Pay, Google Pay y Bizum.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Wizard Quick Connect Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-[#009688]/20 bg-teal-50/50 p-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#101828]">Conectar cuenta con Stripe Connect</p>
            <p className="text-[11px] text-zinc-600">Onboarding oficial alojado en los servidores de Stripe.</p>
          </div>
          <button
            type="button"
            disabled={isConnectingLive}
            onClick={handleConnectStripeLive}
            className="rounded-xl bg-[#009688] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isConnectingLive && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Ir a Stripe oficial</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Environment Selector */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">Modo de Operación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTestMode(true)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold transition cursor-pointer ${
                  testMode
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>🧪 Modo Pruebas (Test Mode)</span>
              </button>
              <button
                type="button"
                onClick={() => setTestMode(false)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-semibold transition cursor-pointer ${
                  !testMode
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>⚡ Modo Producción (Cobros Reales)</span>
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block font-bold text-zinc-700">Email de la cuenta Stripe *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-email@agencia.com"
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
            />
          </div>

          {/* API Keys */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Clave pública (Publishable Key)</label>
                <span className="text-[10px] text-zinc-400">pk_test_... o pk_live_...</span>
              </div>
              <input
                type="text"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder={testMode ? 'pk_test_51...' : 'pk_live_51...'}
                className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Clave secreta (Secret Key)</label>
                <span className="text-[10px] text-zinc-400">sk_test_... o sk_live_...</span>
              </div>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={testMode ? 'sk_test_51...' : 'sk_live_51...'}
                className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700">Clave secreta de Webhook (Signing Secret)</label>
                <span className="text-[10px] text-zinc-400">whsec_... (Opcional)</span>
              </div>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="w-full rounded-xl border border-zinc-300 p-2.5 font-mono text-xs text-zinc-900 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
              />
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div>
            <label className="mb-1 block font-bold text-zinc-700">
              Endpoint de Webhooks para Stripe
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] text-zinc-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer shrink-0"
              >
                {copiedUrl ? (
                  <>
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-zinc-400">
              Configura este endpoint en tu Stripe Dashboard con los eventos `checkout.session.completed` y `payment_intent.succeeded`.
            </p>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div
              className={`flex items-center gap-2.5 rounded-xl p-3 text-xs font-semibold ${
                testResult.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {testResult.type === 'success' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{testResult.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{testResult.message}</span>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <div>
              {config.connected && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDisconnectOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Desconectar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !email.trim()}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
              >
                {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Probar conexión</span>
              </button>

              <button
                type="submit"
                disabled={!email.trim()}
                className="rounded-xl bg-[#009688] px-5 py-2 font-bold text-white shadow-xs hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDisconnectOpen}
        onClose={() => setIsConfirmDisconnectOpen(false)}
        onConfirm={() => {
          onDisconnect();
          onClose();
        }}
        title="Desconectar cuenta de Stripe"
        message="¿Estás seguro de que deseas desconectar tu cuenta de Stripe? Los cobros automáticos de reservas quedarán pausados hasta que vuelvas a vincular una cuenta."
        confirmText="Desconectar cuenta"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
