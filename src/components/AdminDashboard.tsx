'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, BellRing, CalendarDays, FileText, Loader2, Plane, Users } from 'lucide-react';

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

  if (error) return <div className="mx-auto max-w-6xl border-l-4 border-red-500 bg-white px-4 py-3 text-sm shadow-sm">{error}</div>;
  if (!data) return <div className="flex min-h-64 items-center justify-center text-sm text-[#646970]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando analítica…</div>;

  const { overview } = data;
  const cards = [
    { label: 'Usuarios activos', value: overview.activeUsers, detail: `${overview.totalUsers} registrados · ${overview.adminUsers} administradores`, icon: Users, color: 'text-[#2271b1]' },
    { label: 'Viajes', value: overview.totalTrips, detail: `${overview.activeTrips} en curso · ${overview.upcomingTrips} próximos`, icon: Plane, color: 'text-emerald-600' },
    { label: 'Actividades', value: overview.totalActivities, detail: `Gasto registrado: ${formatCurrency(overview.totalActivitySpend)}`, icon: Activity, color: 'text-violet-600' },
    { label: 'Automatizaciones', value: overview.remindersEnabled, detail: `${overview.publicLinksEnabled} enlaces públicos activos`, icon: BellRing, color: 'text-amber-600' },
  ];

  return <div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#c3c4c7] pb-5"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#646970]">Administración</p><h1 className="text-3xl font-medium tracking-tight">Escritorio</h1><p className="mt-2 text-sm text-[#50575e]">Resumen operativo de Wanderlust.</p></div><Link href="/admin/paginas" className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#2271b1] px-3 text-sm font-semibold text-[#2271b1] transition-colors hover:bg-[#f0f6fc]"><FileText className="h-4 w-4" /> Editar página</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, color }) => <div key={label} className="border border-[#c3c4c7] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#646970]">{label}</p><p className="mt-2 text-3xl font-medium">{value}</p></div><Icon className={`h-5 w-5 ${color}`} /></div><p className="mt-3 text-xs text-[#646970]">{detail}</p></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-5">
      <section className="overflow-hidden border border-[#c3c4c7] bg-white shadow-sm lg:col-span-3"><div className="flex items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-5 py-4"><h2 className="font-semibold">Actividad por categoría</h2><span className="text-xs text-[#646970]">Total y gasto registrado</span></div>{data.activityBreakdown.length === 0 ? <p className="p-8 text-center text-sm text-[#646970]">Todavía no hay actividades registradas.</p> : <div className="divide-y divide-[#f0f0f1]">{data.activityBreakdown.map((item) => <div key={item.type} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{activityLabels[item.type] ?? item.type}</p><p className="mt-0.5 text-xs text-[#646970]">{item.count} {item.count === 1 ? 'actividad' : 'actividades'}</p></div><p className="text-sm font-semibold">{formatCurrency(item.spend)}</p></div>)}</div>}</section>
      <section className="overflow-hidden border border-[#c3c4c7] bg-white shadow-sm lg:col-span-2"><div className="flex items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-5 py-4"><h2 className="font-semibold">Nuevos usuarios</h2><Link href="/admin/usuarios" className="text-xs font-semibold text-[#2271b1] hover:text-[#135e96]">Ver todos</Link></div>{data.recentUsers.length === 0 ? <p className="p-8 text-center text-sm text-[#646970]">No hay usuarios todavía.</p> : <div className="divide-y divide-[#f0f0f1]">{data.recentUsers.map((user) => <div key={user.id} className="flex items-center gap-3 px-5 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2271b1] text-[10px] font-bold text-white">{user.email.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.email}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-[#646970]"><CalendarDays className="h-3 w-3" /> {formatDate(user.createdAt)}</p></div><span className="text-[10px] font-semibold uppercase text-[#646970]">{user.role}</span></div>)}</div>}</section>
    </div>
    <div className="mt-6 border border-[#c3c4c7] bg-white p-5 shadow-sm"><p className="text-sm font-semibold">Crecimiento reciente</p><p className="mt-1 text-sm text-[#50575e]"><strong className="text-[#1d2327]">{overview.newUsersLast30Days}</strong> {overview.newUsersLast30Days === 1 ? 'usuario nuevo en los últimos 30 días.' : 'usuarios nuevos en los últimos 30 días.'}</p></div>
  </div>;
}
