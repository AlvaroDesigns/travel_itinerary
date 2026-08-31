import Link from 'next/link';
import { ArrowRight, FileText, Home, ShieldCheck } from 'lucide-react';

export default function AdminPagesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7"><p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">Gestión de contenido</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Páginas</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">Edita el contenido estructurado de la web de forma segura, sin publicar HTML ni scripts.</p></div>
      <section className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(38,32,80,0.04)]">
        <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Home className="h-6 w-6" /></span><div><h2 className="text-lg font-bold text-slate-900">Inicio</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">Portada principal y mensaje del carrusel.</p></div></div><Link href="/admin/paginas/inicio" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800">Editar <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium text-slate-500"><FileText className="h-3.5 w-3.5 text-violet-600" /> Contenido disponible: pre-título, título y descripción del hero.</div>
      </section>
      <div className="mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-5 text-sm text-violet-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /><p><strong>Contenido seguro.</strong> La estructura visual de la web está protegida: solo puedes actualizar los textos previstos.</p></div>
    </div>
  );
}
