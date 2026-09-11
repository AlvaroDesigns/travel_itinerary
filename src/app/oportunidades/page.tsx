'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTravel, Opportunity, OpportunityStage } from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { OpportunityModal } from '@/components/OpportunityModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { isAgencyUser } from '@/lib/user-utils';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import {
  Search,
  Plus,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface StageColumn {
  key: OpportunityStage;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

const STAGE_COLUMNS: StageColumn[] = [
  {
    key: 'nuevo',
    label: 'Nuevo',
    badgeBg: 'bg-blue-50 border border-blue-200/80',
    badgeText: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    key: 'contactado',
    label: 'Contactado',
    badgeBg: 'bg-purple-50 border border-purple-200/80',
    badgeText: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  {
    key: 'propuesta',
    label: 'Propuesta',
    badgeBg: 'bg-amber-50 border border-amber-200/80',
    badgeText: 'text-amber-800',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'ganada',
    label: 'Ganada',
    badgeBg: 'bg-emerald-50 border border-emerald-200/80',
    badgeText: 'text-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  {
    key: 'perdido',
    label: 'Perdido',
    badgeBg: 'bg-rose-50 border border-rose-200/80',
    badgeText: 'text-rose-700',
    dotColor: 'bg-rose-500',
  },
];

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'Hoy';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Hoy';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `Hace ${diffDays} d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function OportunidadesPage() {
  const { opportunities, updateOpportunity, deleteOpportunity, user, isLoading } = useTravel();
  const router = useRouter();

  const isAgency = isAgencyUser(user);

  useEffect(() => {
    if (!isLoading && !isAgency) {
      router.replace('/viajes');
    }
  }, [isLoading, isAgency, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [createDefaultStage, setCreateDefaultStage] = useState<OpportunityStage>('nuevo');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [oppToDelete, setOppToDelete] = useState<string | null>(null);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opp.clientName && opp.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opp.destination && opp.destination.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchAgent = selectedAgent === 'all' || opp.agentName === selectedAgent;

      return matchSearch && matchAgent;
    });
  }, [opportunities, searchQuery, selectedAgent]);

  // Unique agents for filter
  const uniqueAgents = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.agentName) set.add(o.agentName);
    });
    return Array.from(set);
  }, [opportunities]);

  // Total amount in pipeline
  const totalPipelineAmount = useMemo(() => {
    return opportunities.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
  }, [opportunities]);

  // Won Amount
  const wonAmount = useMemo(() => {
    return opportunities
      .filter((o) => o.stage === 'ganada')
      .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
  }, [opportunities]);

  // Average Deal Size
  const avgDealSize = useMemo(() => {
    if (opportunities.length === 0) return 0;
    return Math.round(totalPipelineAmount / opportunities.length);
  }, [opportunities, totalPipelineAmount]);

  const handleOpenCreate = (stage: OpportunityStage = 'nuevo') => {
    setEditingOpportunity(null);
    setCreateDefaultStage(stage);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleDelete = (id: string) => {
    setOppToDelete(id);
    setActiveDropdownId(null);
  };

  const confirmDeleteOpportunity = async () => {
    if (oppToDelete) {
      await deleteOpportunity(oppToDelete);
      setOppToDelete(null);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedOppId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: OpportunityStage) => {
    if (draggedOppId) {
      await updateOpportunity(draggedOppId, { stage: targetStage });
      setDraggedOppId(null);
    }
  };

  if (isLoading || !isAgency) {
    return (
      <DashboardShell activeMenu="viajes">
        <WanderlustLoader />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell activeMenu="oportunidades">
      <div className="w-full space-y-6 text-left">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight">
              Travel CRM
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenCreate('nuevo')}
              className="flex items-center gap-2 rounded-full bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0052CC] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva oportunidad</span>
            </button>
          </div>
        </div>

        {/* Real CRM Key Performance Indicators (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pipeline Total</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-zinc-950">
              {formatCurrency(totalPipelineAmount)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-500">
              {opportunities.length} {opportunities.length === 1 ? 'oportunidad activa' : 'oportunidades en curso'}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ventas Ganadas</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">
              {formatCurrency(wonAmount)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-500">
              {opportunities.filter((o) => o.stage === 'ganada').length} viajes confirmados
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ticket Medio</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-zinc-950">
              {formatCurrency(avgDealSize)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-500">
              Valor promedio por presupuesto
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Asesores Activos</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-zinc-950">
              {uniqueAgents.length || 1}
            </p>
            <p className="mt-1 text-[11px] font-medium text-zinc-500">
              Asignando y gestionando clientes
            </p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por título, destino o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-[#0066FF] focus:bg-white focus:ring-2 focus:ring-[#0066FF]/15"
              />
            </div>

            {uniqueAgents.length > 0 && (
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#0066FF] focus:bg-white"
              >
                <option value="all">Todos los agentes</option>
                {uniqueAgents.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs font-semibold text-zinc-500">
            Mostrando <strong className="text-zinc-900">{filteredOpportunities.length}</strong> oportunidades
          </div>
        </div>

        {/* Clean SaaS Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-6">
          {STAGE_COLUMNS.map((col) => {
            const colOpps = filteredOpportunities.filter((o) => o.stage === col.key);
            const colTotal = colOpps.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

            return (
              <div
                key={col.key}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.key)}
                className="flex flex-col rounded-2xl border border-zinc-200/80 bg-[#f8fafc] p-3 min-h-[540px]"
              >
                {/* Clean Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/70">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-bold text-zinc-900">
                      {col.label}
                    </span>
                    <span className="rounded-md bg-white border border-zinc-200/80 px-1.5 py-0.2 text-[10px] font-bold text-zinc-600">
                      {colOpps.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-zinc-600">
                      {formatCurrency(colTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(col.key)}
                      title={`Añadir oportunidad en ${col.label}`}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-white hover:text-zinc-700 hover:shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cards Stack */}
                <div className="flex-1 space-y-2.5">
                  {colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={() => handleDragStart(opp.id)}
                      className="group relative rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md hover:border-zinc-300 transition-all cursor-grab active:cursor-grabbing text-left space-y-2.5"
                    >
                      {/* Deal Title & Dropdown Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => handleOpenEdit(opp)}
                          className="text-xs font-bold text-zinc-900 hover:text-[#0066FF] transition-colors line-clamp-2 cursor-pointer leading-snug"
                        >
                          {opp.title}
                        </h4>

                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === opp.id ? null : opp.id);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {activeDropdownId === opp.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-7 z-30 w-44 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl text-xs animate-scale-in"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(opp)}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                                <span>Editar</span>
                              </button>

                              <div className="pt-1 mt-1 border-t border-zinc-100">
                                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                  Mover a:
                                </p>
                                {STAGE_COLUMNS.map((st) => {
                                  if (st.key === opp.stage) return null;
                                  return (
                                    <button
                                      key={st.key}
                                      type="button"
                                      onClick={async () => {
                                        await updateOpportunity(opp.id, { stage: st.key });
                                        setActiveDropdownId(null);
                                      }}
                                      className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                    >
                                      <ArrowRight className="h-3 w-3 text-[#0066FF]" />
                                      <span>{st.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="pt-1 mt-1 border-t border-zinc-100">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(opp.id)}
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Destination Tag */}
                      {opp.destination && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-blue-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md w-fit max-w-full">
                          <MapPin className="h-3 w-3 text-[#0066FF] shrink-0" />
                          <span className="truncate">{opp.destination}</span>
                        </div>
                      )}

                      {/* Client Info */}
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                        <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-medium">
                          {opp.clientName || 'Sin cliente asignado'}
                        </span>
                      </div>

                      {/* Agent / Travelers Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 pt-0.5">
                        {opp.travelersCount && (
                          <span>{opp.travelersCount} {opp.travelersCount === 1 ? 'viajero' : 'viajeros'}</span>
                        )}
                        {opp.agentName && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-zinc-700 truncate max-w-[110px]">
                              {opp.agentName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Card Footer: Time & Amount */}
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-zinc-400">
                          {formatRelativeTime(opp.createdAt)}
                        </span>
                        <span className="text-xs font-extrabold text-zinc-950">
                          {formatCurrency(opp.amount, opp.currency)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {colOpps.length === 0 && (
                    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 bg-white/40 p-4 text-center">
                      <span className="text-[11px] font-medium text-zinc-400">
                        Arrastra aquí o pulsa +
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Opportunity Modal (Create / Edit) */}
        <OpportunityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          opportunityToEdit={editingOpportunity}
          defaultStage={createDefaultStage}
        />

        {/* Delete Opportunity Confirm Modal */}
        <ConfirmModal
          isOpen={!!oppToDelete}
          onClose={() => setOppToDelete(null)}
          onConfirm={confirmDeleteOpportunity}
          title="Eliminar oportunidad comercial"
          message="¿Estás seguro de que deseas eliminar esta oportunidad? Esta acción no se puede deshacer."
          confirmText="Eliminar oportunidad"
          cancelText="Cancelar"
          variant="danger"
        />
      </div>
    </DashboardShell>
  );
}
