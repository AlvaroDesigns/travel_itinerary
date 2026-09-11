'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel, Trip } from '@/context/TravelContext';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { HeroUIDateRangePicker } from '@/components/HeroUIDateRangePicker';
import { DashboardShell } from '@/components/DashboardShell';
import { TableSkeleton } from '@/components/TableSkeleton';
import { CreateTripModal } from '@/components/CreateTripModal';
import { TravelerMobileHome } from '@/components/TravelerMobileHome';
import {
  Search,
  Plus,
  Compass,
  Plane,
  Calendar,
  DollarSign,
  Tag,
  Star,
  User,
  X,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  Download,
  List,
  Grid,
  Settings,
  Eye,
  Edit,
  UserCheck,
  Luggage,
  Users,
} from 'lucide-react';

const PRESET_IMAGES = [
  {
    name: 'Riviera Maya',
    url: 'https://images.unsplash.com/photo-1512815046276-89d511254976?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'París',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Tokio',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Roma',
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Costa Rica',
    url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
  },
];

// Helper to format dates as DD/MM/YYYY
function formatFullDate(dateStr?: string) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

// Helper to generate deterministic trip code
function getTripCode(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let n = Math.abs(hash) + 12345678;
  for (let i = 0; i < 10; i++) {
    result += chars[n % chars.length];
    n = Math.floor(n / chars.length) + (i * 7 + 11);
  }
  return result;
}

