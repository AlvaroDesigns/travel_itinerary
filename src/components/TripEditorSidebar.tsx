'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  BookOpen,
  FileText,
  Users,
  Palette,
  Settings,
  Languages,
  X,
  Sparkles,
  Type,
  Heading,
  Route,
  ListOrdered,
  DollarSign,
  Paperclip,
  CalendarCheck,
  Bed,
  Plane,
  MapPin,
  Utensils,
  Ship,
  Car,
  Train,
  Info,
  Image as ImageIcon,
  Video,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldCheck,
  ListChecks,
  Sun,
  Globe,
  Lock,
  Upload,
} from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { isAgencyUser } from '@/lib/user-utils';
import { TRIP_TEMPLATES, TripTemplate } from '@/lib/templates-data';

export type BlockCategoryType = 'esenciales' | 'servicios' | 'multimedia' | 'otros';

export interface ThemeConfig {
  id: 'classic' | 'elegant' | 'bold' | 'minimal';
  name: string;
  isAccountTheme?: boolean;
  previewType: 'classic' | 'elegant' | 'bold' | 'minimal';
}

export interface PersonalizationSettings {
  useAccountTheme: boolean;
  selectedTheme: 'classic' | 'elegant' | 'bold' | 'minimal';
  logoUrl?: string;
  showLogoInPublic: boolean;
  primaryColor: string;
  fontFamily: string;
  headerStyle: 'compact' | 'standard' | 'immersive';
}

export interface LanguageSettings {
  selectedLanguage: 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';
  currency: 'EUR' | 'USD' | 'GBP';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  autoTranslate: boolean;
}

interface TripEditorSidebarProps {
  activeDate: string;
  tripDates: string[];
  activeDrawer: string | null;
  setActiveDrawer: (drawer: string | null) => void;
  onAddBlock: (type: any, date?: string) => void;
  onDragStartBlock: (type: any, e?: React.DragEvent) => void;
  themeSettings: PersonalizationSettings;
  onUpdateThemeSettings: (settings: Partial<PersonalizationSettings>) => void;
  languageSettings?: LanguageSettings;
  onUpdateLanguageSettings?: (settings: Partial<LanguageSettings>) => void;
  onSelectTemplate?: (template: TripTemplate) => void;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'classic',
    name: 'Classic',
    isAccountTheme: true,
    previewType: 'classic',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    previewType: 'elegant',
  },
  {
    id: 'bold',
    name: 'Bold',
    previewType: 'bold',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    previewType: 'minimal',
  },
];

const COLOR_PALETTES = [
  { name: 'Azul Eléctrico', value: '#0066FF', bg: 'bg-[#0066FF]' },
  { name: 'Índigo Royal', value: '#140b2a', bg: 'bg-[#140b2a]' },
  { name: 'Esmeralda', value: '#059669', bg: 'bg-[#059669]' },
  { name: 'Océano', value: '#0284c7', bg: 'bg-[#0284c7]' },
  { name: 'Rosa Coral', value: '#e11d48', bg: 'bg-[#e11d48]' },
  { name: 'Púrpura Profundo', value: '#7c3aed', bg: 'bg-[#7c3aed]' },
];

const FONTS = [
  { name: 'Outfit (Predeterminada)', value: 'var(--font-outfit), sans-serif' },
  { name: 'Inter (Moderna & Limpia)', value: 'Inter, sans-serif' },
  { name: 'Playfair Display (Editorial)', value: 'Playfair Display, serif' },
  { name: 'Plus Jakarta Sans (Geométrica)', value: 'Plus Jakarta Sans, sans-serif' },
];

