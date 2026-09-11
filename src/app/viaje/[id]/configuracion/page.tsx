'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { TripNotificationSettings } from '@/components/TripNotificationSettings';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { ArrowLeft, Settings, ChevronRight, Eye, Edit } from 'lucide-react';

export default function TripConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const { trips, isLoading } = useTravel();
  const router = useRouter();

  const trip = trips.find((t) => t.id === tripId);

  if (isLoading) {
    return <WanderlustLoader />;
  }

  return (
    <DashboardShell activeMenu="configuracion">
      <div className="w-full space-y-6">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-xl border border-[#eaecf0] bg-[#f9fafb] px-3 py-1.5 text-xs font-bold text-[#344054] hover:bg-[#f2f4f7] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver</span>
            </button>

            <div className="hidden sm:block h-4 w-[1px] bg-[#eaecf0]" />

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-[#667085]">
              <Link href="/viajes" className="hover:text-[#0066FF] font-medium transition-colors">
                Mis viajes
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#98a2b3]" />
              <Link
                href={`/viaje/${tripId}`}
                className="hover:text-[#0066FF] font-medium transition-colors truncate max-w-[200px]"
              >
                {trip?.name || 'Itinerario'}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-[#98a2b3]" />
              <span className="font-bold text-[#101828]">Configuración</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/viaje/${tripId}`}
              className="flex items-center gap-1.5 rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] transition-colors"
            >
              <Edit className="h-3.5 w-3.5 text-[#667085]" />
              <span>Ver editor</span>
            </Link>
          </div>
        </div>

        {/* Header Title Banner */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] shadow-xs">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#101828]">
              Configuración del viaje
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">
              {trip ? trip.name : 'Gestiona los avisos, tokens y accesos del cliente'}
            </p>
          </div>
        </div>

        {/* Configuration Component */}
        <div className="w-full">
          <TripNotificationSettings tripId={tripId} />
        </div>
      </div>
    </DashboardShell>
  );
}

