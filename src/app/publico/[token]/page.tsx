'use client';

import { use, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hotel,
  LockKeyhole,
  MapPin,
  Plane,
  Route,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';

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

type ActivityPresentation = {
  label: string;
  title: string;
  subtitle: string;
  detail: string;
  icon: typeof Plane;
  iconClass: string;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(amount);

function toDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(date));
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(toDate(date))
    .replace('.', '');
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(date));
}

function value(activity: PublicActivity, key: string) {
  return typeof activity[key] === 'string' ? activity[key] as string : '';
}

function activityPresentation(activity: PublicActivity): ActivityPresentation {
  if (activity.type === 'flight') {
    const route = [value(activity, 'origin'), value(activity, 'destination')].filter(Boolean).join(' → ');
    const airline = [value(activity, 'airline'), value(activity, 'flightNumber')].filter(Boolean).join(' · ');
    return { label: 'Vuelo', title: route || 'Vuelo', subtitle: airline || 'Trayecto aéreo', detail: value(activity, 'arrivalTime') ? `Llegada ${value(activity, 'arrivalTime')}` : '', icon: Plane, iconClass: 'bg-sky-100 text-sky-700' };
  }
  if (activity.type === 'transfer') {
    const route = [value(activity, 'origin'), value(activity, 'destination')].filter(Boolean).join(' → ');
    return { label: 'Traslado', title: route || 'Traslado', subtitle: value(activity, 'transportType') || 'Transporte', detail: value(activity, 'duration') || value(activity, 'description'), icon: Route, iconClass: 'bg-violet-100 text-violet-700' };
  }
  if (activity.type === 'hotel') {
    const dates = [value(activity, 'checkIn'), value(activity, 'checkOut')].filter(Boolean).join(' · ');
    return { label: 'Alojamiento', title: value(activity, 'hotelName') || 'Alojamiento', subtitle: dates || 'Estancia', detail: value(activity, 'description'), icon: Hotel, iconClass: 'bg-amber-100 text-amber-700' };
  }
  if (activity.type === 'food') {
    return { label: 'Gastronomía', title: value(activity, 'restaurantName') || 'Comida', subtitle: value(activity, 'mealType') || 'Parada gastronómica', detail: value(activity, 'description'), icon: UtensilsCrossed, iconClass: 'bg-rose-100 text-rose-700' };
  }
  return { label: 'Experiencia', title: value(activity, 'title') || 'Actividad', subtitle: value(activity, 'duration') || 'Plan del día', detail: value(activity, 'description'), icon: MapPin, iconClass: 'bg-emerald-100 text-emerald-700' };
}

