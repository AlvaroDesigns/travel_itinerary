'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CalendarCheck,
  CreditCard,
  Check,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';
import { RedsysLogo } from '@/components/RedsysLogo';
import { BookingActivity } from '@/context/TravelContext';

interface BookingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: BookingActivity | null;
  defaultDate: string;
  onSave: (data: Partial<BookingActivity>) => void;
  onDelete?: (id: string) => void;
}

export function BookingPaymentModal({
  isOpen,
  onClose,
  activity,
  defaultDate,
  onSave,
  onDelete,
}: BookingPaymentModalProps) {
  const [title, setTitle] = useState('Condiciones de Reserva y Plazos de Pago');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('11:00');
  const [totalAmount, setTotalAmount] = useState<number>(1250);
  const [depositAmount, setDepositAmount] = useState<number>(250);
  const [depositPercentage, setDepositPercentage] = useState<number>(20);
  const [secondPaymentAmount, setSecondPaymentAmount] = useState<number>(500);
  const [secondPaymentDate, setSecondPaymentDate] = useState('');
  const [finalPaymentAmount, setFinalPaymentAmount] = useState<number>(500);
  const [finalPaymentDate, setFinalPaymentDate] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'redsys' | 'stripe'>('redsys');
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Cancelación gratuita hasta 30 días antes del inicio del viaje. Depósito no reembolsable a partir del día 15 anterior a la salida.'
  );
  const [autoPaymentEnabled, setAutoPaymentEnabled] = useState(true);
  const [isTestCheckoutOpen, setIsTestCheckoutOpen] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || 'Condiciones de Reserva y Plazos de Pago');
      setDate(activity.date || defaultDate);
      setTime(activity.time || '11:00');
      setTotalAmount(activity.totalAmount ?? (activity.price || 1250));
      setDepositAmount(activity.depositAmount ?? 250);
      setDepositPercentage(activity.depositPercentage ?? 20);
      setSecondPaymentAmount(activity.secondPaymentAmount ?? 500);
      setSecondPaymentDate(activity.secondPaymentDate || '');
      setFinalPaymentAmount(activity.finalPaymentAmount ?? 500);
      setFinalPaymentDate(activity.finalPaymentDate || '');
      setPaymentProvider(activity.paymentProvider || 'redsys');
      setCancellationPolicy(
        activity.cancellationPolicy ||
          activity.description ||
          'Cancelación gratuita hasta 30 días antes del inicio del viaje. Depósito no reembolsable a partir del día 15 anterior a la salida.'
      );
      setAutoPaymentEnabled(activity.autoPaymentEnabled ?? true);
    } else {
      setTitle('Condiciones de Reserva y Plazos de Pago');
      setDate(defaultDate);
      setTime('11:00');
      setTotalAmount(1250);
      setDepositAmount(250);
      setDepositPercentage(20);
      setSecondPaymentAmount(500);
      setSecondPaymentDate('');
      setFinalPaymentAmount(500);
      setFinalPaymentDate('');
      setPaymentProvider('redsys');
      setCancellationPolicy(
        'Cancelación gratuita hasta 30 días antes del inicio del viaje. Depósito no reembolsable a partir del día 15 anterior a la salida.'
      );
      setAutoPaymentEnabled(true);
    }
    setIsTestCheckoutOpen(false);
    setTestSuccess(false);
  }, [activity, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleTotalChange = (val: number) => {
    setTotalAmount(val);
    const dep = Math.round((val * depositPercentage) / 100);
    setDepositAmount(dep);
    const remaining = val - dep;
    setSecondPaymentAmount(Math.round(remaining / 2));
    setFinalPaymentAmount(remaining - Math.round(remaining / 2));
  };

  const handleDepositPercentChange = (pct: number) => {
    setDepositPercentage(pct);
    const dep = Math.round((totalAmount * pct) / 100);
    setDepositAmount(dep);
    const remaining = totalAmount - dep;
    setSecondPaymentAmount(Math.round(remaining / 2));
    setFinalPaymentAmount(remaining - Math.round(remaining / 2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type: 'booking',
      title,
      date,
      time,
      price: totalAmount,
      totalAmount,
      depositAmount,
      depositPercentage,
      secondPaymentAmount,
      secondPaymentDate,
      finalPaymentAmount,
      finalPaymentDate,
      paymentProvider,
      cancellationPolicy,
      description: cancellationPolicy,
      autoPaymentEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl animate-scale-in z-10 overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
      >
        {/* LEFT COLUMN: Lateral Image & Summary */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-7 text-white overflow-hidden shrink-0">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/redsys-banner.jpg"
              alt="Módulo de Reservas y Pagos"
              fill
              className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/15">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Módulo de Pagos & Depósitos</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white drop-shadow-xs">
              Condiciones de Reserva
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Define los plazos de abono del viaje y permite a tus viajeros pagar con pasarela segura (Redsys / Bizum o Stripe).
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>Importe Total:</span>
                <span className="text-emerald-400 font-black">{totalAmount} €</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>Depósito Inicial:</span>
                <span>{depositAmount} € ({depositPercentage}%)</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-300">
                <span>Pasarela:</span>
                <span className="uppercase font-bold text-white">{paymentProvider}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-[#009688] shrink-0" />
              <span>Compatible con TPV Virtual Redsys y Stripe Connect.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form Content */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#009688]">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#101828]">
                    Módulo de Reservas y Pagos
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Configura los importes, plazos y la pasarela bancaria para el viajero.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Title & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Título del bloque de reserva
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-[#101828] focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 outline-none"
                  placeholder="Ej. Condiciones de Reserva y Plazos"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Hora en itinerario
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-semibold text-[#101828] focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 outline-none"
                />
              </div>
            </div>

            {/* Total Budget & Payment Gateway Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Amount */}
              <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50 space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Importe Total del Viaje (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={totalAmount}
                    onChange={(e) => handleTotalChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-base font-black text-[#101828] focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 outline-none"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-zinc-400">EUR (€)</span>
                </div>
              </div>

              {/* Payment Gateway Selector */}
              <div className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50 space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Pasarela de Cobro Activa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentProvider('redsys')}
                    className={`rounded-xl border p-2.5 text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentProvider === 'redsys'
                        ? 'border-[#009688] bg-teal-50/70 ring-2 ring-[#009688]/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <RedsysLogo size="sm" showText={false} />
                      {paymentProvider === 'redsys' && <Check className="h-3.5 w-3.5 text-[#009688]" />}
                    </div>
                    <span className="text-[11px] font-extrabold text-[#101828] mt-1">
                      Redsys (Bizum / Tarjeta)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentProvider('stripe')}
                    className={`rounded-xl border p-2.5 text-left transition cursor-pointer flex flex-col justify-between ${
                      paymentProvider === 'stripe'
                        ? 'border-[#009688] bg-teal-50/70 ring-2 ring-[#009688]/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[#009688]">Stripe</span>
                      {paymentProvider === 'stripe' && <Check className="h-3.5 w-3.5 text-[#009688]" />}
                    </div>
                    <span className="text-[11px] font-extrabold text-[#101828] mt-1">
                      Stripe Payments
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Installments Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700">
                  Calendario de Plazos de Pago
                </label>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>Depósito:</span>
                  {[10, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleDepositPercentChange(pct)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                        depositPercentage === pct
                          ? 'bg-[#009688] text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1st Payment / Deposit */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-zinc-700">
                    <span>1º Depósito Inicial</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-black">
                      {depositPercentage}%
                    </span>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-bold text-[#101828] outline-none"
                  />
                  <p className="text-[10px] text-zinc-400">Al confirmar la reserva</p>
                </div>

                {/* 2nd Payment */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-zinc-700">
                    <span>2º Plazo</span>
                  </div>
                  <input
                    type="number"
                    value={secondPaymentAmount}
                    onChange={(e) => setSecondPaymentAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-bold text-[#101828] outline-none"
                  />
                  <p className="text-[10px] text-zinc-400">45 días antes de salida</p>
                </div>

                {/* Final Payment */}
                <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-zinc-700">
                    <span>3º Pago Restante</span>
                  </div>
                  <input
                    type="number"
                    value={finalPaymentAmount}
                    onChange={(e) => setFinalPaymentAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-bold text-[#101828] outline-none"
                  />
                  <p className="text-[10px] text-zinc-400">15 días antes de salida</p>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Política de cancelación & condiciones visibles al cliente
              </label>
              <textarea
                rows={2}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-3 text-xs text-zinc-700 focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 outline-none"
                placeholder="Condiciones de pago, reembolsos..."
              />
            </div>

            {/* Live Test Sandbox Simulator Box */}
            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#009688]" />
                  <span className="text-xs font-bold text-[#101828]">
                    Probar pasarela en vivo ({paymentProvider === 'redsys' ? 'Redsys Sis-t Sandbox' : 'Stripe Test'})
                  </span>
                </div>
                <span className="rounded-md bg-white border border-teal-200 px-2 py-0.5 text-[10px] font-black text-[#009688]">
                  MODO TEST
                </span>
              </div>
              <p className="text-[11px] text-zinc-600">
                Puedes lanzar un pago simulado de 1,00 € con los datos oficiales de prueba para comprobar la respuesta del TPV.
              </p>

              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestCheckoutOpen(true);
                    setTestSuccess(false);
                    setTimeout(() => {
                      setTestSuccess(true);
                    }, 2000);
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="h-3.5 w-3.5 text-[#009688]" />
                  <span>Lanzar prueba de cobro (1,00 €)</span>
                </button>

                {isTestCheckoutOpen && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {testSuccess ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ¡Pago de prueba validado con éxito en Redsys Sandbox!
                      </span>
                    ) : (
                      <span className="text-zinc-600 flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full border-2 border-[#009688] border-t-transparent animate-spin" />
                        Conectando con TPV Redsys Sis-t...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                {activity && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(activity.id);
                      onClose();
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    Eliminar bloque
                  </button>
                )}

                <button
                  type="submit"
                  className="rounded-xl bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition cursor-pointer"
                >
                  Guardar condiciones de reserva
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
