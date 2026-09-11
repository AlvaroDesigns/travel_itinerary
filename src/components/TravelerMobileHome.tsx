'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel, Trip } from '@/context/TravelContext';
import { UserAvatarDisplay } from '@/components/AvatarPickerModal';
import { CreateTripModal } from '@/components/CreateTripModal';
import {
  Search,
  Mic,
  Plane,
  Heart,
  ArrowUpRight,
  MapPin,
  Star,
  Plus,
  User,
  Sparkles,
  Palmtree,
  Mountain,
  Tent,
  UtensilsCrossed,
  Landmark,
} from 'lucide-react';

interface TravelerMobileHomeProps {
  onOpenCreateTrip?: () => void;
}

export function TravelerMobileHome({ onOpenCreateTrip }: TravelerMobileHomeProps) {
  const { trips, user } = useTravel();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('beach');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wanderlust_mobile_favorites');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'favorites' | 'account'>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toggle favorite trip
  const toggleFavorite = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId];
      try {
        localStorage.setItem('wanderlust_mobile_favorites', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const getUserFirstName = () => {
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) {
      const namePart = user.email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Viajero';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Categories list
  const categories = [
    { id: 'beach', name: 'Playa', icon: Palmtree, emoji: '🏖️' },
    { id: 'mountain', name: 'Montaña', icon: Mountain, emoji: '⛰️' },
    { id: 'camping', name: 'Camping', icon: Tent, emoji: '⛺' },
    { id: 'food', name: 'Gastronomía', icon: UtensilsCrossed, emoji: '🍽️' },
    { id: 'culture', name: 'Cultura', icon: Landmark, emoji: '🏛️' },
  ];

  // Filtered trips by search query and bottom tab
  const displayedTrips = useMemo(() => {
    let result = trips;

    if (activeBottomTab === 'favorites') {
      result = result.filter((t) => favorites.includes(t.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [trips, searchQuery, activeBottomTab, favorites]);

  const handleOpenCreate = () => {
    if (onOpenCreateTrip) {
      onOpenCreateTrip();
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric' }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafbfc] pb-28 text-zinc-900 selection:bg-[#0066FF]/20 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP-RIGHT AMBIENT GRADIENT GLOW                                        */}
      {/* ========================================================================= */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-72 w-72 rounded-full bg-gradient-to-bl from-[#00C6FF]/35 via-[#0066FF]/20 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-40 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-[#38bdf8]/20 via-[#818cf8]/15 to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-md px-4 pt-4 sm:px-6">
        {/* ========================================================================= */}
        {/* 2. HEADER: LOGO ON LEFT, AVATAR & USERNAME ON RIGHT                       */}
        {/* ========================================================================= */}
        <header className="flex items-center justify-between gap-3 pt-2 pb-3">
          {/* Left: Brand Logo (Significantly Larger) */}
          <Link href="/viajes" className="flex items-center group">
            <Image
              src="/wanderlust_horizontal_negro.png"
              alt="Wanderlust"
              width={170}
              height={40}
              priority
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Right: User Avatar + Name + Greeting */}
          <Link
            href="/cuenta"
            className="flex items-center gap-2.5 rounded-full bg-white/80 p-1.5 pr-3 shadow-xs border border-zinc-200/70 backdrop-blur-md hover:bg-white transition-all"
          >
            <UserAvatarDisplay
              avatar={user?.avatar || 'traveler-girl-teal'}
              name={getUserFirstName()}
              size="sm"
            />
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-zinc-900">Hola, {getUserFirstName()}</span>
                <span className="text-xs">👋</span>
              </div>
              <p className="text-[10px] font-medium text-zinc-400">{getGreeting()}</p>
            </div>
          </Link>
        </header>

        {/* ========================================================================= */}
        {/* 3. SEARCH CAPSULE WITH ICONS                                              */}
        {/* ========================================================================= */}
        <section className="mt-3">
          <div className="relative flex items-center rounded-2xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-xs backdrop-blur-sm transition-all focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar destinos, viajes..."
              className="w-full bg-transparent px-3 text-xs font-medium text-zinc-800 placeholder-zinc-400 outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0 border-l border-zinc-200/80 pl-2">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-400 hover:text-zinc-700 transition"
                aria-label="Voz o filtros"
              >
                <Mic className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. PROMO BANNER: "Despierta en un lugar lejano" + Yellow "Explorar ahora" CTA */}
        {/* ========================================================================= */}
        <section className="mt-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#72cbfd] via-[#48bafb] to-[#1e99fa] p-5 text-white shadow-lg">
            {/* Soft decorative elements */}
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/20 blur-xl" />
            <div className="pointer-events-none absolute -top-6 left-24 h-24 w-24 rounded-full bg-cyan-200/30 blur-lg" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* Left Content */}
              <div className="max-w-[58%] space-y-3">
                <h2 className="text-xl font-black leading-tight text-zinc-900 tracking-tight">
                  Despierta en un<br />lugar lejano
                </h2>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEB3B] px-4 py-2 text-xs font-extrabold text-zinc-900 shadow-md transition-all hover:bg-[#FDD835] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Explorar ahora</span>
                </button>
              </div>

              {/* Right Illustration / Photo Group */}
              <div className="relative h-28 w-36 shrink-0">
                {/* Background mini card 1 */}
                <div className="absolute -top-1 right-8 h-16 w-14 rotate-6 overflow-hidden rounded-xl border-2 border-white shadow-md bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80"
                    alt="Beach"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Background mini card 2 */}
                <div className="absolute top-4 right-16 h-14 w-14 -rotate-12 overflow-hidden rounded-xl border-2 border-white shadow-md bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80"
                    alt="Mountain"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Main front photo: Happy Travelers */}
                <div className="absolute right-0 bottom-0 h-24 w-24 overflow-hidden rounded-2xl border-2 border-white shadow-xl bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=300&q=80"
                    alt="Happy travelers"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Slider pagination dots */}
            <div className="relative z-10 mt-3 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-5 rounded-full bg-white shadow-xs" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. "MIS VIAJES" (POPULAR DESTINATION REPLACEMENT)                         */}
        {/* ========================================================================= */}
        <section className="mt-6">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900 tracking-tight">
                {activeBottomTab === 'favorites' ? 'Mis Favoritos' : 'Mis Viajes'}
              </h3>
              <span className="rounded-full bg-[#e0f2f1] px-2 py-0.5 text-[10px] font-extrabold text-[#00796b]">
                {displayedTrips.length}
              </span>
            </div>
            <Link
              href="/viajes"
              className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition"
            >
              Ver todos
            </Link>
          </div>

          {/* 2-Column Grid or Empty State with Dashed Border */}
          {displayedTrips.length === 0 ? (
            <div
              onClick={handleOpenCreate}
              className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white/70 p-8 text-center shadow-xs transition-all hover:border-[#0066FF] hover:bg-blue-50/20 cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] shadow-xs group-hover:scale-110 transition-transform">
                <Plus className="h-7 w-7 stroke-[2.5]" />
              </div>
              <h4 className="mt-3.5 text-base font-black text-zinc-900">Añadir viaje</h4>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
                Crea tu primer itinerario y organiza vuelos, hoteles y actividades.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {displayedTrips.map((trip) => {
                const isFav = favorites.includes(trip.id);
                const coverImage =
                  trip.imageUrl ||
                  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';

                return (
                  <div
                    key={trip.id}
                    onClick={() => router.push(`/viaje/${trip.id}`)}
                    className="group flex flex-col rounded-3xl bg-white p-2.5 shadow-xs border border-zinc-100 hover:shadow-md transition-all cursor-pointer text-left"
                  >
                    {/* Top Image Card */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100">
                      <img
                        src={coverImage}
                        alt={trip.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(trip.id, e)}
                        className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isFav
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-black/30 text-white hover:bg-black/50'
                        }`}
                        aria-label="Marcar como favorito"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Floating Blue Arrow Button */}
                      <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] text-white shadow-md transition-transform group-hover:scale-110">
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Information */}
                    <div className="mt-2.5 px-1 space-y-1">
                      <h4 className="truncate text-xs sm:text-sm font-extrabold text-zinc-900 leading-tight">
                        {trip.name}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                          <span className="truncate">
                            {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0 text-amber-500 font-bold text-[10px]">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{trip.activities?.length ? `${trip.activities.length}a` : '4.9'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 7. FLOATING CAPSULE BOTTOM NAVIGATION BAR                                 */}
      {/* ========================================================================= */}
      <nav
        className="fixed bottom-4 inset-x-6 max-w-xs mx-auto z-40 flex items-center justify-around rounded-full bg-white/95 px-3 py-2 shadow-2xl border border-zinc-200/80 backdrop-blur-xl"
        aria-label="Navegación móvil"
      >
        {/* Tab 1: INICIO */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
            activeBottomTab === 'home'
              ? 'bg-gradient-to-r from-[#0066FF] to-[#00C6FF] px-4 py-2 text-white shadow-md shadow-blue-500/25'
              : 'p-2.5 text-zinc-400 hover:text-zinc-800'
          }`}
        >
          <div className="h-4 w-4 flex items-center justify-center">
            {/* Modern Home Icon */}
            <svg
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
            </svg>
          </div>
          {activeBottomTab === 'home' && (
            <span className="text-[11px] font-black tracking-wider">INICIO</span>
          )}
        </button>

        {/* Tab 2: FAVORITOS */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('favorites');
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer ${
            activeBottomTab === 'favorites'
              ? 'bg-red-50 text-red-500'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800'
          }`}
          aria-label="Favoritos"
        >
          <Heart className={`h-5 w-5 ${activeBottomTab === 'favorites' ? 'fill-current' : ''}`} />
        </button>

        {/* Tab 3: USER / MI CUENTA */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('account');
            router.push('/cuenta');
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all cursor-pointer ${
            activeBottomTab === 'account'
              ? 'bg-blue-50 text-[#0066FF]'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800'
          }`}
          aria-label="Mi Cuenta"
        >
          <User className="h-5 w-5" />
        </button>
      </nav>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
