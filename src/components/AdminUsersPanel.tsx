'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Search, UserPlus, Users, X } from 'lucide-react';
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
const formatDate = (value: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'changeRole'>('activate');
  const [bulkRole, setBulkRole] = useState<UserRole>('user');
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

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
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
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
  const toggleSelected = (id: number) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]);
  const toggleAllFiltered = () => setSelectedIds((ids) => allFilteredSelected ? ids.filter((id) => !filteredUsers.some((user) => user.id === id)) : [...new Set([...ids, ...filteredUsers.map((user) => user.id)])]);

  const saveNewUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, role: form.role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      setUsers((current) => [...current, data].sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || a.email.localeCompare(b.email)));
      setForm(emptyForm);
      setDialog(null);
      showMessage('Invitación enviada. La persona podrá crear su contraseña desde el correo de bienvenida.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el usuario');
    } finally { setIsSaving(false); }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || dialog === 'create') return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${dialog.user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la contraseña');
      setUsers((current) => current.map((user) => user.id === data.id ? data : user));
      setForm(emptyForm);
      setDialog(null);
      showMessage('Contraseña actualizada y hasheada con bcrypt.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la contraseña');
    } finally { setIsSaving(false); }
  };

  const updateUser = async (id: number, payload: Partial<Pick<ManagedUser, 'role' | 'isActive'>>) => {
    if (id === currentUser.userId) return;
    setPendingUserId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el usuario');
      setUsers((current) => current.map((user) => user.id === data.id ? data : user));
      showMessage('Usuario actualizado.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    } finally {
      setPendingUserId((current) => current === id ? null : current);
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    if (user.id === currentUser.userId) return;
    const tripWarning = user.tripCount > 0
      ? ` También se eliminarán ${user.tripCount} ${user.tripCount === 1 ? 'viaje asociado' : 'viajes asociados'} y todo su contenido.`
      : '';
    if (!window.confirm(`¿Borrar definitivamente a ${user.email}? Esta acción no se puede deshacer.${tripWarning}`)) return;

    setPendingUserId(user.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo borrar el usuario');
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSelectedIds((current) => current.filter((id) => id !== user.id));
      showMessage('Usuario borrado definitivamente.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo borrar el usuario');
    } finally {
      setPendingUserId((current) => current === user.id ? null : current);
    }
  };

  const applyBulkAction = async () => {
    if (selectedIds.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, action: bulkAction, ...(bulkAction === 'changeRole' ? { role: bulkRole } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar los usuarios');
      setSelectedIds([]);
      await loadUsers();
      showMessage('Acción masiva aplicada.');
    } catch (bulkError) { setError(bulkError instanceof Error ? bulkError.message : 'No se pudieron actualizar los usuarios'); }
    finally { setIsSaving(false); }
  };

  const controlClass = 'h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/15';

  return <>
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div><p className="mb-3 inline-flex rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-bold text-[#00796b]">Comunidad</p><h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">Usuarios</h1><p className="mt-2 text-sm text-zinc-500 sm:text-base">Gestiona los accesos y permisos de tu equipo.</p></div>
        <button type="button" onClick={() => { setError(null); setForm(emptyForm); setDialog('create'); }} className="wanderlust-primary-button inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-md"><UserPlus className="h-4 w-4" /> Añadir usuario</button>
      </div>

      {notice && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}</div>}
      {error && <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Cerrar error" className="rounded-lg p-1 hover:bg-rose-100"><X className="h-4 w-4" /></button></div>}

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#009688]"><Users className="h-5 w-5" /></span><p className="text-sm text-zinc-500"><strong className="text-zinc-900">{users.length}</strong> {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}</p></div><div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuarios" className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#009688] focus:bg-white focus:ring-4 focus:ring-[#009688]/15" /></div></div>

        {selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-teal-100 bg-teal-50 px-5 py-3 sm:px-6"><span className="mr-1 text-sm font-bold text-teal-900">{selectedIds.length} seleccionados</span><select value={bulkAction} onChange={(event) => setBulkAction(event.target.value as typeof bulkAction)} className="h-9 rounded-lg border border-teal-200 bg-white px-2 text-sm text-zinc-700"><option value="activate">Activar cuentas</option><option value="deactivate">Desactivar cuentas</option><option value="changeRole">Cambiar rol</option></select>{bulkAction === 'changeRole' && <select value={bulkRole} onChange={(event) => setBulkRole(event.target.value as UserRole)} className="h-9 rounded-lg border border-teal-200 bg-white px-2 text-sm text-zinc-700"><option value="user">Usuario</option><option value="admin">Administrador</option></select>}<button type="button" disabled={isSaving} onClick={() => void applyBulkAction()} className="h-9 rounded-lg bg-[#009688] px-3.5 text-sm font-bold text-white transition hover:bg-[#00796b] disabled:opacity-50">Aplicar</button></div>}

        <div className="overflow-x-auto"><table className="w-full min-w-[920px] border-collapse text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="w-12 px-5 py-4 sm:px-6"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label="Seleccionar usuarios visibles" className="h-4 w-4 rounded border-zinc-300 text-[#009688] focus:ring-[#009688]" /></th><th className="px-4 py-4 font-bold">Usuario</th><th className="px-4 py-4 font-bold">Rol</th><th className="px-4 py-4 font-bold">Estado</th><th className="px-4 py-4 font-bold">Viajes</th><th className="px-4 py-4 font-bold">Registro</th><th className="px-5 py-4 text-right font-bold sm:px-6">Acciones</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="px-4 py-16 text-center text-zinc-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#009688]" />Cargando usuarios…</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={7} className="px-4 py-16 text-center text-zinc-500">No se han encontrado usuarios.</td></tr> : filteredUsers.map((user) => <tr key={user.id} className="border-t border-zinc-100 transition-colors hover:bg-teal-50/30"><td className="px-5 py-4 sm:px-6"><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelected(user.id)} disabled={pendingUserId === user.id} aria-label={`Seleccionar ${user.email}`} className="h-4 w-4 rounded border-zinc-300 text-[#009688] focus:ring-[#009688] disabled:cursor-not-allowed disabled:opacity-50" /></td><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xs font-extrabold text-[#00796b]">{user.email.slice(0, 2).toUpperCase()}</span><div><p className="font-bold text-zinc-800">{user.email}</p>{user.id === currentUser.userId && <p className="mt-0.5 text-xs font-medium text-[#00796b]">Tu cuenta</p>}</div></div></td><td className="px-4 py-4"><select value={user.role} onChange={(event) => void updateUser(user.id, { role: event.target.value as UserRole })} disabled={user.id === currentUser.userId || pendingUserId === user.id} aria-label={`Rol de ${user.email}`} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-600 disabled:cursor-not-allowed disabled:bg-zinc-100"><option value="user">Usuario</option><option value="admin">Administrador</option></select></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span></td><td className="px-4 py-4 font-semibold text-zinc-600">{user.tripCount}</td><td className="px-4 py-4 text-zinc-500">{formatDate(user.createdAt)}</td><td className="px-5 py-4 text-right sm:px-6"><div className="flex flex-wrap justify-end gap-1"><button type="button" disabled={pendingUserId === user.id} onClick={() => { setError(null); setForm(emptyForm); setDialog({ type: 'password', user }); }} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#00796b] transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-3.5 w-3.5" /> Restablecer</button><button type="button" disabled={user.id === currentUser.userId || pendingUserId === user.id} onClick={() => void updateUser(user.id, { isActive: !user.isActive })} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50" title={user.isActive ? 'Deshabilitar usuario' : 'Habilitar usuario'}>{pendingUserId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.isActive ? 'Deshabilitar' : 'Habilitar'}</button><button type="button" disabled={user.id === currentUser.userId || pendingUserId === user.id} onClick={() => void deleteUser(user)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50" title="Borrar usuario">Borrar</button></div></td></tr>)}</tbody></table></div>
      </section>
    </div>

    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"><button type="button" aria-label="Cerrar" className="absolute inset-0 cursor-default bg-zinc-950/60 backdrop-blur-sm" onClick={() => !isSaving && setDialog(null)} /><form onSubmit={dialog === 'create' ? saveNewUser : resetPassword} className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-md"><div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5"><div><h2 className="text-lg font-bold text-zinc-950">{dialog === 'create' ? 'Añadir usuario' : 'Restablecer contraseña'}</h2>{dialog !== 'create' && <p className="mt-1 text-xs font-medium text-zinc-500">{dialog.user.email}</p>}</div><button type="button" onClick={() => !isSaving && setDialog(null)} aria-label="Cerrar" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"><X className="h-5 w-5" /></button></div><div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">{dialog === 'create' && <><label className="block text-sm font-bold text-zinc-700">Correo electrónico<input type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={`mt-1.5 w-full ${controlClass}`} /></label><label className="block text-sm font-bold text-zinc-700">Rol<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))} className={`mt-1.5 w-full ${controlClass}`}><option value="user">Usuario</option><option value="admin">Administrador</option></select></label><p className="rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-[#004d40]">Enviaremos un correo de bienvenida con un enlace seguro para que esta persona cree su propia contraseña.</p></>}{dialog !== 'create' && <label className="block text-sm font-bold text-zinc-700">Nueva contraseña<div className="relative mt-1.5"><input type={isPasswordVisible ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className={`w-full pr-12 ${controlClass}`} /><button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={isPasswordVisible} title={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-teal-50 hover:text-[#00796b] focus:outline-none focus:ring-2 focus:ring-[#009688]">{isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><span className="mt-1.5 block text-xs font-medium leading-relaxed text-zinc-500">Mínimo 12 caracteres. Nunca se almacena en texto plano.</span></label>}</div><div className="grid grid-cols-2 gap-2 border-t border-zinc-100 bg-zinc-50 px-5 py-4 sm:flex sm:justify-end sm:px-6"><button type="button" onClick={() => !isSaving && setDialog(null)} className="h-10 w-full rounded-xl px-4 text-sm font-bold text-zinc-600 hover:bg-zinc-200 sm:w-auto">Cancelar</button><button type="submit" disabled={isSaving} className="wanderlust-primary-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{dialog === 'create' ? 'Enviar invitación' : 'Guardar contraseña'}</button></div></form></div>}
  </>;
}
