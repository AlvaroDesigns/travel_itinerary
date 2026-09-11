'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Calendar, CalendarClock, Clock3, Mail, Save, Send, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PublicAccessSettings } from '@/components/PublicAccessSettings';
import { SettingsSwitch } from '@/components/SettingsSwitch';
import type { NotificationSettings } from '@/lib/notification-settings';

interface TripNotificationSettingsProps {
  tripId: string;
}

const inputClassName = 'mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/15 disabled:cursor-not-allowed disabled:opacity-60';

export function TripNotificationSettings({ tripId }: TripNotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingType, setSendingType] = useState<'countdown' | 'instructions' | 'itinerary' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string; testType?: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      setIsLoading(true);
      setFeedback(null);
      try {
        const response = await fetch(`/api/trips/${tripId}/notification-settings`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar la configuración');
        setSettings(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar la configuración' });
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadSettings();
    return () => controller.abort();
  }, [tripId]);

  const updateSettings = (changes: Partial<NotificationSettings>) => {
    setSettings((current) => {
      if (!current) return current;
      return { ...current, ...changes };
    });
    setFeedback(null);
    setIsSaved(false);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la configuración');
      setSettings(data);
      setIsSaved(true);
      setFeedback({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar la configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async (testType: 'countdown' | 'instructions' | 'itinerary') => {
    if (!settings) return;

    setSendingType(testType);
    setFeedback(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/notification-settings/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: settings.recipientEmail,
          bccEmails: settings.bccEmails,
          testType,
          instructionsText: settings.instructionsText,
          reminderIntervalDays: settings.reminderIntervalDays,
          countdownMode: settings.countdownMode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar el email de prueba');
      const labels = { countdown: 'cuenta atrás', instructions: 'instrucciones', itinerary: 'acceso al itinerario' };
      const hiddenCopies = Math.max(0, Number(data.recipientCount ?? 1) - 1);
      setFeedback({
        type: 'success',
        testType,
        text: `Prueba de ${labels[testType]} enviada correctamente a ${settings.recipientEmail}${hiddenCopies > 0 ? ` (+${hiddenCopies} CCO)` : ''}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        testType,
        text: error instanceof Error ? error.message : 'No se pudo enviar el email de prueba',
      });
    } finally {
      setSendingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-200/80 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-zinc-200" />
                  <div className="h-3 w-48 rounded bg-zinc-100" />
                </div>
              </div>
              <div className="h-6 w-12 rounded-full bg-zinc-200" />
            </div>
            <div className="h-10 w-full rounded-xl bg-zinc-50 border border-zinc-200/60" />
          </div>
        ))}
      </div>
    );
  }

  if (!settings) {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-medium text-red-700">No se ha podido cargar la configuración.</div>;
  }

  const dependentClassName = settings.reminderEnabled ? '' : 'opacity-55';

  return (
    <section className="space-y-6">
      {/* Top Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{feedback.text}</p>
            {feedback.type === 'success' && (
              <p className="mt-1 text-xs text-emerald-700">
                Los correos se envían desde <strong>viajes@travel.alvarodesigns.com</strong>. Si no lo ves en la bandeja de entrada, revisa la carpeta de <strong>Spam o Correo no deseado</strong>.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#009688]"><Bell className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Avisos del viaje</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">Programa recordatorios, las instrucciones previas y el enlace al itinerario para este viaje.</p>
            </div>
          </div>
          <SettingsSwitch
            label="Activar avisos"
            checked={settings.reminderEnabled}
            onCheckedChange={(reminderEnabled) => updateSettings({ reminderEnabled })}
          />
        </div>

        <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="notification-recipient">Email destinatario</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[1.35rem] h-4 w-4 text-zinc-400" />
              <input
                id="notification-recipient"
                type="email"
                className={`${inputClassName} pl-9`}
                value={settings.recipientEmail}
                onChange={(event) => updateSettings({ recipientEmail: event.target.value })}
                placeholder="persona@ejemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="notification-bcc">CCO (copia oculta)</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[1.35rem] h-4 w-4 text-zinc-400" />
              <input
                id="notification-bcc"
                type="text"
                inputMode="email"
                className={`${inputClassName} pl-9`}
                value={settings.bccEmails.join(', ')}
                onChange={(event) => updateSettings({ bccEmails: event.target.value.split(/[,;\n]/).map((email) => email.trim()).filter(Boolean) })}
                placeholder="acompanante@ejemplo.com"
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Opcional. Separa varias direcciones con comas; recibirán el correo sin ver a los demás destinatarios.</p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs ${dependentClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00796b]"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Cuenta atrás del viaje</h3>
              <p className="mt-1 text-sm text-zinc-500">Envía un email cada cierto número de días mientras se acerca la salida.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={sendingType !== null || !settings.recipientEmail}
            onClick={() => sendTestEmail('countdown')}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#00796b] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {sendingType === 'countdown' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Enviando…</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Enviar prueba</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Frecuencia de envío
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: 'Diario', days: 1, desc: 'Cada día' },
                { label: 'Día sí, día no', days: 2, desc: 'Cada 2 días' },
                { label: 'Cada 3 días', days: 3, desc: 'Cada 3 días' },
                { label: 'Semanal', days: 7, desc: '1 vez por semana' },
                { label: 'Quincenal', days: 14, desc: 'Cada 2 semanas' },
                { label: 'Personalizado', days: null, desc: 'Días a medida' },
              ].map((preset) => {
                const isPresetActive =
                  preset.days === null
                    ? ![1, 2, 3, 7, 14].includes(settings.reminderIntervalDays)
                    : settings.reminderIntervalDays === preset.days;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={!settings.reminderEnabled}
                    onClick={() => {
                      if (preset.days !== null) {
                        updateSettings({ reminderIntervalDays: preset.days });
                      } else if ([1, 2, 3, 7, 14].includes(settings.reminderIntervalDays)) {
                        updateSettings({ reminderIntervalDays: 5 });
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed ${
                      isPresetActive
                        ? 'bg-[#009688] text-white shadow-xs font-bold ring-2 ring-[#009688]/20'
                        : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={`text-[11px] ${isPresetActive ? 'text-teal-100 font-normal' : 'text-zinc-400 font-normal'}`}>
                      · {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pt-1">
            <div className="flex flex-wrap items-end gap-4 sm:gap-5">
              {![1, 2, 3, 7, 14].includes(settings.reminderIntervalDays) && (
                <div className="w-full sm:w-36 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="reminder-days">
                    Días exactos
                  </label>
                  <input
                    id="reminder-days"
                    type="number"
                    min="1"
                    max="365"
                    disabled={!settings.reminderEnabled}
                    className={inputClassName}
                    value={settings.reminderIntervalDays}
                    onChange={(event) => {
                      const val = Math.max(1, Math.min(365, Number(event.target.value) || 1));
                      updateSettings({ reminderIntervalDays: val });
                    }}
                  />
                </div>
              )}

              <div className="w-full sm:w-36">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="reminder-time">
                  Hora de envío
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  disabled={!settings.reminderEnabled}
                  className={inputClassName}
                  value={settings.reminderTime || '09:00'}
                  onChange={(event) => updateSettings({ reminderTime: event.target.value })}
                />
              </div>
            </div>

            <div className="w-full sm:w-60 sm:ml-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tipo de cuenta atrás
              </p>
              <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm font-semibold">
                <button
                  type="button"
                  disabled={!settings.reminderEnabled}
                  onClick={() => updateSettings({ countdownMode: 'exact' })}
                  className={`rounded-lg px-3 py-2 transition cursor-pointer disabled:cursor-not-allowed ${
                    settings.countdownMode === 'exact'
                      ? 'bg-white text-[#00796b] shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Real
                </button>
                <button
                  type="button"
                  disabled={!settings.reminderEnabled}
                  onClick={() => updateSettings({ countdownMode: 'surprise' })}
                  className={`rounded-lg px-3 py-2 transition cursor-pointer disabled:cursor-not-allowed ${
                    settings.countdownMode === 'surprise'
                      ? 'bg-white text-[#00796b] shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Sorpresa
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-xl bg-teal-50/80 p-3 text-xs leading-relaxed text-[#004d40]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#009688]" />
          {settings.countdownMode === 'exact'
            ? `El email indicará cuántos días faltan para empezar el viaje (se enviará cada ${settings.reminderIntervalDays === 1 ? 'día' : `${settings.reminderIntervalDays} días`}).`
            : 'El email no revelará la fecha exacta y mostrará un mensaje genérico para mantener la sorpresa.'}
        </div>
      </div>

      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs ${dependentClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00796b]"><Clock3 className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Instrucciones 24 horas antes</h3>
              <p className="mt-1 text-sm text-zinc-500">Manda un recordatorio con las indicaciones que escribas durante las 24 horas previas.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              disabled={sendingType !== null || !settings.recipientEmail}
              onClick={() => sendTestEmail('instructions')}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#00796b] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {sendingType === 'instructions' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar prueba</span>
                </>
              )}
            </button>
            <SettingsSwitch
              label="Enviar instrucciones"
              disabled={!settings.reminderEnabled}
              checked={settings.instructionsEnabled}
              onCheckedChange={(instructionsEnabled) => updateSettings({ instructionsEnabled })}
            />
          </div>
        </div>
        <textarea disabled={!settings.reminderEnabled || !settings.instructionsEnabled} className="mt-5 min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-700 outline-none transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/15 disabled:cursor-not-allowed" value={settings.instructionsText} onChange={(event) => updateSettings({ instructionsText: event.target.value })} maxLength={5000} placeholder="Ej.: prepara el equipaje, lleva tu documentación y acude al punto de encuentro a las 08:30." />
      </div>

      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs ${dependentClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#009688]"><Mail className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Acceso al itinerario</h3>
              <p className="mt-1 text-sm text-zinc-500">Envía un email final con una invitación y el enlace directo al itinerario.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              disabled={sendingType !== null || !settings.recipientEmail}
              onClick={() => sendTestEmail('itinerary')}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#00796b] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {sendingType === 'itinerary' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar prueba</span>
                </>
              )}
            </button>
            <SettingsSwitch
              label="Enviar acceso"
              disabled={!settings.reminderEnabled}
              checked={settings.itineraryAccessEnabled}
              onCheckedChange={(itineraryAccessEnabled) => updateSettings({ itineraryAccessEnabled })}
            />
          </div>
        </div>
        <div className="mt-5 max-w-xs">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="access-hours">Horas antes de la salida</label>
          <input id="access-hours" type="number" min="1" max="720" disabled={!settings.reminderEnabled || !settings.itineraryAccessEnabled} className={inputClassName} value={settings.itineraryAccessHours} onChange={(event) => updateSettings({ itineraryAccessHours: Number(event.target.value) })} />
        </div>
      </div>

      <PublicAccessSettings settings={settings} onChange={updateSettings} />

      {feedback && (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.text}
        </p>
      )}
      <div className="flex justify-end">
        <button type="button" disabled={isSaving} onClick={saveSettings} className="wanderlust-primary-button inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-70">
          <Save className="h-4 w-4" />{isSaving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </section>
  );
}
