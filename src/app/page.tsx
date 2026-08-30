'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTravel } from '@/context/TravelContext';
import {
  Plus,
  Search,
  Calendar,
  Euro,
  Trash2,
  ArrowRight,
  X,
  Loader2,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const HERO_SLIDES = [
  { url: '/carousel-1.webp', place: 'Costa y montaña' },
  { url: '/carousel-2.webp', place: 'Acantilados del Algarve' },
  { url: '/carousel-3.webp', place: 'San Juan de Gaztelugatxe' },
  { url: '/carousel-4.webp', place: 'Cala escondida' },
];

const PRESET_IMAGES = [
  {
    name: 'Vietnam',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'París',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Tokio',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Roma',
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Nueva York',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const { trips, addTrip, deleteTrip, logout, user, isLoading } = useTravel();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [customImage, setCustomImage] = useState('');

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white">
        <Image
          src="/wanderlust_icono_negro.png"
          alt="Wanderlust"
          width={56}
          height={56}
          priority
          className="h-14 w-auto animate-pulse object-contain"
        />
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-ink-400">Cargando tus aventuras…</span>
        </div>
      </div>
    );
  }

  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDays = (start: string, end: string) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
  };

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const s = new Date(start);
    const e = new Date(end);

    const sDay = s.getDate();
    const sMonth = months[s.getMonth()];
    const eDay = e.getDate();
    const eMonth = months[e.getMonth()];
    const eYear = e.getFullYear();

    if (s.getMonth() === e.getMonth()) {
      return `${sDay} – ${eDay} ${sMonth} ${eYear}`;
    }
    return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${eYear}`;
  };

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) {
      alert('Indica el nombre del destino y las fechas del viaje.');
      return;
    }

    const finalImage = customImage.trim() !== '' ? customImage : imageUrl;

    addTrip({
      name,
      startDate,
      endDate,
      budget: 0,
      imageUrl: finalImage,
      description,
      notes,
    });

    setName('');
    setStartDate('');
    setEndDate('');
    setImageUrl(PRESET_IMAGES[0].url);
    setCustomImage('');
    setDescription('');
    setNotes('');

    setIsOpen(false);
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Navigation Bar */}
      <nav className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Image
            src="/wanderlust_horizontal_negro.png"
            alt="Wanderlust"
            width={180}
            height={44}
            priority
            className="h-9 w-auto object-contain"
          />

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Conectado como</span>
                <span className="text-xs font-bold text-ink-900">{user.email}</span>
              </div>
              <div className="hidden h-6 w-px bg-ink-200 sm:block" />
              <button
                onClick={logout}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition-all hover:border-ink-900 hover:text-ink-900 active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Carousel */}
      <section className="relative h-[380px] w-full overflow-hidden bg-ink-900 md:h-[460px]">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.url}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === heroIndex ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={idx !== heroIndex}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.url}
              alt={slide.place}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-ink-900/20" />
          </div>
        ))}

        {/* Overlay content */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 md:pb-20 lg:px-8">
          <div className="max-w-2xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" />
              <span>Tu compañero de aventuras</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm sm:text-5xl md:text-6xl">
              Planifica cada viaje<br className="hidden sm:block" /> con intención.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
              Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.
            </p>
          </div>
        </div>

        {/* Prev / Next controls */}
        <button
          type="button"
          onClick={() => setHeroIndex((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-ink-900/40 text-white backdrop-blur-sm transition-all hover:bg-ink-900/70"
          title="Anterior"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setHeroIndex((c) => (c + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-ink-900/40 text-white backdrop-blur-sm transition-all hover:bg-ink-900/70"
          title="Siguiente"
          aria-label="Imagen siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.url}
              type="button"
              onClick={() => setHeroIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
              title={slide.place}
              aria-label={`Ir a ${slide.place}`}
            />
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 md:mt-10 lg:px-8">
        {/* Control Bar */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-10 pr-4 text-sm font-medium text-ink-800 transition-all focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
              placeholder="Buscar un viaje…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>

          <button
            id="btn-add-trip"
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition-all hover:bg-ink-700 active:scale-95 sm:w-auto"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Añadir viaje
          </button>
        </div>

        {/* Trips Grid */}
        <div className="mt-8">
          {filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-6 py-16 text-center">
              <Image
                src="/wanderlust_icono_negro.png"
                alt=""
                width={64}
                height={64}
                className="mb-4 h-16 w-auto object-contain opacity-70"
              />
              <h3 className="text-xl font-bold text-ink-900">No hay viajes planificados</h3>
              <p className="mt-2 max-w-sm text-ink-500">
                {searchQuery
                  ? 'No se encontraron viajes con ese nombre. Prueba con otra búsqueda.'
                  : 'Aún no has agregado ningún viaje. Haz clic en "Añadir viaje" para comenzar tu aventura.'}
              </p>
              {!searchQuery && (
                <button
                  className="mt-6 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition-all hover:bg-ink-700 active:scale-95"
                  onClick={() => setIsOpen(true)}
                >
                  Crear mi primer viaje
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip) => {
                const totalDays = calculateDays(trip.startDate, trip.endDate);
                return (
                  <div
                    key={trip.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-300 hover:border-ink-300 hover:shadow-lg"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-ink-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={trip.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                        alt={trip.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />

                      <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          className="flex h-8 w-8 min-w-8 items-center justify-center rounded-lg border border-white/40 bg-white/95 text-ink-700 transition-colors hover:bg-ink-900 hover:text-white"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que quieres eliminar el viaje a "${trip.name}"? Se perderán todos sus itinerarios.`)) {
                              deleteTrip(trip.id);
                            }
                          }}
                          title="Eliminar viaje"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="rounded-full border border-white/30 bg-ink-900/60 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                          {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
                        </span>
                        <h2 className="mt-1.5 line-clamp-1 text-xl font-bold text-white drop-shadow-sm">
                          {trip.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5 text-sm text-ink-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-ink-400" />
                            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-ink-400" />
                            <span className="font-semibold text-ink-800">
                              Gastos registrados: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(trip.activities.reduce((total, activity) => total + activity.price, 0))}
                            </span>
                          </div>
                        </div>

                        {trip.description && (
                          <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">
                            {trip.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 border-t border-ink-100 pt-4">
                        <Link
                          href={`/viaje/${trip.id}`}
                          className="wanderlust-primary-button flex h-10 w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all hover:bg-zinc-800 active:scale-[0.98]"
                        >
                          Ver itinerario
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Añadir Viaje */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                Crear nuevo viaje
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Nombre del destino *</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 text-sm font-medium text-ink-800 transition-all focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  placeholder="Ej. París, Vietnam Mágico, Safari en Kenia…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Fecha de inicio *</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm text-ink-800 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Fecha de fin *</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm text-ink-800 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Imagen de portada (preestablecida)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => {
                        setImageUrl(img.url);
                        setCustomImage('');
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        imageUrl === img.url && customImage === ''
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-200 bg-ink-50 text-ink-600 hover:bg-ink-100'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  O introduce una URL de imagen personalizada
                </label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 text-sm font-medium text-ink-800 transition-all focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  placeholder="https://images.unsplash.com/…"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Descripción breve</label>
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 text-sm font-medium text-ink-800 transition-all focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  placeholder="Ej. Ruta de 12 días recorriendo el Sudeste Asiático…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Notas generales</label>
                <textarea
                  placeholder="Vacunas necesarias, visado, contactos de emergencia…"
                  className="h-20 w-full resize-none rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800 focus:border-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/50 px-6 py-4">
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white transition-all hover:bg-ink-700 active:scale-95"
                onClick={handleSubmit}
              >
                Crear viaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
