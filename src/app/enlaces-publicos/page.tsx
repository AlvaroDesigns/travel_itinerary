'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTravel, Trip } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import {
  Share2,
  Search,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  RefreshCw,
  QrCode,
  X,
  Settings,
  ShieldCheck,
  Plane,
  Clock,
  DollarSign,
  Send,
} from 'lucide-react';

interface TripPublicSetting {
  tripId: string;
  publicAccessEnabled: boolean;
  publicAccessToken?: string;
  publicShowExpenses: boolean;
  publicItineraryVisibility: 'all' | 'day_before';
}

function formatFullDate(dateStr?: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export default function EnlacesPublicosPage() {
  const { trips, isLoading } = useTravel();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [settingsMap, setSettingsMap] = useState<Record<string, TripPublicSetting>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [selectedShareTrip, setSelectedShareTrip] = useState<Trip | null>(null);
  const [selectedConfigTrip, setSelectedConfigTrip] = useState<Trip | null>(null);
  const [isSavingSetting, setIsSavingSetting] = useState<string | null>(null);

  // Load public notification settings for all trips
  useEffect(() => {
    let cancelled = false;
    async function loadAllSettings() {
      if (trips.length === 0) return;
      setIsLoadingSettings(true);
      const map: Record<string, TripPublicSetting> = {};

      await Promise.all(
        trips.map(async (trip) => {
          try {
            const res = await fetch(`/api/trips/${trip.id}/notification-settings`);
            if (res.ok) {
              const data = await res.json();
              map[trip.id] = {
                tripId: trip.id,
                publicAccessEnabled: Boolean(data.publicAccessEnabled),
                publicAccessToken: data.publicAccessToken || trip.id,
                publicShowExpenses: Boolean(data.publicShowExpenses),
                publicItineraryVisibility: data.publicItineraryVisibility || 'all',
              };
            }
          } catch {
            // fallback
            map[trip.id] = {
              tripId: trip.id,
              publicAccessEnabled: true,
              publicAccessToken: trip.id,
              publicShowExpenses: true,
              publicItineraryVisibility: 'all',
            };
          }
        })
      );

      if (!cancelled) {
        setSettingsMap(map);
        setIsLoadingSettings(false);
      }
    }

    loadAllSettings();
    return () => {
      cancelled = true;
    };
  }, [trips]);

  const getTripPublicUrl = (tripId: string) => {
    const setting = settingsMap[tripId];
    const token = setting?.publicAccessToken || tripId;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/publico/${encodeURIComponent(token)}`;
  };

  const handleCopyLink = (tripId: string) => {
    const url = getTripPublicUrl(tripId);
    navigator.clipboard.writeText(url);
    setCopiedId(tripId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTogglePublicAccess = async (tripId: string, currentState: boolean) => {
    setIsSavingSetting(tripId);
    const nextState = !currentState;
    const prev = settingsMap[tripId] || {
      tripId,
      publicAccessEnabled: currentState,
      publicAccessToken: tripId,
      publicShowExpenses: true,
      publicItineraryVisibility: 'all',
    };

    const updated = {
      ...prev,
      publicAccessEnabled: nextState,
    };

    setSettingsMap((curr) => ({
      ...curr,
      [tripId]: updated,
    }));

    try {
      await fetch(`/api/trips/${tripId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // rollback
      setSettingsMap((curr) => ({
        ...curr,
        [tripId]: prev,
      }));
    } finally {
      setIsSavingSetting(null);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trip.clientName && trip.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        trip.id.toLowerCase().includes(searchQuery.toLowerCase());

      const setting = settingsMap[trip.id];
      const isEnabled = setting ? setting.publicAccessEnabled : true;

      if (statusFilter === 'enabled') return matchesSearch && isEnabled;
      if (statusFilter === 'disabled') return matchesSearch && !isEnabled;
      return matchesSearch;
    });
  }, [trips, searchQuery, statusFilter, settingsMap]);

  if (isLoading) {
    return <WanderlustLoader />;
  }

  const totalEnabled = Object.values(settingsMap).filter((s) => s.publicAccessEnabled).length;

  return (
    <DashboardShell activeMenu="compartir">
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-3.5 py-1 text-xs font-bold text-[#00796b]">
              <Globe className="h-3.5 w-3.5 text-[#009688]" /> Enlaces & Accesos Públicos
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828]">
              Gestión de Enlaces Públicos
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#667085]">
              Administra los enlaces compartidos, la visibilidad de presupuestos y la seguridad de cada itinerario.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white border border-[#eaecf0] px-4 py-2 text-xs font-bold text-[#344054] shadow-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalEnabled || trips.length} enlaces activos</span>
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#667085] uppercase tracking-wider">Total de Itinerarios</p>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] mt-1">{trips.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
              <Plane className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-[#ccfbf1] bg-[#f0fdfa] p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#00796b] uppercase tracking-wider">Enlaces Habilitados</p>
              <p className="text-2xl sm:text-3xl font-black text-[#00796b] mt-1">{totalEnabled || trips.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009688] text-white">
              <LockOpen className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#667085] uppercase tracking-wider">Protección & Privacidad</p>
              <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Encriptación Token UUID
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Globe className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-3xl border border-[#eaecf0] bg-white p-3.5 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98a2b3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre de viaje, cliente o código..."
              className="w-full rounded-2xl border border-transparent bg-[#f8fafc] pl-10 pr-4 py-2 text-xs font-semibold text-[#101828] placeholder-[#98a2b3] focus:border-[#009688] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-[#f1f3f5] p-1 rounded-2xl border border-[#eaecf0]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#101828] shadow-xs'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              Todos ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('enabled')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'enabled'
                  ? 'bg-white text-[#00796b] shadow-xs'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              Activos ({totalEnabled || trips.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              Bloqueados ({trips.length - (totalEnabled || trips.length)})
            </button>
          </div>
        </div>

        {/* Table of Public Links */}
        <div className="overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#475467]">
              <thead className="bg-[#f8fafc] text-[11px] font-extrabold uppercase tracking-wider text-[#667085] border-b border-[#eaecf0]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Viaje & Cliente</th>
                  <th scope="col" className="px-4 py-3.5">Fechas</th>
                  <th scope="col" className="px-4 py-3.5">Estado Enlace</th>
                  <th scope="col" className="px-4 py-3.5">Precios</th>
                  <th scope="col" className="px-4 py-3.5">Enlace Público</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-[#667085]">
                      No se encontraron itinerarios con los criterios seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => {
                    const setting = settingsMap[trip.id] || {
                      tripId: trip.id,
                      publicAccessEnabled: true,
                      publicAccessToken: trip.id,
                      publicShowExpenses: true,
                      publicItineraryVisibility: 'all',
                    };
                    const isEnabled = setting.publicAccessEnabled;
                    const token = setting.publicAccessToken || trip.id;
                    const publicUrl = getTripPublicUrl(trip.id);
                    const isCopied = copiedId === trip.id;

                    return (
                      <tr key={trip.id} className="hover:bg-[#f8fafc]/80 transition-colors">
                        {/* Viaje & Cliente */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="h-11 w-11 shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative border border-[#eaecf0]">
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
                              <Link
                                href={`/viaje/${trip.id}`}
                                className="font-extrabold text-sm text-[#101828] hover:text-[#009688] transition-colors truncate block"
                              >
                                {trip.name}
                              </Link>
                              <p className="text-[11px] text-[#667085] truncate">
                                {trip.clientName ? `Cliente: ${trip.clientName}` : 'Sin cliente asignado'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Fechas */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-xs text-[#344054] font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-[#009688]" />
                            <span>{formatFullDate(trip.startDate)}</span>
                          </span>
                          <span className="text-[10px] text-[#667085] block mt-0.5">
                            {trip.activities?.length || 0} servicios
                          </span>
                        </td>

                        {/* Estado Switch Toggle */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleTogglePublicAccess(trip.id, isEnabled)}
                            disabled={isSavingSetting === trip.id}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                              isEnabled
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <LockOpen className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Público Activo</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5 text-slate-500" />
                                <span>Acceso Bloqueado</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Precios */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              setting.publicShowExpenses
                                ? 'bg-teal-50 text-[#00796b] border border-teal-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {setting.publicShowExpenses ? 'Precios visibles' : 'Precios ocultos'}
                          </span>
                        </td>

                        {/* Enlace Público Box */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="text"
                              readOnly
                              value={publicUrl}
                              className="w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-mono text-[#475467] truncate select-all outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyLink(trip.id)}
                              className={`shrink-0 rounded-xl p-1.5 transition-colors cursor-pointer border ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  : 'bg-white text-[#475467] border-[#eaecf0] hover:bg-[#f8fafc]'
                              }`}
                              title="Copiar enlace"
                            >
                              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-xl bg-white border border-[#eaecf0] px-3 py-1.5 text-xs font-bold text-[#344054] hover:bg-[#f8fafc] hover:border-[#009688] transition shadow-2xs"
                              title="Abrir en pestaña nueva"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-[#009688]" />
                              <span>Ver</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setSelectedShareTrip(trip)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#009688] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#00796b] transition shadow-2xs cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Compartir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Share Modal */}
        {selectedShareTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-scale-in border border-[#eaecf0] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f4f7]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#101828]">Compartir Itinerario</h3>
                    <p className="text-xs text-[#667085] truncate max-w-[200px]">{selectedShareTrip.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShareTrip(null)}
                  className="rounded-full p-2 text-[#667085] hover:bg-[#f2f4f7] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#344054]">Enlace público directo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getTripPublicUrl(selectedShareTrip.id)}
                    className="w-full rounded-2xl border border-[#eaecf0] bg-[#f8fafc] px-3 py-2 text-xs font-mono text-[#344054]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedShareTrip.id)}
                    className="rounded-2xl bg-[#009688] px-4 py-2 text-xs font-bold text-white hover:bg-[#00796b] transition cursor-pointer shrink-0"
                  >
                    {copiedId === selectedShareTrip.id ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Quick WhatsApp / Email share buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `¡Hola! Aquí tienes el itinerario detallado de tu viaje "${selectedShareTrip.name}": ${getTripPublicUrl(
                      selectedShareTrip.id
                    )}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar por WhatsApp</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Itinerario de viaje: ${selectedShareTrip.name}`
                  )}&body=${encodeURIComponent(
                    `Hola,\n\nPuedes consultar el itinerario completo en el siguiente enlace:\n${getTripPublicUrl(
                      selectedShareTrip.id
                    )}\n\n¡Buen viaje!`
                  )}`}
                  className="rounded-2xl border border-[#eaecf0] bg-[#f8fafc] p-3 text-center text-xs font-bold text-[#344054] hover:bg-[#f2f4f7] transition flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar por Email</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedShareTrip(null)}
                className="w-full rounded-2xl bg-[#f2f4f7] py-2.5 text-xs font-bold text-[#475467] hover:bg-[#e4e7ec] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
