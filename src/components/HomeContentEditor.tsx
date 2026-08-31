'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, Loader2, Save } from 'lucide-react';

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
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudo cargar la página');
        if (!cancelled) setContent(body.content);
      })
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la página');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex min-h-64 items-center justify-center text-sm text-[#646970]"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando página…</div>;

  return <div className="mx-auto max-w-4xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#c3c4c7] pb-5"><div><Link href="/admin/paginas" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2271b1] hover:text-[#135e96]"><ArrowLeft className="h-3.5 w-3.5" /> Volver a páginas</Link><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#646970]">Editar página</p><h1 className="text-3xl font-medium tracking-tight">Inicio</h1></div><Link href="/" className="inline-flex h-9 items-center gap-2 rounded-sm border border-[#8c8f94] px-3 text-sm font-semibold transition-colors hover:bg-[#f6f7f7]"><Eye className="h-4 w-4" /> Ver página</Link></div>
    {notice && <div className="mb-4 flex items-center gap-2 border-l-4 border-emerald-500 bg-white px-4 py-3 text-sm shadow-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {notice}</div>}
    {error && <div className="mb-4 border-l-4 border-red-500 bg-white px-4 py-3 text-sm shadow-sm">{error}</div>}
    <form onSubmit={save} className="overflow-hidden border border-[#c3c4c7] bg-white shadow-sm"><div className="space-y-5 p-5 sm:p-7"><p className="rounded-sm border border-[#dcdcde] bg-[#f6f7f7] px-3 py-2 text-xs leading-relaxed text-[#50575e]">Edita únicamente el contenido textual de la cabecera. El carrusel, la estructura y los estilos se mantienen protegidos para evitar contenido inseguro.</p><label className="block text-sm font-semibold">Pre-título<input required maxLength={90} value={content.heroBadge} onChange={(event) => setContent((current) => ({ ...current, heroBadge: event.target.value }))} className="mt-1.5 h-10 w-full border border-[#8c8f94] px-3 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /><span className="mt-1 block text-xs font-normal text-[#646970]">Aparece sobre el título · máximo 90 caracteres.</span></label><label className="block text-sm font-semibold">Título<textarea required maxLength={120} rows={3} value={content.heroTitle} onChange={(event) => setContent((current) => ({ ...current, heroTitle: event.target.value }))} className="mt-1.5 w-full resize-y border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /><span className="mt-1 block text-xs font-normal text-[#646970]">Puedes añadir un salto de línea · máximo 120 caracteres.</span></label><label className="block text-sm font-semibold">Descripción<textarea required maxLength={600} rows={5} value={content.heroDescription} onChange={(event) => setContent((current) => ({ ...current, heroDescription: event.target.value }))} className="mt-1.5 w-full resize-y border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]" /><span className="mt-1 block text-xs font-normal text-[#646970]">Resumen visible bajo el título · máximo 600 caracteres.</span></label></div><div className="flex justify-end border-t border-[#c3c4c7] bg-[#f6f7f7] px-5 py-4"><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#2271b1] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#135e96] disabled:opacity-50">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving ? 'Guardando…' : 'Guardar cambios'}</button></div></form>
  </div>;
}
