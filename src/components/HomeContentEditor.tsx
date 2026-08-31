'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, FileText, Loader2, Save, X } from 'lucide-react';

type HomeContent = { heroBadge: string; heroTitle: string; heroDescription: string };
const initialContent: HomeContent = {
  heroBadge: 'Tu compañero de aventuras',
  heroTitle: 'Planifica cada viaje\ncon intención.',
  heroDescription: 'Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.',
};

export function HomeContentEditor() {
  const [content, setContent] = useState<HomeContent>(initialContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/pages/home')
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'No se pudo cargar la página'); if (!cancelled) setContent(body.content); })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la página'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/pages/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo guardar la página');
      setContent(body.content);
      setNotice('Cambios guardados. Ya son visibles en la página de inicio.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la página'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="flex min-h-64 items-center justify-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /> Cargando página…</div>;

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100';
  return <div className="mx-auto max-w-5xl">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><Link href="/admin/paginas" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900"><ArrowLeft className="h-3.5 w-3.5" /> Volver a páginas</Link><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Editar inicio</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Actualiza el mensaje principal de tu web.</p></div><Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"><Eye className="h-4 w-4" /> Ver página</Link></div>
    {notice && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}</div>}
    {error && <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Cerrar error" className="rounded-lg p-1 hover:bg-rose-100"><X className="h-4 w-4" /></button></div>}
    <form onSubmit={save} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(38,32,80,0.04)]"><div className="border-b border-slate-100 px-5 py-5 sm:px-7"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><FileText className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Contenido del hero</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">Solo se edita el texto: diseño, carrusel y estructura permanecen protegidos.</p></div></div></div><div className="space-y-6 px-5 py-6 sm:px-7"><label className="block text-sm font-bold text-slate-700">Pre-título<input required maxLength={90} value={content.heroBadge} onChange={(event) => setContent((current) => ({ ...current, heroBadge: event.target.value }))} className={`h-11 ${inputClass}`} /><span className="mt-1.5 block text-xs font-medium text-slate-500">Aparece sobre el título · máximo 90 caracteres.</span></label><label className="block text-sm font-bold text-slate-700">Título<textarea required maxLength={120} rows={3} value={content.heroTitle} onChange={(event) => setContent((current) => ({ ...current, heroTitle: event.target.value }))} className={`resize-y py-3 ${inputClass}`} /><span className="mt-1.5 block text-xs font-medium text-slate-500">Puedes añadir un salto de línea · máximo 120 caracteres.</span></label><label className="block text-sm font-bold text-slate-700">Descripción<textarea required maxLength={600} rows={5} value={content.heroDescription} onChange={(event) => setContent((current) => ({ ...current, heroDescription: event.target.value }))} className={`resize-y py-3 ${inputClass}`} /><span className="mt-1.5 block text-xs font-medium text-slate-500">Resumen visible bajo el título · máximo 600 caracteres.</span></label></div><div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7"><button type="submit" disabled={isSaving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:opacity-50">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving ? 'Guardando…' : 'Guardar cambios'}</button></div></form>
  </div>;
}
