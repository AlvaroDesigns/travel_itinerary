'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { AuthenticatedUser, UserRole } from '@/lib/auth';
import { TableSkeleton } from '@/components/TableSkeleton';
import { ConfirmModal } from '@/components/ConfirmModal';

export type ManagedUser = {
  id: number;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  agencyName: string;
  planType: string;
  createdAt: string;
  tripCount: number;
};

type Dialog =
  | 'create'
  | { type: 'edit'; user: ManagedUser }
  | { type: 'password'; user: ManagedUser }
  | null;

const emptyForm = {
  email: '',
  name: '',
  password: '',
  role: 'user' as UserRole,
  tenantId: 'particular',
  agencyName: 'Particular',
  planType: 'particular',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export function AdminUsersPanel({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const isSuperUser = currentUser.role === 'superuser' || currentUser.role === 'superadmin';
  const [activeView, setActiveView] = useState<'board' | 'table'>(isSuperUser ? 'board' : 'table');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(emptyForm);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'changeRole' | 'changeTenant'>('activate');
  const [bulkRole, setBulkRole] = useState<UserRole>('user');
  const [bulkTenant, setBulkTenant] = useState({ id: 'particular', name: 'Particular', plan: 'particular' });
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
      setUsers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/users')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
        if (!cancelled) setUsers(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Distinct agencies
  const distinctAgencies = useMemo(() => {
    const map = new Map<string, { tenantId: string; agencyName: string; planType: string; count: number; totalTrips: number }>();
    users.forEach((u) => {
      const tid = u.tenantId || 'particular';
      const aname = u.agencyName || (tid === 'particular' ? 'Particular' : tid);
      const plan = u.planType || (tid === 'particular' ? 'particular' : 'agency_starter');
      const existing = map.get(tid);
      if (existing) {
        existing.count += 1;
        existing.totalTrips += u.tripCount;
      } else {
        map.set(tid, {
          tenantId: tid,
          agencyName: aname,
          planType: plan,
          count: 1,
          totalTrips: u.tripCount,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.tenantId === 'alvarodesigns') return -1;
      if (b.tenantId === 'alvarodesigns') return 1;
      if (a.tenantId === 'particular') return 1;
      if (b.tenantId === 'particular') return -1;
      return a.agencyName.localeCompare(b.agencyName);
    });
  }, [users]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.agencyName && user.agencyName.toLowerCase().includes(query)) ||
        user.tenantId.toLowerCase().includes(query);

      const matchesTenant =
        selectedTenantFilter === 'all' || user.tenantId === selectedTenantFilter;

      const matchesRole =
        selectedRoleFilter === 'all' || user.role === selectedRoleFilter;

      return matchesQuery && matchesTenant && matchesRole;
    });
  }, [search, users, selectedTenantFilter, selectedRoleFilter]);

  // Grouped by tenant for board view
  const groupedUsers = useMemo(() => {
    const groups: { [key: string]: ManagedUser[] } = {};
    filteredUsers.forEach((u) => {
      const key = u.tenantId || 'particular';
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });
    return groups;
  }, [filteredUsers]);

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.includes(user.id));

  const showMessage = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const toggleSelected = (id: number) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]
    );

  const toggleAllFiltered = () =>
    setSelectedIds((ids) =>
      allFilteredSelected
        ? ids.filter((id) => !filteredUsers.some((user) => user.id === id))
        : [...new Set([...ids, ...filteredUsers.map((user) => user.id)])]
    );

  const saveNewUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          role: form.role,
          tenantId: form.tenantId,
          agencyName: form.agencyName,
          planType: form.planType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      setUsers((current) => [data, ...current]);
      setForm(emptyForm);
      setDialog(null);
      showMessage('Invitación enviada. La persona podrá activar su cuenta desde el enlace de bienvenida.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditedUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || typeof dialog === 'string' || dialog.type !== 'edit') return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${dialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          tenantId: form.tenantId,
          agencyName: form.agencyName,
          planType: form.planType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el usuario');
      setUsers((current) => current.map((user) => (user.id === data.id ? data : user)));
      setDialog(null);
      showMessage('Usuario y agencia actualizados correctamente.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || typeof dialog === 'string' || dialog.type !== 'password') return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${dialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la contraseña');
      setUsers((current) => current.map((user) => (user.id === data.id ? data : user)));
      setForm(emptyForm);
      setDialog(null);
      showMessage('Contraseña restablecida correctamente.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserActive = async (user: ManagedUser) => {
    if (user.id === currentUser.userId) return;
    setPendingUserId(user.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cambiar el estado');
      setUsers((current) => current.map((item) => (item.id === data.id ? data : item)));
      showMessage(`Usuario ${data.isActive ? 'activado' : 'desactivado'}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    } finally {
      setPendingUserId(null);
    }
  };

  const deleteUser = (user: ManagedUser) => {
    if (user.id === currentUser.userId) return;
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const user = userToDelete;

    setPendingUserId(user.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo borrar el usuario');
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSelectedIds((current) => current.filter((id) => id !== user.id));
      showMessage('Usuario eliminado permanentemente.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo borrar el usuario');
    } finally {
      setPendingUserId(null);
      setUserToDelete(null);
    }
  };

  const applyBulkAction = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ids: selectedIds, action: bulkAction };
      if (bulkAction === 'changeRole') payload.role = bulkRole;
      if (bulkAction === 'changeTenant') {
        payload.tenantId = bulkTenant.id;
        payload.agencyName = bulkTenant.name;
        payload.planType = bulkTenant.plan;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar los usuarios');
      setSelectedIds([]);
      await loadUsers();
      showMessage('Acción masiva aplicada.');
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'No se pudieron actualizar los usuarios');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialogForAgency = (tenantId?: string, agencyName?: string, planType?: string) => {
    setError(null);
    setForm({
      ...emptyForm,
      tenantId: tenantId || 'particular',
      agencyName: agencyName || (tenantId === 'particular' ? 'Particular' : tenantId || 'Particular'),
      planType: planType || (tenantId === 'particular' ? 'particular' : 'agency_starter'),
    });
    setDialog('create');
  };

  const openEditDialog = (user: ManagedUser) => {
    setError(null);
    setForm({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      tenantId: user.tenantId,
      agencyName: user.agencyName,
      planType: user.planType,
    });
    setDialog({ type: 'edit', user });
  };

  const controlClass =
    'h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/15';

  const getRoleBadge = (role: UserRole) => {
    if (role === 'superuser' || role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-xs font-extrabold text-purple-800 whitespace-nowrap shrink-0">
          <ShieldAlert className="h-3 w-3 text-purple-600 shrink-0" />
          SUPERUSER
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-xs font-extrabold text-[#00796b] whitespace-nowrap shrink-0">
          <ShieldCheck className="h-3 w-3 text-[#009688] shrink-0" />
          Admin Agencia
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700 whitespace-nowrap shrink-0">
        <Users className="h-3 w-3 text-zinc-500 shrink-0" />
        Usuario
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    if (plan === 'agency_enterprise') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 whitespace-nowrap shrink-0">
          Enterprise Plan
        </span>
      );
    }
    if (plan === 'agency_pro') {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-800 whitespace-nowrap shrink-0">
          Agency Pro
        </span>
      );
    }
    if (plan === 'agency_starter') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 whitespace-nowrap shrink-0">
          Agency Starter
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 whitespace-nowrap shrink-0">
        Particular
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* View Header */}
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Usuarios
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            {isSuperUser
              ? 'Gestiona accesos, roles, asignaciones y cuentas particulares.'
              : 'Gestiona los miembros y accesos de tu equipo.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle (Only for SUPERUSER) */}
          {isSuperUser && (
            <div className="inline-flex rounded-2xl border border-zinc-200/80 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveView('board')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'board'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Tablero Agencias</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('table')}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Tabla Completa</span>
              </button>
            </div>
          )}

          {/* Add User / Agency Button */}
          <button
            type="button"
            onClick={() => openCreateDialogForAgency()}
            className="wanderlust-primary-button inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Añadir usuario</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 animate-scale-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 animate-scale-in">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Cerrar error"
            className="rounded-lg p-1 hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o agencia..."
              className="h-9.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-[#009688] focus:bg-white focus:ring-4 focus:ring-[#009688]/15"
            />
          </div>

          {/* Tenant Filter (Only for SUPERUSER) */}
          {isSuperUser && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-zinc-400 hidden sm:block" />
              <select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="h-9.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#009688] focus:bg-white"
              >
                <option value="all">Todas las agencias / tenants</option>
                {distinctAgencies.map((agency) => (
                  <option key={agency.tenantId} value={agency.tenantId}>
                    {agency.agencyName} ({agency.tenantId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-9.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#009688] focus:bg-white"
          >
            <option value="all">Todos los roles</option>
            {isSuperUser && <option value="superuser">SUPERUSER</option>}
            <option value="admin">Admin Agencia</option>
            <option value="user">Usuario</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-zinc-500">
          Mostrando <strong className="text-zinc-900">{filteredUsers.length}</strong> usuarios
        </div>
      </div>

      {/* Main View: Board vs Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={4} showFilters={false} />
      ) : isSuperUser && activeView === 'board' ? (
        <div className="space-y-6">
          {distinctAgencies
            .filter(
              (agency) =>
                selectedTenantFilter === 'all' || agency.tenantId === selectedTenantFilter
            )
            .map((agency) => {
              const members = groupedUsers[agency.tenantId] || [];
              if (members.length === 0 && search) return null;

              const isParticular = agency.tenantId === 'particular';

              return (
                <div
                  key={agency.tenantId}
                  className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xs transition-all hover:shadow-md"
                >
                  {/* Agency Card Header */}
                  <div
                    className={`border-b p-5 sm:px-6 ${
                      isParticular
                        ? 'border-zinc-100 bg-zinc-50/70'
                        : 'border-teal-100/70 bg-gradient-to-br from-teal-50/50 to-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2
                            className={`h-4.5 w-4.5 ${
                              isParticular ? 'text-zinc-500' : 'text-[#009688]'
                            }`}
                          />
                          <h3 className="font-extrabold text-base text-zinc-900">
                            {agency.agencyName}
                          </h3>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-600">
                            #{agency.tenantId}
                          </span>
                          {getPlanBadge(agency.planType)}
                        </div>
                      </div>

                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                        {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                      </span>
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div className="p-4 sm:p-5">
                    {members.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        No hay usuarios en esta agencia con los filtros actuales.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {members.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-[#f8fafc]/70 p-3.5 transition-all hover:bg-white hover:border-zinc-300 hover:shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-extrabold text-[#00796b]">
                                {user.email.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-zinc-900">
                                  {user.name || user.email}
                                </p>
                                <p className="truncate text-[11px] text-zinc-500">
                                  {user.email}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5">
                                  {getRoleBadge(user.role)}
                                  {!user.isActive && (
                                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Member Quick Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditDialog(user)}
                                title="Editar usuario o mover de agencia"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-teal-50 hover:text-[#00796b] transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={pendingUserId === user.id}
                                onClick={() => {
                                  setError(null);
                                  setForm(emptyForm);
                                  setDialog({ type: 'password', user });
                                }}
                                title="Restablecer contraseña"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                              {user.id !== currentUser.userId && (
                                <button
                                  type="button"
                                  disabled={pendingUserId === user.id}
                                  onClick={() => deleteUser(user)}
                                  title="Eliminar usuario"
                                  className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agency Footer Button */}
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-3.5 sm:px-6">
                    <button
                      type="button"
                      onClick={() =>
                        openCreateDialogForAgency(
                          agency.tenantId,
                          agency.agencyName,
                          agency.planType
                        )
                      }
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#00796b] hover:text-[#004d40] transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Añadir usuario a {agency.agencyName}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xs">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-teal-100 bg-teal-50 px-5 py-3 sm:px-6">
              <span className="mr-1 text-xs font-bold text-teal-900">
                {selectedIds.length} seleccionados
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
                className="h-8 rounded-lg border border-teal-200 bg-white px-2 text-xs font-semibold text-zinc-700"
              >
                <option value="activate">Activar cuentas</option>
                <option value="deactivate">Desactivar cuentas</option>
                <option value="changeRole">Cambiar rol</option>
                <option value="changeTenant">Mover a Agencia</option>
              </select>

              {bulkAction === 'changeRole' && (
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value as UserRole)}
                  className="h-8 rounded-lg border border-teal-200 bg-white px-2 text-xs font-semibold text-zinc-700"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  {(currentUser.role === 'superuser' || currentUser.role === 'superadmin') && (
                    <option value="superuser">SUPERUSER</option>
                  )}
                </select>
              )}

              {bulkAction === 'changeTenant' && (
                <select
                  value={bulkTenant.id}
                  onChange={(e) => {
                    const sel = distinctAgencies.find((a) => a.tenantId === e.target.value);
                    if (sel) {
                      setBulkTenant({ id: sel.tenantId, name: sel.agencyName, plan: sel.planType });
                    }
                  }}
                  className="h-8 rounded-lg border border-teal-200 bg-white px-2 text-xs font-semibold text-zinc-700"
                >
                  {distinctAgencies.map((a) => (
                    <option key={a.tenantId} value={a.tenantId}>
                      {a.agencyName}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void applyBulkAction()}
                className="h-8 rounded-lg bg-[#009688] px-3 text-xs font-bold text-white transition hover:bg-[#00796b] disabled:opacity-50 cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left text-xs">
              <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100">
                <tr>
                  <th className="w-12 px-5 py-4 sm:px-6">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAllFiltered}
                      aria-label="Seleccionar todos los visibles"
                      className="h-4 w-4 rounded border-zinc-300 text-[#009688] focus:ring-[#009688]"
                    />
                  </th>
                  <th className="px-4 py-4 whitespace-nowrap">Usuario</th>
                  <th className="px-4 py-4 whitespace-nowrap">Rol</th>
                  <th className="px-4 py-4 whitespace-nowrap">Agencia & Tenant</th>
                  <th className="px-4 py-4 whitespace-nowrap">Plan</th>
                  <th className="px-4 py-4 whitespace-nowrap">Estado</th>
                  <th className="px-4 py-4 whitespace-nowrap">Viajes</th>
                  <th className="px-4 py-4 whitespace-nowrap">Registro</th>
                  <th className="px-5 py-4 text-right sm:px-6 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-zinc-500">
                      No se han encontrado usuarios con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-teal-50/20"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelected(user.id)}
                          disabled={pendingUserId === user.id}
                          aria-label={`Seleccionar ${user.email}`}
                          className="h-4 w-4 rounded border-zinc-300 text-[#009688] focus:ring-[#009688] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-xs font-extrabold text-[#00796b] shrink-0">
                            {user.email.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">
                              {user.name || user.email.split('@')[0]}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                            {user.id === currentUser.userId && (
                              <span className="mt-0.5 inline-block text-[10px] font-bold text-[#00796b]">
                                Tu cuenta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-bold text-zinc-800">{user.agencyName}</p>
                        <span className="font-mono text-[10px] text-zinc-400">
                          #{user.tenantId}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getPlanBadge(user.planType)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-200 text-zinc-600'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-700 whitespace-nowrap">
                        {user.tripCount}
                      </td>
                      <td className="px-4 py-4 text-zinc-500 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDialog(user)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            disabled={pendingUserId === user.id}
                            onClick={() => {
                              setError(null);
                              setForm(emptyForm);
                              setDialog({ type: 'password', user });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#00796b] hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>Clave</span>
                          </button>
                          <button
                            type="button"
                            disabled={user.id === currentUser.userId || pendingUserId === user.id}
                            onClick={() => toggleUserActive(user)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          {user.id !== currentUser.userId && (
                            <button
                              type="button"
                              disabled={pendingUserId === user.id}
                              onClick={() => deleteUser(user)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DIALOG: CREATE USER / INVITE */}
      {dialog === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-scale-in">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => !isSaving && setDialog(null)}
          />
          <form
            onSubmit={saveNewUser}
            className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Añadir nuevo usuario</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Configura su rol, datos personales y asignación a una agencia o plan particular.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block text-xs font-bold text-zinc-700">
                Correo electrónico *
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                  placeholder="ej. nuevo.agente@agencia.com"
                  className={`mt-1.5 w-full ${controlClass}`}
                />
              </label>

              <label className="block text-xs font-bold text-zinc-700">
                Nombre completo
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="ej. Laura Sánchez"
                  className={`mt-1.5 w-full ${controlClass}`}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-zinc-700">
                  Rol en la plataforma
                  <select
                    value={form.role}
                    onChange={(e) => setForm((c) => ({ ...c, role: e.target.value as UserRole }))}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador de Agencia</option>
                    {(currentUser.role === 'superuser' || currentUser.role === 'superadmin') && (
                      <option value="superuser">SUPERUSER Global</option>
                    )}
                  </select>
                </label>

                <label className="block text-xs font-bold text-zinc-700">
                  Tipo de Plan
                  <select
                    value={form.planType}
                    onChange={(e) => setForm((c) => ({ ...c, planType: e.target.value }))}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="particular">Particular</option>
                    <option value="agency_starter">Agency Starter</option>
                    <option value="agency_pro">Agency Pro</option>
                    <option value="agency_enterprise">Agency Enterprise</option>
                  </select>
                </label>
              </div>

              {/* Agency Assignment */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
                <label className="block text-xs font-bold text-zinc-800">
                  Asignación de Agencia / Tenant
                  <select
                    value={form.tenantId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'particular') {
                        setForm((c) => ({ ...c, tenantId: 'particular', agencyName: 'Particular', planType: 'particular' }));
                      } else if (val === 'custom') {
                        setForm((c) => ({ ...c, tenantId: '', agencyName: '', planType: 'agency_starter' }));
                      } else {
                        const sel = distinctAgencies.find((a) => a.tenantId === val);
                        if (sel) {
                          setForm((c) => ({ ...c, tenantId: sel.tenantId, agencyName: sel.agencyName, planType: sel.planType }));
                        }
                      }
                    }}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="particular">Cuenta Particular (Sin Agencia)</option>
                    {distinctAgencies
                      .filter((a) => a.tenantId !== 'particular')
                      .map((a) => (
                        <option key={a.tenantId} value={a.tenantId}>
                          {a.agencyName} (#{a.tenantId})
                        </option>
                      ))}
                    <option value="custom">+ Crear Nueva Agencia (Nuevo Tenant)</option>
                  </select>
                </label>

                {form.tenantId !== 'particular' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      Nombre de Agencia
                      <input
                        type="text"
                        required
                        value={form.agencyName}
                        onChange={(e) => setForm((c) => ({ ...c, agencyName: e.target.value }))}
                        placeholder="ej. Alvaro Designs Agency"
                        className={`mt-1 w-full ${controlClass}`}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-zinc-700">
                      ID Tenant (Slug)
                      <input
                        type="text"
                        required
                        value={form.tenantId}
                        onChange={(e) => setForm((c) => ({ ...c, tenantId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                        placeholder="ej. alvarodesigns"
                        className={`mt-1 w-full font-mono ${controlClass}`}
                      />
                    </label>
                  </div>
                )}
              </div>

              <p className="rounded-xl bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-[#004d40] leading-relaxed">
                Enviaremos un correo de bienvenida con un enlace seguro para que el usuario active su cuenta y defina su contraseña.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-6 py-4">
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="wanderlust-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Enviar invitación</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DIALOG: EDIT USER & MOVE AGENCY */}
      {dialog && typeof dialog === 'object' && dialog.type === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-scale-in">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => !isSaving && setDialog(null)}
          />
          <form
            onSubmit={saveEditedUser}
            className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Editar usuario y agencia</h2>
                <p className="mt-0.5 text-xs font-mono text-zinc-500">{dialog.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block text-xs font-bold text-zinc-700">
                Nombre completo
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="ej. Álvaro Bonilla"
                  className={`mt-1.5 w-full ${controlClass}`}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-zinc-700">
                  Rol
                  <select
                    value={form.role}
                    disabled={dialog.user.id === currentUser.userId}
                    onChange={(e) => setForm((c) => ({ ...c, role: e.target.value as UserRole }))}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador de Agencia</option>
                    {(currentUser.role === 'superuser' || currentUser.role === 'superadmin') && (
                      <option value="superuser">SUPERUSER Global</option>
                    )}
                  </select>
                </label>

                <label className="block text-xs font-bold text-zinc-700">
                  Plan
                  <select
                    value={form.planType}
                    onChange={(e) => setForm((c) => ({ ...c, planType: e.target.value }))}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="particular">Particular</option>
                    <option value="agency_starter">Agency Starter</option>
                    <option value="agency_pro">Agency Pro</option>
                    <option value="agency_enterprise">Agency Enterprise</option>
                  </select>
                </label>
              </div>

              {/* Agency Assignment */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
                <label className="block text-xs font-bold text-zinc-800">
                  Agencia / Organización (Tenant)
                  <select
                    value={form.tenantId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'particular') {
                        setForm((c) => ({ ...c, tenantId: 'particular', agencyName: 'Particular', planType: 'particular' }));
                      } else if (val === 'custom') {
                        setForm((c) => ({ ...c, tenantId: '', agencyName: '', planType: 'agency_starter' }));
                      } else {
                        const sel = distinctAgencies.find((a) => a.tenantId === val);
                        if (sel) {
                          setForm((c) => ({ ...c, tenantId: sel.tenantId, agencyName: sel.agencyName, planType: sel.planType }));
                        }
                      }
                    }}
                    className={`mt-1.5 w-full ${controlClass}`}
                  >
                    <option value="particular">Particular (Sin Agencia)</option>
                    {distinctAgencies
                      .filter((a) => a.tenantId !== 'particular')
                      .map((a) => (
                        <option key={a.tenantId} value={a.tenantId}>
                          {a.agencyName} (#{a.tenantId})
                        </option>
                      ))}
                    <option value="custom">+ Crear / Asignar Nuevo Tenant</option>
                  </select>
                </label>

                {form.tenantId !== 'particular' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      Nombre de Agencia
                      <input
                        type="text"
                        required
                        value={form.agencyName}
                        onChange={(e) => setForm((c) => ({ ...c, agencyName: e.target.value }))}
                        className={`mt-1 w-full ${controlClass}`}
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-zinc-700">
                      ID Tenant
                      <input
                        type="text"
                        required
                        value={form.tenantId}
                        onChange={(e) => setForm((c) => ({ ...c, tenantId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                        className={`mt-1 w-full font-mono ${controlClass}`}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-6 py-4">
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="wanderlust-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Guardar cambios</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DIALOG: RESET PASSWORD */}
      {dialog && typeof dialog === 'object' && dialog.type === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-scale-in">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => !isSaving && setDialog(null)}
          />
          <form
            onSubmit={resetPassword}
            className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Restablecer contraseña</h2>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">{dialog.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <label className="block text-xs font-bold text-zinc-700">
                Nueva contraseña
                <div className="relative mt-1.5">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                    className={`w-full pr-12 ${controlClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-teal-50 hover:text-[#00796b]"
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <span className="mt-1.5 block text-[11px] font-medium text-zinc-500">
                  Mínimo 12 caracteres. Se almacena con cifrado bcrypt.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-6 py-4">
              <button
                type="button"
                onClick={() => !isSaving && setDialog(null)}
                className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="wanderlust-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Guardar contraseña</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete User Custom Confirm Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Eliminar usuario definitivamente"
        message={`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${userToDelete?.email || 'este usuario'}?${
          (userToDelete?.tripCount ?? 0) > 0
            ? ` También se eliminarán sus ${userToDelete?.tripCount} ${
                userToDelete?.tripCount === 1 ? 'viaje asociado' : 'viajes asociados'
              }.`
            : ''
        } Esta acción no se puede deshacer.`}
        confirmText="Eliminar usuario"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