function tripDuration(startDate: string, endDate: string) {
  const diff = Math.round((toDate(endDate).getTime() - toDate(startDate).getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

function tripDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = toDate(startDate);
  const end = toDate(endDate);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export default function PublicTripPage({ params }: PageProps) {
  const { token } = use(params);
  const [data, setData] = useState<PublicTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTrip() {
      try {
        const response = await fetch(`/api/public/trips/${encodeURIComponent(token)}`, { signal: controller.signal });
        const payload = await response.json() as PublicTripResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || 'No se ha podido abrir el itinerario');
        setData(payload);
        if (payload.available) setSelectedDate(payload.trip.startDate);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(loadError instanceof Error ? loadError.message : 'No se ha podido abrir el itinerario');
        }
      }
    }
    void loadTrip();
    return () => controller.abort();
  }, [token]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#159dc6] p-5"><section className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><LockKeyhole className="h-6 w-6" /></span><h1 className="mt-5 text-xl font-bold text-slate-900">Enlace no disponible</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">{error}</p></section></main>;
  }

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center bg-[#159dc6] text-sm font-semibold text-white"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 animate-pulse" /> Preparando tu aventura…</span></main>;
  }

  if (!data.available) {
    const availableAt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(data.availableAt));
    return <main className="flex min-h-screen items-center justify-center bg-[#159dc6] p-5"><section className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center text-slate-900 shadow-2xl"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d3ff72] text-slate-900"><LockKeyhole className="h-6 w-6" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Aventura en preparación</p><h1 className="mt-3 text-2xl font-extrabold">Una experiencia por descubrir</h1><p className="mt-4 text-sm leading-relaxed text-slate-500">El itinerario se revelará el {availableAt}.</p></section></main>;
  }

  const { trip } = data;
  const activitiesByDate = trip.activities.reduce<Record<string, PublicActivity[]>>((groups, activity) => {
    groups[activity.date] = [...(groups[activity.date] || []), activity];
    return groups;
  }, {});
  const dates = tripDates(trip.startDate, trip.endDate);
  const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : trip.startDate;
  const activeActivities = activitiesByDate[activeDate] ?? [];
  const totalExpenses = trip.activities.reduce((total, activity) => total + (activity.price || 0), 0);
  const duration = tripDuration(trip.startDate, trip.endDate);

  return <main className="min-h-screen overflow-x-hidden bg-[#dff3f7] text-slate-900">
    <section className="relative isolate min-h-[16rem] overflow-hidden bg-[#159dc6] sm:min-h-[17.5rem]">
      {trip.imageUrl && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trip.imageUrl} alt={`Vista de ${trip.name}`} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      </>}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(21,157,198,0.14)_0%,rgba(6,91,130,0.2)_38%,rgba(5,47,69,0.88)_100%)]" />
      <div className="mx-auto flex min-h-[16rem] max-w-5xl flex-col justify-between px-5 pb-14 pt-5 text-white sm:min-h-[17.5rem] sm:px-9 sm:pb-16">
        <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-sm font-black backdrop-blur">W</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur">Itinerario</span></div>
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3ff72]">Tu próxima aventura</p><h1 className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">{trip.name}</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">{trip.description || 'Cada momento de tu viaje, organizado para disfrutarlo sin pensar en nada más.'}</p></div>
      </div>
    </section>

    <div className="relative z-10 mx-auto -mt-16 max-w-5xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-4 shadow-[0_-16px_36px_rgba(5,70,94,0.12)] sm:-mt-20 sm:rounded-[2.75rem] sm:px-9 sm:pt-5">
      <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-slate-200" />
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">Plan de viaje</p><p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDays className="h-4 w-4 text-cyan-600" />{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p></div><span className="rounded-full bg-[#d3ff72] px-3 py-2 text-xs font-extrabold text-slate-900">{duration} {duration === 1 ? 'día' : 'días'}</span></div>

      {dates.length > 0 && <nav aria-label="Días del itinerario" className="mt-6 overflow-x-auto [scrollbar-width:none]"><div className="flex min-w-max gap-2">{dates.map((date, index) => <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`flex h-[5.85rem] min-w-[8.5rem] flex-col items-center justify-center rounded-[2rem] px-4 text-center transition ${activeDate === date ? 'bg-[#d3ff72] text-slate-950 shadow-[0_7px_14px_rgba(125,170,35,0.18)]' : 'bg-[#edf5f6] text-slate-500 hover:bg-cyan-50'}`}><span className="block text-[11px] font-extrabold uppercase tracking-wider">Día {index + 1}</span><span className="mt-1 block whitespace-nowrap text-[15px] font-extrabold capitalize">{formatDay(date)}</span></button>)}</div></nav>}

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="rounded-[2rem] bg-[#f4fbfc] p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 px-2 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">Ruta del día</p><h2 className="mt-1 text-2xl font-extrabold capitalize tracking-tight">{activeDate ? formatWeekday(activeDate) : 'Itinerario'}</h2></div>{activeActivities.length > 0 && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">{activeActivities.length} {activeActivities.length === 1 ? 'plan' : 'planes'}</span>}</div>
          {activeActivities.length === 0 ? <div className="rounded-[1.5rem] bg-white py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff3f7] text-cyan-600"><CalendarDays className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-slate-700">Todavía no hay planes para este día.</p></div> : <ol className="relative space-y-2 before:absolute before:bottom-7 before:left-[4.2rem] before:top-7 before:w-0.5 before:bg-[#bde8ee] sm:before:left-[5.3rem]">{activeActivities.map((activity) => {
            const presentation = activityPresentation(activity);
            const Icon = presentation.icon;
            return <li key={activity.id} className="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 py-2 sm:grid-cols-[4.25rem_minmax(0,1fr)] sm:gap-4"><time className="pt-4 text-right text-xs font-extrabold text-slate-500">{activity.time}</time><article className="relative rounded-[1.5rem] bg-white p-4 shadow-[0_8px_22px_rgba(17,91,106,0.08)]"><span className={`absolute -left-[1.6rem] top-5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#f4fbfc] ${presentation.iconClass} sm:-left-[1.9rem]`}><Icon className="h-3.5 w-3.5" /></span><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-700">{presentation.label}</p><h3 className="mt-1 font-extrabold text-slate-900">{presentation.title}</h3><p className="mt-1 text-sm font-medium text-slate-500">{presentation.subtitle}</p>{presentation.detail && <p className="mt-2 text-xs leading-relaxed text-slate-500">{presentation.detail}</p>}</div>{trip.showExpenses && <span className="shrink-0 rounded-full bg-[#edf5f6] px-2.5 py-1 text-xs font-extrabold text-slate-700">{formatCurrency(activity.price || 0)}</span>}</div></article></li>;
          })}</ol>}
        </section>

        <aside className="space-y-4 lg:pt-1">
          {trip.description && <article className="rounded-[1.75rem] bg-[#eef8fa] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm"><MapPin className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">Sobre el viaje</p><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{trip.description}</p></article>}
          {trip.showExpenses && <article className="rounded-[1.75rem] bg-[#159dc6] p-5 text-white shadow-lg shadow-cyan-700/20"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-[#d3ff72]"><Wallet className="h-5 w-5" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-[#d3ff72]">Coste estimado</p><p className="mt-1 text-2xl font-extrabold">{formatCurrency(totalExpenses)}</p><p className="mt-2 text-xs leading-relaxed text-white/80">Suma de actividades incluidas en este itinerario.</p></article>}
          <article className="flex items-start gap-3 rounded-[1.75rem] border border-[#d3ff72] bg-[#f6ffdf] p-5 text-slate-800"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" /><p className="text-sm font-medium leading-relaxed">Todo listo: sigue el itinerario a tu ritmo y disfruta de cada parada.</p></article>
        </aside>
      </div>
    </div>
  </main>;
}
