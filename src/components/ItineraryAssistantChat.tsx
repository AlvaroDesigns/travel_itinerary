'use client';

import { FormEvent, useState } from 'react';
import { Bot, Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/context/TravelContext';

type Proposal = { date: string; time: string; title: string; description: string; duration: string; price: number };
type Message = { role: 'user' | 'assistant'; text: string };

export function ItineraryAssistantChat({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: `Hola, soy tu asistente para ${trip.name}. Puedo responder dudas y proponerte actividades para un día; tú decides qué se añade.` }]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput(''); setLoading(true); setError(null); setProposals([]); setSelected([]);
    setMessages((current) => [...current, { role: 'user', text: question }]);
    try {
      const response = await fetch('/api/assistant/itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: trip.id, message: question }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'El asistente no ha podido responder');
      const next = Array.isArray(data.proposals) ? data.proposals as Proposal[] : [];
      setMessages((current) => [...current, { role: 'assistant', text: data.message || 'He preparado una respuesta.' }]);
      setProposals(next); setSelected(next.map((_: Proposal, index: number) => index));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo contactar con el asistente'); }
    finally { setLoading(false); }
  };

  const addSelected = async () => {
    const activities = proposals.filter((_, index) => selected.includes(index));
    if (!activities.length) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}/activities/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activities: activities.map((item) => ({ ...item, type: 'excursion' })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron añadir las actividades');
      setMessages((current) => [...current, { role: 'assistant', text: `${activities.length} ${activities.length === 1 ? 'actividad añadida' : 'actividades añadidas'} al itinerario.` }]);
      setProposals([]); setSelected([]); window.location.reload();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudieron añadir las actividades'); }
    finally { setSaving(false); }
  };

  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Cerrar asistente de viaje' : 'Abrir asistente de viaje'} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white shadow-xl shadow-black/25 transition hover:scale-105 hover:bg-ink-700 active:scale-95">
      {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
    </button>
    {open && <section className="fixed bottom-22 right-4 z-40 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl sm:right-5">
      <header className="flex items-center gap-3 border-b border-ink-100 bg-ink-900 px-5 py-4 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><Bot className="h-5 w-5" /></div><div><h2 className="text-sm font-bold">Asistente de viaje</h2><p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Propuestas revisables</p></div></header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4">{messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-ink-900 text-white' : 'border border-ink-100 bg-white text-ink-700'}`}>{message.text}</div>)}{loading && <div className="flex w-fit items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3.5 py-2.5 text-xs text-ink-500"><Loader2 className="h-4 w-4 animate-spin" />Pensando…</div>}{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
      {proposals.length > 0 && <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-3"><p className="text-xs font-bold uppercase tracking-wider text-ink-500">Propuestas para revisar</p>{proposals.map((proposal, index) => <label key={`${proposal.date}-${proposal.time}-${index}`} className="flex cursor-pointer gap-3 border-t border-ink-100 py-3 first:border-0 first:pt-0"><input type="checkbox" checked={selected.includes(index)} onChange={() => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className="mt-1" /><span><strong className="block text-sm text-ink-900">{proposal.time} · {proposal.title}</strong><span className="mt-0.5 block text-xs text-ink-500">{proposal.date} · {proposal.duration}{proposal.price > 0 ? ` · ${proposal.price} €` : ''}</span><span className="mt-1 block text-xs text-ink-600">{proposal.description}</span></span></label>)}<button type="button" onClick={() => void addSelected()} disabled={saving || selected.length === 0} className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Añadir seleccionadas</button></div>}</div>
      <form onSubmit={ask} className="flex gap-2 border-t border-ink-100 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ej. planifica el día 3" className="h-10 min-w-0 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm outline-none focus:border-ink-900" disabled={loading || saving} /><button type="submit" disabled={!input.trim() || loading || saving} className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
    </section>}
  </>;
}
