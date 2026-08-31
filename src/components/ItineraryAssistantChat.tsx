'use client';

import { FormEvent, useState } from 'react';
import { Bot, Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/context/TravelContext';

type Proposal = {
  date: string;
  time: string;
  title: string;
  description: string;
  duration: string;
  price: number;
};
type Message = { role: 'user' | 'assistant'; text: string };

export function ItineraryAssistantChat({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `¡Hola! Soy tu asistente de viaje para ${trip.name}. Puedes pedirme recomendaciones, rutas o que planifique un día completo.`,
    },
  ]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setLoading(true);
    setError(null);
    setProposals([]);
    setSelected([]);
    setMessages((current) => [...current, { role: 'user', text: question }]);
    try {
      const response = await fetch('/api/assistant/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, message: question }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'El asistente no ha podido responder');
      const next = Array.isArray(data.proposals)
        ? (data.proposals as Proposal[])
        : [];
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: data.message || 'He preparado una respuesta.' },
      ]);
      setProposals(next);
      setSelected(next.map((_: Proposal, index: number) => index));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo contactar con el asistente'
      );
    } finally {
      setLoading(false);
    }
  };

  const addSelected = async () => {
    const activities = proposals.filter((_, index) => selected.includes(index));
    if (!activities.length) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}/activities/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: activities.map((item) => ({ ...item, type: 'excursion' })),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'No se pudieron añadir las actividades');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: `${activities.length} ${
            activities.length === 1 ? 'actividad añadida' : 'actividades añadidas'
          } al itinerario.`,
        },
      ]);
      setProposals([]);
      setSelected([]);
      window.location.reload();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudieron añadir las actividades'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating HeroUI Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar asistente de viaje' : 'Abrir asistente de viaje'}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#009688] text-white shadow-xl shadow-teal-500/30 transition-all hover:scale-105 hover:bg-[#00796b] active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 text-white" />}
      </button>

      {/* Floating Assistant Drawer Panel */}
      {open && (
        <section className="fixed bottom-24 right-4 z-40 flex h-[min(640px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-2xl sm:right-6">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-teal-900 bg-zinc-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009688]/20 text-[#26a69a]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Asistente de Itinerario</h2>
                <p className="text-[10px] font-medium uppercase tracking-wider text-teal-300">
                  Propuestas inteligentes
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Messages Body */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-[#009688] text-white shadow-sm'
                    : 'border border-zinc-200/80 bg-white text-zinc-800 shadow-xs'
                }`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-500 shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-700" />
                <span>Generando sugerencias…</span>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            {/* Proposals Preview Box */}
            {proposals.length > 0 && (
              <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Propuestas para revisar
                </p>
                <div className="space-y-2">
                  {proposals.map((proposal, index) => (
                    <label
                      key={`${proposal.date}-${proposal.time}-${index}`}
                      className="flex cursor-pointer gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-colors hover:bg-zinc-100/60"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(index)}
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(index)
                              ? current.filter((item) => item !== index)
                              : [...current, index]
                          )
                        }
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
                      />
                      <div className="flex-1">
                        <strong className="block text-xs font-bold text-zinc-900">
                          {proposal.time} · {proposal.title}
                        </strong>
                        <span className="mt-0.5 block text-[11px] font-semibold text-zinc-500">
                          {proposal.date} · {proposal.duration}
                          {proposal.price > 0 ? ` · ${proposal.price} €` : ''}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-600">
                          {proposal.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void addSelected()}
                  disabled={saving || selected.length === 0}
                  className="wanderlust-primary-button mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Añadir seleccionadas al itinerario</span>
                </button>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={ask} className="flex gap-2 border-t border-zinc-100 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ej. Planifica el día 3 con visitas culturales…"
              className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
              disabled={loading || saving}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || saving}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
