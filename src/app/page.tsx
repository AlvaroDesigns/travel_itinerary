'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import {
  Sparkles,
  Plane,
  Users,
  Activity,
  BellRing,
  CalendarDays,
  FileText,
  ArrowRight,
  Plus,
  Compass,
  Luggage,
  Clock,
  TrendingUp,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Calendar,
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return 'Sin fecha';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

const activityLabels: Record<string, string> = {
  flight: 'Vuelos',
  transfer: 'Traslados',
  hotel: 'Alojamientos',
  excursion: 'Excursiones',
  food: 'Comidas',
};

export default function DashboardHome() {
  const { trips, clients, user, isLoading } = useTravel();
  const router = useRouter();

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
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las métricas');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getUserDisplayName = () => {
    if (user?.email) return user.email.split('@')[0];
    return 'Agente';
  };

  if (isLoading) {
    return <WanderlustLoader />;
  }

  const overview = data?.overview || {
    totalUsers: 1,
    activeUsers: 1,
    adminUsers: 1,
    newUsersLast30Days: 1,
    totalTrips: trips.length,
    upcomingTrips: trips.filter((t) => t.startDate > new Date().toISOString().split('T')[0]).length,
    activeTrips: trips.filter((t) => t.startDate <= new Date().toISOString().split('T')[0] && t.endDate >= new Date().toISOString().split('T')[0]).length,
    totalActivities: 0,
    totalActivitySpend: 0,
    remindersEnabled: 0,
    publicLinksEnabled: trips.length,
  };

  const cards = [
    {
      label: 'Mis viajes',
      value: trips.length || overview.totalTrips,
      detail: `${overview.activeTrips} en curso · ${overview.upcomingTrips} próximos`,
      icon: Plane,
      tone: 'bg-teal-50 text-[#009688]',
      href: '/viajes',
    },
    {
      label: 'Clientes',
      value: clients.length || 0,
      detail: `${clients.length} clientes gestionados en la cartera`,
      icon: Users,
      tone: 'bg-sky-50 text-sky-700',
      href: '/clientes',
    },
    {
      label: 'Actividades & Gasto',
      value: overview.totalActivities,
      detail: `Presupuesto: ${formatCurrency(overview.totalActivitySpend)}`,
      icon: Activity,
      tone: 'bg-amber-50 text-amber-700',
      href: '/viajes',
    },
    {
      label: 'Recordatorios & Enlaces',
      value: overview.remindersEnabled,
      detail: `${overview.publicLinksEnabled} enlaces públicos activos`,
      icon: BellRing,
      tone: 'bg-emerald-50 text-emerald-700',
      href: '/viajes',
    },
  ];

  return (
    <DashboardShell activeMenu="dashboard">
      <div className="w-full space-y-6">
        {/* Header: Greeting & Quick Actions */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-3.5 py-1 text-xs font-bold text-[#00796b]">
              <Sparkles className="h-3.5 w-3.5 text-[#009688]" />
              <span>Centro de control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828]">
              Hola, {getUserDisplayName()}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#667085]">
              Bienvenido a tu panel de control de Wanderlust. Gestiona tus viajes, clientes e itinerarios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/clientes"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d0d5dd] bg-white px-4 text-xs font-bold text-[#344054] shadow-xs hover:bg-[#f9fafb] transition-all"
            >
              <Users className="h-4 w-4 text-[#667085]" />
              <span>Clientes</span>
            </Link>

            <Link
              href="/viajes"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#009688] px-4 text-xs font-bold text-white shadow-md hover:bg-[#00796b] transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Ver viajes</span>
            </Link>
          </div>
        </div>

        {/* Top 4 Metrics Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone, href }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">{label}</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#101828]">{value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone} transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 border-t border-[#eaecf0] pt-3 text-xs font-medium leading-relaxed text-[#667085]">
                {detail}
              </p>
            </Link>
          ))}
        </section>

        {/* Banner Hero: AI Agent & Quick Trip Planner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-[#004d40] to-teal-900 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#009688]/30 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#80cbc4] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#80cbc4]" />
                Asistente Wanderlust IA
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight">
                Genera itinerarios y propuestas en minutos
              </h2>
              <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-teal-100">
                Organiza vuelos, hoteles, traslados y excursiones con presupuestos detallados y compártelos con tus clientes a través de su portal interactivo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/viajes"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs sm:text-sm font-bold text-[#00796b] shadow-md transition-all hover:bg-teal-50 hover:scale-105 active:scale-95"
              >
                <Plane className="h-4 w-4" />
                <span>Explorar viajes</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section: Recent Trips Carousel / Cards */}
        <section className="rounded-3xl border border-[#eaecf0] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#eaecf0] pb-4 mb-5">
            <div>
              <h2 className="font-bold text-base text-[#101828]">Tus viajes recientes</h2>
              <p className="text-xs text-[#667085] mt-0.5">Acceso rápido a los últimos itinerarios gestionados</p>
            </div>
            <Link
              href="/viajes"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:text-[#00796b]"
            >
              <span>Ver todos ({trips.length})</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#667085]">
              <Plane className="mx-auto h-8 w-8 text-zinc-300 mb-2 opacity-50" />
              <p className="font-bold text-[#101828]">No tienes viajes creados todavía</p>
              <p className="mt-1">Crea tu primer itinerario para empezar.</p>
              <Link
                href="/viajes"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#009688] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b]"
              >
                <Plus className="h-4 w-4" />
                <span>Crear itinerario</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.slice(0, 3).map((trip) => {
                const client = clients.find((c) => c.id === trip.clientId);
                return (
                  <Link
                    key={trip.id}
                    href={`/viaje/${trip.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#eaecf0] bg-white transition-all hover:border-[#009688]/40 hover:shadow-md cursor-pointer"
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-zinc-100">
                      {trip.imageUrl ? (
                        <Image
                          src={trip.imageUrl}
                          alt={trip.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-teal-900/10 text-[#009688]">
                          <Plane className="h-8 w-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                        <h3 className="font-bold text-sm leading-snug drop-shadow-sm">{trip.name}</h3>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3.5 text-xs">
                      <div className="flex items-center justify-between text-[#667085] mb-2">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3 text-[#009688]" />
                          {formatFullDate(trip.startDate)}
                        </span>
                        <span className="font-bold text-[#00796b]">
                          {trip.budget > 0 ? `${trip.budget} €` : 'Personalizado'}
                        </span>
                      </div>
                      {client ? (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#eaecf0] text-[11px] text-[#00796b] font-bold">
                          <UserCheck className="h-3 w-3" />
                          <span className="truncate">{client.name}</span>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#eaecf0] text-[11px] text-[#98a2b3]">
                          Sin cliente asignado
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Grid: Activity Breakdown & Recent Users / System Activity */}
        <div className="grid gap-6 xl:grid-cols-5">
          {/* Activity Breakdown */}
          <section className="overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs xl:col-span-3">
            <div className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-[#101828]">Actividad por categoría</h2>
                <p className="mt-0.5 text-xs text-[#667085]">Total de actividades y gasto presupuestado</p>
              </div>
              <span className="rounded-full bg-[#f4f5f8] px-3 py-1 text-[11px] font-bold text-[#344054]">
                Resumen
              </span>
            </div>

            {(!data?.activityBreakdown || data.activityBreakdown.length === 0) ? (
              <p className="p-8 text-center text-xs text-[#667085]">
                Todavía no hay actividades registradas en los viajes.
              </p>
            ) : (
              <div className="divide-y divide-[#eaecf0]">
                {data.activityBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                    <div>
                      <p className="font-bold text-xs text-[#101828]">{activityLabels[item.type] ?? item.type}</p>
                      <p className="mt-0.5 text-[11px] text-[#667085]">
                        {item.count} {item.count === 1 ? 'actividad' : 'actividades'}
                      </p>
                    </div>
                    <p className="rounded-xl bg-teal-50 px-3 py-1 text-xs font-bold text-[#00796b]">
                      {formatCurrency(item.spend)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Access & Client Portfolio */}
          <section className="overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs xl:col-span-2">
            <div className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-[#101828]">Clientes recientes</h2>
                <p className="mt-0.5 text-xs text-[#667085]">Últimas altas en la plataforma</p>
              </div>
              <Link href="/clientes" className="text-xs font-bold text-[#009688] hover:text-[#00796b]">
                Ver todos
              </Link>
            </div>

            {clients.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#667085]">
                <p className="font-bold text-[#101828]">No hay clientes registrados</p>
                <Link
                  href="/clientes"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Crear primer cliente
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#eaecf0]">
                {clients.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-bold text-[#00796b]">
                      {c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#101828]">{c.name}</p>
                      <p className="text-[11px] text-[#667085] truncate">{c.email || c.phone || 'Sin datos de contacto'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
