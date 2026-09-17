"use client";

import { Check, Code2, Link2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  tripCode?: string;
}

export function ShareTripModal({
  isOpen,
  onClose,
  tripId,
  tripName,
  tripCode,
}: ShareTripModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [hideLogo, setHideLogo] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  // Determinar el token público
  const effectiveCode = tripCode || tripId;

  // Base origin
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // URL pública pura
  const publicUrl = `${origin}/publico/${encodeURIComponent(effectiveCode)}`;

  // URL para el iframe con parámetros query
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (hideLogo) params.set("hideLogo", "true");
    if (hideHeader) params.set("hideHeader", "true");
    const query = params.toString();
    return query ? `${publicUrl}?${query}` : publicUrl;
  }, [publicUrl, hideLogo, hideHeader]);

  // Snippet de iframe listo para incrustar
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  // Texto para WhatsApp
  const whatsappShareUrl = useMemo(() => {
    const text = `¡Hola! Aquí tienes la propuesta detallada de tu viaje "${tripName}":\n${publicUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }, [tripName, publicUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in text-left text-[#101828]"
        role="dialog"
        aria-modal="true"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* COLUMNA IZQUIERDA: Imagen Inspiracional & Guía de Estilo de la App */}
          <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white overflow-hidden bg-[#0c111d]">
            {/* Imagen de fondo generada con overlay de gradientes */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/share-trip-cover.jpg"
                alt="Compartir propuesta con el cliente"
                fill
                priority
                className="object-cover object-center scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c111d] via-[#0c111d]/70 to-[#0c111d]/40" />
              <div className="absolute inset-0 bg-radial from-transparent to-[#0c111d]/60" />
            </div>

            {/* Parte superior: Badge de marca Wanderlust */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-md border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-[#00C6FF]" />
                <span className="text-xs font-extrabold tracking-wide uppercase text-white">
                  Wanderlust Share
                </span>
              </div>
            </div>

            {/* Parte inferior: Mensaje inspiracional y viñetas */}
            <div className="relative z-10 space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300">
                  Integración web & cliente
                </span>
                <h3 className="text-2xl font-black leading-tight text-white tracking-tight">
                  Tus propuestas de viaje, visibles y actualizadas.
                </h3>
                <p className="text-xs leading-relaxed text-zinc-200 font-medium">
                  Configura la vista, copia el código y comparte tus viajes con
                  clientes en minutos, siempre actualizados y accesibles desde
                  cualquier dispositivo.
                </p>
              </div>

              {/* Características destacadas */}
              <div className="space-y-2 pt-3 border-t border-white/15">
                <div className="flex items-center gap-2 text-xs text-zinc-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                    ✓
                  </span>
                  <span>Envío directo por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                    ✓
                  </span>
                  <span>Portal público interactivo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                    ✓
                  </span>
                  <span>Incrustable en tu sitio web (iFrame)</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Opciones Interactivas para Compartir */}
          <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-white overflow-y-auto max-h-[85vh]">
            {/* Encabezado del modal */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-[#f2f4f7]">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#101828]">
                    Compartir con el cliente
                  </h2>
                  <p className="text-xs text-[#667085] mt-0.5 truncate max-w-sm">
                    {tripName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828] transition cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {/* Bloque 1: Compartir por WhatsApp */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Compartir por WhatsApp
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-[#667085] leading-relaxed max-w-xs">
                      Tu WhatsApp se abre con todo preparado. Solo tienes que darle
                      a enviar. Así de fácil.
                    </p>
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* Icono oficial SVG de WhatsApp */}
                      <svg
                        className="h-4 w-4 fill-current"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>Compartir por WhatsApp</span>
                    </a>
                  </div>
                </div>

                <hr className="border-[#f2f4f7]" />

                {/* Bloque 2: Compartir por enlace */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Compartir por enlace
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="w-full rounded-xl border border-[#d0d5dd] bg-[#f8fafc] px-3.5 py-2 text-xs font-mono text-[#344054] outline-hidden focus:border-[#0066FF] select-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#0066FF] bg-white px-4 py-2 text-xs font-bold text-[#0066FF] hover:bg-blue-50/70 transition shadow-2xs cursor-pointer shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Copiar enlace</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <hr className="border-[#f2f4f7]" />

                {/* Bloque 3: Insertar en tu página web */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Insertar en tu página web
                  </h3>

                  {/* Checkboxes para opciones */}
                  <div className="flex items-center gap-6 text-xs text-[#344054]">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideLogo}
                        onChange={(e) => setHideLogo(e.target.checked)}
                        className="h-4 w-4 rounded-md border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                      />
                      <span className="font-medium">Ocultar logo</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideHeader}
                        onChange={(e) => setHideHeader(e.target.checked)}
                        className="h-4 w-4 rounded-md border-[#d0d5dd] accent-[#0066FF] cursor-pointer"
                      />
                      <span className="font-medium">Ocultar cabecera</span>
                    </label>
                  </div>

                  {/* Cuadro de código y botón de copiar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 overflow-hidden">
                      <div className="w-full rounded-xl border border-[#eaecf0] bg-[#f8fafc] px-3.5 py-2.5 text-[11px] font-mono text-[#344054] truncate">
                        {iframeCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#0066FF] bg-white px-4 py-2 text-xs font-bold text-[#0066FF] hover:bg-blue-50/70 transition shadow-2xs cursor-pointer shrink-0"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">¡Código copiado!</span>
                        </>
                      ) : (
                        <>
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Copiar código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del modal con botón de cerrar */}
            <div className="mt-6 flex justify-end pt-3 border-t border-[#f2f4f7]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#d0d5dd] bg-white px-5 py-2 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
