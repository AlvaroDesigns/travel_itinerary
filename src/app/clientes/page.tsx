"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Client, useTravel } from "@/context/TravelContext";
import {
  Check,
  Copy,
  Download,
  Edit,
  FileText,
  Globe,
  Grid,
  List,
  Mail,
  MoreVertical,
  Phone,
  Plane,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const AVATAR_COLORS = [
  "bg-emerald-500 text-white",
  "bg-indigo-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-[#0066FF] text-white",
  "bg-cyan-500 text-white",
  "bg-rose-500 text-white",
  "bg-blue-500 text-white",
];

function getAvatarBg(str?: string) {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name?: string) {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatFullDate(dateStr?: string) {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function getClientCode(id: string) {
  return id.replace("client-", "CL-").substring(0, 10).toUpperCase();
}

export default function ClientesPage() {
  const { clients, trips, addClient, updateClient, deleteClient, isLoading } =
    useTravel();
  const router = useRouter();

  // Filters & Search & View
  const [filterPill, setFilterPill] = useState<
    "todos" | "activos" | "con_viajes" | "prospectos" | "inactivos"
  >("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal State for Create/Edit Client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [nationality, setNationality] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"activo" | "prospecto" | "inactivo">(
    "activo",
  );
  const [assignedTripIds, setAssignedTripIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Quick Assign Trips
  const [assignModalClient, setAssignModalClient] = useState<Client | null>(
    null,
  );
  const [quickAssignedTripIds, setQuickAssignedTripIds] = useState<string[]>(
    [],
  );
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.documentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.nationality.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterPill === "activos") {
        return client.status === "activo";
      }
      if (filterPill === "con_viajes") {
        return (
          (client.assignedTripsCount || 0) > 0 ||
          trips.some((t) => t.clientId === client.id)
        );
      }
      if (filterPill === "prospectos") {
        return client.status === "prospecto";
      }
      if (filterPill === "inactivos") {
        return client.status === "inactivo";
      }

      return true;
    });
  }, [clients, trips, searchQuery, filterPill]);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setName("");
    setEmail("");
    setPhone("");
    setDocumentId("");
    setNationality("");
    setNotes("");
    setStatus("activo");
    setAssignedTripIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenDropdownId(null);
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setDocumentId(client.documentId);
    setNationality(client.nationality);
    setNotes(client.notes);
    setStatus(client.status);
    const clientTrips = trips
      .filter((t) => t.clientId === client.id)
      .map((t) => t.id);
    setAssignedTripIds(clientTrips);
    setIsModalOpen(true);
  };

  const openAssignModal = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenDropdownId(null);
    setAssignModalClient(client);
    const currentAssigned = trips
      .filter((t) => t.clientId === client.id)
      .map((t) => t.id);
    setQuickAssignedTripIds(currentAssigned);
  };

  const handleSaveQuickAssign = async () => {
    if (!assignModalClient) return;
    setIsSubmitting(true);
    try {
      await updateClient(assignModalClient, quickAssignedTripIds);
      setAssignModalClient(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(
          {
            ...editingClient,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            documentId: documentId.trim(),
            nationality: nationality.trim(),
            notes: notes.trim(),
            status,
          },
          assignedTripIds,
        );
      } else {
        await addClient(
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            documentId: documentId.trim(),
            nationality: nationality.trim(),
            notes: notes.trim(),
            status,
          },
          assignedTripIds,
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    setClientToDelete(client);
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Nombre",
      "Email",
      "Teléfono",
      "Documento",
      "Nacionalidad",
      "Estado",
      "Viajes Asignados",
    ];
    const rows = filteredClients.map((c) => {
      const assignedCount = trips.filter((t) => t.clientId === c.id).length;
      return [
        c.id,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.documentId}"`,
        `"${c.nationality}"`,
        `"${c.status}"`,
        assignedCount,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clientes_wanderlust_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <DashboardShell activeMenu="clientes">
        <div className="w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
              Clientes
            </h1>
          </div>
          <TableSkeleton rows={6} columns={4} showFilters={true} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell activeMenu="clientes">
      <div onClick={() => setOpenDropdownId(null)} className="w-full space-y-5">
        {/* View Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#101828]">
            Clientes
          </h1>
        </div>

        {/* HeroUI Tabs Segmented Filter */}
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs">
            {[
              { id: "todos", label: "Todos" },
              { id: "activos", label: "Activos" },
              { id: "con_viajes", label: "Con viajes" },
              { id: "prospectos", label: "Prospectos" },
              { id: "inactivos", label: "Inactivos" },
            ].map((tab) => {
              const isSelected = filterPill === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterPill(tab.id as typeof filterPill)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? "bg-white text-[#18181b] shadow-sm font-bold"
                      : "text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#eaecf0] bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente por nombre, email o teléfono..."
                className="w-full rounded-2xl border border-[#d0d5dd] bg-white py-2 pl-9 pr-3 text-xs text-[#101828] placeholder-[#98a2b3] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
              />
            </div>

            <span className="text-xs font-semibold text-[#667085]">
              {filteredClients.length}{" "}
              {filteredClients.length === 1 ? "Cliente" : "Clientes"}
            </span>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* View Switchers */}
            <div className="flex items-center rounded-full border border-[#d0d5dd] bg-white p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-full p-1.5 transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#f2f4f7] text-[#101828]"
                    : "text-[#667085]"
                }`}
                title="Vista tabla"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-full p-1.5 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#f2f4f7] text-[#101828]"
                    : "text-[#667085]"
                }`}
                title="Vista cuadrícula"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#667085]" />
              <span>Exportar</span>
            </button>

            {/* Primary Create Client CTA */}
            <button
              onClick={openCreateModal}
              className="wanderlust-primary-button flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear cliente</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* VIEW MODE: TABLE OR GRID                                */}
        {/* ------------------------------------------------------- */}
        {viewMode === "table" ? (
          <div className="overflow-visible rounded-2xl border border-[#eaecf0] bg-white shadow-xs">
            <div className="overflow-x-auto lg:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#eaecf0] bg-[#f9fafb] text-[11px] font-semibold text-[#475467]">
                  <tr>
                    <th className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={
                          selectedClients.length === filteredClients.length &&
                          filteredClients.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Cliente</th>
                    <th className="px-4 py-3.5 font-semibold">Email</th>
                    <th className="px-4 py-3.5 font-semibold">Teléfono</th>
                    <th className="px-4 py-3.5 font-semibold">
                      Documento / Pasaporte
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Nacionalidad</th>
                    <th className="px-4 py-3.5 font-semibold">
                      Viajes Asignados
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Estado</th>
                    <th className="px-4 py-3.5 font-semibold">Registrado</th>
                    <th className="w-10 px-4 py-3.5 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0]">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-12 text-center text-xs text-[#667085]"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="h-8 w-8 text-[#98a2b3]" />
                          <p className="font-semibold text-[#344054]">
                            No se encontraron clientes
                          </p>
                          <p className="text-xs text-[#667085]">
                            Crea tu primer cliente para asignarlo a tus
                            itinerarios de viaje.
                          </p>
                          <button
                            onClick={openCreateModal}
                            className="wanderlust-primary-button mt-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 cursor-pointer transition-all"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear cliente ahora</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, index) => {
                      const clientTrips = trips.filter(
                        (t) => t.clientId === client.id,
                      );
                      const isSelected = selectedClients.includes(client.id);
                      const isDropdownOpen = openDropdownId === client.id;
                      const isNearBottom =
                        filteredClients.length > 3 &&
                        index >= filteredClients.length - 2;

                      return (
                        <tr
                          key={client.id}
                          className={`group transition-colors ${
                            isSelected ? "bg-blue-50/40" : "hover:bg-[#f9fafb]"
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="px-4 py-4"
                            onClick={(e) => handleToggleSelect(client.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                            />
                          </td>

                          {/* Nombre + Avatar */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs ${getAvatarBg(
                                  client.name,
                                )}`}
                              >
                                {getInitials(client.name)}
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(client)}
                                  className="font-bold text-[#101828] hover:text-[#0066FF] text-left transition-colors"
                                >
                                  {client.name}
                                </button>
                                <span className="block font-mono text-[10px] text-[#98a2b3]">
                                  {getClientCode(client.id)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-4 text-[#475467]">
                            {client.email ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`mailto:${client.email}`}
                                  className="hover:text-[#0066FF] hover:underline"
                                >
                                  {client.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(client.email, e)}
                                  title="Copiar email"
                                  className="text-[#98a2b3] hover:text-[#344054]"
                                >
                                  {copiedText === client.email ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#98a2b3]">-</span>
                            )}
                          </td>

                          {/* Teléfono */}
                          <td className="px-4 py-4 text-[#475467]">
                            {client.phone ? (
                              <a
                                href={`tel:${client.phone}`}
                                className="hover:text-[#0066FF] hover:underline"
                              >
                                {client.phone}
                              </a>
                            ) : (
                              <span className="text-[#98a2b3]">-</span>
                            )}
                          </td>

                          {/* Documento / Pasaporte */}
                          <td className="px-4 py-4 font-mono text-[11px] text-[#344054]">
                            {client.documentId ? (
                              <span className="rounded-md bg-[#f2f4f7] px-2 py-0.5">
                                {client.documentId}
                              </span>
                            ) : (
                              <span className="text-[#98a2b3]">-</span>
                            )}
                          </td>

                          {/* Nacionalidad */}
                          <td className="px-4 py-4 text-[#475467]">
                            {client.nationality || "-"}
                          </td>

                          {/* Viajes asignados */}
                          <td className="px-4 py-4">
                            {clientTrips.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(client)}
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0066FF] hover:bg-blue-100 transition-colors"
                                  title="Gestionar viajes asignados"
                                >
                                  <Plane className="h-3 w-3" />
                                  <span>
                                    {clientTrips.length}{" "}
                                    {clientTrips.length === 1
                                      ? "Viaje"
                                      : "Viajes"}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openAssignModal(client)}
                                className="text-xs text-[#667085] hover:text-[#0066FF] hover:underline cursor-pointer"
                              >
                                + Asignar viaje
                              </button>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                client.status === "activo"
                                  ? "bg-[#ecfdf3] text-[#027a48]"
                                  : client.status === "prospecto"
                                    ? "bg-[#eff8ff] text-[#175cd3]"
                                    : "bg-[#f2f4f7] text-[#5925dc]"
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>

                          {/* Creado */}
                          <td className="px-4 py-4 text-[#667085]">
                            {new Intl.DateTimeFormat("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            }).format(new Date(client.createdAt))}
                          </td>

                          {/* 3-dots actions */}
                          <td
                            className={`relative px-4 py-4 text-right ${isDropdownOpen ? "z-30" : ""}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(
                                  isDropdownOpen ? null : client.id,
                                );
                              }}
                              className="rounded-lg p-1.5 text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828] cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu Modal */}
                            {isDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                  }}
                                />
                                <div
                                  className={`absolute right-4 ${
                                    isNearBottom
                                      ? "bottom-full mb-1.5 origin-bottom-right"
                                      : "top-full mt-1.5 origin-top-right"
                                  } z-50 w-52 rounded-2xl border border-[#eaecf0] bg-white py-1.5 shadow-2xl text-left animate-scale-in`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Editar */}
                                  <button
                                    type="button"
                                    onClick={(e) => openEditModal(client, e)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-[#344054] hover:bg-[#f9fafb]"
                                  >
                                    <Edit className="h-4 w-4 text-[#667085]" />
                                    <span>Editar información</span>
                                  </button>

                                  {/* Asignar viajes */}
                                  <button
                                    type="button"
                                    onClick={(e) => openAssignModal(client, e)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-[#344054] hover:bg-[#f9fafb]"
                                  >
                                    <Plane className="h-4 w-4 text-[#667085]" />
                                    <span>Asignar viajes</span>
                                  </button>

                                  {client.email && (
                                    <a
                                      href={`mailto:${client.email}`}
                                      onClick={() => setOpenDropdownId(null)}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-[#344054] hover:bg-[#f9fafb]"
                                    >
                                      <Mail className="h-4 w-4 text-[#667085]" />
                                      <span>Enviar correo</span>
                                    </a>
                                  )}

                                  <div className="my-1 border-t border-[#f2f4f7]" />

                                  {/* Eliminar */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDelete(client, e)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#d92d20] hover:bg-[#fee4e2]"
                                  >
                                    <Trash2 className="h-4 w-4 text-[#d92d20]" />
                                    <span>Eliminar cliente</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const clientTrips = trips.filter((t) => t.clientId === client.id);

              return (
                <div
                  key={client.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs transition-all hover:border-[#0066FF] hover:shadow-lg"
                >
                  <div>
                    {/* Header: Avatar + Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold shadow-xs ${getAvatarBg(
                            client.name,
                          )}`}
                        >
                          {getInitials(client.name)}
                        </span>
                        <div>
                          <h3 className="text-base font-extrabold text-[#101828] group-hover:text-[#0066FF] transition-colors">
                            {client.name}
                          </h3>
                          <span className="font-mono text-[10px] text-[#98a2b3]">
                            {getClientCode(client.id)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                          client.status === "activo"
                            ? "bg-[#ecfdf3] text-[#027a48]"
                            : client.status === "prospecto"
                              ? "bg-[#eff8ff] text-[#175cd3]"
                              : "bg-[#f2f4f7] text-[#5925dc]"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="mt-4 space-y-2 text-xs text-[#475467]">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-[#98a2b3] shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-[#98a2b3] shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.nationality && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-[#98a2b3] shrink-0" />
                          <span>{client.nationality}</span>
                        </div>
                      )}
                      {client.documentId && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-[#98a2b3] shrink-0" />
                          <span className="font-mono text-[11px]">
                            {client.documentId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Trips Badges */}
                    <div className="mt-4 pt-3 border-t border-[#f2f4f7]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#98a2b3] mb-1.5">
                        Viajes asignados ({clientTrips.length})
                      </p>
                      {clientTrips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {clientTrips.map((t) => (
                            <Link
                              key={t.id}
                              href={`/viaje/${t.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#0066FF] hover:bg-blue-100 transition-colors"
                            >
                              <Plane className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">
                                {t.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#98a2b3] italic">
                          Ningún viaje asignado
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#f2f4f7] pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => openAssignModal(client)}
                      className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-[11px] font-bold text-[#344054] hover:bg-[#e4e7ec] transition-colors"
                    >
                      + Asignar viaje
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        className="rounded-full bg-[#0066FF] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#0052CC] transition-colors"
                      >
                        Editar
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
      {/* MODAL: CREAR / EDITAR CLIENTE                                 */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#344054] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  {editingClient ? "Editar cliente" : "Crear nuevo cliente"}
                </h2>
                <p className="text-xs text-[#667085]">
                  {editingClient
                    ? "Actualiza los datos del cliente y sus preferencias."
                    : "Registra los datos de contacto para asignarlo a tus viajes."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-[#344054]">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. María González o Familia Rodríguez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[#344054]">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="maria@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#344054]">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[#344054]">
                    Documento / Pasaporte
                  </label>
                  <input
                    type="text"
                    placeholder="DNI, NIE o Pasaporte"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-[#344054]">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Española, Mexicana, etc."
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#344054]">
                  Estado del cliente
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "activo", label: "Activo" },
                    { id: "prospecto", label: "Prospecto" },
                    { id: "inactivo", label: "Inactivo" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id as typeof status)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                        status === st.id
                          ? "bg-[#0066FF] text-white shadow-xs"
                          : "border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Trips section inside modal */}
              <div>
                <label className="mb-1 block font-bold text-[#344054]">
                  Asignar viajes ({assignedTripIds.length} seleccionados)
                </label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-[#d0d5dd] p-2 space-y-1 bg-[#f9fafb]">
                  {trips.length === 0 ? (
                    <p className="p-2 text-center text-xs text-[#98a2b3]">
                      No tienes viajes creados aún.
                    </p>
                  ) : (
                    trips.map((trip) => {
                      const isChecked = assignedTripIds.includes(trip.id);
                      return (
                        <label
                          key={trip.id}
                          className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-white transition-colors cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setAssignedTripIds((prev) =>
                                prev.includes(trip.id)
                                  ? prev.filter((id) => id !== trip.id)
                                  : [...prev, trip.id],
                              );
                            }}
                            className="rounded border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                          />
                          <span className="font-semibold text-[#101828] truncate flex-1">
                            {trip.name}
                          </span>
                          <span className="text-[10px] text-[#98a2b3]">
                            {formatFullDate(trip.startDate)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#344054]">
                  Notas & Preferencias
                </label>
                <textarea
                  rows={2}
                  placeholder="Preferencias de asientos, alergias, requerimientos especiales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#d0d5dd] p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-[#d0d5dd] bg-white px-5 py-2 font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="wanderlust-primary-button flex items-center gap-1.5 rounded-full px-6 py-2 font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>
                    {editingClient ? "Guardar cambios" : "Crear cliente"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ASIGNAR VIAJES AL CLIENTE                              */}
      {/* ============================================================= */}
      {assignModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in">
            <button
              onClick={() => setAssignModalClient(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#344054] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF]">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  Asignar viajes
                </h2>
                <p className="text-xs text-[#667085]">
                  Cliente:{" "}
                  <strong className="text-[#101828]">
                    {assignModalClient.name}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-[#667085] mb-2">
                Selecciona los itinerarios de viaje que pertenecen a este
                cliente:
              </p>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-[#eaecf0] p-2 space-y-1 bg-[#f9fafb]">
                {trips.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#98a2b3]">
                    No tienes viajes creados.
                  </p>
                ) : (
                  trips.map((trip) => {
                    const isChecked = quickAssignedTripIds.includes(trip.id);
                    const isOtherClient =
                      trip.clientId && trip.clientId !== assignModalClient.id;

                    return (
                      <label
                        key={trip.id}
                        className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors cursor-pointer text-xs ${
                          isChecked
                            ? "bg-blue-50/50 border border-[#0066FF]/30"
                            : "hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setQuickAssignedTripIds((prev) =>
                              prev.includes(trip.id)
                                ? prev.filter((id) => id !== trip.id)
                                : [...prev, trip.id],
                            );
                          }}
                          className="h-4 w-4 rounded border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#101828] truncate">
                            {trip.name}
                          </p>
                          <p className="text-[11px] text-[#667085]">
                            {formatFullDate(trip.startDate)} —{" "}
                            {formatFullDate(trip.endDate)}
                            {isOtherClient && (
                              <span className="ml-1 text-amber-600 font-medium">
                                (Actualmente:{" "}
                                {trip.clientName || "Otro cliente"})
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setAssignModalClient(null)}
                className="rounded-full border border-[#d0d5dd] bg-white px-5 py-2 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveQuickAssign}
                className="wanderlust-primary-button flex items-center gap-1.5 rounded-full px-6 py-2 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
              >
                <Check className="h-4 w-4" />
                <span>Guardar asignación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-bold text-[#101828]">
              ¿Eliminar cliente?
            </h3>
            <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar al cliente{" "}
              <strong>"{clientToDelete.name}"</strong>? Los viajes vinculados
              conservarán su información.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 rounded-full border border-[#d0d5dd] bg-white py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = clientToDelete.id;
                  setClientToDelete(null);
                  await deleteClient(id);
                }}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
