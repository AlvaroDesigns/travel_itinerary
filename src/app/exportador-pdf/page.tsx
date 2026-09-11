'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel, Trip, Activity } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import {
  FileText,
  Search,
  Printer,
  Share2,
  Check,
  Plane,
  Calendar,
  User,
  Sparkles,
  LayoutGrid,
  List,
  Eye,
  X,
  MapPin,
  Clock,
  Bed,
  Utensils,
  Car,
  Compass,
  Download,
  Building,
} from 'lucide-react';

function formatFullDate(dateStr?: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function calculateDays(start?: string, end?: string) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) ? null : diffDays;
}

export default function ExportadorPdfPage() {
  const { trips, isLoading, user } = useTravel();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_client' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  // PDF Preview Modal State
  const [previewTrip, setPreviewTrip] = useState<Trip | null>(null);
  const [isAutoPrinting, setIsAutoPrinting] = useState(false);

  const filteredTrips = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = searchQuery.trim().toLowerCase();

    return trips.filter((trip) => {
      // Filter tab
      if (filterType === 'with_client' && !trip.clientName && !trip.clientId) {
        return false;
      }
      if (filterType === 'upcoming' && trip.startDate && trip.startDate < today) {
        return false;
      }

      // Search query
      if (!q) return true;
      return (
        trip.name.toLowerCase().includes(q) ||
        (trip.description && trip.description.toLowerCase().includes(q)) ||
        (trip.clientName && trip.clientName.toLowerCase().includes(q)) ||
        (trip.clientEmail && trip.clientEmail.toLowerCase().includes(q))
      );
    });
  }, [trips, searchQuery, filterType]);

  const handleCopyLink = (trip: Trip) => {
    const url = `${window.location.origin}/viaje/${trip.id}`;
    navigator.clipboard.writeText(url);
    setCopiedTripId(trip.id);
    setTimeout(() => setCopiedTripId(null), 2500);
  };

  const handleOpenPreview = (trip: Trip, autoPrint = false) => {
    setPreviewTrip(trip);
    if (autoPrint) {
      setIsAutoPrinting(true);
      setTimeout(() => {
        window.print();
        setIsAutoPrinting(false);
      }, 400);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group activities by date for the preview modal
  const groupedActivities = useMemo(() => {
    if (!previewTrip || !previewTrip.activities) return {};
    const groups: { [date: string]: Activity[] } = {};

    const sorted = [...previewTrip.activities].sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.time || '').localeCompare(b.time || '');
    });

    sorted.forEach((act) => {
      const d = act.date || previewTrip.startDate || 'Sin fecha';
      if (!groups[d]) groups[d] = [];
      groups[d].push(act);
    });

    return groups;
  }, [previewTrip]);

  if (isLoading) {
    return <WanderlustLoader />;
  }

  return (
    <DashboardShell activeMenu="exportar_pdf">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Exportador PDF
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Previsualiza e imprime tus itinerarios en formato PDF listo para entregar al cliente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-2xl border border-zinc-200/80 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-zinc-500">
              Total: <strong className="text-zinc-900">{filteredTrips.length}</strong> {filteredTrips.length === 1 ? 'itinerario' : 'itinerarios'}
            </div>
          </div>
        </div>

        {/* Tip Alert */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-4 shadow-2xs">
          <Sparkles className="h-5 w-5 shrink-0 text-[#0066FF] mt-0.5" />
          <div className="text-xs text-blue-950">
            <p className="font-bold">Vista previa y exportación directa</p>
            <p className="mt-0.5 text-zinc-600 leading-relaxed">
              Pulsa el icono del <strong>Ojo</strong> para previsualizar el documento completo o pulsa <strong>Exportar PDF</strong> para abrir directamente la ventana de impresión/guardado en PDF.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por destino, cliente o notas..."
              className="h-9.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todos ({trips.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('with_client')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                filterType === 'with_client'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Con cliente
            </button>
            <button
              type="button"
              onClick={() => setFilterType('upcoming')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                filterType === 'upcoming'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Próximos
            </button>
          </div>
        </div>

        {/* Content: Table vs Grid View */}
        {filteredTrips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-300" />
            <h3 className="mt-3 text-sm font-bold text-zinc-900">No se encontraron itinerarios</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Prueba con otro término de búsqueda o crea un nuevo viaje.
            </p>
            <Link
              href="/viajes?crear=true"
              className="wanderlust-primary-button mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <Plane className="h-3.5 w-3.5" />
              <span>Crear nuevo viaje</span>
            </Link>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-4 sm:px-6 whitespace-nowrap">Itinerario / Viaje</th>
                    <th className="px-4 py-4 whitespace-nowrap">Fechas & Duración</th>
                    <th className="px-4 py-4 whitespace-nowrap">Cliente Asignado</th>
                    <th className="px-4 py-4 whitespace-nowrap text-center">Actividades</th>
                    <th className="px-4 py-4 whitespace-nowrap">Presupuesto</th>
                    <th className="px-5 py-4 text-right sm:px-6 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredTrips.map((trip) => {
                    const days = calculateDays(trip.startDate, trip.endDate);
                    const hasClient = Boolean(trip.clientName || trip.clientId);

                    return (
                      <tr
                        key={trip.id}
                        className="transition-colors hover:bg-blue-50/30 group"
                      >
                        {/* Trip Name & Thumbnail */}
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                              {trip.imageUrl ? (
                                <Image
                                  src={trip.imageUrl}
                                  alt={trip.name}
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[#0052CC]">
                                  <Plane className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-zinc-900 truncate">
                                {trip.name}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0052CC]">
                                  <FileText className="h-2.5 w-2.5" />
                                  <span>PDF</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Dates & Duration */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="font-bold text-zinc-800">
                            {formatFullDate(trip.startDate)} - {formatFullDate(trip.endDate)}
                          </p>
                          {days && (
                            <span className="mt-0.5 inline-block text-[10px] font-semibold text-zinc-500">
                              {days} {days === 1 ? 'día de itinerario' : 'días de itinerario'}
                            </span>
                          )}
                        </td>

                        {/* Client */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {hasClient ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-extrabold text-[#0052CC]">
                                {(trip.clientName || 'C').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900">{trip.clientName}</p>
                                {trip.clientEmail && (
                                  <p className="text-[11px] text-zinc-400">{trip.clientEmail}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Sin cliente</span>
                          )}
                        </td>

                        {/* Activities */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-extrabold text-zinc-700">
                            {trip.activities?.length || 0}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="px-4 py-4 whitespace-nowrap font-extrabold text-zinc-900">
                          {trip.budget ? `${trip.budget.toLocaleString('es-ES')} €` : '-'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right sm:px-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(trip)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-blue-50 hover:text-[#0052CC] hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                              title={copiedTripId === trip.id ? '¡Enlace copiado!' : 'Copiar enlace público'}
                              aria-label="Copiar enlace público"
                            >
                              {copiedTripId === trip.id ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* View PDF Preview in Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(trip, false)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-blue-50 hover:text-[#0052CC] hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                              title="Previsualizar PDF del itinerario"
                              aria-label="Previsualizar PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Direct Export to PDF */}
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(trip, true)}
                              className="wanderlust-primary-button inline-flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                              title="Imprimir o guardar en PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Exportar PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => {
              const days = calculateDays(trip.startDate, trip.endDate);
              const hasClient = Boolean(trip.clientName || trip.clientId);

              return (
                <div
                  key={trip.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xs transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                    {trip.imageUrl ? (
                      <Image
                        src={trip.imageUrl}
                        alt={trip.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900 to-zinc-900">
                        <Plane className="h-10 w-10 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
                        <FileText className="h-3 w-3 text-[#93C5FD]" />
                        <span>PDF Listo</span>
                      </span>

                      {days && (
                        <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-zinc-900 shadow-xs">
                          {days} {days === 1 ? 'día' : 'días'}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-base font-extrabold text-white line-clamp-1 drop-shadow-xs">
                        {trip.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/90">
                        <Calendar className="h-3.5 w-3.5 text-[#93C5FD]" />
                        <span>
                          {formatFullDate(trip.startDate)} - {formatFullDate(trip.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 p-2.5 border border-zinc-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0052CC]">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">Cliente</p>
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {trip.clientName || 'Sin cliente asignado'}
                            </p>
                          </div>
                        </div>

                        {hasClient && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Asignado
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 text-center">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Actividades</p>
                          <p className="font-extrabold text-zinc-900 mt-0.5">
                            {trip.activities?.length || 0}
                          </p>
                        </div>
                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 text-center">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Presupuesto</p>
                          <p className="font-extrabold text-zinc-900 mt-0.5">
                            {trip.budget ? `${trip.budget.toLocaleString('es-ES')} €` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(trip)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-blue-50 hover:text-[#0052CC] hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                        title="Copiar enlace"
                      >
                        {copiedTripId === trip.id ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(trip, false)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-blue-50 hover:text-[#0052CC] hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                        title="Previsualizar PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(trip, true)}
                        className="wanderlust-primary-button inline-flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Exportar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* PDF DOCUMENT PREVIEW MODAL                                    */}
      {/* ============================================================= */}
      {previewTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity print:hidden"
            onClick={() => setPreviewTrip(null)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl z-10 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
            {/* Modal Header Toolbar (Hidden during browser print) */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-900 px-5 py-3.5 text-white print:hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-[#93C5FD] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm truncate">
                    Itinerario PDF: {previewTrip.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Documento digital preparado para el viajero
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="wanderlust-primary-button inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTrip(null)}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
                  aria-label="Cerrar vista previa"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-zinc-100/60 print:bg-white print:p-0">
              <div
                id="printable-itinerary-sheet"
                className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0"
              >
                {/* Agency Branding Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0052CC]">
                      <Plane className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold tracking-tight text-zinc-900">
                        {user?.agencyName || 'Wanderlust Agency'}
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Itinerario personalizado de viaje
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-zinc-500">
                    <p className="font-bold text-zinc-800">
                      Fecha de emisión: {new Date().toLocaleDateString('es-ES')}
                    </p>
                    <p>Ref: #{previewTrip.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Trip Hero Banner in Document */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-900 text-white relative">
                  {previewTrip.imageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={previewTrip.imageUrl}
                        alt={previewTrip.name}
                        fill
                        className="object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent" />
                    </div>
                  )}

                  <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tight text-white">
                      {previewTrip.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[#93C5FD]" />
                        <span>
                          {formatFullDate(previewTrip.startDate)} - {formatFullDate(previewTrip.endDate)}
                        </span>
                      </div>
                      {calculateDays(previewTrip.startDate, previewTrip.endDate) && (
                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                          {calculateDays(previewTrip.startDate, previewTrip.endDate)} días de aventura
                        </span>
                      )}
                      {previewTrip.clientName && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-[#93C5FD]" />
                          <span>Viajero: <strong>{previewTrip.clientName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trip Summary Details */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Viajero Principal</p>
                    <p className="text-xs font-bold text-zinc-900 mt-0.5">
                      {previewTrip.clientName || 'Cliente Particular'}
                    </p>
                    {previewTrip.clientEmail && (
                      <p className="text-[10px] text-zinc-500 truncate">{previewTrip.clientEmail}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Presupuesto Total</p>
                    <p className="text-xs font-bold text-zinc-900 mt-0.5">
                      {previewTrip.budget ? `${previewTrip.budget.toLocaleString('es-ES')} €` : 'A consultar'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Total Actividades</p>
                    <p className="text-xs font-bold text-zinc-900 mt-0.5">
                      {previewTrip.activities?.length || 0} incluidas
                    </p>
                  </div>
                </div>

                {/* Day-by-Day Activities */}
                <div className="mt-8 space-y-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-2">
                    Programa e Itinerario Detallado
                  </h3>

                  {Object.keys(groupedActivities).length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-400">
                      No hay actividades configuradas para este viaje aún.
                    </p>
                  ) : (
                    Object.entries(groupedActivities).map(([date, acts], dayIndex) => (
                      <div key={date} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0066FF] text-[11px] font-extrabold text-white">
                            {dayIndex + 1}
                          </span>
                          <h4 className="text-xs font-extrabold text-zinc-900">
                            {formatFullDate(date)}
                          </h4>
                        </div>

                        <div className="ml-3 space-y-2 border-l-2 border-blue-100 pl-4">
                          {acts.map((act) => (
                            <div
                              key={act.id}
                              className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                                <div className="flex items-center gap-2">
                                  {act.type === 'flight' && <Plane className="h-3.5 w-3.5 text-[#0066FF]" />}
                                  {act.type === 'hotel' && <Bed className="h-3.5 w-3.5 text-indigo-600" />}
                                  {act.type === 'food' && <Utensils className="h-3.5 w-3.5 text-amber-600" />}
                                  {act.type === 'transfer' && <Car className="h-3.5 w-3.5 text-sky-600" />}
                                  {act.type === 'excursion' && <Compass className="h-3.5 w-3.5 text-emerald-600" />}

                                  <span>
                                    {act.type === 'flight' && `Vuelo ${(act as any).airline || ''} ${(act as any).flightNumber || ''} (${(act as any).origin || ''} → ${(act as any).destination || ''})`}
                                    {act.type === 'hotel' && `Hotel: ${(act as any).hotelName || 'Alojamiento'}`}
                                    {act.type === 'food' && `Gastronomía: ${(act as any).restaurantName || 'Comida'}`}
                                    {act.type === 'transfer' && `Traslado: ${(act as any).origin || ''} → ${(act as any).destination || ''}`}
                                    {act.type === 'excursion' && ((act as any).title || 'Excursión / Visita')}
                                  </span>
                                </div>

                                {act.time && (
                                  <span className="font-mono text-[11px] text-zinc-500">
                                    {act.time}
                                  </span>
                                )}
                              </div>

                              {act.description && (
                                <p className="mt-1 text-zinc-600 leading-relaxed text-[11px]">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Notes */}
                <div className="mt-10 border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400">
                  <p>Este documento es un itinerario informativo emitido por {user?.agencyName || 'Wanderlust'}.</p>
                  <p className="mt-0.5">Para soporte o cambios en el viaje, contacta con tu agente de viajes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
