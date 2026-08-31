import Link from 'next/link';
import { ArrowRight, FileText, Home } from 'lucide-react';

export default function AdminPagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 border-b border-[#c3c4c7] pb-5"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#646970]">Administración</p><h1 className="text-3xl font-medium tracking-tight">Páginas</h1><p className="mt-2 max-w-2xl text-sm text-[#50575e]">Edita el contenido estructurado de la web sin publicar HTML ni scripts.</p></div>
      <div className="overflow-hidden border border-[#c3c4c7] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f0f6fc] text-[#2271b1]"><Home className="h-5 w-5" /></span><div><h2 className="font-semibold text-[#2271b1]">Inicio</h2><p className="mt-1 text-sm text-[#646970]">Portada principal y mensaje del carrusel.</p></div></div>
          <Link href="/admin/paginas/inicio" className="inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-[#2271b1] px-3 text-sm font-semibold text-[#2271b1] transition-colors hover:bg-[#f0f6fc]">Editar <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="border-t border-[#f0f0f1] bg-[#f6f7f7] px-5 py-3 text-xs text-[#646970]"><FileText className="mr-1 inline h-3.5 w-3.5" /> Contenido disponible: pre-título, título y descripción del hero.</div>
      </div>
    </div>
  );
}
