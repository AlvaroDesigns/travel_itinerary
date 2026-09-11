'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import { HeroUIDateRangePicker } from '@/components/HeroUIDateRangePicker';
import { TRIP_TEMPLATES, TripTemplate } from '@/lib/templates-data';
import {
  X,
  Edit3,
  FileText,
  BookOpen,
  Sparkles,
  Search,
  ArrowLeft,
  Upload,
  Check,
  Plane,
  Calendar,
  DollarSign,
  Loader2,
  Tag,
} from 'lucide-react';

const PRESET_IMAGES = [
  {
    name: 'Riviera Maya',
    url: '/carousel-1.webp',
  },
  {
    name: 'París',
    url: '/carousel-2.webp',
  },
  {
    name: 'Tokio',
    url: '/carousel-3.webp',
  },
  {
    name: 'Roma',
    url: '/carousel-4.webp',
  },
  {
    name: 'Bali & Islas',
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  },
];

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'choose' | 'scratch' | 'document' | 'templates';

export function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const { addTrip } = useTravel();
  const router = useRouter();

  const [step, setStep] = useState<ModalStep>('choose');
  const [templateSearch, setTemplateSearch] = useState('');

  // Form states for manual creation
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(1500);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document AI upload state
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docProgress, setDocProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on close
  const handleClose = () => {
    setStep('choose');
    setTripName('');
    setStartDate('');
    setEndDate('');
    setBudget(1500);
    setDescription('');
    setImageUrl(PRESET_IMAGES[0].url);
    setTemplateSearch('');
    setDocFile(null);
    setIsProcessingDoc(false);
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return TRIP_TEMPLATES;
    const q = templateSearch.toLowerCase();
    return TRIP_TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templateSearch]);

  // Handle Create From Scratch
  const handleCreateFromScratch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    setIsSubmitting(true);
    try {
      const today = new Date();
      const defaultStart = startDate || today.toISOString().split('T')[0];
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const defaultEnd = endDate || nextWeek.toISOString().split('T')[0];

      const created = await addTrip({
        name: tripName.trim(),
        startDate: defaultStart,
        endDate: defaultEnd,
        budget: Number(budget) || 1500,
        imageUrl,
        description: description.trim(),
        notes: '',
      });

      if (created) {
        handleClose();
        router.push(`/viaje/${created.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create From Template
  const handleSelectTemplate = async (template: TripTemplate) => {
    setIsSubmitting(true);
    try {
      const today = new Date();
      const defaultStart = today.toISOString().split('T')[0];
      const endDateObj = new Date(today.getTime() + template.durationDays * 24 * 60 * 60 * 1000);
      const defaultEnd = endDateObj.toISOString().split('T')[0];

      // Convert day offsets to real dates & typed activities
      const activitiesWithDates = template.activities.map((act) => {
        const actDateObj = new Date(today.getTime() + act.dayOffset * 24 * 60 * 60 * 1000);
        const dateStr = actDateObj.toISOString().split('T')[0];

        if (act.type === 'hotel') {
          return {
            type: 'hotel' as const,
            date: dateStr,
            time: act.time,
            price: act.price,
            hotelName: act.details.hotelName || act.title,
            address: act.details.address || '',
            checkIn: act.time,
            checkOut: '12:00',
            description: act.title,
          };
        }
        if (act.type === 'flight') {
          return {
            type: 'flight' as const,
            date: dateStr,
            time: act.time,
            price: act.price,
            flightNumber: act.details.flightNumber || 'FL100',
            airline: act.details.airline || 'Aerolínea',
            origin: act.details.origin || 'Origen',
            destination: act.details.destination || 'Destino',
            arrivalTime: act.details.arrivalTime || '14:00',
            description: act.title,
          };
        }
        if (act.type === 'transfer') {
          return {
            type: 'transfer' as const,
            date: dateStr,
            time: act.time,
            price: act.price,
            transportType: 'taxi' as const,
            origin: act.details.from || act.details.pickupLocation || 'Origen',
            destination: act.details.to || 'Destino',
            duration: '1 hora',
            description: act.title,
          };
        }
        if (act.type === 'food') {
          return {
            type: 'food' as const,
            date: dateStr,
            time: act.time,
            price: act.price,
            restaurantName: act.details.restaurantName || act.title,
            mealType: 'dinner' as const,
            description: act.details.notes || act.title,
          };
        }
        return {
          type: 'excursion' as const,
          date: dateStr,
          time: act.time,
          price: act.price,
          title: act.title,
          description: act.details.title || act.title,
          duration: '3 horas',
        };
      });

      const created = await addTrip(
        {
          name: template.title,
          startDate: defaultStart,
          endDate: defaultEnd,
          budget: template.estimatedBudget,
          imageUrl: template.imageUrl,
          description: template.description,
          notes: `Plantilla utilizada: ${template.code} - ${template.title}`,
        },
        activitiesWithDates
      );

      if (created) {
        handleClose();
        router.push(`/viaje/${created.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Document Upload & AI simulation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFile(file);
    setIsProcessingDoc(true);
    setDocProgress('Analizando documento con Wanderlust AI...');

    try {
      // Simulate extraction or read filename
      await new Promise((r) => setTimeout(r, 1200));
      setDocProgress('Extrayendo destinos, fechas y actividades...');
      await new Promise((r) => setTimeout(r, 1200));

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const extractedTitle = cleanName ? `Viaje: ${cleanName}` : 'Itinerario Personalizado';

      const today = new Date();
      const defaultStart = today.toISOString().split('T')[0];
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const defaultEnd = nextWeek.toISOString().split('T')[0];

      const created = await addTrip({
        name: extractedTitle,
        startDate: defaultStart,
        endDate: defaultEnd,
        budget: 2500,
        imageUrl: PRESET_IMAGES[0].url,
        description: `Importado desde archivo ${file.name} con Wanderlust AI`,
        notes: `Documento de origen: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      });

      if (created) {
        handleClose();
        router.push(`/viaje/${created.id}`);
      }
    } finally {
      setIsProcessingDoc(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in"
    >
      {/* ------------------------------------------------------------- */}
      {/* STEP 1: CHOOSE START METHOD (MODERN 2-COLUMN LAYOUT)          */}
      {/* ------------------------------------------------------------- */}
      {step === 'choose' && (
        <div className="relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] border-0 bg-[#140b2a] shadow-2xl animate-scale-in text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
            {/* LEFT COLUMN: Travel Hero Image & Brand Overlay */}
            <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white overflow-hidden bg-[#140b2a]">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/carousel-1.webp"
                  alt="Wanderlust Travel"
                  fill
                  priority
                  className="object-cover object-center scale-105 transition-transform duration-1000 group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140b2a] via-[#140b2a]/70 to-[#140b2a]/40" />
                <div className="absolute inset-0 bg-radial from-transparent to-[#140b2a]/60" />
              </div>

              {/* Top: Brand Logo / Badge */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-[#00C6FF]" />
                  <span className="text-xs font-extrabold tracking-wide uppercase text-white">Wanderlust Studio</span>
                </div>
              </div>

              {/* Bottom: Inspiring Content & Feature Pills */}
              <div className="relative z-10 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black leading-tight text-white tracking-tight">
                    Crea viajes extraordinarios
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-300 font-medium">
                    Diseña itinerarios a medida para tus clientes con ayuda de inteligencia artificial y plantillas exclusivas.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/30 text-[#93C5FD]">✓</span>
                    <span>Itinerarios visuales e interactivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/30 text-[#93C5FD]">✓</span>
                    <span>Importación inteligente de reservas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/30 text-[#93C5FD]">✓</span>
                    <span>Presupuestos y cotizaciones en vivo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Creation Options */}
            <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-white">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                      ¿Cómo quieres empezar?
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
                      Elige el método de inicio que mejor se adapte a tu flujo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 3 Modern Selection Rows / Cards (Inverted order with 'Desde cero' marked/highlighted) */}
                <div className="mt-6 space-y-3">
                  {/* Option 1: Desde Cero (MARKED / HIGHLIGHTED) */}
                  <div
                    onClick={() => setStep('scratch')}
                    className="group relative flex items-center justify-between rounded-2xl border-2 border-[#0066FF] bg-gradient-to-r from-blue-50/60 to-white p-4 transition-all duration-200 hover:shadow-lg hover:border-[#0052CC] cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/20 group-hover:scale-105 transition-transform">
                        <Edit3 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-zinc-900 group-hover:text-[#0052CC] transition-colors">
                            Desde cero
                          </h3>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-[#0066FF]">
                            Personalizado
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          Empieza con un lienzo en blanco para máxima personalización
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl bg-[#0066FF] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs group-hover:bg-[#0052CC] transition-colors"
                    >
                      Empezar
                    </button>
                  </div>

                  {/* Option 2: Desde una Plantilla */}
                  <div
                    onClick={() => setStep('templates')}
                    className="group relative flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:border-[#0066FF]/60 hover:shadow-md hover:bg-zinc-50/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] group-hover:scale-105 transition-transform">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-zinc-900 group-hover:text-[#0066FF] transition-colors">
                            Desde una plantilla
                          </h3>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-600">
                            +50 rutas
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          Catálogo de destinos con días y actividades ya configuradas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 group-hover:border-[#0066FF] group-hover:text-[#0066FF] transition-colors"
                    >
                      Explorar
                    </button>
                  </div>

                  {/* Option 3: Desde un Documento (AI) */}
                  <div
                    onClick={() => setStep('document')}
                    className="group relative flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:border-[#0066FF]/60 hover:shadow-md hover:bg-zinc-50/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] group-hover:scale-105 transition-transform">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-zinc-900 group-hover:text-[#0066FF] transition-colors">
                            Desde un documento
                          </h3>
                          <span className="rounded-full bg-[#140b2a] px-2 py-0.5 text-[9px] font-black text-white flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-[#00C6FF]" />
                            IA
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          Sube un PDF o imagen de reserva y la IA creará el viaje
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 group-hover:border-[#0066FF] group-hover:text-[#0066FF] transition-colors"
                    >
                      Subir
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom footer tip */}
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span>¿Necesitas ayuda? Siempre podrás editar todo más tarde.</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: TEMPLATES GALLERY (Image 2)                           */}
      {/* ------------------------------------------------------------- */}
      {step === 'templates' && (
        <div className="w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-3xl border border-[#eaecf0] bg-white shadow-2xl animate-scale-in text-left overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] p-6 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex items-center gap-1 rounded-xl border border-[#eaecf0] bg-zinc-50 p-2 text-xs font-bold text-[#344054] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-extrabold text-[#101828]">
                Crear viaje desde una plantilla
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar plantilla..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#344054]">
                Inspiración ({filteredTemplates.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="group relative cursor-pointer rounded-2xl border border-[#eaecf0] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#0066FF]/60 transition-all"
                >
                  {/* Image container */}
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={tpl.imageUrl}
                      alt={tpl.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Code Pill */}
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold tracking-wider text-white">
                      {tpl.code}
                    </div>

                    {/* Duration / Budget Pill */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#101828]">
                      {tpl.durationDays} días · ~{tpl.estimatedBudget} €
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF]">
                        {tpl.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-[#101828] group-hover:text-[#0066FF] transition-colors truncate">
                      {tpl.title}
                    </h4>
                    <p className="mt-1 text-xs text-[#667085] line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No se encontraron plantillas con el término "{templateSearch}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: CREATE FROM SCRATCH FORM (2-COLUMN MODERN MODAL)      */}
      {/* ------------------------------------------------------------- */}
      {step === 'scratch' && (
        <div className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] border-0 bg-[#140b2a] shadow-2xl animate-scale-in text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
            {/* LEFT COLUMN: LIVE TRIP CARD PREVIEW */}
            <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white overflow-hidden bg-[#140b2a]">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={imageUrl || PRESET_IMAGES[0].url}
                  alt="Portada seleccionada"
                  fill
                  priority
                  className="object-cover object-center transition-all duration-700 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140b2a] via-[#140b2a]/70 to-[#140b2a]/40" />
                <div className="absolute inset-0 bg-radial from-transparent to-[#140b2a]/60" />
              </div>

              {/* Top: Live Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-[#00C6FF]" />
                  <span className="text-xs font-extrabold tracking-wide uppercase text-white">Vista Previa</span>
                </div>
                <span className="rounded-full bg-[#0066FF] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                  Borrador
                </span>
              </div>

              {/* Bottom: Live Trip Summary */}
              <div className="relative z-10 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#93C5FD]">Nuevo Itinerario</span>
                  <h3 className="text-2xl font-black leading-tight text-white tracking-tight break-words">
                    {tripName.trim() || 'Escapada Inolvidable'}
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-300 font-medium line-clamp-2">
                    {description.trim() || 'Diseño de viaje a medida con vuelos, hoteles y actividades personalizadas.'}
                  </p>
                </div>

                {/* Live Stats Pills */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/15 text-xs">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5 text-[#00C6FF]" />
                    <span className="text-[11px] font-bold text-zinc-100">
                      {startDate && endDate ? `${startDate} — ${endDate}` : 'Fechas por definir'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    <DollarSign className="h-3.5 w-3.5 text-[#00C6FF]" />
                    <span className="text-[11px] font-bold text-zinc-100">
                      ~{budget || 1500} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FORM INPUTS */}
            <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 bg-white max-h-[90vh] overflow-y-auto [scrollbar-width:thin]">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('choose')}
                      className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 tracking-tight">Crear viaje desde cero</h2>
                      <p className="text-xs text-zinc-500">Configura los detalles básicos de la propuesta</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateFromScratch} className="mt-5 space-y-4">
                  {/* Trip Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Nombre del destino o viaje <span className="text-[#0066FF]">*</span>
                    </label>
                    <div className="relative">
                      <Plane className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="ej. Escapada a Bali y Komodo"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-3 py-2.5 text-xs text-zinc-900 focus:border-[#0066FF] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Dates (No duplicate label) */}
                  <div>
                    <HeroUIDateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      label="Fechas del viaje"
                      isRequired={false}
                      onChange={({ startDate: s, endDate: e }) => {
                        setStartDate(s);
                        setEndDate(e);
                      }}
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Presupuesto aproximado (€)
                    </label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-3 py-2.5 text-xs text-zinc-900 focus:border-[#0066FF] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Descripción breve
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe brevemente el viaje o estilo de la ruta..."
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 text-xs text-zinc-900 focus:border-[#0066FF] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 transition-all"
                    />
                  </div>

                  {/* Preset Images with reliable local/Unsplash URLs and checkmark */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                      Imagen de portada
                    </label>
                    <div className="grid grid-cols-5 gap-2.5">
                      {PRESET_IMAGES.map((img) => {
                        const isSelected = imageUrl === img.url;
                        return (
                          <button
                            key={img.url}
                            type="button"
                            onClick={() => setImageUrl(img.url)}
                            className={`group relative h-14 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#0066FF] ring-2 ring-[#0066FF]/30 scale-102 shadow-sm'
                                : 'border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-400'
                            }`}
                          >
                            <Image src={img.url} alt={img.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#0066FF]/20 flex items-center justify-center">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-xs">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setStep('choose')}
                      className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !tripName.trim()}
                      className="flex items-center gap-2 rounded-full bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0066FF]/20 hover:bg-[#0052CC] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Crear itinerario</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: DOCUMENT UPLOAD (Wanderlust AI)                        */}
      {/* ------------------------------------------------------------- */}
      {step === 'document' && (
        <div className="w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in text-left">
          <div className="flex items-center justify-between border-b border-[#eaecf0] pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex items-center gap-1 rounded-xl border border-[#eaecf0] bg-zinc-50 p-1.5 text-xs font-bold text-[#344054] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-base font-extrabold text-[#101828]">Crear viaje con Wanderlust AI</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-1 text-[#667085] hover:bg-[#f4f5f8] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#0066FF]/40 bg-blue-50/50 p-8 text-center hover:bg-blue-50/80 transition-all cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.bmp,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066FF] text-white shadow-md mb-3">
                <Upload className="h-7 w-7" />
              </div>
              <p className="text-sm font-extrabold text-[#101828]">
                {docFile ? docFile.name : 'Haz clic o arrastra tu archivo aquí'}
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                PDF, JPEG, PNG o documentos de reserva (máx. 10MB)
              </p>
            </div>

            {isProcessingDoc && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center space-y-2">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0066FF]" />
                <p className="text-xs font-bold text-[#0052CC]">{docProgress}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-5 border-t border-[#eaecf0] mt-5">
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="rounded-full border border-[#d0d5dd] px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