export default function MisViajesPage() {
  const { trips, clients, addTrip, deleteTrip, addClient, assignTripClient, user, isLoading } = useTravel();
  const router = useRouter();

  // Filters & Search & View Mode
  const [filterPill, setFilterPill] = useState<'todos' | 'proximos' | 'en_curso' | 'completados' | 'borradores'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal State for New Trip
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(1500);

  // Modal State for Share & Change Owner
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [changeOwnerTrip, setChangeOwnerTrip] = useState<Trip | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [ownerChangeSuccess, setOwnerChangeSuccess] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Modal State for Assign Client to Trip
  const [assignClientTrip, setAssignClientTrip] = useState<Trip | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isQuickCreateClientOpen, setIsQuickCreateClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isAssigningClient, setIsAssigningClient] = useState(false);
  // Modal State for Delete Confirmation
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDeleteTrips = async () => {
    if (selectedTrips.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedTrips.map((id) => deleteTrip(id)));
      setSelectedTrips([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to bulk delete trips:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return trips.filter((trip) => {
      const matchSearch =
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTripCode(trip.id).toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterPill === 'proximos') {
        return trip.startDate > today;
      }
      if (filterPill === 'en_curso') {
        return trip.startDate <= today && trip.endDate >= today;
      }
      if (filterPill === 'completados') {
        return trip.endDate < today;
      }

      return true;
    });
  }, [trips, searchQuery, filterPill]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSelectAll = () => {
    if (selectedTrips.length === filteredTrips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(filteredTrips.map((t) => t.id));
    }
  };

  const handleToggleSelectTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrips((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDuplicateTrip = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    await addTrip({
      name: `${trip.name} (Copia)`,
      startDate: trip.startDate,
      endDate: trip.endDate,
      imageUrl: trip.imageUrl,
      description: trip.description,
      notes: trip.notes,
      budget: trip.budget,
    });
  };

  const handleCreateTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    await addTrip({
      name: tripName,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
      imageUrl,
      description: description || 'Itinerario de viaje exclusivo.',
      notes: '',
      budget: Number(budget) || 0,
    });

    setIsCreateModalOpen(false);
    setTripName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  const getUserInitials = (emailOrName?: string) => {
    if (!emailOrName) return 'AS';
    const parts = emailOrName.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailOrName.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user?.email) return 'Alvaro Saiz';
    return user.email.split('@')[0];
  };

  const getAvatarVibrantBg = (seed?: string) => {
    const styles = [
      'bg-[#0066ff] text-white shadow-xs',
      'bg-[#0066FF] text-white shadow-xs',
      'bg-[#7c3aed] text-white shadow-xs',
      'bg-[#e11d48] text-white shadow-xs',
      'bg-[#d97706] text-white shadow-xs',
      'bg-[#0284c7] text-white shadow-xs',
    ];
    if (!seed) return styles[0];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
    }
    return styles[Math.abs(hash) % styles.length];
  };

  if (isLoading) {
    return (
      <DashboardShell activeMenu="viajes">
        <div className="w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Mis viajes</h1>
            <p className="text-xs text-[#667085] mt-0.5">
              Gestiona y personaliza tus itinerarios, actividades y presupuestos de viaje.
            </p>
          </div>
          <TableSkeleton rows={6} columns={4} showFilters={true} />
        </div>
      </DashboardShell>
    );
  }

  const isAgent =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.role === 'superuser' ||
    (Boolean(user?.tenantId) && user?.tenantId !== 'particular');

  return (
    <>
      {!isAgent && (
        <div className="block md:hidden">
          <TravelerMobileHome onOpenCreateTrip={() => setIsCreateModalOpen(true)} />
        </div>
      )}
      <div className={!isAgent ? 'hidden md:block' : 'block'}>
        <DashboardShell activeMenu="viajes" onOpenCreateTrip={() => setIsCreateModalOpen(true)}>
          <div onClick={() => setOpenDropdownId(null)} className="w-full space-y-5">
            {/* View Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
                Mis viajes
              </h1>
              <p className="text-xs text-[#667085] mt-0.5">
                Gestiona y personaliza tus itinerarios, actividades y presupuestos de viaje.
              </p>
        </div>

        {/* HeroUI Tabs Segmented Filter */}
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs">
            {[
              { id: 'todos', label: 'Todo' },
              { id: 'proximos', label: 'Próximos viajes' },
              { id: 'en_curso', label: 'En curso' },
              { id: 'completados', label: 'Completados' },
              { id: 'borradores', label: 'Borradores' },
            ].map((tab) => {
              const isSelected = filterPill === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterPill(tab.id as typeof filterPill)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? 'bg-white text-[#18181b] shadow-sm font-bold'
                      : 'text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-3xl border border-[#eaecf0] bg-white p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar viajes..."
                className="w-full rounded-2xl border border-[#d0d5dd] bg-white py-2 pl-9 pr-3 text-xs text-[#101828] placeholder-[#98a2b3] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
              />
            </div>

            {/* Filtros Button */}
            <button className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] transition-all cursor-pointer shrink-0">
              <span>Filtros</span>
            </button>

            {/* Counter */}
            <span className="text-xs font-semibold text-[#475467] hidden md:inline shrink-0">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'Viaje' : 'Viajes'}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-full border border-[#d0d5dd] bg-[#f9fafb] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Vista de lista"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085] hover:text-[#101828]'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista de cuadrícula"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085] hover:text-[#101828]'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>

            {/* Exportar Button */}
            <button className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] shadow-xs transition-all cursor-pointer">
              <Download className="h-3.5 w-3.5 text-[#667085]" />
              <span className="hidden xs:inline">Exportar</span>
            </button>

            {/* + Crear Viaje Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Crear viaje</span>
            </button>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedTrips.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200/90 bg-blue-50/90 px-4 py-2.5 text-xs shadow-xs animate-scale-in">
            <div className="flex items-center gap-2 text-[#003399] font-bold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF] text-[10px] text-white shadow-xs">
                {selectedTrips.length}
              </span>
              <span>
                {selectedTrips.length === 1
                  ? '1 viaje seleccionado'
                  : `${selectedTrips.length} viajes seleccionados`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar seleccionados ({selectedTrips.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrips([])}
                className="rounded-full border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-all cursor-pointer"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Table / Grid Content */}
        {viewMode === 'table' ? (
          <div className="w-full overflow-visible rounded-3xl border border-[#eaecf0] bg-white shadow-xs">
            <div className="w-full overflow-x-auto lg:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#eaecf0] bg-white text-[#475467]">
                    <th className="w-12 px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTrips.length > 0 && selectedTrips.length === filteredTrips.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-[#d0d5dd] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Código</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Título</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Visualizaciones</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Fecha de inicio</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Fecha de fin</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Duración</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Propietario</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Países</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Creado +</th>
                    <th className="px-4 py-3.5 font-semibold text-[#475467]">Cliente</th>
                    <th className="w-12 px-4 py-3.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0]">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-zinc-500">
                        <Plane className="mx-auto h-8 w-8 text-zinc-400 mb-2 opacity-40" />
                        <p className="font-semibold text-zinc-700">No se encontraron viajes</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Prueba con otro término de búsqueda o crea uno nuevo con el Agente IA.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip, index) => {
                      const tripCode = getTripCode(trip.id);
                      const startD = trip.startDate ? new Date(trip.startDate) : null;
                      const endD = trip.endDate ? new Date(trip.endDate) : null;
                      const durationDays =
                        startD && endD
                          ? Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)))
                          : 0;
                      const isNearBottom = index >= 2 && index >= filteredTrips.length - 2;
                      const isDropdownOpen = openDropdownId === trip.id;

                      return (
                        <tr
                          key={trip.id}
                          onClick={() => router.push(`/viaje/${trip.id}`)}
                          className={`group transition-colors hover:bg-[#f8fafc] cursor-pointer ${
                            selectedTrips.includes(trip.id) ? 'bg-[#f0fdfa]' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedTrips.includes(trip.id)}
                              onChange={(e) => handleToggleSelectTrip(trip.id, e as unknown as React.MouseEvent)}
                              className="h-4 w-4 rounded border-[#d0d5dd] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                            />
                          </td>

                          {/* Code Pill */}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f8] px-2.5 py-1 text-[11px] font-bold text-[#344054]">
                              <span>{tripCode}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyCode(tripCode, e)}
                                title="Copiar código"
                                className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                              >
                                {copiedCode === tripCode ? (
                                  <Check className="h-3 w-3 text-[#0066FF]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3 font-bold text-[#101828]">
                            <span className="hover:text-[#0066FF] transition-colors">{trip.name}</span>
                          </td>

                          {/* Views Pill */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2fe] px-2 py-0.5 text-[11px] font-bold text-[#0369a1]">
                              <Eye className="h-3 w-3" /> 0
                            </span>
                          </td>

                          {/* Start Date */}
                          <td className="px-4 py-3 text-[#475467]">{formatFullDate(trip.startDate)}</td>

                          {/* End Date */}
                          <td className="px-4 py-3 text-[#475467]">{formatFullDate(trip.endDate)}</td>

                          {/* Duration */}
                          <td className="px-4 py-3 text-[#475467]">{durationDays}</td>

                          {/* Owner */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${getAvatarVibrantBg(
                                  trip.id
                                )}`}
                              >
                                {getUserInitials(user?.email)}
                              </span>
                              <span className="font-semibold text-[#344054] text-xs">
                                {getUserDisplayName()}
                              </span>
                            </div>
                          </td>

                          {/* Countries */}
                          <td className="px-4 py-3 text-[#475467]">-</td>

                          {/* Created */}
                          <td className="px-4 py-3 text-[#475467] text-[11px]">
                            {trip.startDate ? `${trip.startDate.split('-').reverse().join('/')}, 11:37` : '-'}
                          </td>

                          {/* Client */}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const assignedClient = clients.find((c) => c.id === trip.clientId);
                              if (assignedClient) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignClientTrip(trip);
                                      setSelectedClientId(assignedClient.id);
                                      setIsQuickCreateClientOpen(false);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0066FF] hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    <UserCheck className="h-3 w-3" />
                                    <span className="truncate max-w-[120px]">{assignedClient.name}</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignClientTrip(trip);
                                    setSelectedClientId('');
                                    setIsQuickCreateClientOpen(false);
                                  }}
                                  className="text-[11px] font-medium text-[#667085] hover:text-[#0066FF] hover:underline cursor-pointer"
                                >
                                  Asignar cliente
                                </button>
                              );
                            })()}
                          </td>

                          {/* Actions Three Dots */}
                          <td className={`px-4 py-3 text-center relative ${isDropdownOpen ? 'z-30' : ''}`} onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(isDropdownOpen ? null : trip.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#98a2b3] hover:bg-[#eaecf0] hover:text-[#101828] transition-colors cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40 bg-black/30 sm:bg-transparent"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                    }}
                                  />

                                  {/* Mobile Bottom Action Sheet (sm:hidden) */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="sm:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-[#eaecf0] bg-white p-5 shadow-2xl animate-slide-up text-left space-y-1"
                                  >
                                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#eaecf0]">
                                      <div className="min-w-0 pr-2">
                                        <p className="text-sm font-bold text-[#101828] truncate">{trip.name}</p>
                                        <p className="text-xs text-[#667085] font-semibold">{tripCode}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setOpenDropdownId(null)}
                                        className="rounded-full p-1.5 text-[#667085] hover:bg-[#f4f5f8]"
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/viaje/${trip.id}`);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4 text-[#0066FF]" />
                                      <span>Editar viaje</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/viaje/${trip.id}/configuracion`);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Settings className="h-4 w-4 text-[#667085]" />
                                      <span>Configuración</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setShareTrip(trip);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <ExternalLink className="h-4 w-4 text-[#667085]" />
                                      <span>Compartir enlace</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setChangeOwnerTrip(trip);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <User className="h-4 w-4 text-[#667085]" />
                                      <span>Cambiar propietario</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        setOpenDropdownId(null);
                                        handleDuplicateTrip(trip, e);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Copy className="h-4 w-4 text-[#667085]" />
                                      <span>Duplicar</span>
                                    </button>

                                    <div className="my-1 border-t border-[#eaecf0]" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setTripToDelete(trip);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-[#d92d20] hover:bg-[#fef3f2] cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4 text-[#d92d20]" />
                                      <span>Eliminar viaje</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setOpenDropdownId(null)}
                                      className="mt-2 w-full rounded-2xl bg-[#f4f5f8] py-3 text-xs font-bold text-[#475467] hover:bg-[#eaecf0]"
                                    >
                                      Cancelar
                                    </button>
                                  </div>

                                  {/* Desktop Floating Dropdown (hidden sm:block) */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`hidden sm:block absolute right-2 ${
                                      isNearBottom ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
                                    } z-50 w-52 rounded-2xl border border-[#eaecf0] bg-white p-1.5 shadow-2xl text-left animate-scale-in`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/viaje/${trip.id}`);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Edit className="h-3.5 w-3.5 text-[#667085]" />
                                      <span>Editar viaje</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        router.push(`/viaje/${trip.id}/configuracion`);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Settings className="h-3.5 w-3.5 text-[#667085]" />
                                      <span>Configuración</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setShareTrip(trip);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 text-[#667085]" />
                                      <span>Compartir enlace</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setChangeOwnerTrip(trip);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <User className="h-3.5 w-3.5 text-[#667085]" />
                                      <span>Cambiar propietario</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDuplicateTrip(trip, e)}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] cursor-pointer"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-[#667085]" />
                                      <span>Duplicar</span>
                                    </button>

                                    <div className="my-1 border-t border-[#eaecf0]" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setTripToDelete(trip);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#d92d20] hover:bg-[#fef3f2] cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-[#d92d20]" />
                                      <span>Eliminar</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eaecf0] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Página anterior"
                  disabled
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d0d5dd] bg-white text-[#667085] hover:bg-zinc-50 hover:text-[#101828] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#667085] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C6FF] text-xs font-bold text-white shadow-xs hover:opacity-90 transition-colors cursor-pointer"
                >
                  1
                </button>
                <button
                  type="button"
                  title="Página siguiente"
                  disabled
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d0d5dd] bg-white text-[#667085] hover:bg-zinc-50 hover:text-[#101828] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#667085] transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#475467]">
                <span>Elementos por página</span>
                <select className="rounded-xl border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#101828] focus:border-[#0066FF] focus:outline-hidden cursor-pointer">
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/viaje/${trip.id}`)}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#eaecf0] bg-white shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              >
                <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={trip.imageUrl || PRESET_IMAGES[0].url}
                    alt={trip.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                        {getTripCode(trip.id)}
                      </span>
                      <h3 className="text-base font-bold leading-tight">{trip.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <p className="line-clamp-2 text-xs text-[#667085] leading-relaxed mb-4">
                    {trip.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-[#eaecf0] pt-3 text-xs text-[#475467]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#0066FF]" />
                      <span>{formatFullDate(trip.startDate)}</span>
                    </div>
                    <span className="font-bold text-[#0066FF]">
                      {trip.budget > 0 ? `${trip.budget} €` : 'Personalizado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODALS (Create Trip, Share, Owner, Client Assign)             */}
      {/* ============================================================= */}
      {/* 1. Modal: Crear Viaje con 3 opciones y galería de plantillas  */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* 2. Modal: Compartir Enlace Público */}
      {shareTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-base font-bold text-[#101828]">Compartir itinerario</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareTrip(null)}
                className="rounded-full p-1 text-[#667085] hover:bg-[#f4f5f8] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-[#475467] leading-relaxed">
              Copia este enlace para compartir el portal interactivo del viaje con tu cliente.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#d0d5dd] bg-[#f8fafc] p-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/publico/${getTripCode(shareTrip.id)}`}
                className="w-full bg-transparent text-xs text-[#101828] font-mono outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/publico/${getTripCode(shareTrip.id)}`
                  );
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 2000);
                }}
                className="rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
              >
                {copiedShareLink ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShareTrip(null)}
                className="rounded-full border border-[#d0d5dd] px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Cambiar Propietario */}
      {changeOwnerTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#0066FF]" />
                <h3 className="text-base font-bold text-[#101828]">Cambiar propietario</h3>
              </div>
              <button
                type="button"
                onClick={() => setChangeOwnerTrip(null)}
                className="rounded-full p-1 text-[#667085] hover:bg-[#f4f5f8] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOwnerChangeSuccess(true);
                setTimeout(() => {
                  setOwnerChangeSuccess(false);
                  setChangeOwnerTrip(null);
                }, 1500);
              }}
              className="mt-4 space-y-4"
            >
              <p className="text-xs text-[#475467]">
                Introduce el correo del nuevo agente o administrador que gestionará <strong>{changeOwnerTrip.name}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="agente@wanderlust.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                />
              </div>

              {ownerChangeSuccess && (
                <div className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-[#0066FF]">
                  ✓ Propietario transferido correctamente
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setChangeOwnerTrip(null)}
                  className="rounded-full border border-[#d0d5dd] px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Asignar Cliente a Viaje */}
      {assignClientTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#0066FF]" />
                <div>
                  <h3 className="text-base font-bold text-[#101828]">Asignar cliente al viaje</h3>
                  <p className="text-xs text-[#667085]">{assignClientTrip.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignClientTrip(null)}
                className="rounded-full p-1 text-[#667085] hover:bg-[#f4f5f8] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isQuickCreateClientOpen ? (
              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[#344054]">Seleccionar cliente existente</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCreateClientOpen(true)}
                      className="font-bold text-[#0066FF] hover:underline cursor-pointer"
                    >
                      + Crear nuevo cliente
                    </button>
                  </div>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  >
                    <option value="">-- Sin cliente asignado --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClientId && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs">
                    {(() => {
                      const selClient = clients.find((c) => c.id === selectedClientId);
                      if (!selClient) return null;
                      return (
                        <div className="space-y-1">
                          <p className="font-bold text-[#101828]">{selClient.name}</p>
                          {selClient.email && <p className="text-[#475467]">📧 {selClient.email}</p>}
                          {selClient.phone && <p className="text-[#475467]">📞 {selClient.phone}</p>}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#eaecf0]">
                  {assignClientTrip.clientId ? (
                    <button
                      type="button"
                      disabled={isAssigningClient}
                      onClick={async () => {
                        setIsAssigningClient(true);
                        try {
                          await assignTripClient(assignClientTrip.id, null);
                          setAssignClientTrip(null);
                        } finally {
                          setIsAssigningClient(false);
                        }
                      }}
                      className="text-xs font-semibold text-[#d92d20] hover:underline cursor-pointer"
                    >
                      Desasignar cliente
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignClientTrip(null)}
                      className="rounded-full border border-[#d0d5dd] px-4 py-2 font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isAssigningClient}
                      onClick={async () => {
                        setIsAssigningClient(true);
                        try {
                          await assignTripClient(assignClientTrip.id, selectedClientId || null);
                          setAssignClientTrip(null);
                        } finally {
                          setIsAssigningClient(false);
                        }
                      }}
                      className="rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-5 py-2 font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      Guardar asignación
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Quick Create Form */
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newClientName.trim()) return;
                  setIsAssigningClient(true);
                  try {
                    const created = await addClient(
                      {
                        name: newClientName.trim(),
                        email: newClientEmail.trim(),
                        phone: newClientPhone.trim(),
                        documentId: '',
                        nationality: '',
                        notes: '',
                        status: 'activo',
                      },
                      [assignClientTrip.id]
                    );

                    if (created) {
                      setAssignClientTrip(null);
                      setIsQuickCreateClientOpen(false);
                    }
                  } finally {
                    setIsAssigningClient(false);
                  }
                }}
                className="mt-5 space-y-3 text-xs"
              >
                <div>
                  <label className="mb-1 block font-bold text-[#344054]">Nombre del nuevo cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Carlos Mendoza"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#344054]">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="carlos@ejemplo.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#344054]">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaecf0]">
                  <button
                    type="button"
                    onClick={() => setIsQuickCreateClientOpen(false)}
                    className="rounded-full border border-[#d0d5dd] px-4 py-2 font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                  >
                    Volver a la lista
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigningClient}
                    className="rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-5 py-2 font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    Crear y asignar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-bold text-[#101828]">
              ¿Eliminar este viaje?
            </h3>
            <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el viaje <strong>"{tripToDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="flex-1 rounded-full border border-[#d0d5dd] bg-white py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = tripToDelete.id;
                  setTripToDelete(null);
                  await deleteTrip(id);
                }}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Bulk Action Bar (fixed bottom pill) */}
      {selectedTrips.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-[#eaecf0] bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md animate-slide-up">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#0066FF]">
            {selectedTrips.length}
          </span>
          <span className="text-xs font-bold text-[#101828]">
            {selectedTrips.length === 1 ? '1 viaje seleccionado' : `${selectedTrips.length} viajes seleccionados`}
          </span>
          <div className="h-4 w-[1px] bg-[#eaecf0]" />
          <button
            type="button"
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTrips([])}
            className="inline-flex items-center gap-1 rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancelar</span>
          </button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-bold text-[#101828]">
              ¿Eliminar {selectedTrips.length} {selectedTrips.length === 1 ? 'viaje' : 'viajes'}?
            </h3>
            <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente los <strong>{selectedTrips.length} viajes</strong> seleccionados? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 rounded-full border border-[#d0d5dd] bg-white py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteTrips}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-all disabled:opacity-50"
              >
                {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  </div>
</>
  );
}
