'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hotel,
  LockKeyhole,
  MapPin,
  Plane,
  Route,
  UtensilsCrossed,
  Wallet,
  Share2,
  ChevronRight,
  Compass,
  FileText,
  PhoneCall,
  Sparkles,
  Info,
  Car,
  X,
  ExternalLink,
  Download,
  ShieldCheck,
  Bed,
  Luggage,
  Calendar,
  Check,
  Navigation,
  ChevronDown,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

type PublicActivity = {
  id: string;
  type: string;
  date: string;
  time: string;
  price?: number;
  isCheckout?: boolean;
  originalId?: string;
  checkoutDate?: string;
  checkIn?: string;
  checkOut?: string;
  hotelName?: string;
  [key: string]: unknown;
};

type PublicTrip = {
  name: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  description: string | null;
  showExpenses: boolean;
  activities: PublicActivity[];
};

type PublicTripResponse =
  | { available: true; trip: PublicTrip }
  | { available: false; availableAt: string };

function toDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toDate(date));
}

function formatDayLabel(date: string) {
  const d = toDate(date);
  const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
    .format(d)
    .replace('.', '')
    .toUpperCase();
  const dayNum = d.getDate();
  const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(d)
    .replace('.', '');
  return { weekday, dayNum, month };
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(toDate(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function tripDuration(startDate: string, endDate: string) {
  const diff = Math.round((toDate(endDate).getTime() - toDate(startDate).getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

function tripDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = toDate(startDate);
  const end = toDate(endDate);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function extractAirportCode(locationStr?: string) {
  if (!locationStr) return '---';
  const match = locationStr.match(/\(([A-Z0-9]{3,4})\)/i);
  if (match) return match[1].toUpperCase();
  const trimmed = locationStr.trim();
  if (trimmed.length <= 4) return trimmed.toUpperCase();
  return trimmed.slice(0, 3).toUpperCase();
}

function calculateLayoverDuration(arrivalTime?: string, departureTime?: string) {
  if (!arrivalTime || !departureTime) return '';
  const [arrH, arrM] = arrivalTime.split(':').map(Number);
  const [depH, depM] = departureTime.split(':').map(Number);
  if (isNaN(arrH) || isNaN(arrM) || isNaN(depH) || isNaN(depM)) return '';

  let arrTotal = arrH * 60 + arrM;
  let depTotal = depH * 60 + depM;

  if (depTotal < arrTotal) {
    depTotal += 24 * 60; // Next day departure
  }

  const diff = depTotal - arrTotal;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function getAirlineMeta(airlineName?: string, flightNumber?: string) {
  const num = (flightNumber || '').toUpperCase().trim();
  const name = (airlineName || '').toLowerCase();

  let code = '';
  let airlineOfficialName = airlineName || 'Vuelo Comercial';
  let bgColor = 'bg-[#009688]';
  let textColor = 'text-white';
  let borderColor = 'border-[#009688]/40';
  let logoText = 'FL';

  if (num.startsWith('FR') || name.includes('ryanair')) {
    code = 'FR';
    airlineOfficialName = 'Ryanair';
    bgColor = 'bg-[#073590]';
    textColor = 'text-[#f1c40f]';
    borderColor = 'border-[#073590]/40';
    logoText = 'FR';
  } else if (num.startsWith('IB') || num.startsWith('I2') || name.includes('iberia')) {
    code = 'IB';
    airlineOfficialName = num.startsWith('I2') ? 'Iberia Express' : 'Iberia';
    bgColor = 'bg-[#d71920]';
    textColor = 'text-white';
    borderColor = 'border-[#d71920]/40';
    logoText = 'IB';
  } else if (num.startsWith('VY') || name.includes('vueling')) {
    code = 'VY';
    airlineOfficialName = 'Vueling';
    bgColor = 'bg-[#ffd200]';
    textColor = 'text-[#101828]';
    borderColor = 'border-[#ffd200]/50';
    logoText = 'VY';
  } else if (num.startsWith('UX') || name.includes('europa')) {
    code = 'UX';
    airlineOfficialName = 'Air Europa';
    bgColor = 'bg-[#0073ce]';
    textColor = 'text-white';
    borderColor = 'border-[#0073ce]/40';
    logoText = 'UX';
  } else if (num.startsWith('LH') || name.includes('lufthansa')) {
    code = 'LH';
    airlineOfficialName = 'Lufthansa';
    bgColor = 'bg-[#05164d]';
    textColor = 'text-[#ffaa00]';
    borderColor = 'border-[#05164d]/40';
    logoText = 'LH';
  } else if (num.startsWith('AF') || name.includes('air france')) {
    code = 'AF';
    airlineOfficialName = 'Air France';
    bgColor = 'bg-[#002157]';
    textColor = 'text-white';
    borderColor = 'border-[#002157]/40';
    logoText = 'AF';
  } else if (num.startsWith('BA') || name.includes('british')) {
    code = 'BA';
    airlineOfficialName = 'British Airways';
    bgColor = 'bg-[#075aaa]';
    textColor = 'text-white';
    borderColor = 'border-[#075aaa]/40';
    logoText = 'BA';
  } else if (num.startsWith('EK') || name.includes('emirates')) {
    code = 'EK';
    airlineOfficialName = 'Emirates';
    bgColor = 'bg-[#d71920]';
    textColor = 'text-white';
    borderColor = 'border-[#d71920]/40';
    logoText = 'EK';
  } else if (num.startsWith('QR') || name.includes('qatar')) {
    code = 'QR';
    airlineOfficialName = 'Qatar Airways';
    bgColor = 'bg-[#5c0632]';
    textColor = 'text-white';
    borderColor = 'border-[#5c0632]/40';
    logoText = 'QR';
  } else if (num.startsWith('KL') || name.includes('klm')) {
    code = 'KL';
    airlineOfficialName = 'KLM';
    bgColor = 'bg-[#00a1de]';
    textColor = 'text-white';
    borderColor = 'border-[#00a1de]/40';
    logoText = 'KL';
  } else if (num.startsWith('EY') || name.includes('etihad')) {
    code = 'EY';
    airlineOfficialName = 'Etihad Airways';
    bgColor = 'bg-[#b38b3f]';
    textColor = 'text-white';
    borderColor = 'border-[#b38b3f]/40';
    logoText = 'EY';
  } else if (num.startsWith('U2') || num.startsWith('EZY') || num.startsWith('EZS') || name.includes('easyjet')) {
    code = 'U2';
    airlineOfficialName = 'easyJet';
    bgColor = 'bg-[#ff6600]';
    textColor = 'text-white';
    borderColor = 'border-[#ff6600]/40';
    logoText = 'EZ';
  } else if (num.startsWith('TK') || name.includes('turkish')) {
    code = 'TK';
    airlineOfficialName = 'Turkish Airlines';
    bgColor = 'bg-[#e81932]';
    textColor = 'text-white';
    borderColor = 'border-[#e81932]/40';
    logoText = 'TK';
  } else if (num.startsWith('TP') || name.includes('tap')) {
    code = 'TP';
    airlineOfficialName = 'TAP Air Portugal';
    bgColor = 'bg-[#009b48]';
    textColor = 'text-white';
    borderColor = 'border-[#009b48]/40';
    logoText = 'TP';
  } else if (num.startsWith('AZ') || num.startsWith('ITY') || name.includes('ita')) {
    code = 'AZ';
    airlineOfficialName = 'ITA Airways';
    bgColor = 'bg-[#00387b]';
    textColor = 'text-white';
    borderColor = 'border-[#00387b]/40';
    logoText = 'AZ';
  } else if (name.includes('volotea') || num.startsWith('V7')) {
    code = 'V7';
    airlineOfficialName = airlineName || 'Volotea';
    bgColor = 'bg-[#e5004c]';
    textColor = 'text-white';
    borderColor = 'border-[#e5004c]/40';
    logoText = 'V7';
  } else if (name.includes('wizz') || num.startsWith('W6') || num.startsWith('WZZ')) {
    code = 'W6';
    airlineOfficialName = airlineName || 'Wizz Air';
    bgColor = 'bg-[#cb0081]';
    textColor = 'text-white';
    borderColor = 'border-[#cb0081]/40';
    logoText = 'W6';
  } else {
    const match = num.match(/^([A-Z0-9]{2})/);
    code = match ? match[1] : '';
    const cleanName = airlineName || 'Vuelo';
    logoText = cleanName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || (code ? code : 'FL');
  }

  const logoUrl = code ? `https://cdn.logitravel.com/webmobile/vuelos/images/logo_${code.toUpperCase()}.png` : null;

  return {
    name: airlineOfficialName,
    code,
    bgColor,
    textColor,
    borderColor,
    logoText,
    logoUrl,
  };
}

function PublicActivityIcon({ act }: { act: PublicActivity }) {
  const [imgError, setImgError] = useState(false);
  const customUrl = typeof act.customIconUrl === 'string' ? act.customIconUrl.trim() : null;
  const isHotel = act.type === 'hotel';
  const isFood = act.type === 'food';
  const isTransfer = act.type === 'transfer';
  const isExcursion = act.type === 'excursion';

  useEffect(() => {
    setImgError(false);
  }, [act.customIconUrl, act.type]);

  if (customUrl && !imgError) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#eaecf0] shadow-2xs z-10 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0 overflow-hidden p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customUrl}
          alt={String(act.type || 'actividad')}
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] shadow-2xs z-10 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
      {isHotel && <Bed className="h-5 w-5" />}
      {isFood && <UtensilsCrossed className="h-5 w-5" />}
      {isTransfer && <Car className="h-5 w-5" />}
      {isExcursion && <MapPin className="h-5 w-5" />}
    </div>
  );
}

function hasActivityDetails(act: PublicActivity): boolean {
  if (typeof act.description === 'string' && act.description.trim().length > 0) return true;
  if (typeof act.notes === 'string' && act.notes.trim().length > 0) return true;
  if (act.type === 'flight' && Array.isArray(act.legs) && act.legs.length > 1) return true;
  return false;
}

function PublicActivityCardItem({
  act,
  trip,
  onSelect,
}: {
  act: PublicActivity;
  trip: PublicTrip;
  onSelect: (act: PublicActivity) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const customUrl = typeof act.customIconUrl === 'string' && act.customIconUrl.trim().length > 0 ? act.customIconUrl.trim() : null;
  const isHotel = act.type === 'hotel';
  const isFood = act.type === 'food';
  const isTransfer = act.type === 'transfer';
  const isExcursion = act.type === 'excursion';
  const isClickable = hasActivityDetails(act);
  const showFullImage = Boolean(customUrl && !imgError);

  useEffect(() => {
    setImgError(false);
  }, [act.customIconUrl]);

  return (
    <div
      onClick={() => isClickable && onSelect(act)}
      className={`group relative flex flex-row items-stretch rounded-3xl border border-[#eaecf0] bg-white shadow-xs transition-all overflow-hidden min-h-[140px] sm:min-h-[155px] ${
        isClickable ? 'cursor-pointer hover:border-[#009688] hover:shadow-md' : ''
      }`}
    >
      {showFullImage ? (
        <div className="w-1/3 min-w-[110px] max-w-[220px] shrink-0 relative bg-slate-100 overflow-hidden self-stretch">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customUrl!}
            alt={String(act.title || act.hotelName || act.restaurantName || act.type)}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="p-3.5 sm:p-5 pr-0 shrink-0 self-start">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] shadow-2xs z-10 group-hover:scale-105 transition-transform">
            {isHotel && <Bed className="h-5 w-5" />}
            {isFood && <UtensilsCrossed className="h-5 w-5" />}
            {isTransfer && <Car className="h-5 w-5" />}
            {isExcursion && <MapPin className="h-5 w-5" />}
            {act.type === 'flight' && <Plane className="h-5 w-5" />}
          </div>
        </div>
      )}

      <div className="w-2/3 flex-1 p-3.5 sm:p-5 min-w-0 flex flex-col justify-between">
        <div>
          {/* 1. Title */}
          {isHotel && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {act.isCheckout
                ? `Check-out: ${(act.hotelName as string) || 'Alojamiento'}`
                : (act.hotelName as string) || 'Hotel Resort & Spa'}
            </h3>
          )}

          {isExcursion && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.title as string) || 'Tour y Excursión'}
            </h3>
          )}

          {isFood && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.restaurantName as string) || 'Restaurante Exclusivo'}
            </h3>
          )}

          {isTransfer && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.origin as string) || 'Origen'} → {(act.destination as string) || 'Destino'}
            </h3>
          )}

          {act.type === 'flight' && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.airline as string) || 'Vuelo'} {act.flightNumber ? `(${act.flightNumber})` : ''}
            </h3>
          )}

          {/* 2. Category & Time Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 mb-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                act.isCheckout
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-[#f2f4f7] text-[#475467]'
              }`}
            >
              {isHotel && (act.isCheckout ? 'Check-out Alojamiento' : 'Alojamiento')}
              {isFood && 'Restaurante & Gastronomía'}
              {isTransfer && 'Traslado Privado'}
              {isExcursion && 'Actividad Guiada'}
              {act.type === 'flight' && 'Vuelo'}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#009688]">
              <Clock3 className="h-3.5 w-3.5" />
              {act.time}
            </span>
          </div>

          {/* 3. Address / Subtitle details */}
          {isHotel && (
            <div>
              {Boolean(act.address) && (
                <p className="text-xs text-[#667085] mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#009688] shrink-0" />
                  <span className="truncate">{act.address as string}</span>
                </p>
              )}
              {act.isCheckout && (
                <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                  Salida de la estancia antes de las {String(act.checkOut || act.time || '11:00')}
                </p>
              )}
            </div>
          )}

          {isExcursion && Boolean(act.description) && (
            <p className="text-xs text-[#667085] mt-1 line-clamp-2">
              {act.description as string}
            </p>
          )}

          {isFood && (
            <p className="text-xs text-[#667085] mt-1">
              {(act.mealType as string) || 'Comida'}
              {act.description ? ` · ${act.description}` : ''}
            </p>
          )}

          {isTransfer && (
            <p className="text-xs text-[#667085] mt-1">
              {act.duration ? `${act.duration as string} · ` : ''}
              {act.description ? String(act.description) : 'Traslado confirmado'}
            </p>
          )}
        </div>

        {(Boolean(trip.showExpenses && act.price && act.price > 0) || isClickable) && (
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#f2f4f7]">
            {trip.showExpenses && act.price && act.price > 0 ? (
              <span className="rounded-full bg-[#f8fafc] px-2.5 py-0.5 text-xs font-black text-[#101828] border border-[#eaecf0]">
                {formatCurrency(act.price)}
              </span>
            ) : <div />}

            {isClickable && (
              <div className="flex items-center gap-1 text-xs font-bold text-[#009688] group-hover:translate-x-1 transition-transform">
                <span>Ver detalles</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicTripPage({ params }: PageProps) {
  const { token } = use(params);
  const [data, setData] = useState<PublicTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerario' | 'resumen' | 'notas'>('itinerario');
  const [selectedActivity, setSelectedActivity] = useState<PublicActivity | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTrip() {
      try {
        const response = await fetch(`/api/public/trips/${encodeURIComponent(token)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as PublicTripResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || 'No se ha podido abrir el itinerario');
        setData(payload);
        if (payload.available) setSelectedDate(payload.trip.startDate);
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(
            loadError instanceof Error ? loadError.message : 'No se ha podido abrir el itinerario'
          );
        }
      }
    }
    void loadTrip();
    return () => controller.abort();
  }, [token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090e1a] p-5 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-xl font-extrabold text-[#101828]">Enlace no disponible</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#667085]">{error}</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-[#009688] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#00796b] transition-all"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-[#090e1a] px-5 font-sans text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 p-2 backdrop-blur-md animate-pulse border border-white/10">
          <Image
            src="/wanderlust_icono_blanco.png"
            alt="Wanderlust"
            width={48}
            height={48}
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Clock3 className="h-4 w-4 animate-spin text-[#009688]" />
          <span>Cargando tu experiencia de viaje...</span>
        </div>
      </main>
    );
  }

  if (!data.available) {
    const availableAt = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(data.availableAt));
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090e1a] p-5 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#009688]">
            Aventura en preparación
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#101828]">Itinerario por descubrir</h1>
          <p className="mt-3 text-xs leading-relaxed text-[#667085]">
            El itinerario se desbloqueará el {availableAt}.
          </p>
        </div>
      </main>
    );
  }

  const { trip } = data;
  const dates = tripDates(trip.startDate, trip.endDate);
  const activeDate = selectedDate && dates.includes(selectedDate) ? selectedDate : trip.startDate;
  const getNextDateStr = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts;
    const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
    const ny = nextDate.getUTCFullYear();
    const nm = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nd = String(nextDate.getUTCDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  };

  const activitiesByDate: Record<string, PublicActivity[]> = {};

  trip.activities.forEach((activity) => {
    // 1. Add primary activity to its scheduled date
    activitiesByDate[activity.date] = [...(activitiesByDate[activity.date] || []), activity];

    // 2. If hotel, also register check-out on departure day (strictly after check-in date)
    if (activity.type === 'hotel') {
      let checkoutDay = typeof activity.checkoutDate === 'string' ? activity.checkoutDate.trim() : '';
      if (!checkoutDay || checkoutDay === activity.date) {
        checkoutDay = getNextDateStr(activity.date);
      }
      const checkoutTime = (activity.checkOut as string) || '11:00';

      if (checkoutDay && checkoutDay !== activity.date) {
        const checkoutAct: PublicActivity = {
          ...activity,
          id: `${activity.id}-checkout`,
          originalId: activity.id,
          isCheckout: true,
          date: checkoutDay,
          time: checkoutTime,
          price: 0, // avoid double expense calculation
        };
        activitiesByDate[checkoutDay] = [...(activitiesByDate[checkoutDay] || []), checkoutAct];
      }
    }
  });

  // Sort each day chronologically by time
  Object.keys(activitiesByDate).forEach((d) => {
    activitiesByDate[d].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  });

  const activeActivities = activitiesByDate[activeDate] ?? [];
  const duration = tripDuration(trip.startDate, trip.endDate);
  const totalExpenses = trip.activities.reduce((sum, a) => sum + (a.price || 0), 0);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, url: window.location.href });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User dismissed or canceled the share sheet — perfectly normal behavior
          return;
        }
        // Fallback to clipboard if share failed
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 2500);
        } catch {
          // ignore
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#101828] selection:bg-[#009688] selection:text-white">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#101828] px-5 py-2.5 text-xs font-semibold text-white shadow-2xl border border-white/10 animate-fade-in">
          <Check className="h-4 w-4 text-[#009688]" />
          <span>¡Enlace copiado al portapapeles!</span>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 1. IMMERSIVE HERO BANNER WITH INTEGRATED WHITE LOGO & ACTIONS*/}
      {/* ----------------------------------------------------------- */}
      <div className="relative w-full overflow-hidden bg-[#0c111d] text-white rounded-b-[2rem] sm:rounded-b-[3rem] lg:rounded-b-[3.5rem] shadow-xl">
        {/* Cover Photo */}
        <div className="relative h-72 sm:h-84 md:h-[420px] lg:h-[460px] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              trip.imageUrl ||
              'https://images.unsplash.com/photo-1512815046276-89d511254976?auto=format&fit=crop&w=1600&q=80'
            }
            alt={trip.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Top Floating Glass Bar inside Hero */}
        <div className="absolute top-0 inset-x-0 z-20 mx-auto max-w-7xl px-4 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between">
          {/* Left: White Logo */}
          <Link href="/" className="flex items-center group transition-transform hover:scale-105">
            <Image
              src="/wanderlust_icono_blanco.png"
              alt="Wanderlust"
              width={64}
              height={64}
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-lg"
              priority
            />
          </Link>

          {/* Right: Actions (Share icon button) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
              title="Compartir itinerario"
              aria-label="Compartir itinerario"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Hero Bottom Content */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-[#009688] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
              {duration} Días · {Math.max(1, duration - 1)} Noches
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-sm">
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </span>
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-[#80cbc4] backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Itinerario Confirmado</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg text-white">
            {trip.name}
          </h1>

          {trip.description && (
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-200 line-clamp-2 font-medium leading-relaxed drop-shadow-md">
              {trip.description}
            </p>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. NAVIGATION TABS (HeroUI Segmented Tabs Style)            */}
      {/* ----------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-5">
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs">
            {[
              { id: 'itinerario', label: 'Itinerario' },
              { id: 'resumen', label: 'Resumen de servicios' },
              { id: 'notas', label: 'Notas' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? 'bg-white text-[#18181b] shadow-sm font-bold'
                      : 'text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. DÍAS SELECTOR (Seamless, larger day badges)             */}
      {/* ----------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-4 sm:pt-6">
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto py-2 px-1 [scrollbar-width:none] justify-start">
          {dates.map((dateStr) => {
            const isSelected = activeDate === dateStr;
            const { weekday, dayNum } = formatDayLabel(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`group flex shrink-0 flex-col items-center justify-center min-w-[62px] sm:min-w-[72px] py-3 sm:py-3.5 px-3.5 sm:px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#009688] text-white shadow-lg shadow-[#009688]/30 scale-105 ring-2 ring-[#009688]/20'
                    : 'bg-white text-[#475467] border border-[#eaecf0] shadow-xs hover:border-[#009688]/50 hover:bg-slate-50'
                }`}
                title={`${weekday} ${dayNum}`}
              >
                <span
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    isSelected ? 'text-white/90' : 'text-[#667085] group-hover:text-[#101828]'
                  }`}
                >
                  {weekday}
                </span>
                <span
                  className={`text-lg sm:text-xl font-black leading-tight mt-0.5 ${
                    isSelected ? 'text-white' : 'text-[#101828]'
                  }`}
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4. MAIN CONTENT: 2-COLUMN RESPONSIVE LAYOUT                 */}
      {/* ----------------------------------------------------------- */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-5">
        {activeTab === 'itinerario' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------- */}
            {/* MAIN ACTIVITIES TIMELINE COLUMN (Order 1 on mobile, Cols 8 on desktop) */}
            {/* ------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
              {/* Activities List */}
              {activeActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#eaecf0] bg-white p-10 text-center shadow-xs">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] shadow-sm">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-[#101828]">Día libre para relajarse</h3>
                  <p className="mt-1 max-w-sm text-xs text-[#667085] leading-relaxed">
                    No hay traslados ni horarios programados para esta jornada. Aprovecha para explorar el destino o descansar en el hotel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeActivities.map((act) => {
                    const isFlight = act.type === 'flight';
                    const isHotel = act.type === 'hotel';
                    const isFood = act.type === 'food';
                    const isTransfer = act.type === 'transfer';
                    const isExcursion = act.type === 'excursion';

                    const airlineMeta = isFlight
                      ? getAirlineMeta(act.airline as string, act.flightNumber as string)
                      : null;
                    const legs = Array.isArray(act.legs) ? act.legs : [];
                    const hasScales = legs.length > 1;

                    if (isFlight && airlineMeta) {
                      if (hasScales) {
                        return (
                          <div key={act.id} className="space-y-3">
                            {legs.map((leg: any, lIdx: number) => {
                              const legAirlineMeta = getAirlineMeta(
                                leg.airline || (act.airline as string),
                                leg.flightNumber || (act.flightNumber as string)
                              );
                              const nextLeg = legs[lIdx + 1];

                              return (
                                <div key={lIdx} className="space-y-3">
                                  {/* Individual Card for this flight leg */}
                                  <div
                                    onClick={() => hasActivityDetails(act) && setSelectedActivity(act)}
                                    className={`group relative flex flex-col gap-3.5 rounded-3xl border border-[#eaecf0] bg-white p-4 sm:p-5 shadow-xs transition-all ${
                                      hasActivityDetails(act) ? 'cursor-pointer hover:border-[#009688] hover:shadow-md' : ''
                                    }`}
                                  >
                                    <div className="w-full space-y-3.5">
                                      {/* Header */}
                                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f2f4f7]">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-white p-1.5 border border-slate-200 shadow-xs overflow-hidden"
                                            title={legAirlineMeta.name}
                                          >
                                            {legAirlineMeta.logoUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={legAirlineMeta.logoUrl}
                                                alt={legAirlineMeta.name}
                                                className="h-full w-full object-contain"
                                                onError={(e) => {
                                                  const target = e.currentTarget;
                                                  target.style.display = 'none';
                                                  if (target.parentElement) {
                                                    target.parentElement.className = `flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full font-black text-xs sm:text-sm tracking-tight shadow-xs border ${legAirlineMeta.bgColor} ${legAirlineMeta.textColor} ${legAirlineMeta.borderColor}`;
                                                    target.parentElement.innerText = legAirlineMeta.logoText;
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <div className={`flex h-full w-full items-center justify-center rounded-full font-black text-xs ${legAirlineMeta.bgColor} ${legAirlineMeta.textColor}`}>
                                                {legAirlineMeta.logoText}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <span className="font-extrabold text-sm sm:text-base text-[#101828]">
                                              {legAirlineMeta.name}
                                            </span>
                                            <p className="text-[11px] font-bold text-[#475467] mt-0.5">
                                              {leg.flightNumber
                                                ? `Vuelo ${leg.flightNumber}`
                                                : act.flightNumber
                                                ? `Vuelo ${act.flightNumber}`
                                                : 'Vuelo regular'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-bold text-[#15803d] flex items-center gap-1.5 shadow-2xs">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                                            <span>Tramo {lIdx + 1} de {legs.length}</span>
                                          </span>

                                          {lIdx === 0 && trip.showExpenses && act.price && act.price > 0 && (
                                            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-black text-[#101828] border border-[#eaecf0]">
                                              {formatCurrency(act.price)}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Route Visual */}
                                      <div className="py-2 flex items-center justify-between gap-3 sm:gap-6">
                                        <div className="flex-1 min-w-0 text-left">
                                          <p className="text-xs font-semibold text-[#667085] truncate">
                                            {leg.origin || 'Origen'}
                                          </p>
                                          <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                            {extractAirportCode(leg.origin)}
                                          </p>
                                          <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                            {leg.departureTime || act.time}
                                          </p>
                                        </div>

                                        <div className="flex flex-col items-center justify-center px-2 sm:px-4 flex-1 max-w-[180px] sm:max-w-[240px]">
                                          <div className="relative w-full flex items-center justify-center">
                                            <div className="w-full border-t-2 border-dashed border-[#cbd5e1]" />
                                            <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-[#e0f2f1] text-[#009688] shadow-xs border border-white">
                                              <Plane className="h-4 w-4 rotate-90 sm:rotate-45" />
                                            </div>
                                          </div>
                                          <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] mt-2">
                                            Directo
                                          </span>
                                        </div>

                                        <div className="flex-1 min-w-0 text-right">
                                          <p className="text-xs font-semibold text-[#667085] truncate">
                                            {leg.destination || 'Destino'}
                                          </p>
                                          <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                            {extractAirportCode(leg.destination)}
                                          </p>
                                          <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                            {leg.arrivalTime || '—'}
                                          </p>
                                        </div>
                                      </div>

                                      {hasActivityDetails(act) && (
                                        <div className="flex items-center justify-end pt-1">
                                          <div className="flex items-center gap-1 text-xs font-bold text-[#009688] group-hover:translate-x-1 transition-transform">
                                            <span>Ver detalles</span>
                                            <ChevronRight className="h-4 w-4" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Inter-card Dashed Line with Layover Badge and Duration */}
                                  {nextLeg && (
                                    <div className="flex items-center justify-center my-2 relative py-3">
                                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-[#ea580c]/60" />
                                      {(() => {
                                        const layoverTime = calculateLayoverDuration(
                                          leg.arrivalTime,
                                          nextLeg.departureTime
                                        );
                                        return (
                                          <div className="relative z-10 rounded-full bg-[#fff7ed] border border-[#ffedd5] px-4 py-1.5 text-xs font-bold text-[#c2410c] shadow-xs flex items-center gap-2">
                                            <Clock3 className="h-3.5 w-3.5 text-[#ea580c]" />
                                            <span>
                                              Escala en{' '}
                                              {extractAirportCode(leg.destination) !== '---'
                                                ? extractAirportCode(leg.destination)
                                                : leg.destination}
                                              {layoverTime ? ` · ${layoverTime}` : ''}
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      /* Single Direct Flight Card */
                      return (
                        <div
                          key={act.id}
                          onClick={() => hasActivityDetails(act) && setSelectedActivity(act)}
                          className={`group relative flex flex-col gap-3.5 rounded-3xl border border-[#eaecf0] bg-white p-4 sm:p-5 shadow-xs transition-all ${
                            hasActivityDetails(act) ? 'cursor-pointer hover:border-[#009688] hover:shadow-md' : ''
                          }`}
                        >
                          <div className="w-full space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f2f4f7]">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 border border-[#eaecf0] shadow-2xs overflow-hidden"
                                  title={airlineMeta.name}
                                >
                                  {Boolean((act.customIconUrl as string) || airlineMeta.logoUrl) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={((act.customIconUrl as string)?.trim()) || airlineMeta.logoUrl!}
                                      alt={airlineMeta.name}
                                      className="h-full w-full object-contain"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        if (target.parentElement) {
                                          target.parentElement.className = `flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs sm:text-sm tracking-tight shadow-xs border ${airlineMeta.bgColor} ${airlineMeta.textColor} ${airlineMeta.borderColor}`;
                                          target.parentElement.innerText = airlineMeta.logoText;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className={`flex h-full w-full items-center justify-center rounded-2xl font-black text-xs ${airlineMeta.bgColor} ${airlineMeta.textColor}`}>
                                      {airlineMeta.logoText}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-sm sm:text-base text-[#101828]">
                                    {airlineMeta.name}
                                  </span>
                                  <p className="text-[11px] font-bold text-[#475467] mt-0.5">
                                    {act.flightNumber ? `Vuelo ${act.flightNumber}` : 'Vuelo regular'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-bold text-[#15803d] flex items-center gap-1.5 shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                                  <span>Directo (Non-Stop)</span>
                                </span>
                                {trip.showExpenses && act.price && act.price > 0 && (
                                  <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-black text-[#101828] border border-[#eaecf0]">
                                    {formatCurrency(act.price)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="py-2 flex items-center justify-between gap-3 sm:gap-6">
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-semibold text-[#667085] truncate">
                                  {(act.origin as string) || 'Origen'}
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                  {extractAirportCode(act.origin as string)}
                                </p>
                                <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                  {act.time}
                                </p>
                              </div>
                              <div className="flex flex-col items-center justify-center px-2 sm:px-4 flex-1 max-w-[180px] sm:max-w-[240px]">
                                <div className="relative w-full flex items-center justify-center">
                                  <div className="w-full border-t-2 border-dashed border-[#cbd5e1]" />
                                  <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-[#e0f2f1] text-[#009688] shadow-xs border border-white">
                                    <Plane className="h-4 w-4 rotate-90 sm:rotate-45" />
                                  </div>
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] mt-2">
                                  Directo
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <p className="text-xs font-semibold text-[#667085] truncate">
                                  {(act.destination as string) || 'Destino'}
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                  {extractAirportCode(act.destination as string)}
                                </p>
                                <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                  {(act.arrivalTime as string) || '—'}
                                </p>
                              </div>
                            </div>

                            {hasActivityDetails(act) && (
                              <div className="flex items-center justify-end pt-1">
                                <div className="flex items-center gap-1 text-xs font-bold text-[#009688] group-hover:translate-x-1 transition-transform">
                                  <span>Ver detalles</span>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <PublicActivityCardItem
                        key={act.id}
                        act={act}
                        trip={trip}
                        onSelect={setSelectedActivity}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------- */}
            {/* SIDEBAR WIDGETS COLUMN (Order 2 on mobile, Cols 4 on desktop) */}
            {/* ------------------------------------------------------- */}
            <aside className="lg:col-span-4 space-y-4 order-2 lg:order-1 lg:sticky lg:top-24">
              {/* Active Day Detail Card */}
              <div className="hidden lg:block rounded-3xl border border-[#eaecf0] bg-white p-5 shadow-xs space-y-3">
                <span className="inline-block rounded-full bg-[#e0f2f1] px-3 py-1 text-[11px] font-extrabold text-[#00796b]">
                  Día {dates.indexOf(activeDate) + 1} de {dates.length}
                </span>
                <h3 className="text-lg font-black capitalize text-[#101828]">
                  {formatWeekday(activeDate)}
                </h3>
                <p className="text-xs text-[#667085]">
                  {activeActivities.length === 0
                    ? 'Jornada libre para descansar o explorar a tu propio ritmo.'
                    : `${activeActivities.length} ${
                        activeActivities.length === 1 ? 'servicio programado' : 'servicios programados'
                      } para este día.`}
                </p>
              </div>

              {/* Trip Highlights Summary Widget */}
              <div className="rounded-3xl border border-[#eaecf0] bg-gradient-to-br from-[#f0fdfa] to-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#009688]">
                  <ShieldCheck className="h-5 w-5" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    Garantía Wanderlust
                  </h4>
                </div>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Todos los traslados, hoteles y actividades cuentan con seguro de viaje y soporte directo durante toda tu estancia.
                </p>
                <div className="pt-2 border-t border-[#ccfbf1]/60 flex items-center justify-between text-xs text-[#00796b] font-bold">
                  <span>Asistencia 24/7 en ruta</span>
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: RESUMEN DE SERVICIOS                                 */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Plane className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === 'flight').length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">Vuelos confirmados</p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Bed className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === 'hotel').length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">Noches de hotel</p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === 'excursion').length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">Excursiones y tours</p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Car className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === 'transfer').length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">Traslados privados</p>
              </div>
            </div>

            {/* List of all Hotels */}
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-[#101828] uppercase tracking-wider">
                Alojamientos confirmados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trip.activities
                  .filter((a) => a.type === 'hotel')
                  .map((hotelAct, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#eaecf0] p-4 bg-[#f8fafc] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#101828] text-sm">
                          {(hotelAct.hotelName as string) || 'Hotel'}
                        </span>
                        <span className="rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#009688]">
                          {hotelAct.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#667085] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#009688]" />
                        <span>{(hotelAct.address as string) || 'Dirección'}</span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 3: NOTAS DEL VIAJE                                      */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'notas' && (
          <div className="space-y-6">
            {/* Trip Notes / Description Card */}
            {trip.description && (
              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#101828]">Notas generales del viaje</h3>
                    <p className="text-xs text-[#667085]">Información clave y recomendaciones</p>
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#344054] pt-2 border-t border-[#f2f4f7]">
                  {trip.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <PhoneCall className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#101828]">Atención y Soporte</h4>
                    <p className="text-xs text-[#667085]">Contacto durante el viaje</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#eaecf0] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Teléfono internacional:</span>
                    <span className="font-bold text-[#101828]">+34 91 123 4567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">WhatsApp de asistencia:</span>
                    <span className="font-bold text-[#009688]">+34 600 000 000</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#101828]">Póliza y Coberturas</h4>
                    <p className="text-xs text-[#667085]">Cobertura médica y cancelaciones</p>
                  </div>
                </div>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Tu viaje cuenta con póliza multiasistencia contratada que cubre incidencias médicas, equipajes y traslados sanitarios.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------------------------------------------------- */}
      {/* 4. ACTIVITY DETAIL MODAL                                    */}
      {/* ----------------------------------------------------------- */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-scale-in border border-[#eaecf0]">
            <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7]">
              <div className="flex items-center gap-3">
                <PublicActivityIcon act={selectedActivity} />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#009688]">
                    Detalle del Servicio
                  </span>
                  <h3 className="text-base font-extrabold text-[#101828]">
                    {(selectedActivity.title as string) ||
                      (selectedActivity.hotelName as string) ||
                      (selectedActivity.airline as string) ||
                      (selectedActivity.restaurantName as string) ||
                      'Servicio del Itinerario'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="rounded-full bg-[#f2f4f7] p-2 text-[#667085] hover:bg-[#e4e7ec] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs text-[#475467]">
              {selectedActivity.type === 'flight' && (
                <div className="rounded-2xl bg-[#f0fdfa] p-4 border border-[#ccfbf1] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#009688]">
                      Itinerario de vuelo
                    </span>
                    <span className="font-extrabold text-[#101828]">
                      {(selectedActivity.airline as string) || 'Aerolínea'} · {(selectedActivity.flightNumber as string) || 'Vuelo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#101828]">
                    <div>
                      <p className="text-xs text-[#667085]">Salida</p>
                      <p className="font-extrabold text-base">{(selectedActivity.origin as string) || 'Origen'}</p>
                      <p className="text-xs text-[#009688]">{selectedActivity.time}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <Plane className="h-4 w-4 text-[#009688] rotate-90" />
                      <span className="text-[10px] text-[#667085] mt-1">
                        {Array.isArray(selectedActivity.legs) && selectedActivity.legs.length > 1
                          ? `${selectedActivity.legs.length - 1} escala`
                          : 'Directo'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#667085]">Llegada</p>
                      <p className="font-extrabold text-base">{(selectedActivity.destination as string) || 'Destino'}</p>
                      <p className="text-xs text-[#009688]">{(selectedActivity.arrivalTime as string) || '—'}</p>
                    </div>
                  </div>

                  {Array.isArray(selectedActivity.legs) && selectedActivity.legs.length > 1 && (
                    <div className="pt-2 border-t border-[#ccfbf1] space-y-2">
                      <p className="text-[10px] font-bold uppercase text-[#009688]">Escalas programadas:</p>
                      {selectedActivity.legs.map((leg: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-xl border border-[#ccfbf1]/60">
                          <span className="font-bold">{leg.origin} → {leg.destination}</span>
                          <span className="text-[#009688] font-semibold">{leg.departureTime} - {leg.arrivalTime} ({leg.flightNumber})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] p-3.5 border border-[#eaecf0]">
                <span className="font-semibold text-[#667085]">Fecha y Hora:</span>
                <span className="font-bold text-[#101828]">
                  {selectedActivity.date} · {selectedActivity.time}
                </span>
              </div>

              {selectedActivity.price && selectedActivity.price > 0 && trip.showExpenses && (
                <div className="flex items-center justify-between rounded-2xl bg-[#f0fdfa] p-3.5 border border-[#ccfbf1]">
                  <span className="font-semibold text-[#009688]">Tarifa Incluida:</span>
                  <span className="font-black text-sm text-[#009688]">
                    {formatCurrency(Number(selectedActivity.price))}
                  </span>
                </div>
              )}

              {Boolean(selectedActivity.description) && (
                <div className="rounded-2xl border border-[#eaecf0] p-4 bg-[#fafafa]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#98a2b3]">
                    Información y recomendaciones
                  </span>
                  <p className="mt-1.5 text-xs text-[#344054] leading-relaxed">
                    {String(selectedActivity.description)}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedActivity(null)}
              className="mt-6 w-full rounded-full bg-[#009688] py-3 text-xs font-bold text-white shadow-md hover:bg-[#00796b] transition-all"
            >
              Cerrar detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