export function TripEditorSidebar({
  activeDate,
  tripDates,
  activeDrawer,
  setActiveDrawer,
  onAddBlock,
  onDragStartBlock,
  themeSettings,
  onUpdateThemeSettings,
  languageSettings = {
    selectedLanguage: 'es',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    autoTranslate: true,
  },
  onUpdateLanguageSettings,
  onSelectTemplate,
}: TripEditorSidebarProps) {
  const { user } = useTravel();
  const isAgency = isAgencyUser(user);
  const sidebarLogoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSidebarLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onUpdateThemeSettings({ logoUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Accordion state for blocks drawer
  const [categoriesOpen, setCategoriesOpen] = useState<{ [key in BlockCategoryType]: boolean }>({
    esenciales: true,
    servicios: true,
    multimedia: true,
    otros: true,
  });

  const toggleCategory = (cat: BlockCategoryType) => {
    setCategoriesOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const navItems = [
    { id: 'esenciales', label: 'Esenciales', icon: Plus },
    { id: 'templates', label: 'Plantillas', icon: BookOpen },
    { id: 'personalization', label: 'Diseño', icon: Palette },
    { id: 'languages', label: 'Idioma', icon: Languages },
    { id: 'clients', label: 'Viajeros', icon: Users },
    { id: 'document', label: 'Documento', icon: FileText },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    if (activeDrawer === id) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(id);
    }
  };

  return (
    <div className="flex z-30 shrink-0 select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT VERTICAL ICON DOCK / NAVIGATION RAIL                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col items-center justify-between border-r border-[#eaecf0] bg-white py-3 px-1.5 w-14 shrink-0 shadow-2xs">
        <div className="flex flex-col items-center gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeDrawer === item.id || (item.id === 'esenciales' && activeDrawer === 'blocks');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/25'
                    : 'text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828]'
                }`}
              >
                {isActive && (
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#0066FF]" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
              </button>
            );
          })}
        </div>

        {/* Bottom indicator */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col items-center">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sincronizado" />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPANDABLE DRAWER PANEL                                    */}
      {/* ------------------------------------------------------------- */}
      {activeDrawer && (
        <aside className="w-80 sm:w-96 border-r border-[#eaecf0] bg-white shadow-xl flex flex-col h-full animate-slide-left z-20 overflow-hidden">
          {/* ========================================================= */}
          {/* DRAWER 1: ESENCIALES & BLOQUES                             */}
          {/* ========================================================= */}
          {(activeDrawer === 'esenciales' || activeDrawer === 'blocks') && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div>
                  <h3 className="text-base font-extrabold text-[#101828]">Bloques Esenciales</h3>
                  <p className="text-[11px] text-[#667085]">
                    Arrastra o haz clic para añadir al día ({activeDate})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body: Grouped Accordions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
                {/* 1. ESENCIALES */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleCategory('esenciales')}
                    className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {categoriesOpen.esenciales ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      Esenciales
                    </span>
                  </button>

                  {categoriesOpen.esenciales && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <BlockGridItem
                        label="Texto"
                        icon={Type}
                        type="text"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Título"
                        icon={Heading}
                        type="title"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Itinerario"
                        icon={Route}
                        type="itinerary"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Documentos"
                        icon={Paperclip}
                        type="services_summary"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Qué incluye"
                        icon={ListChecks}
                        type="conditions"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Precio"
                        icon={DollarSign}
                        type="price"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Archivo"
                        icon={Paperclip}
                        type="file"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Booking"
                        icon={CalendarCheck}
                        type="booking"
                        badge="ACTIVO"
                        badgeColor="bg-blue-100 text-blue-800"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                    </div>
                  )}
                </div>

                {/* 2. MULTIMEDIA */}
                <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
                  <button
                    type="button"
                    onClick={() => toggleCategory('multimedia')}
                    className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {categoriesOpen.multimedia ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      Multimedia
                    </span>
                  </button>

                  {categoriesOpen.multimedia && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <BlockGridItem
                        label="Galería"
                        icon={ImageIcon}
                        type="gallery"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Vídeo"
                        icon={Video}
                        type="video"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                    </div>
                  )}
                </div>

                {/* 3. OTROS */}
                <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
                  <button
                    type="button"
                    onClick={() => toggleCategory('otros')}
                    className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {categoriesOpen.otros ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      Otros
                    </span>
                  </button>

                  {categoriesOpen.otros && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <BlockGridItem
                        label="Notas & FAQ"
                        icon={FileText}
                        type="notes"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Asistencia 24/7"
                        icon={ShieldCheck}
                        type="emergency"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Clima & Consejos"
                        icon={Sun}
                        type="weather"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                    </div>
                  )}
                </div>

                {/* 4. SERVICIOS */}
                <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
                  <button
                    type="button"
                    onClick={() => toggleCategory('servicios')}
                    className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {categoriesOpen.servicios ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      Servicios
                    </span>
                  </button>

                  {categoriesOpen.servicios && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <BlockGridItem
                        label="Alojamiento"
                        icon={Bed}
                        type="hotel"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Vuelo"
                        icon={Plane}
                        type="flight"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Actividad"
                        icon={MapPin}
                        type="activity"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Comida"
                        icon={Utensils}
                        type="food"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Crucero"
                        icon={Ship}
                        type="cruise"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Transporte"
                        icon={Car}
                        type="transport"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Tren"
                        icon={Train}
                        type="train"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                      <BlockGridItem
                        label="Información"
                        icon={Info}
                        type="info"
                        onAdd={onAddBlock}
                        onDragStart={onDragStartBlock}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 2: PLANTILLAS                                      */}
          {/* ========================================================= */}
          {activeDrawer === 'templates' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#0066FF]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101828]">Plantillas de Viaje</h3>
                    <p className="text-[11px] text-[#667085]">Aplica itinerarios prediseñados</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
                {TRIP_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group rounded-2xl border border-zinc-200 bg-white p-3.5 hover:border-[#0066FF] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-32 w-full rounded-xl overflow-hidden mb-2.5">
                        <Image
                          src={tpl.imageUrl}
                          alt={tpl.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          {tpl.code}
                        </div>
                        <div className="absolute bottom-2 right-2 rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-[#101828]">
                          {tpl.durationDays} días
                        </div>
                      </div>
                      <h4 className="text-xs font-extrabold text-[#101828] group-hover:text-[#0066FF] transition-colors line-clamp-1">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-[#667085] line-clamp-2 mt-0.5">{tpl.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-full">
                          ~{tpl.estimatedBudget} €
                        </span>
                        <span className="text-[10px] text-zinc-500">{tpl.activities.length} actividades</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTemplate && onSelectTemplate(tpl)}
                      className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#0066FF] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Aplicar al itinerario</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 3: DISEÑO / PERSONALIZACIÓN                        */}
          {/* ========================================================= */}
          {activeDrawer === 'personalization' && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF]">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101828]">Diseño & Personalización</h3>
                    <p className="text-[11px] text-[#667085]">Estilos, tema y marca de la propuesta</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 [scrollbar-width:thin]">
                {/* 1. SECCIÓN TEMA */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Tema</h4>
                  </div>

                  {/* Account Theme Checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-[#eaecf0] bg-[#fafafa] p-3 transition hover:bg-[#f4f5f8]">
                    <input
                      type="checkbox"
                      checked={themeSettings.useAccountTheme}
                      onChange={(e) => onUpdateThemeSettings({ useAccountTheme: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#101828]">Usar el tema de tu cuenta</span>
                      <p className="text-[11px] text-[#667085]">
                        Ahora mismo: <strong className="text-[#0066FF] capitalize">{themeSettings.selectedTheme}</strong>
                      </p>
                    </div>
                  </label>

                  {/* Grid of 4 Themes (Classic, Elegant, Bold, Minimal) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {THEMES.map((th) => {
                      const isSelected = themeSettings.selectedTheme === th.id;
                      return (
                        <div
                          key={th.id}
                          className={`group relative flex flex-col justify-between rounded-2xl border-2 p-3 transition-all ${
                            isSelected
                              ? 'border-[#0066FF] bg-blue-50/50 shadow-sm'
                              : 'border-[#eaecf0] bg-white hover:border-zinc-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-[#101828]">{th.name}</span>
                          </div>

                          <div className="h-16 w-full rounded-xl bg-zinc-100/90 border border-zinc-200/80 p-1.5 flex flex-col justify-between overflow-hidden">
                            {th.previewType === 'classic' && (
                              <>
                                <div className="h-2.5 w-1/3 rounded bg-zinc-300" />
                                <div className="h-1.5 w-2/3 rounded bg-zinc-200" />
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                  <div className="h-6 rounded bg-zinc-300/80" />
                                  <div className="h-6 rounded bg-zinc-300/80" />
                                </div>
                              </>
                            )}
                            {th.previewType === 'elegant' && (
                              <div className="flex flex-col items-center justify-center h-full gap-1">
                                <div className="h-2 w-1/2 rounded-full bg-zinc-400" />
                                <div className="h-8 w-4/5 rounded bg-zinc-300/80" />
                              </div>
                            )}
                            {th.previewType === 'bold' && (
                              <>
                                <div className="h-4 w-full rounded bg-zinc-400/80" />
                                <div className="flex gap-1 mt-1">
                                  <div className="h-7 w-2/3 rounded bg-zinc-300" />
                                  <div className="h-7 w-1/3 rounded bg-zinc-200" />
                                </div>
                              </>
                            )}
                            {th.previewType === 'minimal' && (
                              <>
                                <div className="flex justify-between">
                                  <div className="h-2 w-2/5 rounded bg-zinc-400" />
                                  <div className="h-2 w-1/5 rounded bg-zinc-300" />
                                </div>
                                <div className="space-y-1 mt-1">
                                  <div className="h-3 w-full rounded bg-zinc-200" />
                                  <div className="h-3 w-full rounded bg-zinc-200" />
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onUpdateThemeSettings({ selectedTheme: th.id })}
                            className={`mt-2.5 w-full rounded-xl py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0066FF] text-white shadow-xs'
                                : 'border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]'
                            }`}
                          >
                            {isSelected ? 'Activo' : 'Seleccionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SECCIÓN LOGOTIPO */}
                {isAgency ? (
                  <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Logotipo</h4>
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-[#0066FF]">
                          Agencia
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">PNG / SVG</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-[#fafafa] p-3">
                      <div className="relative h-12 w-28 shrink-0 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            (themeSettings.logoUrl && themeSettings.logoUrl !== "/wanderlust_horizontal_negro.png" ? themeSettings.logoUrl : null) ||
                            user?.agencyLogo ||
                            (typeof window !== "undefined" ? localStorage.getItem("wanderlust_agency_logo") : null) ||
                            "/wanderlust_horizontal_negro.png"
                          }
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#101828] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={themeSettings.showLogoInPublic}
                            onChange={(e) => onUpdateThemeSettings({ showLogoInPublic: e.target.checked })}
                            className="rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                          />
                          <span>Mostrar en propuesta</span>
                        </label>

                        <input
                          type="file"
                          ref={sidebarLogoInputRef}
                          onChange={handleSidebarLogoUpload}
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                        />

                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => sidebarLogoInputRef.current?.click()}
                            className="text-[10px] font-bold text-[#0066FF] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Cambiar logo</span>
                          </button>

                          {themeSettings.logoUrl && themeSettings.logoUrl !== "/wanderlust_horizontal_negro.png" && (
                            <button
                              type="button"
                              onClick={() => onUpdateThemeSettings({ logoUrl: "/wanderlust_horizontal_negro.png" })}
                              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 hover:underline cursor-pointer"
                            >
                              Restaurar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Logotipo</h4>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-600 flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Exclusivo Agencias
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-[#f9fafb] p-3 opacity-90">
                      <div className="relative h-12 w-24 shrink-0 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/wanderlust_horizontal_negro.png"
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-zinc-500 leading-snug">
                          La marca personalizada está reservada para <strong>cuentas de Agencia</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SECCIÓN COLORES DE MARCA */}
                <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Color Principal</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PALETTES.map((col) => {
                      const isColActive = themeSettings.primaryColor === col.value;
                      return (
                        <button
                          key={col.value}
                          type="button"
                          title={col.name}
                          onClick={() => onUpdateThemeSettings({ primaryColor: col.value })}
                          className={`h-9 w-9 rounded-full ${col.bg} flex items-center justify-center transition-transform cursor-pointer ${
                            isColActive ? 'ring-3 ring-offset-2 ring-[#0066FF] scale-110 shadow-sm' : 'hover:scale-105 opacity-90'
                          }`}
                        >
                          {isColActive && <Check className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. SECCIÓN TIPOGRAFÍA */}
                <div className="space-y-2 pt-4 border-t border-[#eaecf0]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Tipografía</h4>
                  <select
                    value={themeSettings.fontFamily}
                    onChange={(e) => onUpdateThemeSettings({ fontFamily: e.target.value })}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. SECCIÓN ESTILO DE PORTADA */}
                <div className="space-y-2 pt-4 border-t border-[#eaecf0]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Altura de Portada</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Compacta' },
                      { id: 'standard', label: 'Estándar' },
                      { id: 'immersive', label: 'Inmersiva' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateThemeSettings({ headerStyle: opt.id as any })}
                        className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                          themeSettings.headerStyle === opt.id
                            ? 'bg-[#101828] text-white shadow-xs'
                            : 'border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 4: IDIOMA & CONFIGURACIÓN REGIONAL                 */}
          {/* ========================================================= */}
          {activeDrawer === 'languages' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#0066FF]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101828]">Idioma & Región</h3>
                    <p className="text-[11px] text-[#667085]">Idiomas, moneda y traducción IA</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 [scrollbar-width:thin]">
                {/* Selector de idioma */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Idioma de la propuesta</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { code: 'es', label: 'Español (Predeterminado)' },
                      { code: 'en', label: 'English (Inglés)' },
                      { code: 'fr', label: 'Français (Francés)' },
                      { code: 'de', label: 'Deutsch (Alemán)' },
                      { code: 'it', label: 'Italiano' },
                      { code: 'pt', label: 'Português' },
                    ].map((lang) => {
                      const isSelected = languageSettings.selectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => onUpdateLanguageSettings && onUpdateLanguageSettings({ selectedLanguage: lang.code as any })}
                          className={`flex items-center justify-between rounded-xl p-3 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-[#0052CC] border border-[#0066FF]'
                              : 'border border-[#eaecf0] bg-white text-[#344054] hover:bg-[#f9fafb]'
                          }`}
                        >
                          <span>{lang.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-[#0066FF]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Moneda */}
                <div className="space-y-2 pt-3 border-t border-[#eaecf0]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Moneda</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['EUR', 'USD', 'GBP'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => onUpdateLanguageSettings && onUpdateLanguageSettings({ currency: curr })}
                        className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                          languageSettings.currency === curr
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : 'border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]'
                        }`}
                      >
                        {curr} {curr === 'EUR' ? '€' : curr === 'USD' ? '$' : '£'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formato de Fecha */}
                <div className="space-y-2 pt-3 border-t border-[#eaecf0]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">Formato de Fecha</h4>
                  <select
                    value={languageSettings.dateFormat}
                    onChange={(e) => onUpdateLanguageSettings && onUpdateLanguageSettings({ dateFormat: e.target.value as any })}
                    className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Europa - 18/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (EE.UU. - 09/18/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO - 2026-09-18)</option>
                  </select>
                </div>

                {/* Traducción Automática IA */}
                <div className="pt-3 border-t border-[#eaecf0]">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-[#eaecf0] bg-[#fafafa] p-3 transition hover:bg-[#f4f5f8]">
                    <input
                      type="checkbox"
                      checked={languageSettings.autoTranslate}
                      onChange={(e) => onUpdateLanguageSettings && onUpdateLanguageSettings({ autoTranslate: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#101828]">Traducción dinámica con IA</span>
                      <p className="text-[11px] text-[#667085]">
                        Traduce automáticamente notas, títulos e itinerarios en tiempo real para clientes internacionales.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 5: VIAJEROS & PASAJEROS                            */}
          {/* ========================================================= */}
          {activeDrawer === 'clients' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0066FF]" />
                  <h3 className="text-sm font-extrabold text-[#101828]">Viajeros & Clientes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 text-xs text-zinc-600 space-y-3">
                <p>Gestiona los datos de los pasajeros principales y acompañantes para este itinerario.</p>
                <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center">
                  <Users className="mx-auto h-6 w-6 text-zinc-400 mb-1" />
                  <span className="font-bold text-zinc-700">1 Pasajero Principal Asignado</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 6: DOCUMENTO                                       */}
          {/* ========================================================= */}
          {activeDrawer === 'document' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0066FF]" />
                  <h3 className="text-sm font-extrabold text-[#101828]">Documento & Exportación</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 text-xs text-zinc-600 space-y-3">
                <p>Opciones de descarga y exportación de la propuesta de viaje en formato PDF interactivo.</p>
                <button
                  type="button"
                  onClick={() => alert('Generando propuesta en formato PDF imprimible...')}
                  className="w-full rounded-xl bg-[#0066FF] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition cursor-pointer"
                >
                  Descargar PDF de la propuesta
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRAWER 7: CONFIGURACIÓN                                   */}
          {/* ========================================================= */}
          {activeDrawer === 'settings' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-[#eaecf0] p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#0066FF]" />
                  <h3 className="text-sm font-extrabold text-[#101828]">Configuración del viaje</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 text-xs text-zinc-600 space-y-3">
                <p>Parámetros avanzados de privacidad, notificaciones y visibilidad pública del itinerario.</p>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Subcomponent for matching Card in the Blocks Grid
// -----------------------------------------------------------------
interface BlockGridItemProps {
  label: string;
  icon: any;
  type: string;
  badge?: string;
  badgeColor?: string;
  onAdd: (type: string) => void;
  onDragStart: (type: string, e?: React.DragEvent) => void;
}

function BlockGridItem({
  label,
  icon: Icon,
  type,
  badge,
  badgeColor = 'bg-zinc-100 text-zinc-700',
  onAdd,
  onDragStart,
}: BlockGridItemProps) {
  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', type);
        onDragStart(type, e);
      }}
      onClick={() => onAdd(type)}
      className="group relative flex flex-col justify-between rounded-2xl border border-[#eaecf0] bg-white p-3.5 text-left transition-all hover:border-[#0066FF] hover:shadow-md cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold text-[#101828] group-hover:text-[#0066FF] transition-colors leading-tight line-clamp-2">
          {label}
        </span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[#667085] group-hover:text-[#0066FF] transition-colors">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {badge && (
        <div className="mt-2 flex items-center justify-end">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider ${badgeColor}`}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
