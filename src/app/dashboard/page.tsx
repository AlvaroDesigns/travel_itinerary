'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { CreateTripModal } from '@/components/CreateTripModal';
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
  DollarSign,
  Share2,
  LayoutGrid,
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
  recentUsers: { id: number; email: string; role: 'superadmin' | 'admin' | 'user'; createdAt: string }[];
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
  booking: 'Módulos de Pago',
};

export default function DashboardPage() {
  const { trips, clients, user, isLoading } = useTravel();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      label: 'Clientes registrados',
      value: clients.length || overview.activeUsers,
      detail: `${clients.length} contactos en CRM`,
      icon: Users,
      tone: 'bg-sky-50 text-sky-700',
      href: '/clientes',
    },
    {
      label: 'Enlaces públicos',
      value: overview.publicLinksEnabled || trips.length,
      detail: 'Itinerarios compartibles en vivo',
      icon: Share2,
      tone: 'bg-amber-50 text-amber-700',
      href: '/enlaces-publicos',
    },
    {
      label: 'Actividades programadas',
      value: overview.totalActivities || trips.reduce((acc, t) => acc + (t.activities?.length || 0), 0),
      detail: overview.totalActivitySpend > 0 ? `Presupuesto: ${formatCurrency(overview.totalActivitySpend)}` : 'Servicios en rutas',
      icon: Activity,
      tone: 'bg-emerald-50 text-emerald-700',
      href: '/viajes',
    },
  ];

  return (
    <DashboardShell activeMenu="dashboard" onOpenCreateTrip={() => setIsCreateModalOpen(true)}>
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        {/* Top Greeting Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828]">
              Hola, {getUserDisplayName()} 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#667085]">
              Resumen en tiempo real de tus itinerarios, clientes y reservas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/enlaces-publicos"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eaecf0] bg-white px-4 text-xs font-bold text-[#344054] shadow-xs hover:bg-[#f8fafc] transition"
            >
              <Share2 className="h-3.5 w-3.5 text-[#009688]" />
              <span>Ver Enlaces Públicos</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#009688] px-5 text-xs font-bold text-white shadow-md hover:bg-[#00796b] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Viaje</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone, href }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs transition-all hover:border-[#009688]/40 hover:shadow-md block"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#667085] uppercase tracking-wider">{label}</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-[#101828]">{value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 border-t border-[#f2f4f7] pt-3 flex items-center justify-between text-xs text-[#667085]">
                <span className="font-medium truncate">{detail}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#98a2b3] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </section>

        {/* Quick Access Action Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004d40] via-[#00796b] to-[#009688] p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-100 backdrop-blur-md mb-2">
                Asistente Inteligente
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Crea un itinerario completo con IA</h2>
              <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-teal-100">
                Diseña viajes en segundos con recomendaciones de vuelos, hoteles seleccionados, restaurantes y visitas guiadas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs sm:text-sm font-extrabold text-[#00796b] shadow-md transition-all hover:bg-teal-50 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#009688]" />
              <span>Generar con Agente IA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* 2-Column Section: Viajes Recientes & Actividad */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Viajes recientes */}
          <section className="overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs lg:col-span-3">
            <div className="flex items-center justify-between border-b border-[#f2f4f7] px-6 py-4">
              <h3 className="font-extrabold text-sm sm:text-base text-[#101828]">Tus viajes recientes</h3>
              <Link
                href="/viajes"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#eaecf0] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-bold text-[#344054] shadow-xs hover:bg-[#eaecf0] hover:text-[#101828] transition-all"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-[#009688]" />
                <span>Ver más</span>
                <ChevronRight className="h-3 w-3 text-[#98a2b3]" />
              </Link>
            </div>

            {trips.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Plane className="h-8 w-8 text-[#98a2b3] mx-auto" />
                <p className="text-xs text-[#667085]">Aún no tienes viajes creados.</p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-full bg-[#009688] px-4 py-2 text-xs font-bold text-white hover:bg-[#00796b] transition"
                >
                  Crear mi primer viaje
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#f2f4f7]">
                {trips.slice(0, 5).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/viaje/${trip.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-[#f8fafc] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative">
                        {trip.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={trip.imageUrl} alt={trip.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#009688] bg-[#e0f2f1]">
                            <Plane className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#101828] truncate">{trip.name}</p>
                        <p className="text-[11px] text-[#667085] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3 text-[#009688]" />
                          <span>
                            {formatFullDate(trip.startDate)} - {formatFullDate(trip.endDate)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#00796b]">
                        {trip.activities?.length || 0} servicios
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#98a2b3]" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Actividades por categoría */}
          <section className="overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#f2f4f7] px-6 py-4">
              <h3 className="font-extrabold text-sm sm:text-base text-[#101828]">Distribución de servicios</h3>
              <span className="rounded-md bg-[#f2f4f7] px-2 py-0.5 text-[10px] font-bold text-[#475467]">
                Resumen
              </span>
            </div>

            {data?.activityBreakdown && data.activityBreakdown.length > 0 ? (
              <div className="divide-y divide-[#f2f4f7]">
                {data.activityBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="font-bold text-xs text-[#101828]">{activityLabels[item.type] ?? item.type}</p>
                      <p className="text-[11px] text-[#667085]">{item.count} {item.count === 1 ? 'servicio' : 'servicios'}</p>
                    </div>
                    <span className="rounded-full bg-[#f0fdfa] px-2.5 py-1 text-xs font-bold text-[#00796b] border border-[#ccfbf1]">
                      {formatCurrency(item.spend)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7] text-xs">
                  <span className="font-bold text-[#344054]">Vuelos</span>
                  <span className="text-[#009688] font-bold">Activo</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7] text-xs">
                  <span className="font-bold text-[#344054]">Alojamientos</span>
                  <span className="text-[#009688] font-bold">Activo</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7] text-xs">
                  <span className="font-bold text-[#344054]">Traslados</span>
                  <span className="text-[#009688] font-bold">Activo</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="font-bold text-[#344054]">Módulos de Pago & Depósito</span>
                  <span className="text-[#009688] font-bold">Activo</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Create Trip Modal */}
        <CreateTripModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      </div>
    </DashboardShell>
  );
}
