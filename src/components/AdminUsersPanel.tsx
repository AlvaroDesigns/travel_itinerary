'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import type { AuthenticatedUser, UserRole } from '@/lib/auth';

type ManagedUser = {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  tripCount: number;
};

type Dialog = 'create' | { type: 'password'; user: ManagedUser } | null;

const emptyForm = { email: '', password: '', role: 'user' as UserRole };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function AdminUsersPanel({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'changeRole'>('activate');
  const [bulkRole, setBulkRole] = useState<UserRole>('user');

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

    return () => { cancelled = true; };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? users.filter((user) => user.email.toLowerCase().includes(query)) : users;
  }, [search, users]);

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((user) => selectedIds.includes(user.id));

  const showMessage = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]);
  };

  const toggleAllFiltered = () => {
    setSelectedIds((ids) => allFilteredSelected
      ? ids.filter((id) => !filteredUsers.some((user) => user.id === id))
      : [...new Set([...ids, ...filteredUsers.map((user) => user.id)])]);
  };

  const saveNewUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      setUsers((current) => [...current, data].sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || a.email.localeCompare(b.email)));
      setForm(emptyForm);
      setDialog(null);
      showMessage('Usuario creado y contraseña almacenada de forma segura.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || dialog === 'create') return;
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
      setUsers((current) => current.map((user) => user.id === data.id ? data : user));
      setForm(emptyForm);
      setDialog(null);
      showMessage('Contraseña actualizada y hasheada con bcrypt.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  const updateUser = async (id: number, payload: Partial<Pick<ManagedUser, 'role' | 'isActive'>>) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el usuario');
      setUsers((current) => current.map((user) => user.id === data.id ? data : user));
      showMessage('Usuario actualizado.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    }
  };

  const applyBulkAction = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: bulkAction, ...(bulkAction === 'changeRole' ? { role: bulkRole } : {}) }),
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

  return (
    <>
      <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#c3c4c7] pb-5">
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#646970]">Administración</p><h1 className="text-3xl font-medium tracking-tight">Usuarios</h1></div>
              <button type="button" onClick={() => { setError(null); setForm(emptyForm); setDialog('create'); }} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2271b1] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#135e96]"><UserPlus className="h-4 w-4" /> Añadir usuario</button>
            </div>

            {notice && <div className="mb-4 flex items-center gap-2 border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm shadow-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {notice}</div>}
            {error && <div className="mb-4 flex items-center justify-between gap-3 border-l-4 border-red-500 bg-white px-4 py-3 text-sm shadow-sm"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Cerrar error"><X className="h-4 w-4" /></button></div>}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#50575e]"><strong>{users.length}</strong> {users.length === 1 ? 'usuario' : 'usuarios'} registrados</p>
              <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#646970]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuarios" className="h-9 w-full border border-[#8c8f94] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /></div>
            </div>

            {selectedIds.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 border border-[#c3c4c7] bg-white p-3 text-sm shadow-sm"><span className="mr-2 font-semibold">{selectedIds.length} seleccionados</span><select value={bulkAction} onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)} className="h-8 border border-[#8c8f94] bg-white px-2"><option value="activate">Activar cuentas</option><option value="deactivate">Desactivar cuentas</option><option value="changeRole">Cambiar rol</option></select>{bulkAction === 'changeRole' && <select value={bulkRole} onChange={(event) => setBulkRole(event.target.value as UserRole)} className="h-8 border border-[#8c8f94] bg-white px-2"><option value="user">Usuario</option><option value="admin">Administrador</option></select>}<button type="button" disabled={isSaving} onClick={() => void applyBulkAction()} className="h-8 rounded-sm border border-[#2271b1] px-3 font-medium text-[#2271b1] transition-colors hover:bg-[#f0f6fc] disabled:opacity-50">Aplicar</button></div>}

            <div className="overflow-hidden border border-[#c3c4c7] bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><thead className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-[#2c3338]"><tr><th className="w-12 px-4 py-3"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label="Seleccionar usuarios visibles" /></th><th className="px-4 py-3 font-semibold">Usuario</th><th className="px-4 py-3 font-semibold">Rol</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Viajes</th><th className="px-4 py-3 font-semibold">Registro</th><th className="px-4 py-3 text-right font-semibold">Acciones</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="px-4 py-16 text-center text-[#646970]"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Cargando usuarios…</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={7} className="px-4 py-16 text-center text-[#646970]">No se han encontrado usuarios.</td></tr> : filteredUsers.map((user) => <tr key={user.id} className="border-b border-[#f0f0f1] last:border-0 hover:bg-[#f6f7f7]"><td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelected(user.id)} aria-label={`Seleccionar ${user.email}`} /></td><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2271b1] text-xs font-bold text-white">{user.email.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold text-[#2271b1]">{user.email}</p>{user.id === currentUser.userId && <p className="text-xs text-[#646970]">Tu cuenta</p>}</div></div></td><td className="px-4 py-4"><select value={user.role} onChange={(event) => void updateUser(user.id, { role: event.target.value as UserRole })} disabled={user.id === currentUser.userId} aria-label={`Rol de ${user.email}`} className="h-8 border border-[#c3c4c7] bg-white px-2 text-xs disabled:cursor-not-allowed disabled:bg-[#f6f7f7]"><option value="user">Usuario</option><option value="admin">Administrador</option></select></td><td className="px-4 py-4"><button type="button" onClick={() => void updateUser(user.id, { isActive: !user.isActive })} disabled={user.id === currentUser.userId} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'} disabled:cursor-not-allowed`} title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}>{user.isActive ? 'Activo' : 'Inactivo'}</button></td><td className="px-4 py-4 text-[#50575e]">{user.tripCount}</td><td className="px-4 py-4 text-[#50575e]">{formatDate(user.createdAt)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => { setError(null); setForm(emptyForm); setDialog({ type: 'password', user }); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2271b1] hover:text-[#135e96]"><KeyRound className="h-3.5 w-3.5" /> Restablecer</button></td></tr>)}</tbody></table></div></div>
          </div>

      {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Cerrar" className="absolute inset-0 cursor-default bg-black/40" onClick={() => !isSaving && setDialog(null)} /><form onSubmit={dialog === 'create' ? saveNewUser : resetPassword} className="relative w-full max-w-md bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#c3c4c7] px-5 py-4"><div><h2 className="text-lg font-semibold">{dialog === 'create' ? 'Añadir usuario' : 'Restablecer contraseña'}</h2>{dialog !== 'create' && <p className="mt-1 text-xs text-[#646970]">{dialog.user.email}</p>}</div><button type="button" onClick={() => !isSaving && setDialog(null)} aria-label="Cerrar"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-5">{dialog === 'create' && <><label className="block text-sm font-medium">Correo electrónico<input type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-1.5 h-10 w-full border border-[#8c8f94] px-3 outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /></label><label className="block text-sm font-medium">Rol<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))} className="mt-1.5 h-10 w-full border border-[#8c8f94] bg-white px-3"><option value="user">Usuario</option><option value="admin">Administrador</option></select></label></>}<label className="block text-sm font-medium">{dialog === 'create' ? 'Contraseña' : 'Nueva contraseña'}<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-1.5 h-10 w-full border border-[#8c8f94] px-3 outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /><span className="mt-1.5 block text-xs font-normal text-[#646970]">Mínimo 12 caracteres. Nunca se almacena en texto plano.</span></label></div><div className="flex justify-end gap-2 border-t border-[#c3c4c7] bg-[#f6f7f7] px-5 py-4"><button type="button" onClick={() => !isSaving && setDialog(null)} className="h-9 px-3 text-sm font-medium">Cancelar</button><button type="submit" disabled={isSaving} className="inline-flex h-9 items-center gap-2 bg-[#2271b1] px-4 text-sm font-semibold text-white hover:bg-[#135e96] disabled:opacity-50">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{dialog === 'create' ? 'Crear usuario' : 'Guardar contraseña'}</button></div></form></div>}
    </>
  );
}
