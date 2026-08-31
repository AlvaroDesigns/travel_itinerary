'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useTravel,
  Activity,
  ActivityType,
  FlightActivity,
  FlightLeg,
  TransferActivity,
  HotelActivity,
  ExcursionActivity,
  FoodActivity,
} from '@/context/TravelContext';
import { TripNotificationSettings } from '@/components/TripNotificationSettings';
import { ItineraryAssistantChat } from '@/components/ItineraryAssistantChat';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { TabSkeleton } from '@/components/TabSkeletons';
import {
  ArrowLeft,
  Calendar,
  Euro,
  Plus,
  Trash2,
  Edit2,
  Plane,
  Car,
  Bed,
  Map,
  Utensils,
  Clock,
  MapPin,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  X,
  LogOut,
  ShieldCheck,
  Sparkles,
  Settings,
  Compass,
  Navigation,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

type ActivityInput<T extends Activity = Activity> = T extends Activity ? Omit<T, 'id'> : never;

export default function ViajeDetalle({ params }: PageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const {
    activeTrip,
    setActiveTripById,
    updateTrip,
    addActivity,
    updateActivity,
    deleteActivity,
    logout,
    user,
    isLoading,
  } = useTravel();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Today's date representation (YYYY-MM-DD)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Selected Day State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Available tabs and active tab
  const TABS = [
    { id: 'itinerario', label: 'Itinerario', icon: Calendar },
    { id: 'descripcion', label: 'Descripción', icon: FileText },
    { id: 'detalles', label: 'Detalles & Finanzas', icon: TrendingUp },
    { id: 'notas', label: 'Notas', icon: Edit2 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.id === tabFromUrl)
    ? (tabFromUrl as string)
    : 'itinerario';

  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setIsTabTransitioning(true);
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (tabId === 'itinerario') {
      p.delete('tab');
    } else {
      p.set('tab', tabId);
    }
    const query = p.toString();
    router.replace(`/viaje/${id}${query ? `?${query}` : ''}`, { scroll: false });
    window.setTimeout(() => {
      setIsTabTransitioning(false);
    }, 280);
  };

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Activity Form States
  const [actType, setActType] = useState<ActivityType>('flight');
  const [actTime, setActTime] = useState('09:00');
  const [actPrice, setActPrice] = useState('');

  // Type-specific Form States
  const [flightLegs, setFlightLegs] = useState<FlightLeg[]>([]);

  const [transType, setTransType] = useState<
    'taxi' | 'bus' | 'train' | 'metro' | 'walking' | 'other'
  >('taxi');
  const [transOrigin, setTransOrigin] = useState('');
  const [transDest, setTransDest] = useState('');
  const [transDuration, setTransDuration] = useState('');
  const [transDescription, setTransDescription] = useState('');

  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelDescription, setHotelDescription] = useState('');
  const [hotelCheckInDate, setHotelCheckInDate] = useState('');
  const [hotelCheckOutDate, setHotelCheckOutDate] = useState('');

  const [excursionTitle, setExcursionTitle] = useState('');
  const [excursionDesc, setExcursionDesc] = useState('');
  const [excursionDur, setExcursionDur] = useState('');

  const [foodRestName, setFoodRestName] = useState('');
  const [foodType, setFoodType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [foodDesc, setFoodDesc] = useState('');

  const [noteDraft, setNoteDraft] = useState<{ tripId: string; value: string } | null>(null);

  // Sync active trip by URL param
  useEffect(() => {
    if (id) {
      setActiveTripById(id);
    }
  }, [id, setActiveTripById]);

  // Helper functions
  function getDatesInRange(startStr: string, endStr: string) {
    if (!startStr || !endStr) return [];
    const dates = [];
    const startParts = startStr.split('-').map(Number);
    const endParts = endStr.split('-').map(Number);

    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const current = new Date(start);
    while (current <= end) {
      dates.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(
          current.getDate()
        ).padStart(2, '0')}`
      );
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function addDays(dateStr: string, daysStr: number) {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + daysStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  }

  function getNights(inDate: string, outDate: string) {
    if (!inDate || !outDate) return 0;
    const startParts = inDate.split('-').map(Number);
    const endParts = outDate.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatDateSimple(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const month = months[monthIdx] || '';
    return `${day} ${month}`;
  }

  function calculateLayover(legA: FlightLeg, legB: FlightLeg, defaultDate: string) {
    const dateA = legA.arrivalDate || legA.departureDate || defaultDate;
    const dateB = legB.departureDate || defaultDate;
    if (!dateA || !dateB || !legA.arrivalTime || !legB.departureTime) return '';

    try {
      const [hA, mA] = legA.arrivalTime.split(':').map(Number);
      const [hB, mB] = legB.departureTime.split(':').map(Number);

      const partsA = dateA.split('-').map(Number);
      const partsB = dateB.split('-').map(Number);

      const timeA = new Date(partsA[0], partsA[1] - 1, partsA[2], hA, mA).getTime();
      const timeB = new Date(partsB[0], partsB[1] - 1, partsB[2], hB, mB).getTime();

      const diffMs = timeB - timeA;
      if (diffMs <= 0) return '';

      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    } catch {
      return '';
    }
  }

  function getHotelStatus(act: Activity, dateStr: string) {
    if (act.type !== 'hotel') return null;
    const h = act as HotelActivity;
    if (!h.checkoutDate || h.checkoutDate === h.date) {
      return {
        time: h.checkIn || h.time || '15:00',
        badge: (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <Bed className="h-3 w-3" /> Hotel
          </span>
        ),
        label: 'Alojamiento en ' + h.hotelName,
        showCheckInOut: true,
      };
    }

    if (dateStr === h.date) {
      return {
        time: h.checkIn || h.time || '15:00',
        badge: (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <Bed className="h-3 w-3" /> Entrada Hotel (Check-in)
          </span>
        ),
        label: `Alojamiento en ${h.hotelName}`,
        showCheckInOut: true,
      };
    }

    if (dateStr === h.checkoutDate) {
      return {
        time: h.checkOut || '12:00',
        badge: (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
            <Bed className="h-3 w-3" /> Salida Hotel (Check-out)
          </span>
        ),
        label: `Alojamiento en ${h.hotelName}`,
        showCheckInOut: true,
      };
    }

    const startParts = h.date.split('-').map(Number);
    const currentParts = dateStr.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const current = new Date(currentParts[0], currentParts[1] - 1, currentParts[2]);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const endParts = h.checkoutDate.split('-').map(Number);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    const totalTime = end.getTime() - start.getTime();
    const totalNights = Math.ceil(totalTime / (1000 * 60 * 60 * 24));

    return {
      time: 'Todo el día',
      badge: (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <Bed className="h-3 w-3" /> Noche {diffDays} de {totalNights}
        </span>
      ),
      label: `Alojamiento en ${h.hotelName}`,
      showCheckInOut: false,
    };
  }

  // Initialize the selected day after the active trip is synchronized.
  useEffect(() => {
    if (!activeTrip) return;

    const timer = window.setTimeout(() => {
      const range = getDatesInRange(activeTrip.startDate, activeTrip.endDate);
      if (!selectedDate || !range.includes(selectedDate)) {
        setSelectedDate(range.includes(todayStr) ? todayStr : activeTrip.startDate);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeTrip, selectedDate, todayStr]);

  if (isLoading) {
    return <WanderlustLoader />;
  }

  if (!activeTrip) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-6 py-20">
        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900">
            Viaje no encontrado
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            El viaje que buscas no existe, fue eliminado o ya no tienes acceso a él.
          </p>
          <Link
            href="/"
            className="wanderlust-primary-button mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Mis Viajes</span>
          </Link>
        </div>
      </div>
    );
  }

  const tripDates = getDatesInRange(activeTrip.startDate, activeTrip.endDate);
  const notesText =
    noteDraft?.tripId === activeTrip.id ? noteDraft.value : activeTrip.notes || '';

  const formatDateLabel = (dateStr: string) => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const parts = dateStr.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  // Day activities
  const dayActivities = activeTrip.activities
    .filter((act) => {
      if (act.type === 'hotel') {
        const h = act as HotelActivity;
        if (h.checkoutDate) {
          return selectedDate >= h.date && selectedDate <= h.checkoutDate;
        }
      }
      return act.date === selectedDate;
    })
    .sort((a, b) => {
      const getTimeForSorting = (act: Activity, dateStr: string) => {
        if (act.type === 'hotel') {
          const h = act as HotelActivity;
          if (h.checkoutDate && h.checkoutDate !== h.date) {
            if (dateStr === h.checkoutDate) return h.checkOut || '12:00';
            if (dateStr === h.date) return h.checkIn || h.time || '14:00';
            return '00:00';
          }
        }
        return act.time;
      };
      return getTimeForSorting(a, selectedDate).localeCompare(
        getTimeForSorting(b, selectedDate)
      );
    });

  const getDayCostByCategory = (category: 'transport' | 'activities' | 'hotel' | 'food') => {
    return dayActivities
      .filter((act) => {
        if (category === 'transport') return act.type === 'flight' || act.type === 'transfer';
        if (category === 'activities') return act.type === 'excursion';
        if (category === 'hotel') return act.type === 'hotel' && act.date === selectedDate;
        if (category === 'food') return act.type === 'food';
        return false;
      })
      .reduce((sum, act) => sum + (Number(act.price) || 0), 0);
  };

  const totalTripSpent = activeTrip.activities.reduce(
    (sum, act) => sum + (Number(act.price) || 0),
    0
  );

  const getWholeTripCostByCategory = (category: 'transport' | 'activities' | 'hotel' | 'food') => {
    return activeTrip.activities
      .filter((act) => {
        if (category === 'transport') return act.type === 'flight' || act.type === 'transfer';
        if (category === 'activities') return act.type === 'excursion';
        if (category === 'hotel') return act.type === 'hotel';
        if (category === 'food') return act.type === 'food';
        return false;
      })
      .reduce((sum, act) => sum + (Number(act.price) || 0), 0);
  };

  const totalTransport = getWholeTripCostByCategory('transport');
  const totalActivities = getWholeTripCostByCategory('activities');
  const totalHotels = getWholeTripCostByCategory('hotel');
  const totalFood = getWholeTripCostByCategory('food');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderDescriptionWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zinc-900 underline decoration-zinc-400 hover:decoration-zinc-900 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingActivity(null);
    setActType('flight');
    setActTime('09:00');
    setActPrice('');

    setFlightLegs([
      {
        flightNumber: '',
        airline: '',
        origin: '',
        destination: '',
        departureTime: '09:00',
        departureDate: selectedDate,
        arrivalTime: '12:00',
        arrivalDate: selectedDate,
      },
    ]);

    setTransType('taxi');
    setTransOrigin('');
    setTransDest('');
    setTransDuration('');
    setTransDescription('');

    setHotelName('');
    setHotelAddress('');
    setHotelCheckIn('15:00');
    setHotelCheckOut('12:00');
    setHotelDescription('');
    setHotelCheckInDate(selectedDate);
    setHotelCheckOutDate(addDays(selectedDate, 1));

    setExcursionTitle('');
    setExcursionDesc('');
    setExcursionDur('');

    setFoodRestName('');
    setFoodType('dinner');
    setFoodDesc('');

    setIsOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setActType(act.type);
    setActTime(act.time);
    setActPrice(act.price ? act.price.toString() : '');

    if (act.type === 'flight') {
      const f = act as FlightActivity;
      if (f.legs && f.legs.length > 0) {
        setFlightLegs(f.legs);
      } else {
        setFlightLegs([
          {
            flightNumber: f.flightNumber || '',
            airline: f.airline || '',
            origin: f.origin || '',
            destination: f.destination || '',
            departureTime: f.time || '09:00',
            departureDate: f.date || selectedDate,
            arrivalTime: f.arrivalTime || '12:00',
            arrivalDate: f.date || selectedDate,
          },
        ]);
      }
    } else if (act.type === 'transfer') {
      const t = act as TransferActivity;
      setTransType(t.transportType || 'taxi');
      setTransOrigin(t.origin || '');
      setTransDest(t.destination || '');
      setTransDuration(t.duration || '');
      setTransDescription(t.description || '');
    } else if (act.type === 'hotel') {
      const h = act as HotelActivity;
      setHotelName(h.hotelName || '');
      setHotelAddress(h.address || '');
      setHotelCheckIn(h.checkIn || '15:00');
      setHotelCheckOut(h.checkOut || '12:00');
      setHotelDescription(h.description || '');
      setHotelCheckInDate(h.date || selectedDate);
      setHotelCheckOutDate(h.checkoutDate || addDays(h.date || selectedDate, 1));
    } else if (act.type === 'excursion') {
      const e = act as ExcursionActivity;
      setExcursionTitle(e.title || '');
      setExcursionDesc(e.description || '');
      setExcursionDur(e.duration || '');
    } else if (act.type === 'food') {
      const fd = act as FoodActivity;
      setFoodRestName(fd.restaurantName || '');
      setFoodType(fd.mealType || 'dinner');
      setFoodDesc(fd.description || '');
    }

    setIsOpen(true);
  };

  const handleSubmitActivity = () => {
    if (actType === 'flight') {
      if (flightLegs.length === 0) {
        alert('Por favor, añade al menos un trayecto de vuelo.');
        return;
      }
      for (let i = 0; i < flightLegs.length; i++) {
        const leg = flightLegs[i];
        if (
          !leg.origin ||
          !leg.destination ||
          !leg.flightNumber ||
          !leg.airline ||
          !leg.departureTime ||
          !leg.arrivalTime
        ) {
          alert(`Por favor, rellena todos los campos obligatorios del trayecto ${i + 1}.`);
          return;
        }
      }
    }

    if (actType === 'hotel') {
      if (!hotelCheckInDate || !hotelCheckOutDate) {
        alert('Por favor, indica las fechas de entrada y salida.');
        return;
      }
      if (hotelCheckOutDate < hotelCheckInDate) {
        alert('La fecha de salida no puede ser anterior a la de entrada.');
        return;
      }
    }

    let computedTime = actTime;
    if (actType === 'flight' && flightLegs[0]) {
      computedTime = flightLegs[0].departureTime;
    } else if (actType === 'hotel') {
      computedTime = hotelCheckIn || '15:00';
    }

    const priceNum = parseFloat(actPrice);

    const baseActivity = {
      date:
        actType === 'hotel'
          ? hotelCheckInDate
          : actType === 'flight' && flightLegs[0]
          ? flightLegs[0].departureDate || selectedDate
          : selectedDate,
      time: computedTime,
      price: isNaN(priceNum) ? 0 : priceNum,
    };
    let activityData: ActivityInput;

    if (actType === 'flight') {
      const firstLeg = flightLegs[0];
      const lastLeg = flightLegs[flightLegs.length - 1];
      const combinedFlightNo =
        flightLegs.length > 1
          ? flightLegs.map((leg) => leg.flightNumber).join(' + ')
          : firstLeg.flightNumber;

      activityData = {
        ...baseActivity,
        type: 'flight',
        flightNumber: combinedFlightNo || 'S/N',
        airline: firstLeg.airline || 'Aerolínea',
        origin: firstLeg.origin || 'Origen',
        destination: lastLeg.destination || 'Destino',
        arrivalTime: lastLeg.arrivalTime || '12:00',
        legs: flightLegs,
      };
    } else if (actType === 'transfer') {
      activityData = {
        ...baseActivity,
        type: 'transfer',
        transportType: transType,
        origin: transOrigin || 'Origen',
        destination: transDest || 'Destino',
        duration: transDuration || '15 min',
        description: transDescription || '',
      };
    } else if (actType === 'hotel') {
      activityData = {
        ...baseActivity,
        type: 'hotel',
        hotelName: hotelName || 'Hotel',
        address: hotelAddress || 'Dirección',
        checkIn: hotelCheckIn || '15:00',
        checkOut: hotelCheckOut || '12:00',
        checkoutDate: hotelCheckOutDate,
        description: hotelDescription || '',
      };
    } else if (actType === 'excursion') {
      activityData = {
        ...baseActivity,
        type: 'excursion',
        title: excursionTitle || 'Excursión',
        description: excursionDesc || '',
        duration: excursionDur || '2 horas',
      };
    } else {
      activityData = {
        ...baseActivity,
        type: 'food',
        restaurantName: foodRestName || 'Restaurante',
        mealType: foodType,
        description: foodDesc || '',
      };
    }

    if (editingActivity) {
      updateActivity(activeTrip.id, {
        ...activityData,
        id: editingActivity.id,
      });
    } else {
      addActivity(activeTrip.id, activityData);
    }

    setIsOpen(false);
  };

  const handleSaveNotes = () => {
    updateTrip({
      ...activeTrip,
      notes: notesText,
    });
    alert('Notas guardadas con éxito.');
  };

  return (
    <div className="flex-1 min-h-screen bg-[#fafafa] pb-24 text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Sticky Frosted Glass Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
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

      {/* HeroUI Pro Header Banner */}
      <section className="relative h-[340px] w-full overflow-hidden bg-zinc-950 md:h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            activeTrip.imageUrl ||
            'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
          }
          alt={activeTrip.name}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,150,136,0.25),rgba(255,255,255,0))]" />

        {/* Top Floating Controls */}
        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-5 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-zinc-950/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-zinc-950/70 active:scale-95"
              title="Volver a mis viajes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-zinc-950/50 px-3.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md shadow-sm">
                <Compass className="h-3.5 w-3.5 text-teal-300" />
                <span>
                  {tripDates.length} {tripDates.length === 1 ? 'Día' : 'Días'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Destination Banner Details */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 pb-8 sm:px-6 md:flex-row md:items-end md:pb-10 lg:px-8">
            <div className="text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/40 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-200 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-teal-300" />
                <span>Itinerario activo</span>
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight drop-shadow-md sm:text-5xl md:text-6xl">
                {activeTrip.name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>
                  {formatDateLabel(activeTrip.startDate).day} {formatDateLabel(activeTrip.startDate).month}
                  {' — '}
                  {formatDateLabel(activeTrip.endDate).day} {formatDateLabel(activeTrip.endDate).month} de{' '}
                  {activeTrip.endDate.split('-')[0]}
                </span>
              </div>
            </div>

            {/* Glassmorphic Total Expenses Card */}
            <div className="w-fit min-w-[200px] rounded-2xl border border-white/20 bg-white/95 p-4 text-zinc-900 shadow-xl backdrop-blur-md md:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Gastos del viaje
              </p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-zinc-950">
                {formatCurrency(totalTripSpent)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {/* Capsule Pill Tabs Switcher (Fondo gris con #009688 primary) */}
        <div className="mb-8 flex overflow-x-auto pb-1 scrollbar-hide">
          <div className="inline-flex items-center rounded-full bg-zinc-100 p-1.5 border border-zinc-200/80 shadow-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all duration-150 cursor-pointer shadow-none ${
                    isActive
                      ? 'bg-[#009688] text-white'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENTS (with Skeleton Loading) */}
        <div>
          {isTabTransitioning ? (
            <TabSkeleton tab={activeTab} />
          ) : (
            <>
              {/* TAB 1: ITINERARIO */}
              {activeTab === 'itinerario' && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Timeline & Day Carousel (Left / center 2 cols) */}
              <div className="space-y-6 lg:col-span-2">
                {/* HeroUI Pro Day Selector Strip */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <h3 className="text-sm font-bold text-zinc-900">Días del viaje</h3>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                      {tripDates.length} {tripDates.length === 1 ? 'día' : 'días'}
                    </span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                    {tripDates.map((date, idx) => {
                      const active = selectedDate === date;
                      const isToday = date === todayStr;
                      const { day, month } = formatDateLabel(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          aria-pressed={active}
                          className={`flex h-[86px] min-w-[80px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 transition-all duration-200 ${
                            active
                              ? 'wanderlust-selected-day'
                              : isToday
                              ? 'border-zinc-900 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 shadow-xs'
                              : 'border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                            Día {idx + 1}
                          </span>
                          <span className="mt-0.5 text-2xl font-extrabold leading-none">{day}</span>
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {month}
                            {isToday ? ' · Hoy' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Activities Card */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Plan del Día</h2>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {dayActivities.length === 0
                          ? 'Sin actividades programadas'
                          : `${dayActivities.length} actividades planificadas para esta fecha`}
                      </p>
                    </div>

                    <button
                      id="btn-add-activity"
                      className="wanderlust-primary-button inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Añadir Actividad</span>
                    </button>
                  </div>

                  {/* Vertical Timeline */}
                  {dayActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                        <Clock className="h-7 w-7 stroke-[1.5]" />
                      </div>
                      <h4 className="text-base font-bold text-zinc-800">
                        No hay nada planeado para hoy
                      </h4>
                      <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                        Añade vuelos, traslados, hoteles, comidas o excursiones para dar forma a tu itinerario diario.
                      </p>
                      <button
                        className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 active:scale-95"
                        onClick={handleOpenAdd}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir primer elemento</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative space-y-5 border-l-2 border-zinc-200 pl-5 sm:pl-6 ml-3 sm:ml-4 py-2">
                      {dayActivities.map((act) => {
                        const hotelStatus = getHotelStatus(act, selectedDate);

                        const iconMap = {
                          flight: <Plane className="h-3.5 w-3.5 text-sky-700" />,
                          transfer: <Car className="h-3.5 w-3.5 text-amber-700" />,
                          hotel: <Bed className="h-3.5 w-3.5 text-emerald-700" />,
                          excursion: <Map className="h-3.5 w-3.5 text-violet-700" />,
                          food: <Utensils className="h-3.5 w-3.5 text-rose-700" />,
                        };

                        const dotBgMap = {
                          flight: 'bg-sky-100 border-sky-300',
                          transfer: 'bg-amber-100 border-amber-300',
                          hotel: 'bg-emerald-100 border-emerald-300',
                          excursion: 'bg-violet-100 border-violet-300',
                          food: 'bg-rose-100 border-rose-300',
                        };

                        const badgeMap = {
                          flight: (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                              <Plane className="h-3 w-3" /> Vuelo
                            </span>
                          ),
                          transfer: (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              <Car className="h-3 w-3" /> Traslado
                            </span>
                          ),
                          hotel: (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              <Bed className="h-3 w-3" /> Hotel
                            </span>
                          ),
                          excursion: (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                              <Map className="h-3 w-3" /> Actividad
                            </span>
                          ),
                          food: (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                              <Utensils className="h-3 w-3" /> Gastronomía
                            </span>
                          ),
                        };

                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot indicator on timeline */}
                            <div
                              className={`absolute -left-[31px] top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-xs transition-transform group-hover:scale-110 sm:-left-[37px] ${
                                dotBgMap[act.type]
                              }`}
                            >
                              {iconMap[act.type]}
                            </div>

                            {/* Activity Card */}
                            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
                              <div className="flex flex-col justify-between gap-4 md:flex-row">
                                <div className="flex-1 space-y-3">
                                  {/* Badge & Meta Row */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-bold text-zinc-800">
                                      <Clock className="h-3 w-3 text-zinc-400" />
                                      {hotelStatus ? hotelStatus.time : act.time}
                                    </span>
                                    {hotelStatus ? hotelStatus.badge : badgeMap[act.type]}
                                    {act.price > 0 && (
                                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-bold text-zinc-900">
                                        {formatCurrency(act.price)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Flight rendering */}
                                  {act.type === 'flight' && (
                                    <div className="space-y-3">
                                      {(act as FlightActivity).legs &&
                                      ((act as FlightActivity).legs || []).length > 1 ? (
                                        <div className="space-y-2.5">
                                          <h4 className="text-base font-bold text-zinc-900">
                                            Conexión: {(act as FlightActivity).origin} →{' '}
                                            {(act as FlightActivity).destination}
                                          </h4>
                                          <div className="space-y-3 border-l-2 border-dashed border-zinc-200 pl-3.5 ml-2">
                                            {((act as FlightActivity).legs || []).map((leg, idx) => {
                                              const layoverTime =
                                                idx > 0
                                                  ? calculateLayover(
                                                      ((act as FlightActivity).legs || [])[idx - 1],
                                                      leg,
                                                      act.date
                                                    )
                                                  : '';
                                              return (
                                                <div key={idx} className="space-y-1.5">
                                                  {idx > 0 && layoverTime && (
                                                    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                                      <span>
                                                        Escala en{' '}
                                                        <strong>
                                                          {
                                                            ((act as FlightActivity).legs || [])[
                                                              idx - 1
                                                            ].destination
                                                          }
                                                        </strong>
                                                      </span>
                                                      <span className="rounded-full bg-amber-200/60 px-1.5 py-0.2 text-[9px] font-bold">
                                                        {layoverTime}
                                                      </span>
                                                    </div>
                                                  )}

                                                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3">
                                                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                                                      <span>
                                                        Trayecto {idx + 1}: {leg.flightNumber}
                                                      </span>
                                                      <span className="font-semibold text-zinc-800">
                                                        {leg.airline}
                                                      </span>
                                                    </div>
                                                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-800">
                                                      <span>{leg.origin}</span>
                                                      <span className="text-xs font-normal text-zinc-400">
                                                        ({leg.departureTime}
                                                        {leg.departureDate &&
                                                        leg.departureDate !== act.date
                                                          ? ` · ${formatDateSimple(leg.departureDate)}`
                                                          : ''}
                                                        )
                                                      </span>
                                                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                                                      <span>{leg.destination}</span>
                                                      <span className="text-xs font-normal text-zinc-400">
                                                        ({leg.arrivalTime}
                                                        {leg.arrivalDate &&
                                                        leg.arrivalDate !== act.date
                                                          ? ` · ${formatDateSimple(leg.arrivalDate)}`
                                                          : ''}
                                                        )
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <h4 className="text-base font-bold text-zinc-900">
                                            Vuelo {(act as FlightActivity).flightNumber} ·{' '}
                                            {(act as FlightActivity).airline}
                                          </h4>
                                          <div className="mt-1.5 inline-flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 text-sm font-semibold text-zinc-800">
                                            <span>{(act as FlightActivity).origin}</span>
                                            <span className="text-xs font-normal text-zinc-400">
                                              ({act.time})
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                                            <span>{(act as FlightActivity).destination}</span>
                                            <span className="text-xs font-normal text-zinc-400">
                                              ({(act as FlightActivity).arrivalTime})
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Transfer rendering */}
                                  {act.type === 'transfer' && (
                                    <div className="space-y-1.5">
                                      <h4 className="text-base font-bold text-zinc-900">
                                        Traslado en{' '}
                                        {(act as TransferActivity).transportType === 'taxi'
                                          ? 'Taxi / Coche'
                                          : (act as TransferActivity).transportType === 'bus'
                                          ? 'Autobús'
                                          : (act as TransferActivity).transportType === 'train'
                                          ? 'Tren'
                                          : (act as TransferActivity).transportType === 'metro'
                                          ? 'Metro'
                                          : (act as TransferActivity).transportType === 'walking'
                                          ? 'Caminando'
                                          : 'Otro'}
                                      </h4>
                                      <p className="flex items-center gap-1.5 text-sm text-zinc-700">
                                        <MapPin className="h-4 w-4 text-zinc-500" />
                                        <span>
                                          {(act as TransferActivity).origin} →{' '}
                                          {(act as TransferActivity).destination}
                                        </span>
                                      </p>
                                      <p className="inline-block rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                                        Duración: {(act as TransferActivity).duration}
                                      </p>
                                      {(act as TransferActivity).description && (
                                        <p className="mt-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-2.5 text-xs leading-relaxed text-zinc-600">
                                          {renderDescriptionWithLinks(
                                            (act as TransferActivity).description || ''
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Hotel rendering */}
                                  {act.type === 'hotel' && (
                                    <div className="space-y-2">
                                      <h4 className="text-base font-bold text-zinc-900">
                                        {hotelStatus
                                          ? hotelStatus.label
                                          : `Alojamiento en ${(act as HotelActivity).hotelName}`}
                                      </h4>
                                      <p className="flex items-center gap-1.5 text-sm text-zinc-600">
                                        <MapPin className="h-4 w-4 text-zinc-400" />
                                        <span>{(act as HotelActivity).address}</span>
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-zinc-600">
                                        {hotelStatus && hotelStatus.showCheckInOut ? (
                                          <>
                                            <span>
                                              Check-in:{' '}
                                              <strong className="text-zinc-900">
                                                {(act as HotelActivity).checkIn}
                                              </strong>
                                              {(act as HotelActivity).checkoutDate &&
                                                ` (${formatDateSimple(act.date)})`}
                                            </span>
                                            <span>
                                              Check-out:{' '}
                                              <strong className="text-zinc-900">
                                                {(act as HotelActivity).checkOut}
                                              </strong>
                                              {(act as HotelActivity).checkoutDate &&
                                                ` (${formatDateSimple(
                                                  (act as HotelActivity).checkoutDate || ''
                                                )})`}
                                            </span>
                                          </>
                                        ) : (
                                          (act as HotelActivity).checkoutDate && (
                                            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-semibold text-zinc-700">
                                              Estancia del {formatDateSimple(act.date)} al{' '}
                                              {formatDateSimple(
                                                (act as HotelActivity).checkoutDate || ''
                                              )}
                                            </span>
                                          )
                                        )}
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            (act as HotelActivity).address
                                          )}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-100"
                                        >
                                          <Navigation className="h-3 w-3" />
                                          <span>Cómo llegar</span>
                                        </a>
                                      </div>
                                      {(act as HotelActivity).description && (
                                        <p className="mt-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-2.5 text-xs leading-relaxed text-zinc-600">
                                          {renderDescriptionWithLinks(
                                            (act as HotelActivity).description || ''
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Excursion rendering */}
                                  {act.type === 'excursion' && (
                                    <div className="space-y-1.5">
                                      <h4 className="text-base font-bold text-zinc-900">
                                        {(act as ExcursionActivity).title}
                                      </h4>
                                      {(act as ExcursionActivity).description && (
                                        <p className="text-xs leading-relaxed text-zinc-600">
                                          {renderDescriptionWithLinks(
                                            (act as ExcursionActivity).description
                                          )}
                                        </p>
                                      )}
                                      <p className="inline-block rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                                        Duración: {(act as ExcursionActivity).duration}
                                      </p>
                                    </div>
                                  )}

                                  {/* Food rendering */}
                                  {act.type === 'food' && (
                                    <div className="space-y-1.5">
                                      <h4 className="text-base font-bold text-zinc-900">
                                        {(act as FoodActivity).restaurantName}
                                      </h4>
                                      <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                                        {(act as FoodActivity).mealType === 'breakfast'
                                          ? 'Desayuno'
                                          : (act as FoodActivity).mealType === 'lunch'
                                          ? 'Almuerzo'
                                          : (act as FoodActivity).mealType === 'dinner'
                                          ? 'Cena'
                                          : 'Snack / Café'}
                                      </span>
                                      {(act as FoodActivity).description && (
                                        <p className="text-xs leading-relaxed text-zinc-600">
                                          {renderDescriptionWithLinks(
                                            (act as FoodActivity).description
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Actions (Edit & Delete) */}
                                <div className="flex items-center justify-end gap-1.5 border-t border-zinc-100 pt-3 md:flex-col md:border-t-0 md:border-l md:pl-4 md:pt-0">
                                  <button
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-500 shadow-xs transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95"
                                    onClick={() => handleOpenEdit(act)}
                                    title="Editar actividad"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-500 shadow-xs transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          '¿Estás seguro de que quieres eliminar esta actividad del itinerario?'
                                        )
                                      ) {
                                        deleteActivity(activeTrip.id, act.id);
                                      }
                                    }}
                                    title="Eliminar actividad"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Expenses Breakdown (Right 1 col) */}
              <div className="space-y-6">
                {/* Gastos del Día Bento Card */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <TrendingUp className="h-4 w-4 text-zinc-600" />
                    <span>Gastos del Día</span>
                  </h3>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-zinc-700">
                            Transporte
                          </span>
                          <span className="text-[10px] text-zinc-400">Vuelos y traslados</span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatCurrency(getDayCostByCategory('transport'))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <Map className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-zinc-700">
                            Actividades
                          </span>
                          <span className="text-[10px] text-zinc-400">Excursiones y tours</span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatCurrency(getDayCostByCategory('activities'))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-zinc-700">Comida</span>
                          <span className="text-[10px] text-zinc-400">Restaurantes y cafés</span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatCurrency(getDayCostByCategory('food'))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Bed className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-zinc-700">
                            Alojamiento
                          </span>
                          <span className="text-[10px] text-zinc-400">Hoteles del día</span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatCurrency(getDayCostByCategory('hotel'))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Total del día
                    </span>
                    <span className="text-base font-extrabold text-zinc-900">
                      {formatCurrency(
                        getDayCostByCategory('transport') +
                          getDayCostByCategory('activities') +
                          getDayCostByCategory('food') +
                          getDayCostByCategory('hotel')
                      )}
                    </span>
                  </div>
                </div>

                {/* Gastos Acumulados Card */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <Euro className="h-4 w-4 text-zinc-600" />
                    <span>Gastos Acumulados</span>
                  </h3>
                  <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Total registrado
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                      {formatCurrency(totalTripSpent)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      Calculado automáticamente con los importes de todas las actividades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESCRIPCIÓN */}
          {activeTab === 'descripcion' && (
            <div className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                  Sobre este viaje
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-600 sm:text-base">
                  {activeTrip.description ||
                    'Aún no se ha añadido una descripción para este viaje. ¡Edita tu viaje para añadir detalles del itinerario!'}
                </p>
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <h3 className="mb-4 text-base font-bold text-zinc-900">Métricas del Viaje</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Días Totales
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                      {tripDates.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Actividades
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                      {activeTrip.activities.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Gasto Total
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                      {formatCurrency(totalTripSpent)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Promedio Diario
                    </span>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                      {formatCurrency(totalTripSpent / (tripDates.length || 1))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETALLES & FINANZAS */}
          {activeTab === 'detalles' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Cost Breakdown */}
              <div className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm md:col-span-1">
                <h3 className="border-b border-zinc-100 pb-3 text-base font-bold text-zinc-900">
                  Desglose de Gastos
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600">
                      <span>Transporte</span>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(totalTransport)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{
                          width: `${
                            totalTripSpent > 0 ? (totalTransport / totalTripSpent) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600">
                      <span>Alojamiento</span>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(totalHotels)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${
                            totalTripSpent > 0 ? (totalHotels / totalTripSpent) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600">
                      <span>Actividades</span>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(totalActivities)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{
                          width: `${
                            totalTripSpent > 0 ? (totalActivities / totalTripSpent) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600">
                      <span>Comida</span>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(totalFood)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all"
                        style={{
                          width: `${
                            totalTripSpent > 0 ? (totalFood / totalTripSpent) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Booked Flights & Hotels */}
              <div className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm md:col-span-2">
                <h3 className="border-b border-zinc-100 pb-3 text-base font-bold text-zinc-900">
                  Vuelos y Hoteles Reservados
                </h3>

                {/* Hotels List */}
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Bed className="h-4 w-4 text-emerald-600" />
                    <span>Hoteles & Alojamientos</span>
                  </h4>
                  {activeTrip.activities.filter((a) => a.type === 'hotel').length === 0 ? (
                    <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
                      No hay hoteles registrados en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeTrip.activities
                        .filter((a) => a.type === 'hotel')
                        .map((a) => {
                          const h = a as HotelActivity;
                          return (
                            <div
                              key={h.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-200/80 p-3.5 transition-all hover:bg-zinc-50"
                            >
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{h.hotelName}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span>{h.address}</span>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      h.address
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 font-bold text-zinc-700 hover:underline"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    <span>Mapa</span>
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-zinc-500">
                                  {h.checkoutDate && h.checkoutDate !== h.date
                                    ? `${formatDateSimple(h.date)} - ${formatDateSimple(
                                        h.checkoutDate
                                      )}`
                                    : formatDateSimple(h.date)}
                                </span>
                                <p className="mt-0.5 text-sm font-extrabold text-zinc-900">
                                  {formatCurrency(h.price)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Flights List */}
                <div className="border-t border-zinc-100 pt-4">
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Plane className="h-4 w-4 text-sky-600" />
                    <span>Vuelos Registrados</span>
                  </h4>
                  {activeTrip.activities.filter((a) => a.type === 'flight').length === 0 ? (
                    <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
                      No hay vuelos registrados en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeTrip.activities
                        .filter((a) => a.type === 'flight')
                        .map((a) => {
                          const f = a as FlightActivity;
                          return (
                            <div
                              key={f.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-200/80 p-3.5 transition-all hover:bg-zinc-50"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900">
                                    {f.flightNumber}
                                  </span>
                                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.2 text-[10px] font-bold text-zinc-700">
                                    {f.airline}
                                  </span>
                                  {f.legs && f.legs.length > 1 && (
                                    <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.2 text-[10px] font-bold text-zinc-600">
                                      {f.legs.length - 1}{' '}
                                      {f.legs.length - 1 === 1 ? 'escala' : 'escalas'}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {f.origin} → {f.destination}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-zinc-500">
                                  {f.date} ({f.time})
                                </span>
                                <p className="mt-0.5 text-sm font-extrabold text-zinc-900">
                                  {formatCurrency(f.price)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTAS */}
          {activeTab === 'notas' && (
            <div className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zinc-600" />
                  <h3 className="text-base font-bold text-zinc-900">Notas de Viaje</h3>
                </div>
                <button
                  className="wanderlust-primary-button inline-flex h-9 cursor-pointer items-center justify-center rounded-xl px-4 text-xs font-semibold"
                  onClick={handleSaveNotes}
                >
                  <span>Guardar Notas</span>
                </button>
              </div>

              <textarea
                placeholder="Escribe aquí cualquier detalle crucial de tu viaje: seguros médicos, alquileres de coches, teléfonos de emergencia, números de pasaporte..."
                className="min-h-[360px] w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 text-sm leading-relaxed text-zinc-800 placeholder-zinc-400 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-y"
                value={notesText}
                onChange={(e) =>
                  setNoteDraft({ tripId: activeTrip.id, value: e.target.value })
                }
              />
              <p className="text-right text-xs italic text-zinc-400">
                * Haz clic en &quot;Guardar Notas&quot; para persistir los cambios.
              </p>
            </div>
          )}

          {/* TAB 5: CONFIGURACIÓN */}
          {activeTab === 'configuracion' && (
            <TripNotificationSettings tripId={activeTrip.id} />
          )}
            </>
          )}
        </div>
      </main>

      {/* Floating Itinerary Assistant AI */}
      <ItineraryAssistantChat trip={activeTrip} />

      {/* HeroUI Pro Modal: Añadir / Editar Actividad */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative z-10 flex h-[92vh] sm:h-auto sm:max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    {editingActivity ? 'Editar Actividad' : 'Añadir Actividad'}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Organiza los detalles del itinerario diario
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Type Radio Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Tipo de Actividad
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { type: 'flight', label: 'Vuelo', icon: Plane },
                    { type: 'transfer', label: 'Traslado', icon: Car },
                    { type: 'hotel', label: 'Hotel', icon: Bed },
                    { type: 'excursion', label: 'Actividad', icon: Map },
                    { type: 'food', label: 'Comida', icon: Utensils },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = actType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setActType(item.type as ActivityType)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                          isSelected
                            ? 'border-[#009688] bg-[#009688] text-white shadow-sm ring-2 ring-[#009688]/20'
                            : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[11px] font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Hora *
                  </label>
                  <input
                    type="time"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Importe (€)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                      €
                    </span>
                    <input
                      type="number"
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-sm font-medium text-zinc-800 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      placeholder="Ej. 45"
                      value={actPrice}
                      onChange={(e) => setActPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Form by Activity Kind */}
              {actType === 'flight' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="space-y-3">
                    {flightLegs.map((leg, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                            Trayecto {idx + 1}
                          </span>
                          {flightLegs.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFlightLegs(flightLegs.filter((_, i) => i !== idx))
                              }
                              className="text-xs font-bold text-rose-600 hover:text-rose-700"
                            >
                              Eliminar trayecto
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                              Origen *
                            </label>
                            <input
                              type="text"
                              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                              placeholder="Ej. MAD"
                              value={leg.origin}
                              onChange={(e) => {
                                const updated = [...flightLegs];
                                updated[idx].origin = e.target.value;
                                setFlightLegs(updated);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                              Destino *
                            </label>
                            <input
                              type="text"
                              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                              placeholder="Ej. BKK"
                              value={leg.destination}
                              onChange={(e) => {
                                const updated = [...flightLegs];
                                updated[idx].destination = e.target.value;
                                if (idx + 1 < updated.length) {
                                  updated[idx + 1].origin = e.target.value;
                                }
                                setFlightLegs(updated);
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                              Nº de Vuelo *
                            </label>
                            <input
                              type="text"
                              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                              placeholder="Ej. QR150"
                              value={leg.flightNumber}
                              onChange={(e) => {
                                const updated = [...flightLegs];
                                updated[idx].flightNumber = e.target.value;
                                setFlightLegs(updated);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                              Aerolínea *
                            </label>
                            <input
                              type="text"
                              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                              placeholder="Ej. Qatar Airways"
                              value={leg.airline}
                              onChange={(e) => {
                                const updated = [...flightLegs];
                                updated[idx].airline = e.target.value;
                                setFlightLegs(updated);
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 rounded-xl bg-white p-2.5 border border-zinc-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Salida
                            </span>
                            <div className="mt-1 space-y-1">
                              <input
                                type="date"
                                className="h-8 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                                min={activeTrip.startDate}
                                max={activeTrip.endDate}
                                value={leg.departureDate || selectedDate}
                                onChange={(e) => {
                                  const updated = [...flightLegs];
                                  updated[idx].departureDate = e.target.value;
                                  if (
                                    !updated[idx].arrivalDate ||
                                    updated[idx].arrivalDate < e.target.value
                                  ) {
                                    updated[idx].arrivalDate = e.target.value;
                                  }
                                  setFlightLegs(updated);
                                }}
                                required
                              />
                              <input
                                type="time"
                                className="h-8 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                                value={leg.departureTime}
                                onChange={(e) => {
                                  const updated = [...flightLegs];
                                  updated[idx].departureTime = e.target.value;
                                  setFlightLegs(updated);
                                }}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1 rounded-xl bg-white p-2.5 border border-zinc-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Llegada
                            </span>
                            <div className="mt-1 space-y-1">
                              <input
                                type="date"
                                className="h-8 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                                min={leg.departureDate || activeTrip.startDate}
                                max={activeTrip.endDate}
                                value={
                                  leg.arrivalDate || leg.departureDate || selectedDate
                                }
                                onChange={(e) => {
                                  const updated = [...flightLegs];
                                  updated[idx].arrivalDate = e.target.value;
                                  setFlightLegs(updated);
                                }}
                                required
                              />
                              <input
                                type="time"
                                className="h-8 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                                value={leg.arrivalTime}
                                onChange={(e) => {
                                  const updated = [...flightLegs];
                                  updated[idx].arrivalTime = e.target.value;
                                  setFlightLegs(updated);
                                }}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const lastLeg = flightLegs[flightLegs.length - 1];
                      setFlightLegs([
                        ...flightLegs,
                        {
                          flightNumber: '',
                          airline: lastLeg?.airline || '',
                          origin: lastLeg?.destination || '',
                          destination: '',
                          departureTime: lastLeg?.arrivalTime || '12:00',
                          departureDate: lastLeg?.arrivalDate || selectedDate,
                          arrivalTime: '',
                          arrivalDate: lastLeg?.arrivalDate || selectedDate,
                        },
                      ]);
                    }}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Añadir escala / conexión</span>
                  </button>
                </div>
              )}

              {actType === 'transfer' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Medio de Transporte
                    </label>
                    <select
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm font-medium text-zinc-800"
                      value={transType}
                      onChange={(e) =>
                        setTransType(
                          e.target.value as TransferActivity['transportType']
                        )
                      }
                    >
                      <option value="taxi">Taxi / Coche</option>
                      <option value="bus">Autobús</option>
                      <option value="train">Tren</option>
                      <option value="metro">Metro</option>
                      <option value="walking">Caminando</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Origen
                      </label>
                      <input
                        type="text"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        placeholder="Ej. Aeropuerto"
                        value={transOrigin}
                        onChange={(e) => setTransOrigin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Destino
                      </label>
                      <input
                        type="text"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        placeholder="Ej. Hotel Canopi"
                        value={transDest}
                        onChange={(e) => setTransDest(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Duración Aprox.
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. 30 - 45 min"
                      value={transDuration}
                      onChange={(e) => setTransDuration(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Notas / Recomendaciones
                    </label>
                    <textarea
                      className="h-16 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800"
                      placeholder="Ej. Grab o taxi oficial en salida de terminal..."
                      value={transDescription}
                      onChange={(e) => setTransDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {actType === 'hotel' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Nombre del Hotel *
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. Canopi by Hilton"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Dirección
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. 12 Phan Chu Trinh, Hanoi"
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Fecha Entrada *
                      </label>
                      <input
                        type="date"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        min={activeTrip.startDate}
                        max={activeTrip.endDate}
                        value={hotelCheckInDate}
                        onChange={(e) => {
                          const newInDate = e.target.value;
                          setHotelCheckInDate(newInDate);
                          if (hotelCheckOutDate <= newInDate) {
                            setHotelCheckOutDate(addDays(newInDate, 1));
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Fecha Salida *
                      </label>
                      <input
                        type="date"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        min={hotelCheckInDate || activeTrip.startDate}
                        max={activeTrip.endDate}
                        value={hotelCheckOutDate}
                        onChange={(e) => setHotelCheckOutDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {hotelCheckInDate && hotelCheckOutDate && (
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Estancia calculada
                      </span>
                      <span className="text-xs font-extrabold text-zinc-900">
                        {getNights(hotelCheckInDate, hotelCheckOutDate)}{' '}
                        {getNights(hotelCheckInDate, hotelCheckOutDate) === 1
                          ? 'noche'
                          : 'noches'}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Hora Check-in
                      </label>
                      <input
                        type="text"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        placeholder="Ej. 15:00"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Hora Check-out
                      </label>
                      <input
                        type="text"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                        placeholder="Ej. 12:00"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Notas o Localizador
                    </label>
                    <textarea
                      className="h-16 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800"
                      placeholder="Ej. Reserva Booking #12345, desayuno incluido..."
                      value={hotelDescription}
                      onChange={(e) => setHotelDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {actType === 'excursion' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Título de la Actividad *
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. Kayak en Bahía de Halong"
                      value={excursionTitle}
                      onChange={(e) => setExcursionTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Duración Aprox.
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. 4 horas"
                      value={excursionDur}
                      onChange={(e) => setExcursionDur(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Descripción o Detalles
                    </label>
                    <textarea
                      className="h-20 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800"
                      placeholder="Punto de encuentro, qué llevar..."
                      value={excursionDesc}
                      onChange={(e) => setExcursionDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {actType === 'food' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Nombre del Restaurante / Lugar *
                    </label>
                    <input
                      type="text"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm text-zinc-800"
                      placeholder="Ej. Bun Cha Huong Lien"
                      value={foodRestName}
                      onChange={(e) => setFoodRestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Tipo de Comida
                    </label>
                    <select
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm font-medium text-zinc-800"
                      value={foodType}
                      onChange={(e) =>
                        setFoodType(e.target.value as FoodActivity['mealType'])
                      }
                    >
                      <option value="breakfast">Desayuno</option>
                      <option value="lunch">Almuerzo</option>
                      <option value="dinner">Cena</option>
                      <option value="snack">Snack / Café</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Platos recomendados o Notas
                    </label>
                    <textarea
                      className="h-16 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-800"
                      placeholder="Ej. Probar el plato estrella y pedir mesa en la terraza..."
                      value={foodDesc}
                      onChange={(e) => setFoodDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="wanderlust-primary-button inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
                onClick={handleSubmitActivity}
              >
                {editingActivity ? 'Guardar Cambios' : 'Añadir Actividad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
