'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Ban,
  Plus,
  Trash2,
  Sparkles,
  Plane,
  Bus,
  Bed,
  MapPin,
  ShieldCheck,
  UserCheck,
  Luggage,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';

interface TripIncludesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any | null;
  defaultDate: string;
  tripName?: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

export function TripIncludesModal({
  isOpen,
  onClose,
  activity,
  defaultDate,
  tripName = '',
  onSave,
  onDelete,
}: TripIncludesModalProps) {
  const [title, setTitle] = useState('Qué incluye y qué no incluye');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [includesText, setIncludesText] = useState('');
  const [excludesText, setExcludesText] = useState('');
  const [departureCities, setDepartureCities] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [destinationsText, setDestinationsText] = useState('');

  const isVietnam =
    tripName.toLowerCase().includes('vietnam') ||
    (activity?.tripId && String(activity.tripId).includes('vietnam'));

  // Default values based on destination
  const defaultVietnamIncludes = [
    'Vuelos internacionales de ida y vuelta con compañía de primer nivel',
    'Traslados aeropuerto - hotel - aeropuerto en vehículo privado',
    'Alojamiento en hoteles y resorts previstos o de categoría similar',
    'Vuelos internos y trenes panorámicos según programa del viaje',
    'Visitas culturales, templos y excursiones con entradas incluidas',
    'Guía acompañante de habla hispana durante todo el circuito',
    'Seguro de asistencia médica y cobertura de equipaje en viaje',
  ].join('\n');

  const defaultVietnamDepartures =
    'Madrid, Barcelona, Palma de Mallorca, Valencia, Bilbao, Sevilla, Málaga, Alicante, Lisboa, Oporto';

  const defaultVietnamCategories =
    'Cultural, Naturaleza, Confirmación inmediata, Mejor Precio Garantizado';

  const defaultVietnamDestinations =
    'Hanói, Sapa, Ninh Binh, Huế, Hội An, Da Nang, Ho Chi Minh';

  const defaultGeneralIncludes = [
    'Vuelo regular de ida y vuelta con franquicia de equipaje',
    'Traslados aeropuerto - hotel - aeropuerto.',
    'Alojamiento en hoteles previstos o similares.',
    'Vuelos internos o transportes según el programa.',
    'Visitas y excursiones mencionadas en el itinerario.',
    'Guía acompañante de habla hispana durante el circuito.',
    'Seguro de asistencia en viaje.',
  ].join('\n');

  const defaultGeneralDepartures =
    'A Coruña / La Coruña, Las Palmas de Gran Canaria, Ibiza, Barcelona, Bilbao, Oporto, Milán, Lisboa, Vigo, Tenerife Norte, Madrid, Roma, Alicante, Málaga, Palma, Mallorca, Valencia';

  const defaultGeneralCategories =
    'Cultural, Naturaleza, Confirmación inmediata, Mejor Precio Garantizado';

  const defaultGeneralDestinations =
    'Destinos principales del circuito y visitas destacadas';

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || 'Qué incluye y qué no incluye');
      setDate(activity.date || defaultDate);
      setTime(activity.time || '10:00');

      // Includes list
      if (Array.isArray(activity.includes)) {
        setIncludesText(activity.includes.join('\n'));
      } else if (typeof activity.includes === 'string') {
        setIncludesText(activity.includes);
      } else {
        setIncludesText(isVietnam ? defaultVietnamIncludes : defaultGeneralIncludes);
      }

      // Excludes
      if (Array.isArray(activity.excludes)) {
        setExcludesText(activity.excludes.join('\n'));
      } else if (typeof activity.excludes === 'string') {
        setExcludesText(activity.excludes);
      } else {
        setExcludesText(
          'Bebidas en las comidas no especificadas\nGastos personales y propinas\nExcursiones opcionales no contratadas'
        );
      }

      // Departures
      setDepartureCities(
        activity.departureCities ||
          (isVietnam ? defaultVietnamDepartures : defaultGeneralDepartures)
      );

      // Categories
      if (Array.isArray(activity.categories)) {
        setCategoriesText(activity.categories.join(', '));
      } else {
        setCategoriesText(
          activity.categories ||
            (isVietnam ? defaultVietnamCategories : defaultGeneralCategories)
        );
      }

      // Destinations
      if (Array.isArray(activity.connectedDestinations)) {
        setDestinationsText(activity.connectedDestinations.join(', '));
      } else {
        setDestinationsText(
          activity.connectedDestinations ||
            (isVietnam ? defaultVietnamDestinations : defaultGeneralDestinations)
        );
      }
    } else {
      setTitle('Qué incluye y qué no incluye');
      setDate(defaultDate);
      setTime('10:00');
      setIncludesText(isVietnam ? defaultVietnamIncludes : defaultGeneralIncludes);
      setExcludesText(
        'Bebidas en las comidas no especificadas\nGastos personales y propinas\nExcursiones opcionales no contratadas'
      );
      setDepartureCities(isVietnam ? defaultVietnamDepartures : defaultGeneralDepartures);
      setCategoriesText(isVietnam ? defaultVietnamCategories : defaultGeneralCategories);
      setDestinationsText(isVietnam ? defaultVietnamDestinations : defaultGeneralDestinations);
    }
  }, [activity, defaultDate, isVietnam]);

  if (!isOpen) return null;

  const handleApplyPreset = () => {
    setIncludesText(isVietnam ? defaultVietnamIncludes : defaultGeneralIncludes);
    setDepartureCities(isVietnam ? defaultVietnamDepartures : defaultGeneralDepartures);
    setCategoriesText(isVietnam ? defaultVietnamCategories : defaultGeneralCategories);
    setDestinationsText(isVietnam ? defaultVietnamDestinations : defaultGeneralDestinations);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const includesArray = includesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const excludesArray = excludesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const categoriesArray = categoriesText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const destinationsArray = destinationsText
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    onSave({
      type: 'conditions',
      title: title.trim() || 'Qué incluye y qué no incluye',
      date,
      time,
      price: 0,
      description: includesArray.slice(0, 3).join(' · '),
      includes: includesArray,
      excludes: excludesArray,
      departureCities: departureCities.trim(),
      categories: categoriesArray,
      connectedDestinations: destinationsArray,
      isIncludesBlock: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-8 rounded-3xl bg-white shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600 bg-emerald-50 shrink-0">
              <Check className="h-5 w-5 stroke-[2.5]" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-rose-500 text-rose-500 bg-rose-50 shrink-0">
              <Ban className="h-5 w-5 stroke-[2.5]" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">
                {activity ? 'Editar Módulo: Qué incluye' : 'Nuevo Bloque: Qué incluye'}
              </h2>
              <p className="text-xs text-zinc-500">
                Configura los servicios incluidos, ciudades de salida y categorías para tu cliente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/60 text-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Preset Button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-xs text-teal-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                ¿Quieres rellenar con la plantilla recomendada para{' '}
                <strong>{tripName || 'este viaje'}</strong>?
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplyPreset}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer shrink-0"
            >
              Cargar sugerencias
            </button>
          </div>

          {/* Row 1: Título, Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="text-xs font-bold text-zinc-800">Título del bloque</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Qué incluye y qué no incluye"
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-semibold text-zinc-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Fecha asignada</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Hora</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Section 1: Tu viaje incluye */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-600" />
                <span>Tu viaje incluye (un servicio por línea):</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                {includesText.split('\n').filter(Boolean).length} servicios
              </span>
            </div>
            <textarea
              rows={7}
              value={includesText}
              onChange={(e) => setIncludesText(e.target.value)}
              placeholder="Vuelo Madrid - Destino con equipaje&#10;Traslados aeropuerto - hotel&#10;Alojamiento en hoteles previstos o similares&#10;Seguro de asistencia en viaje..."
              className="w-full rounded-2xl border border-zinc-300 p-3 text-xs text-zinc-800 font-medium leading-relaxed focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none"
              required
            />
            <p className="text-[11px] text-zinc-500">
              Cada línea se mostrará con su icono correspondiente (avión, hotel, traslados, seguro) en la vista pública.
            </p>
          </div>

          {/* Section 2: Salidas desde */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-800">
              Salidas desde (ciudades u orígenes disponibles):
            </label>
            <textarea
              rows={2}
              value={departureCities}
              onChange={(e) => setDepartureCities(e.target.value)}
              placeholder="Madrid, Barcelona, Palma de Mallorca, Bilbao, Valencia..."
              className="w-full rounded-2xl border border-zinc-300 p-3 text-xs text-zinc-800 font-medium leading-relaxed focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none"
            />
          </div>

          {/* Section 3: Categorías y Circuitos que pasan por */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                Categorías (separadas por comas):
              </label>
              <input
                type="text"
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="Cultural, Naturaleza, Confirmación inmediata..."
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800">
                Más circuitos que pasan por (ciudades):
              </label>
              <input
                type="text"
                value={destinationsText}
                onChange={(e) => setDestinationsText(e.target.value)}
                placeholder="Hanói, Sapa, Ninh Binh, Huế, Hội An, Ho Chi Minh..."
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Section 4: Tu viaje NO incluye (Opcional) */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <label className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              <span>Tu viaje NO incluye (opcional, un ítem por línea):</span>
            </label>
            <textarea
              rows={3}
              value={excludesText}
              onChange={(e) => setExcludesText(e.target.value)}
              placeholder="Bebidas no incluidas en el régimen&#10;Gastos personales y propinas&#10;Excursiones opcionales no contratadas..."
              className="w-full rounded-2xl border border-zinc-300 p-3 text-xs text-zinc-800 font-medium leading-relaxed focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none"
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            {activity && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(activity.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar bloque</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                Guardar bloque
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
