'use client';

import { use, useEffect, useState } from 'react';
import { Calendar, Clock3, LockKeyhole, MapPin, Wallet } from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

type PublicActivity = {
  id: string;
  type: string;
  date: string;
  time: string;
  price?: number;
  [key: string]: unknown;
};

type PublicTrip = {
  name: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  description: string | null;
  showExpenses: boolean;
  activities: PublicActivity[];
};

type PublicTripResponse =
  | { available: true; trip: PublicTrip }
  | { available: false; availableAt: string };

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function activityTitle(activity: PublicActivity) {
  const value = (key: string) => typeof activity[key] === 'string' ? activity[key] as string : '';
  if (activity.type === 'flight') return [value('origin'), value('destination')].filter(Boolean).join(' → ') || 'Vuelo';
  if (activity.type === 'transfer') return [value('origin'), value('destination')].filter(Boolean).join(' → ') || 'Traslado';
  if (activity.type === 'hotel') return value('hotelName') || 'Alojamiento';
  if (activity.type === 'excursion') return value('title') || 'Actividad';
  if (activity.type === 'food') return value('restaurantName') || 'Comida';
  return 'Actividad';
}

function activityLabel(type: string) {
  const labels: Record<string, string> = { flight: 'Vuelo', transfer: 'Traslado', hotel: 'Alojamiento', excursion: 'Actividad', food: 'Comida' };
  return labels[type] || 'Actividad';
}

export default function PublicTripPage({ params }: PageProps) {
  const { token } = use(params);
  const [data, setData] = useState<PublicTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTrip() {
      try {
        const response = await fetch(`/api/public/trips/${encodeURIComponent(token)}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se ha podido abrir el itinerario');
        setData(payload);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') setError(loadError instanceof Error ? loadError.message : 'No se ha podido abrir el itinerario');
      }
    }
    loadTrip();
    return () => controller.abort();
  }, [token]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"><h1 className="text-xl font-bold text-slate-800">Enlace no disponible</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;
  }

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-semibold text-slate-300">Cargando itinerario…</main>;
  }

  if (!data.available) {
    const availableAt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(data.availableAt));
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <section className="max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8 text-center text-white shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300"><LockKeyhole className="h-6 w-6" /></div>
          <p className="mt-5 text-sm font-bold uppercase tracking-wider text-indigo-300">Aventura en preparación</p>
          <h1 className="mt-2 text-2xl font-extrabold">Una experiencia por descubrir</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">El itinerario se revelará el {availableAt}.</p>
        </section>
      </main>
    );
  }

  const { trip } = data;
  const totalExpenses = trip.activities.reduce((total, activity) => total + (activity.price || 0), 0);
  const activitiesByDate = trip.activities.reduce<Record<string, PublicActivity[]>>((groups, activity) => {
    groups[activity.date] = [...(groups[activity.date] || []), activity];
    return groups;
  }, {});

  return (
    <main className="min-h-screen bg-slate-50 pb-14 text-slate-800">
      <header className="relative min-h-72 overflow-hidden bg-slate-950">
        {trip.imageUrl && <img src={trip.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/15" />
        <div className="relative mx-auto flex min-h-72 max-w-4xl flex-col justify-end px-5 py-10 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Tu próxima aventura</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{trip.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-200"><Calendar className="h-4 w-4 text-cyan-300" />{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl space-y-6 px-5 pt-8 sm:px-8">
        {trip.description && <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-800">Sobre el viaje</h2><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{trip.description}</p></article>}
        {trip.showExpenses && <article className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-indigo-600" /><span className="text-sm font-bold text-indigo-900">Gastos estimados del itinerario</span></div><strong className="text-lg text-indigo-700">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalExpenses)}</strong></article>}

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Itinerario</h2>
          {Object.keys(activitiesByDate).length === 0 ? <p className="mt-4 text-sm text-slate-500">Todavía no hay actividades planificadas.</p> : <div className="mt-6 space-y-7">{Object.entries(activitiesByDate).map(([date, activities]) => <div key={date}><h3 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-indigo-600">{formatDate(date)}</h3><ul className="mt-3 space-y-3">{activities.map((activity) => <li key={activity.id} className="flex gap-3 rounded-xl bg-slate-50 p-4"><div className="mt-0.5 flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-indigo-600 shadow-sm">{activity.time}</div><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{activityLabel(activity.type)}</p><p className="mt-0.5 font-semibold text-slate-800">{activityTitle(activity)}</p></div>{trip.showExpenses && <span className="shrink-0 text-sm font-bold text-slate-600">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(activity.price || 0)}</span>}</li>)}</ul></div>)}</div>}
        </section>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />Itinerario compartido</p>
      </section>
    </main>
  );
}
