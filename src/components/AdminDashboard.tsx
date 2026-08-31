'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BellRing,
  CalendarDays,
  FileText,
  Loader2,
  Plane,
  Sparkles,
  Users,
} from 'lucide-react';

type DashboardData = {
  overview: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersLast30Days: number;
    totalTrips: number;
    upcomingTrips: number;
    activeTrips: number;
    totalActivities: number;
    totalActivitySpend: number;
    remindersEnabled: number;
    publicLinksEnabled: number;
  };
  activityBreakdown: { type: string; count: number; spend: number }[];
  recentUsers: { id: number; email: string; role: 'admin' | 'user'; createdAt: string }[];
};

const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const activityLabels: Record<string, string> = { flight: 'Vuelos', transfer: 'Traslados', hotel: 'Alojamientos', excursion: 'Excursiones', food: 'Comidas' };

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/dashboard')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudieron cargar las métricas');
        if (!cancelled) setData(body);
      })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las métricas'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="mx-auto max-w-7xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 shadow-sm">{error}</div>;
  if (!data) return <div className="flex min-h-64 items-center justify-center gap-2 text-sm font-medium text-zinc-500"><Loader2 className="h-5 w-5 animate-spin text-[#009688]" /> Cargando analítica…</div>;

  const { overview } = data;
  const cards = [
    { label: 'Usuarios activos', value: overview.activeUsers, detail: `${overview.totalUsers} registrados · ${overview.adminUsers} administradores`, icon: Users, tone: 'bg-teal-50 text-[#009688]' },
    { label: 'Viajes creados', value: overview.totalTrips, detail: `${overview.activeTrips} en curso · ${overview.upcomingTrips} próximos`, icon: Plane, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Actividades', value: overview.totalActivities, detail: `Gasto registrado: ${formatCurrency(overview.totalActivitySpend)}`, icon: Activity, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Recordatorios', value: overview.remindersEnabled, detail: `${overview.publicLinksEnabled} enlaces públicos activos`, icon: BellRing, tone: 'bg-emerald-50 text-emerald-700' },
  ];

  return <div className="mx-auto max-w-7xl">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-3.5 py-1 text-xs font-bold text-[#00796b]"><Sparkles className="h-3.5 w-3.5 text-[#009688]" /> Centro de control</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">Buenos días, equipo</h1>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">Una vista rápida de la actividad de Wanderlust.</p>
      </div>
      <Link href="/admin/paginas" className="wanderlust-primary-button inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md"><FileText className="h-4 w-4" /> Editar página</Link>
    </div>

    <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-zinc-500">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950">{value}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span></div>
        <p className="mt-4 border-t border-zinc-100 pt-3 text-xs font-medium leading-relaxed text-zinc-500">{detail}</p>
      </article>)}
    </section>

    <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-[#004d40] to-teal-900 p-6 text-white shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#009688]/20 blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-300">Próximo paso</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Mantén actualizada la página de inicio</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-100">Revisa el mensaje principal que ven los viajeros y publícalo en un solo paso.</p></div><Link href="/admin/paginas/inicio" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#00796b] shadow-md transition-all hover:bg-teal-50 hover:scale-105 active:scale-95"><FileText className="h-4 w-4" /> Abrir editor <ArrowRight className="h-4 w-4" /></Link></div>
    </section>

    <div className="grid gap-6 xl:grid-cols-5">
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs xl:col-span-3">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-5 sm:px-6"><div><h2 className="font-bold text-zinc-950">Actividad por categoría</h2><p className="mt-1 text-xs font-medium text-zinc-500">Total de actividades y gasto registrado</p></div><span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">Resumen</span></div>
        {data.activityBreakdown.length === 0 ? <p className="p-10 text-center text-sm text-zinc-500">Todavía no hay actividades registradas.</p> : <div className="divide-y divide-zinc-100">{data.activityBreakdown.map((item) => <div key={item.type} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div><p className="font-bold text-zinc-800">{activityLabels[item.type] ?? item.type}</p><p className="mt-1 text-xs font-medium text-zinc-500">{item.count} {item.count === 1 ? 'actividad' : 'actividades'}</p></div><p className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm font-bold text-[#00796b]">{formatCurrency(item.spend)}</p></div>)}</div>}
      </section>
      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs xl:col-span-2">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-5 sm:px-6"><div><h2 className="font-bold text-zinc-950">Nuevos usuarios</h2><p className="mt-1 text-xs font-medium text-zinc-500">Altas recientes</p></div><Link href="/admin/usuarios" className="text-xs font-bold text-[#009688] hover:text-[#00796b]">Ver todos</Link></div>
        {data.recentUsers.length === 0 ? <p className="p-10 text-center text-sm text-zinc-500">No hay usuarios todavía.</p> : <div className="divide-y divide-zinc-100">{data.recentUsers.map((user) => <div key={user.id} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[10px] font-extrabold text-[#00796b]">{user.email.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-zinc-800">{user.email}</p><p className="mt-1 flex items-center gap-1 text-xs font-medium text-zinc-500"><CalendarDays className="h-3 w-3" /> {formatDate(user.createdAt)}</p></div><span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase text-zinc-500">{user.role}</span></div>)}</div>}
      </section>
    </div>
    <section className="mt-6 flex items-center gap-4 rounded-2xl border border-teal-200/80 bg-teal-50/70 p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#009688] shadow-sm"><Users className="h-5 w-5" /></span><p className="text-sm leading-relaxed text-[#004d40]"><strong>{overview.newUsersLast30Days}</strong> {overview.newUsersLast30Days === 1 ? 'usuario nuevo se ha unido en los últimos 30 días.' : 'usuarios nuevos se han unido en los últimos 30 días.'}</p></section>
  </div>;
}
