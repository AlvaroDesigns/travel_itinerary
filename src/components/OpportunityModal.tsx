'use client';

import React, { useState, useEffect } from 'react';
import { useTravel, Opportunity, OpportunityStage } from '@/context/TravelContext';
import {
  X,
  Sparkles,
  DollarSign,
  User,
  Calendar,
  MapPin,
  Users,
  FileText,
  Loader2,
  ChevronDown,
  Mail,
  Phone,
  Check,
} from 'lucide-react';

interface CompanyAgent {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityToEdit?: Opportunity | null;
  defaultStage?: OpportunityStage;
}

export function OpportunityModal({
  isOpen,
  onClose,
  opportunityToEdit,
  defaultStage = 'nuevo',
}: OpportunityModalProps) {
  const { clients, user, addOpportunity, updateOpportunity } = useTravel();

  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<OpportunityStage>(defaultStage);
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('EUR');
  const [agentName, setAgentName] = useState('');

  // Agents list from API
  const [companyAgents, setCompanyAgents] = useState<CompanyAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Contact selection mode
  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Optional details
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [travelersCount, setTravelersCount] = useState<number | ''>(2);
  const [initialNotes, setInitialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch company agents
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setCompanyAgents(data);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      } finally {
        if (isMounted) setIsLoadingAgents(false);
      }

      // Fallback default agents list if empty or error
      if (isMounted) {
        const fallback = [
          {
            id: 1,
            email: user?.email || 'alvaro@wanderlust.com',
            name: user?.email ? user.email.split('@')[0] : 'Álvaro González',
            role: 'admin',
          },
          { id: 2, email: 'laura@wanderlust.com', name: 'Laura Gómez', role: 'user' },
          { id: 3, email: 'carlos@wanderlust.com', name: 'Carlos Mendoza', role: 'user' },
          { id: 4, email: 'elena@wanderlust.com', name: 'Elena Rivas', role: 'user' },
        ];
        setCompanyAgents(fallback);
      }
    };

    fetchAgents();
    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (opportunityToEdit) {
      setTitle(opportunityToEdit.title);
      setStage(opportunityToEdit.stage);
      setAmount(opportunityToEdit.amount || '');
      setCurrency(opportunityToEdit.currency || 'EUR');
      setAgentName(opportunityToEdit.agentName || (user?.email ? user.email.split('@')[0] : 'Álvaro González'));
      setSelectedClientId(opportunityToEdit.clientId || '');
      setContactMode('existing');
      setStartDate(opportunityToEdit.startDate || '');
      setEndDate(opportunityToEdit.endDate || '');
      setDestination(opportunityToEdit.destination || '');
      setTravelersCount(opportunityToEdit.travelersCount || 2);
      setInitialNotes(opportunityToEdit.initialNotes || '');
    } else {
      setTitle('');
      setStage(defaultStage);
      setAmount('');
      setCurrency('EUR');
      setAgentName(user?.email ? user.email.split('@')[0] : 'Álvaro González');
      setSelectedClientId(clients.length > 0 ? clients[0].id : '');
      setContactMode('existing');
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setStartDate('');
      setEndDate('');
      setDestination('');
      setTravelersCount(2);
      setInitialNotes('');
    }
  }, [opportunityToEdit, defaultStage, isOpen, clients, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (opportunityToEdit) {
        await updateOpportunity(opportunityToEdit.id, {
          title: title.trim(),
          stage,
          amount: Number(amount) || 0,
          currency,
          agentName: agentName.trim(),
          clientId: selectedClientId || null,
          startDate,
          endDate,
          destination: destination.trim(),
          travelersCount: Number(travelersCount) || 1,
          initialNotes: initialNotes.trim(),
        });
      } else {
        await addOpportunity({
          title: title.trim(),
          stage,
          amount: Number(amount) || 0,
          currency,
          agentName: agentName.trim(),
          clientId: contactMode === 'existing' ? selectedClientId || null : null,
          newClient:
            contactMode === 'new' && newClientName.trim()
              ? {
                  name: newClientName.trim(),
                  email: newClientEmail.trim(),
                  phone: newClientPhone.trim(),
                }
              : undefined,
          startDate,
          endDate,
          destination: destination.trim(),
          travelersCount: Number(travelersCount) || 1,
          initialNotes: initialNotes.trim(),
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="h-full w-full max-w-xl bg-white shadow-2xl animate-slide-right flex flex-col text-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eaecf0] px-6 py-5 shrink-0 bg-[#fafafa]">
          <div>
            <h2 className="text-lg font-black text-[#101828] tracking-tight">
              {opportunityToEdit ? 'Editar oportunidad' : 'Nueva oportunidad'}
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Registra un nuevo lead o propuesta en el pipeline de ventas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container (Full Height Flex) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <form
            id="opportunity-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-xs pb-12 [scrollbar-width:thin]"
          >
            {/* Nombre de la oportunidad */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                Nombre de la oportunidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Japón en familia, Luna de miel en Bali..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-3 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
              />
            </div>

            {/* Etapa e Importe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                  Etapa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as OpportunityStage)}
                    className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-3 pr-8 text-xs font-semibold text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 cursor-pointer appearance-none transition-all"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="propuesta">Propuesta</option>
                    <option value="ganada">Ganada</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                  Importe <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 overflow-hidden focus-within:border-[#009688] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#009688]/20 transition-all">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-3 text-xs text-[#101828] bg-transparent outline-none"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-zinc-100 border-l border-[#d0d5dd] px-3 text-xs font-bold text-[#344054] outline-none cursor-pointer"
                  >
                    <option value="EUR">EUR €</option>
                    <option value="USD">USD $</option>
                    <option value="GBP">GBP £</option>
                    <option value="MXN">MXN $</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Agente Asignado (Selector de Usuarios/Agentes de la Empresa) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                Agente Asignado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-3 pr-8 text-xs font-semibold text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 cursor-pointer appearance-none transition-all"
                >
                  <option value="" disabled>
                    Selecciona un agente de la empresa...
                  </option>
                  {companyAgents.map((ag) => (
                    <option key={ag.id || ag.email} value={ag.name || ag.email}>
                      {ag.name} ({ag.email}) {ag.role === 'admin' ? '· Administrador' : '· Agente'}
                    </option>
                  ))}
                  {/* If the current value is custom, maintain it in option list */}
                  {agentName &&
                    !companyAgents.some(
                      (ag) => ag.name === agentName || ag.email === agentName
                    ) && <option value={agentName}>{agentName}</option>}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-zinc-400" />
              </div>
              <p className="mt-1 text-[11px] text-[#667085]">
                Selecciona al miembro del equipo responsable del seguimiento de esta oportunidad.
              </p>
            </div>

            {/* Contact Mode Selection */}
            <div className="pt-3 border-t border-[#eaecf0] space-y-3">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#344054]">
                  <input
                    type="radio"
                    name="contactMode"
                    value="existing"
                    checked={contactMode === 'existing'}
                    onChange={() => setContactMode('existing')}
                    className="h-4 w-4 text-[#009688] focus:ring-[#009688]"
                  />
                  <span>Contacto(s) existente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#344054]">
                  <input
                    type="radio"
                    name="contactMode"
                    value="new"
                    checked={contactMode === 'new'}
                    onChange={() => setContactMode('new')}
                    className="h-4 w-4 text-[#009688] focus:ring-[#009688]"
                  />
                  <span>Crear nuevo contacto</span>
                </label>
              </div>

              {contactMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#667085] mb-1">
                    Lista de contactos <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-3 pr-8 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 cursor-pointer appearance-none transition-all"
                    >
                      <option value="">Selecciona un contacto...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-zinc-400" />
                  </div>
                  {clients.length === 0 && (
                    <p className="mt-1 text-[11px] text-[#009688]">
                      No tienes contactos creados aún. Elige "Crear nuevo contacto".
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-[#e0f2f1] bg-[#f0fdfa] p-4">
                  <div>
                    <label className="block text-xs font-bold text-[#344054] mb-1">
                      Nombre del nuevo contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={contactMode === 'new'}
                      placeholder="ej. Jordi Serra"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        placeholder="jordi@ejemplo.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#344054] mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+34 612 345 678"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DETALLES OPCIONALES */}
            <div className="pt-4 border-t border-[#eaecf0] space-y-4">
              <h3 className="font-extrabold text-[#667085] tracking-wider uppercase text-[10px]">
                Detalles opcionales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">Fecha de inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">Fecha de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">Destino</label>
                  <input
                    type="text"
                    placeholder="Ej. Japón, Maldivas, Riviera Maya..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">Número de viajeros</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-2.5 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">Nota inicial</label>
                <textarea
                  rows={3}
                  placeholder="Añade contexto sobre este lead: cómo contactó, qué busca, preferencias de hotel, presupuesto máximo..."
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  className="w-full rounded-2xl border border-[#d0d5dd] bg-zinc-50/60 p-3 text-xs text-[#101828] focus:border-[#009688] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20 transition-all"
                />
              </div>
            </div>
          </form>

          {/* Sticky Bottom Footer (Outside the scroll area, zero overlap) */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#eaecf0] bg-white shrink-0 shadow-xs z-10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#d0d5dd] bg-white px-5 py-2.5 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="opportunity-form"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#009688]/20 hover:bg-[#00796b] disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{opportunityToEdit ? 'Guardar cambios' : 'Crear oportunidad'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
