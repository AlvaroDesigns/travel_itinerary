'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarClock, Clock3, Mail, Save, Send, Sparkles } from 'lucide-react';
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
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersion = useRef(0);

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

  const persistSettings = async (next: NotificationSettings) => {
    const version = ++saveVersion.current;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la configuración');
      // Ignore stale responses if a newer save was triggered meanwhile.
      if (version !== saveVersion.current) return;
      setSettings(data);
      setFeedback({ type: 'success', text: 'Configuración guardada automáticamente.' });
    } catch (error) {
      if (version !== saveVersion.current) return;
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar la configuración' });
    } finally {
      if (version === saveVersion.current) setIsSaving(false);
    }
  };

  const updateSettings = (changes: Partial<NotificationSettings>) => {
    setSettings((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => { void persistSettings(next); }, 600);
      return next;
    });
    setFeedback(null);
  };

  const saveSettings = async () => {
    if (!settings) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    await persistSettings(settings);
  };

  useEffect(() => () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
  }, []);

  const sendTestEmail = async (testType: 'countdown' | 'instructions' | 'itinerary') => {
    if (!settings) return;

    setIsSendingTest(true);
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
        text: `Prueba de ${labels[testType]} enviada al destinatario principal${hiddenCopies > 0 ? ` y ${hiddenCopies} ${hiddenCopies === 1 ? 'copia oculta' : 'copias ocultas'}` : ''}.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo enviar el email de prueba' });
    } finally {
      setIsSendingTest(false);
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Cuenta atrás del viaje</h3>
              <p className="mt-1 text-sm text-zinc-500">Envía un email cada cierto número de días mientras se acerca la salida.</p>
            </div>
          </div>
          <button type="button" disabled={isSendingTest || !settings.recipientEmail} onClick={() => sendTestEmail('countdown')} className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#00796b] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-3.5 w-3.5" />{isSendingTest ? 'Enviando…' : 'Enviar prueba'}</button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="reminder-days">Frecuencia (días)</label>
            <input id="reminder-days" type="number" min="1" max="365" disabled={!settings.reminderEnabled} className={inputClassName} value={settings.reminderIntervalDays} onChange={(event) => updateSettings({ reminderIntervalDays: Number(event.target.value) })} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tipo de cuenta atrás</p>
            <div className="mt-1.5 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm font-semibold">
              <button type="button" disabled={!settings.reminderEnabled} onClick={() => updateSettings({ countdownMode: 'exact' })} className={`rounded-lg px-3 py-2 transition ${settings.countdownMode === 'exact' ? 'bg-white text-[#00796b] shadow-xs' : 'text-zinc-500'}`}>Real</button>
              <button type="button" disabled={!settings.reminderEnabled} onClick={() => updateSettings({ countdownMode: 'surprise' })} className={`rounded-lg px-3 py-2 transition ${settings.countdownMode === 'surprise' ? 'bg-white text-[#00796b] shadow-xs' : 'text-zinc-500'}`}>Sorpresa</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-xl bg-teal-50/80 p-3 text-xs leading-relaxed text-[#004d40]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#009688]" />
          {settings.countdownMode === 'exact' ? 'El email indicará cuántos días faltan para empezar el viaje.' : 'El email no revelará la fecha exacta y mostrará un mensaje genérico para mantener la sorpresa.'}
        </div>
      </div>

      <div className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs ${dependentClassName}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Clock3 className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Instrucciones 24 horas antes</h3>
              <p className="mt-1 text-sm text-zinc-500">Manda un recordatorio con las indicaciones que escribas durante las 24 horas previas.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" disabled={isSendingTest || !settings.recipientEmail} onClick={() => sendTestEmail('instructions')} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-3.5 w-3.5" />{isSendingTest ? 'Enviando…' : 'Enviar prueba'}</button>
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
            <button type="button" disabled={isSendingTest || !settings.recipientEmail} onClick={() => sendTestEmail('itinerary')} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-[#00796b] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-3.5 w-3.5" />{isSendingTest ? 'Enviando…' : 'Enviar prueba'}</button>
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

      {feedback && <p className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{feedback.text}</p>}
      <div className="flex justify-end">
        <button type="button" disabled={isSaving} onClick={saveSettings} className="wanderlust-primary-button inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-70">
          <Save className="h-4 w-4" />{isSaving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </section>
  );
}
