'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTravel } from '@/context/TravelContext';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { HeroUIDateRangePicker } from '@/components/HeroUIDateRangePicker';
import {
  Plus,
  Search,
  Calendar,
  Euro,
  Trash2,
  ArrowRight,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
  Sparkles,
  Plane,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react';

const HERO_SLIDES = [
  { url: '/carousel-1.webp', place: 'Costa y montaña' },
  { url: '/carousel-2.webp', place: 'Acantilados del Algarve' },
  { url: '/carousel-3.webp', place: 'San Juan de Gaztelugatxe' },
  { url: '/carousel-4.webp', place: 'Cala escondida' },
];

const DEFAULT_HERO_CONTENT = {
  heroBadge: 'Tu compañero de aventuras',
  heroTitle: 'Planifica cada viaje\ncon intención.',
  heroDescription: 'Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.',
};

type HeroContent = typeof DEFAULT_HERO_CONTENT;

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
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site/home')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.content) return;
        if (!cancelled) setHeroContent(body.content as HeroContent);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [customImage, setCustomImage] = useState('');

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
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
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

  // Metrics computation for Bento Stats
  const totalDaysAllTrips = useMemo(() => {
    return trips.reduce((acc, t) => acc + calculateDays(t.startDate, t.endDate), 0);
  }, [trips]);

  const totalBudgetSpent = useMemo(() => {
    return trips.reduce(
      (acc, t) => acc + t.activities.reduce((sum, a) => sum + (Number(a.price) || 0), 0),
      0
    );
  }, [trips]);

  const totalActivitiesCount = useMemo(() => {
    return trips.reduce((acc, t) => acc + (t.activities ? t.activities.length : 0), 0);
  }, [trips]);

  if (isLoading) {
    return <WanderlustLoader label="Cargando tus aventuras…" />;
  }

  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="flex-1 min-h-screen bg-[#fafafa] pb-20 text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* HeroUI Pro Sticky Frosted Glass Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/wanderlust_horizontal_negro.png"
                alt="Wanderlust"
                width={180}
                height={44}
                priority
                className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            </Link>
            <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00796b]">
              Pro
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/50 px-3 py-1 text-xs sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#009688] ring-2 ring-[#009688]/20" />
                <span className="font-medium text-zinc-700">{user.email}</span>
              </div>

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-[#009688] hover:text-[#00796b] active:scale-95"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              <button
                onClick={logout}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* HeroUI Pro Hero Section */}
      <section className="relative h-[400px] w-full overflow-hidden bg-zinc-950 md:h-[480px]">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.url}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              idx === heroIndex ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
            aria-hidden={idx !== heroIndex}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.url}
              alt={slide.place}
              className="h-full w-full object-cover"
            />
            {/* HeroUI Pro Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,150,136,0.25),rgba(255,255,255,0))]" />
          </div>
        ))}

        {/* Overlay Content */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 md:pb-18 lg:px-8">
          <div className="max-w-2xl text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              <span>{heroContent.heroBadge}</span>
            </div>
            <h1 className="whitespace-pre-line text-4xl font-extrabold tracking-tight drop-shadow-md sm:text-5xl md:text-6xl">
              {heroContent.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-zinc-300 sm:text-base">
              {heroContent.heroDescription}
            </p>
          </div>
        </div>

        {/* Prev / Next controls */}
        <button
          type="button"
          onClick={() => setHeroIndex((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-zinc-950/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-zinc-950/70 active:scale-95"
          title="Anterior"
          aria-label="Imagen anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setHeroIndex((c) => (c + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-zinc-950/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-zinc-950/70 active:scale-95"
          title="Siguiente"
          aria-label="Imagen siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Carousel indicator dots */}
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.url}
              type="button"
              onClick={() => setHeroIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === heroIndex ? 'w-8 bg-[#009688] shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={slide.place}
              aria-label={`Ir a ${slide.place}`}
            />
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto -mt-6 relative z-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HeroUI Pro Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Viajes creados
                </p>
                <p className="text-xl font-extrabold text-zinc-900">{trips.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Días planeados
                </p>
                <p className="text-xl font-extrabold text-zinc-900">{totalDaysAllTrips}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Euro className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Gastos registrados
                </p>
                <p className="text-xl font-extrabold text-zinc-900">
                  {new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(totalBudgetSpent)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md transition-all hover:border-zinc-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Actividades
                </p>
                <p className="text-xl font-extrabold text-zinc-900">{totalActivitiesCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* HeroUI Pro Control & Search Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-14 text-sm font-medium text-zinc-900 placeholder-zinc-400 transition-all focus:border-[#009688] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009688]/15"
              placeholder="Buscar un viaje…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 shadow-xs">
              ⌘K
            </kbd>
          </div>

          <button
            id="btn-add-trip"
            className="wanderlust-primary-button flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:w-auto"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Añadir viaje</span>
          </button>
        </div>

        {/* Trips Grid */}
        <div className="mt-8">
          {filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white p-8 py-20 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                <Compass className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No hay viajes planificados</h3>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                {searchQuery
                  ? 'No se encontraron viajes con ese nombre. Prueba con otra búsqueda.'
                  : 'Aún no has agregado ningún viaje. Haz clic en "Añadir viaje" para comenzar a planificar tu próxima gran aventura.'}
              </p>
              {!searchQuery && (
                <button
                  className="mt-6 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Crear mi primer viaje
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip) => {
                const totalDays = calculateDays(trip.startDate, trip.endDate);
                const tripTotalExpense = trip.activities.reduce(
                  (total, activity) => total + (Number(activity.price) || 0),
                  0
                );

                return (
                  <div
                    key={trip.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-xl"
                  >
                    {/* Card Cover Image */}
                    <div className="relative h-52 w-full overflow-hidden bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          trip.imageUrl ||
                          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={trip.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />

                      {/* Top Badges & Actions */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-zinc-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
                          <Calendar className="h-3 w-3" />
                          {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
                        </span>

                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-zinc-950/60 text-white backdrop-blur-md opacity-0 transition-all hover:bg-rose-600 hover:border-rose-600 group-hover:opacity-100"
                          onClick={() => {
                            if (
                              confirm(
                                `¿Estás seguro de que quieres eliminar el viaje a "${trip.name}"? Se perderán todos sus itinerarios.`
                              )
                            ) {
                              deleteTrip(trip.id);
                            }
                          }}
                          title="Eliminar viaje"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bottom Image Details */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="line-clamp-1 text-2xl font-extrabold text-white drop-shadow-sm">
                          {trip.name}
                        </h2>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs text-zinc-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                          </div>
                          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-bold text-zinc-800">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0,
                            }).format(tripTotalExpense)}
                          </span>
                        </div>

                        {trip.description && (
                          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
                            {trip.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 border-t border-zinc-100 pt-4">
                        <Link
                          href={`/viaje/${trip.id}`}
                          className="wanderlust-primary-button flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                        >
                          <span>Ver itinerario</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

      {/* HeroUI Pro Modal: Añadir Viaje (Modal al 100% con DateRangePicker y fotos en el footer) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 flex h-full sm:h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-none sm:rounded-3xl border border-zinc-200/80 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4.5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#009688]">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Crear nuevo viaje</h2>
                  <p className="text-xs text-zinc-500">Configura los detalles iniciales de tu ruta</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
              {/* 1. Nombre del destino */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Nombre del destino <span className="text-[#009688]">*</span>
                </label>
                <input
                  type="text"
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 text-sm font-medium text-zinc-900 placeholder-zinc-400 transition-all focus:border-[#009688] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009688]/15"
                  placeholder="Ej. París, Vietnam Mágico, Safari en Kenia…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* 2. HeroUI Date Range Picker */}
              <HeroUIDateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                label="Fechas del viaje"
                isRequired
              />

              {/* 3. Descripción breve */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Descripción breve
                </label>
                <input
                  type="text"
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 text-sm text-zinc-800 placeholder-zinc-400 transition-all focus:border-[#009688] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009688]/15"
                  placeholder="Ej. Ruta de 12 días recorriendo el Sudeste Asiático…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* 4. Notas iniciales */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Notas iniciales
                </label>
                <textarea
                  placeholder="Visados, presupuesto inicial, vacunas…"
                  className="h-24 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-sm text-zinc-800 placeholder-zinc-400 transition-all focus:border-[#009688] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009688]/15"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* 5. Fotos en el Footer de la sección (Portada Predeterminada & URL) */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Portada predeterminada
                    </label>
                    <span className="text-[11px] text-zinc-400">Selecciona o introduce una foto</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {PRESET_IMAGES.map((img) => {
                      const isSelected = imageUrl === img.url && customImage === '';
                      return (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => {
                            setImageUrl(img.url);
                            setCustomImage('');
                          }}
                          className={`relative aspect-video sm:aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-[#009688] ring-2 ring-[#009688]/30 scale-102 shadow-md'
                              : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <span className="absolute bottom-1.5 left-1 right-1 truncate text-[10px] font-bold text-white text-center">
                            {img.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#009688] text-white shadow-xs">
                              <CheckCircle2 className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                    O introduce una URL de imagen personalizada
                  </label>
                  <input
                    type="text"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-xs text-zinc-800 placeholder-zinc-400 transition-all focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/15"
                    placeholder="https://images.unsplash.com/photo-…"
                    value={customImage}
                    onChange={(e) => setCustomImage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Sticky Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/90 px-6 py-4 sm:px-8">
              <button
                type="button"
                className="h-11 cursor-pointer rounded-xl px-5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="wanderlust-primary-button flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
                onClick={handleSubmit}
              >
                <Plus className="h-4 w-4" />
                <span>Crear viaje</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
