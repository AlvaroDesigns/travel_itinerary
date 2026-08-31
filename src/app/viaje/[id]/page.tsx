'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTravel, Activity, ActivityType, FlightActivity, FlightLeg, TransferActivity, HotelActivity, ExcursionActivity, FoodActivity } from '@/context/TravelContext';
import { TripNotificationSettings } from '@/components/TripNotificationSettings';
import { ItineraryAssistantChat } from '@/components/ItineraryAssistantChat';
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
  Loader2,
  LogOut,
  ShieldCheck,
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;


  // Selected Day State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Available tabs and active tab (kept in sync with the ?tab= URL query param)
  const TABS = [
    { id: 'itinerario', label: 'Itinerario' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'detalles', label: 'Detalles' },
    { id: 'notas', label: 'Notas' },
    { id: 'configuracion', label: 'Configuración' },
  ];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.id === tabFromUrl) ? (tabFromUrl as string) : 'itinerario';

  // Keep the active tab reflected in the URL without triggering a full reload
  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (tabId === 'itinerario') {
      params.delete('tab');
    } else {
      params.set('tab', tabId);
    }
    const query = params.toString();
    router.replace(`/viaje/${id}${query ? `?${query}` : ''}`, { scroll: false });
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


  const [transType, setTransType] = useState<'taxi' | 'bus' | 'train' | 'metro' | 'walking' | 'other'>('taxi');
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

  // Notes draft is keyed to the active trip, avoiding synchronous state updates in an effect.
  const [noteDraft, setNoteDraft] = useState<{ tripId: string; value: string } | null>(null);

  // Sync active trip by URL param
  useEffect(() => {
    if (id) {
      setActiveTripById(id);
    }
  }, [id, setActiveTripById]);

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
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-ink-50 px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center border border-ink-200 bg-white">
            <Image
              src="/wanderlust_icono_negro.png"
              alt="Wanderlust"
              width={56}
              height={56}
              className="h-12 w-auto animate-pulse object-contain"
            />
          </div>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.28em] text-ink-400">Wanderlust</p>
          <div className="mt-3 flex items-center gap-2 text-ink-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-semibold">Preparando tu itinerario</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-ink-50 px-6 py-20">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-ink-200 bg-white text-ink-900">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.28em] text-ink-400">Wanderlust</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">Viaje no encontrado</h2>
          <p className="mt-3 text-sm leading-6 text-ink-500">El viaje que buscas no existe, fue eliminado o ya no tienes acceso a él.</p>
          <Link
            href="/"
            className="wanderlust-primary-button mt-8 inline-flex items-center justify-center px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-95"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
            Volver a Mis Viajes
          </Link>
        </div>
      </div>
    );
  }

  // Get Dates in Range Helper
  function getDatesInRange(startStr: string, endStr: string) {
    const dates = [];
    const startParts = startStr.split('-').map(Number);
    const endParts = endStr.split('-').map(Number);
    
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      );
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Helper to add days to a YYYY-MM-DD date string
  function addDays(dateStr: string, daysStr: number) {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + daysStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Helper to get number of nights between two dates
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

  // Helper to format date simply (e.g. "27 Jun")
  function formatDateSimple(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const month = months[monthIdx] || '';
    return `${day} ${month}`;
  }

  // Helper to calculate layover time between two legs
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


  // Helper to determine status and display styling for a hotel stay on a specific date
  function getHotelStatus(act: Activity, dateStr: string) {
    if (act.type !== 'hotel') return null;
    const h = act as HotelActivity;
    if (!h.checkoutDate || h.checkoutDate === h.date) {
      return {
        time: h.checkIn || h.time || '15:00',
        badge: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Hotel</span>,
        label: 'Alojamiento en ' + h.hotelName,
        showCheckInOut: true
      };
    }

    if (dateStr === h.date) {
      return {
        time: h.checkIn || h.time || '15:00',
        badge: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Entrada Hotel (Check-in)</span>,
        label: `Alojamiento en ${h.hotelName}`,
        showCheckInOut: true
      };
    }

    if (dateStr === h.checkoutDate) {
      return {
        time: h.checkOut || '12:00',
        badge: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Salida Hotel (Check-out)</span>,
        label: `Alojamiento en ${h.hotelName}`,
        showCheckInOut: true
      };
    }

    // Intermediate day: calculate which night this is!
    const startParts = h.date.split('-').map(Number);
    const currentParts = dateStr.split('-').map(Number);
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const current = new Date(currentParts[0], currentParts[1] - 1, currentParts[2]);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Total nights
    const endParts = h.checkoutDate.split('-').map(Number);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    const totalTime = end.getTime() - start.getTime();
    const totalNights = Math.ceil(totalTime / (1000 * 60 * 60 * 24));

    return {
      time: 'Todo el día',
      badge: <span className="border border-ink-200 bg-ink-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-700">Hotel - Estancia (Noche {diffDays} de {totalNights})</span>,
      label: `Alojamiento en ${h.hotelName}`,
      showCheckInOut: false
    };
  }


  const tripDates = getDatesInRange(activeTrip.startDate, activeTrip.endDate);
  const notesText = noteDraft?.tripId === activeTrip.id ? noteDraft.value : activeTrip.notes || '';

  const formatDateLabel = (dateStr: string) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const parts = dateStr.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  // Calculations for current selected day
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
            if (dateStr === h.checkoutDate) {
              return h.checkOut || '12:00';
            }
            if (dateStr === h.date) {
              return h.checkIn || h.time || '14:00';
            }
            return '00:00';
          }
        }
        return act.time;
      };
      const timeA = getTimeForSorting(a, selectedDate);
      const timeB = getTimeForSorting(b, selectedDate);
      return timeA.localeCompare(timeB);
    });

  const getDayCostByCategory = (category: 'transport' | 'activities' | 'hotel' | 'food') => {
    return dayActivities
      .filter((act) => {
        if (category === 'transport') return act.type === 'flight' || act.type === 'transfer';
        if (category === 'activities') return act.type === 'excursion';
        if (category === 'hotel') {
          // Only add hotel cost on check-in day to avoid duplicate counting!
          return act.type === 'hotel' && act.date === selectedDate;
        }
        if (category === 'food') return act.type === 'food';
        return false;
      })
      .reduce((sum, act) => sum + act.price, 0);
  };

  // Calculations for whole trip
  const totalTripSpent = activeTrip.activities.reduce((sum, act) => sum + act.price, 0);

  // Categories for the whole trip
  const getWholeTripCostByCategory = (category: 'transport' | 'activities' | 'hotel' | 'food') => {
    return activeTrip.activities
      .filter((act) => {
        if (category === 'transport') return act.type === 'flight' || act.type === 'transfer';
        if (category === 'activities') return act.type === 'excursion';
        if (category === 'hotel') return act.type === 'hotel';
        if (category === 'food') return act.type === 'food';
        return false;
      })
      .reduce((sum, act) => sum + act.price, 0);
  };

  const totalTransport = getWholeTripCostByCategory('transport');
  const totalActivities = getWholeTripCostByCategory('activities');
  const totalHotels = getWholeTripCostByCategory('hotel');
  const totalFood = getWholeTripCostByCategory('food');

  // Format currencies beautifully as Euros (e.g. 2500 -> 2.500 €)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to parse URLs inside descriptions and render them as clickable links
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
            className="text-ink-900 hover:text-ink-600 font-bold underline break-all font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Handle open add modal
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
        arrivalTime: '11:00',
        arrivalDate: selectedDate,
      }
    ]);
    setTransType('taxi');
    setTransOrigin('');
    setTransDest('');
    setTransDuration('');
    setTransDescription('');
    setHotelName('');
    setHotelAddress('');
    setHotelCheckIn('');
    setHotelCheckOut('');
    setHotelDescription('');
    const defaultCheckIn = selectedDate;
    const defaultCheckOut = addDays(selectedDate, 1) > activeTrip.endDate ? activeTrip.endDate : addDays(selectedDate, 1);
    setHotelCheckInDate(defaultCheckIn);
    setHotelCheckOutDate(defaultCheckOut);
    setExcursionTitle('');
    setExcursionDesc('');
    setExcursionDur('');
    setFoodRestName('');
    setFoodType('dinner');
    setFoodDesc('');
    setIsOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setActType(act.type);
    setActTime(act.time);
    setActPrice(act.price > 0 ? String(act.price) : '');

    if (act.type === 'flight') {
      const f = act as FlightActivity;
      if (f.legs && f.legs.length > 0) {
        setFlightLegs(f.legs);
      } else {
        setFlightLegs([
          {
            flightNumber: f.flightNumber,
            airline: f.airline,
            origin: f.origin,
            destination: f.destination,
            departureTime: f.time,
            departureDate: f.date,
            arrivalTime: f.arrivalTime,
            arrivalDate: f.date,
          }
        ]);
      }
    } else if (act.type === 'transfer') {
      const t = act as TransferActivity;
      setTransType(t.transportType);
      setTransOrigin(t.origin);
      setTransDest(t.destination);
      setTransDuration(t.duration);
      setTransDescription(t.description || '');
    } else if (act.type === 'hotel') {
      const h = act as HotelActivity;
      setHotelName(h.hotelName);
      setHotelAddress(h.address);
      setHotelCheckIn(h.checkIn);
      setHotelCheckOut(h.checkOut);
      setHotelDescription(h.description || '');
      setHotelCheckInDate(h.date);
      setHotelCheckOutDate(h.checkoutDate || h.date);
    }
 else if (act.type === 'excursion') {
      const e = act as ExcursionActivity;
      setExcursionTitle(e.title);
      setExcursionDesc(e.description);
      setExcursionDur(e.duration);
    } else if (act.type === 'food') {
      const fd = act as FoodActivity;
      setFoodRestName(fd.restaurantName);
      setFoodType(fd.mealType);
      setFoodDesc(fd.description);
    }
    setIsOpen(true);
  };

  // Submit Activity Form (Add/Update)
  const handleSubmitActivity = () => {
    if (actType === 'flight') {
      if (flightLegs.length === 0) {
        alert('Por favor, añade al menos un trayecto de vuelo.');
        return;
      }
      for (let i = 0; i < flightLegs.length; i++) {
        const leg = flightLegs[i];
        if (!leg.origin || !leg.destination || !leg.flightNumber || !leg.airline || !leg.departureTime || !leg.arrivalTime) {
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

    // Determine default action time
    let computedTime = actTime;
    if (actType === 'flight' && flightLegs[0]) {
      computedTime = flightLegs[0].departureTime;
    } else if (actType === 'hotel') {
      computedTime = hotelCheckIn || '15:00';
    }

    const priceNum = parseFloat(actPrice);
    
    // Construct a fully typed activity for the selected activity kind.
    const baseActivity = {
      date: actType === 'hotel' ? hotelCheckInDate : (actType === 'flight' && flightLegs[0] ? (flightLegs[0].departureDate || selectedDate) : selectedDate),
      time: computedTime,
      price: isNaN(priceNum) ? 0 : priceNum,
    };
    let activityData: ActivityInput;

    if (actType === 'flight') {
      const firstLeg = flightLegs[0];
      const lastLeg = flightLegs[flightLegs.length - 1];
      const combinedFlightNo = flightLegs.length > 1
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

  // Save Notes on change
  const handleSaveNotes = () => {
    updateTrip({
      ...activeTrip,
      notes: notesText,
    });
    alert('Notas guardadas con éxito.');
  };

  return (
    <div className="flex-1 bg-ink-50 pb-16">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Ir a mis viajes" className="inline-flex items-center">
            <Image src="/wanderlust_horizontal_negro.png" alt="Wanderlust" width={180} height={44} priority className="h-8 w-auto object-contain sm:h-9" />
          </Link>
          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Cuenta</span>
                <span className="max-w-48 truncate text-xs font-bold text-ink-900">{user.email}</span>
              </div>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Usuarios</span>
                </Link>
              )}
              <div className="hidden h-6 w-px bg-ink-200 sm:block" />
              <button onClick={logout} className="inline-flex cursor-pointer items-center gap-1.5 border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white active:scale-95">
                <LogOut className="h-3.5 w-3.5" /><span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Dynamic Header Banner */}
      <header className="relative h-[22rem] w-full overflow-hidden bg-ink-900 md:h-[30rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeTrip.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
          alt={activeTrip.name}
          className="h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/35 to-ink-900/10" />

        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-5 sm:px-6 lg:px-8">
            <Link
              href="/"
              aria-label="Volver a mis viajes"
              className="inline-flex h-10 w-10 items-center justify-center border border-white/25 bg-ink-900/75 text-white transition-colors hover:bg-white hover:text-ink-900"
              title="Volver a mis viajes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="border border-white/20 bg-ink-900/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              {tripDates.length} {tripDates.length === 1 ? 'Día' : 'Días'}
            </span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 pb-6 sm:px-6 md:flex-row md:items-end md:pb-8 lg:px-8">
            <div className="text-white">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">Tu próximo destino</p>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl md:text-6xl">
                {activeTrip.name}
              </h1>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/75">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {formatDateLabel(activeTrip.startDate).day} {formatDateLabel(activeTrip.startDate).month}
                  {' — '}
                  {formatDateLabel(activeTrip.endDate).day} {formatDateLabel(activeTrip.endDate).month} de {activeTrip.endDate.split('-')[0]}
                </span>
              </div>
            </div>

            <div className="w-fit min-w-40 border border-white/20 bg-white px-4 py-3 text-ink-900 md:min-w-52 md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Gastos del viaje</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{formatCurrency(totalTripSpent)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Custom Tab Switcher */}
        <div className="mb-8 border-b border-ink-200 pb-3">
          <div className="flex w-max min-w-full gap-1 overflow-x-auto bg-white p-1.5 scrollbar-hide sm:min-w-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`shrink-0 px-4 py-2.5 text-sm font-bold transition-colors ${
                    isActive
                      ? 'wanderlust-active-tab'
                      : 'border border-transparent text-ink-500 hover:border-ink-200 hover:bg-ink-50 hover:text-ink-900'
                  }`}
                  style={isActive ? { backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff' } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div>
          
          {/* TAB 1: ITINERARIO */}
          {activeTab === 'itinerario' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Timeline list & Selector (Left / center, 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Horizontal Day Selector */}
                <div className="border border-ink-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-end justify-between gap-4 px-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Itinerario</p>
                      <h3 className="mt-1 text-base font-extrabold text-ink-900">Días del viaje</h3>
                    </div>
                    <span className="text-xs font-semibold text-ink-500">{tripDates.length} {tripDates.length === 1 ? 'día' : 'días'}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                          aria-label={`Día ${idx + 1}: ${day} de ${month}${isToday ? ', hoy' : ''}`}
                          className={`flex h-[84px] min-w-[76px] flex-col items-center justify-center border px-2 transition-colors ${
                            active
                              ? 'wanderlust-selected-day'
                              : isToday
                                ? 'border-ink-900 bg-white text-ink-900 hover:bg-ink-50'
                                : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-ink-400 hover:bg-white'
                          }`}
                          style={active ? { backgroundColor: '#000000', borderColor: '#000000', color: '#ffffff', boxShadow: '0 8px 18px rgb(0 0 0 / 18%)' } : undefined}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">Día {idx + 1}</span>
                          <span className="mt-1 text-xl font-extrabold leading-none">{day}</span>
                          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">{month}{isToday ? ' · Hoy' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Activities List */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-ink-100">
                  <div className="flex items-center justify-between border-b border-ink-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-ink-800 font-sans">Plan del Día</h2>
                      <p className="text-xs text-ink-400 mt-0.5 font-sans">
                        {dayActivities.length === 0 ? 'Sin actividades programadas' : `${dayActivities.length} actividades planificadas`}
                      </p>
                    </div>
                    <button
                      id="btn-add-activity"
                      className="font-semibold shadow-md bg-ink-900 text-white hover:bg-ink-700 rounded-xl h-10 px-4 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-sm font-sans"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Elemento
                    </button>
                  </div>

                  {/* Vertical Timeline */}
                  {dayActivities.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Clock className="w-12 h-12 text-ink-300 stroke-[1.5] mb-3" />
                      <h4 className="font-bold text-ink-600 font-sans">No hay nada planeado para hoy</h4>
                      <p className="text-ink-400 text-xs mt-1 max-w-xs leading-relaxed font-sans">
                        Añade vuelos, traslados, hoteles o excursiones para dar forma a tu itinerario diario.
                      </p>
                      <button
                        className="mt-4 font-semibold border border-ink-200 rounded-xl bg-ink-50 text-ink-800 h-9 px-3.5 hover:bg-ink-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                        onClick={handleOpenAdd}
                      >
                        Añadir mi primer elemento
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-ink-100 pl-5 sm:pl-6 ml-2.5 sm:ml-4 space-y-6 sm:space-y-8 py-2">
                      {dayActivities.map((act) => {
                        const hotelStatus = getHotelStatus(act, selectedDate);

                        const iconMap = {
                          flight: <Plane className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />,
                          transfer: <Car className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />,
                          hotel: <Bed className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />,
                          excursion: <Map className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />,
                          food: <Utensils className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />,
                        };
                        
                        const borderMap = {
                          flight: 'border-ink-200 hover:border-ink-900',
                          transfer: 'border-ink-200 hover:border-ink-900',
                          hotel: 'border-ink-200 hover:border-ink-900',
                          excursion: 'border-ink-200 hover:border-ink-900',
                          food: 'border-ink-200 hover:border-ink-900',
                        };

                        const badgeMap = {
                          flight: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Vuelo</span>,
                          transfer: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Traslado</span>,
                          hotel: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Hotel</span>,
                          excursion: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Actividad</span>,
                          food: <span className="border border-ink-900 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Comida</span>,
                        };

                        return (
                          <div key={act.id} className="relative group/item">
                            
                            {/* Dot element on left timeline */}
                            <div className="absolute -left-[31px] top-4 z-10 flex h-6 w-6 items-center justify-center border border-ink-900 bg-ink-900 transition-transform group-hover/item:scale-110 sm:-left-[37px] sm:h-7 sm:w-7">
                              {iconMap[act.type]}
                            </div>

                            {/* Card Content */}
                            <div className={`overflow-hidden border bg-white transition-colors duration-300 ${borderMap[act.type]}`}>
                              <div className="flex flex-col justify-between gap-4 p-4 md:flex-row">
                                <div className="flex-1 space-y-2">
                                  
                                  {/* Badge / Type & Time info */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex items-center gap-1 text-sm font-bold text-ink-800 font-sans">
                                      <Clock className="h-3.5 w-3.5 text-ink-400" />
                                      {hotelStatus ? hotelStatus.time : act.time}
                                    </span>
                                    {hotelStatus ? hotelStatus.badge : badgeMap[act.type]}
                                    {act.price > 0 && (
                                      <span className="border border-ink-200 bg-ink-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-700">
                                        {formatCurrency(act.price)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Flight rendering */}
                                  {act.type === 'flight' && (
                                    <div className="space-y-3">
                                      {(act as FlightActivity).legs && ((act as FlightActivity).legs || []).length > 1 ? (
                                        <div className="space-y-3">
                                          <h4 className="text-base font-bold text-ink-800 font-sans">
                                            Conexión: {(act as FlightActivity).origin} → {(act as FlightActivity).destination}
                                          </h4>
                                          <div className="border-l-2 border-dashed border-ink-300 pl-4 ml-2.5 space-y-4 my-2">
                                            {((act as FlightActivity).legs || []).map((leg, idx) => {
                                              const layoverTime = idx > 0 ? calculateLayover(((act as FlightActivity).legs || [])[idx - 1], leg, act.date) : '';
                                              return (
                                                <div key={idx} className="relative space-y-2">
                                                  {/* Connecting indicator dot */}
                                                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-ink-900 border-2 border-white shadow-sm" />
                                                  
                                                  {/* Layover banner */}
                                                  {idx > 0 && layoverTime && (
                                                    <div className="bg-ink-50 border border-ink-200 text-ink-700 rounded-lg p-2 text-xs font-semibold flex items-center justify-between shadow-xs mb-3 -ml-2 select-none">
                                                      <span>Escala en <strong className="text-ink-900">{((act as FlightActivity).legs || [])[idx - 1].destination}</strong></span>
                                                      <span className="bg-ink-900 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-bold">Espera: {layoverTime}</span>
                                                    </div>
                                                  )}

                                                  {/* Leg segment box */}
                                                  <div className="bg-white/60 p-3 rounded-xl border border-ink-100 shadow-xs">
                                                    <div className="flex justify-between items-center text-xs font-bold text-ink-500 font-sans">
                                                      <span>Trayecto {idx + 1}: {leg.flightNumber}</span>
                                                      <span className="text-ink-900 font-semibold">{leg.airline}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-ink-700 mt-1.5 font-semibold bg-white/40 p-1 rounded max-w-fit flex-wrap">
                                                      <span className="font-extrabold text-ink-800">{leg.origin}</span>
                                                      <span className="text-xs text-ink-400 font-normal">
                                                        ({leg.departureTime}{leg.departureDate && leg.departureDate !== act.date ? ` el ${formatDateSimple(leg.departureDate)}` : ''})
                                                      </span>
                                                      <ChevronRight className="w-3.5 h-3.5 text-ink-400" />
                                                      <span className="font-extrabold text-ink-800">{leg.destination}</span>
                                                      <span className="text-xs text-ink-400 font-normal">
                                                        ({leg.arrivalTime}{leg.arrivalDate && leg.arrivalDate !== act.date ? ` el ${formatDateSimple(leg.arrivalDate)}` : ''})
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ) : (
                                        // Direct flight view (1 leg or legacy)
                                        <div>
                                          <h4 className="text-base font-bold text-ink-800 font-sans">
                                            Vuelo {(act as FlightActivity).flightNumber} - {(act as FlightActivity).airline}
                                          </h4>
                                          <div className="flex items-center gap-3 text-sm text-ink-600 mt-1 font-medium bg-white/60 p-2 rounded-lg border border-ink-100/50 max-w-fit flex-wrap">
                                            <span className="font-bold text-ink-700">{(act as FlightActivity).origin}</span>
                                            <span className="text-xs text-ink-400 font-sans">
                                              (Salida: {act.time})
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-ink-400" />
                                            <span className="font-bold text-ink-700">{(act as FlightActivity).destination}</span>
                                            <span className="text-xs text-ink-400 font-sans">
                                              (Llegada: {(act as FlightActivity).arrivalTime})
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Transfer rendering */}
                                  {act.type === 'transfer' && (
                                    <div>
                                      <h4 className="text-base font-bold text-ink-800 font-sans">
                                        Traslado en {
                                          (act as TransferActivity).transportType === 'taxi' ? 'Taxi' :
                                          (act as TransferActivity).transportType === 'bus' ? 'Autobús' :
                                          (act as TransferActivity).transportType === 'train' ? 'Tren' :
                                          (act as TransferActivity).transportType === 'metro' ? 'Metro' :
                                          (act as TransferActivity).transportType === 'walking' ? 'Caminando' : 'Otro'
                                        }
                                      </h4>
                                      <p className="text-sm text-ink-600 mt-1 flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-4 h-4 text-ink-700" />
                                        <span>{(act as TransferActivity).origin} {' -> '} {(act as TransferActivity).destination}</span>
                                      </p>
                                      <p className="text-xs text-ink-400 mt-1 bg-white/60 px-2 py-1 rounded border border-ink-100/50 max-w-fit font-sans">
                                        Duración: {(act as TransferActivity).duration}
                                      </p>
                                      {/* Custom transfer description */}
                                      {(act as TransferActivity).description && (
                                        <p className="text-sm text-ink-500 mt-2 max-w-lg leading-relaxed font-sans italic bg-ink-50/30 p-2.5 rounded-xl border border-ink-100/50 border-dashed break-words">
                                          {renderDescriptionWithLinks((act as TransferActivity).description || '')}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Hotel rendering */}
                                  {act.type === 'hotel' && (
                                    <div>
                                      <h4 className="text-base font-bold text-ink-800 font-sans">
                                        {hotelStatus ? hotelStatus.label : `Alojamiento en ${(act as HotelActivity).hotelName}`}
                                      </h4>
                                      <p className="text-sm text-ink-600 mt-1 flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-4 h-4 text-ink-700" />
                                        <span>{(act as HotelActivity).address}</span>
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-medium font-sans">
                                        {hotelStatus && hotelStatus.showCheckInOut ? (
                                          <>
                                            <span className="text-ink-400">
                                              Check-in: <strong className="text-ink-600">{(act as HotelActivity).checkIn}</strong>
                                              {(act as HotelActivity).checkoutDate && ` (${formatDateSimple(act.date)})`}
                                            </span>
                                            <span className="text-ink-400">
                                              Check-out: <strong className="text-ink-600">{(act as HotelActivity).checkOut}</strong>
                                              {(act as HotelActivity).checkoutDate && ` (${formatDateSimple((act as HotelActivity).checkoutDate || '')})`}
                                            </span>
                                          </>
                                        ) : (
                                          (act as HotelActivity).checkoutDate && (
                                            <span className="text-ink-500 bg-ink-50 border border-ink-100 rounded-lg px-2.5 py-0.5 font-semibold">
                                              Estancia del {formatDateSimple(act.date)} al {formatDateSimple((act as HotelActivity).checkoutDate || '')}
                                            </span>
                                          )
                                        )}
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((act as HotelActivity).address)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-ink-900 hover:bg-ink-100 bg-ink-50 border border-ink-200 rounded-lg px-2.5 py-1 transition-all font-bold hover:scale-[1.02] active:scale-[0.98] cursor-pointer ml-auto sm:ml-0"
                                        >
                                          <MapPin className="w-3.5 h-3.5 text-ink-700" />
                                          <span>Cómo llegar</span>
                                        </a>
                                      </div>
                                      {/* Custom hotel description/notes */}
                                      {(act as HotelActivity).description && (
                                        <p className="text-sm text-ink-500 mt-2.5 max-w-lg leading-relaxed font-sans italic bg-ink-50/30 p-2.5 rounded-xl border border-ink-100/50 border-dashed break-words">
                                          {renderDescriptionWithLinks((act as HotelActivity).description || '')}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Excursion rendering */}
                                  {act.type === 'excursion' && (
                                    <div>
                                      <h4 className="text-base font-bold text-ink-800 font-sans">
                                        {(act as ExcursionActivity).title}
                                      </h4>
                                      {(act as ExcursionActivity).description && (
                                        <p className="text-sm text-ink-500 mt-1 max-w-lg leading-relaxed font-sans break-words">
                                          {renderDescriptionWithLinks((act as ExcursionActivity).description)}
                                        </p>
                                      )}
                                      <p className="mt-1.5 max-w-fit border border-ink-200 bg-ink-50 px-2 py-1 text-xs text-ink-600 font-sans">
                                        Duración: {(act as ExcursionActivity).duration}
                                      </p>
                                    </div>
                                  )}

                                  {/* Food rendering */}
                                  {act.type === 'food' && (
                                    <div>
                                      <h4 className="text-base font-bold text-ink-800 font-sans">
                                        Comida: {(act as FoodActivity).restaurantName}
                                      </h4>
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="border border-ink-200 bg-ink-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-700">
                                          {
                                            (act as FoodActivity).mealType === 'breakfast' ? 'Desayuno' :
                                            (act as FoodActivity).mealType === 'lunch' ? 'Almuerzo' :
                                            (act as FoodActivity).mealType === 'dinner' ? 'Cena' : 'Snack'
                                          }
                                        </span>
                                      </div>
                                      {(act as FoodActivity).description && (
                                        <p className="text-sm text-ink-500 mt-2 max-w-lg leading-relaxed font-sans break-words">
                                          {renderDescriptionWithLinks((act as FoodActivity).description)}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                </div>

                                {/* Actions */}
                                <div className="flex min-w-[70px] flex-row items-center justify-end gap-2 border-t border-ink-200 pt-3 md:flex-col md:border-t-0 md:border-l md:pl-4 md:pt-0">
                                  <button
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center border border-ink-200 text-ink-500 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                                    onClick={() => handleOpenEdit(act)}
                                    title="Editar"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center border border-ink-200 text-ink-500 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que quieres eliminar esta actividad del itinerario?')) {
                                        deleteActivity(activeTrip.id, act.id);
                                      }
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

              {/* Sidebar Expenses details (Right, 1 col) */}
              <div className="space-y-6">
                
                {/* Gastos del Día por Persona Summary */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-ink-100">
                  <h3 className="text-sm font-bold text-ink-700 mb-4 flex items-center gap-2 font-sans">
                    <TrendingUp className="w-5 h-5 text-ink-500" />
                    Gastos del Día (Por Persona)
                  </h3>
                  
                  {/* Category boxes */}
                  <div className="space-y-3">
                    
                    {/* Transporte Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-ink-100 bg-ink-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-ink-100/50">
                          <Car className="w-4 h-4 text-ink-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-ink-600 block">Transporte</span>
                          <span className="text-[10px] text-ink-400">Vuelos y traslados</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-ink-700 font-sans">
                        {formatCurrency(getDayCostByCategory('transport'))}
                      </span>
                    </div>

                    {/* Actividades Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-ink-100 bg-ink-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-ink-100/50">
                          <Map className="w-4 h-4 text-ink-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-ink-600 block">Actividades</span>
                          <span className="text-[10px] text-ink-400">Excursiones y visitas</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-ink-700 font-sans">
                        {formatCurrency(getDayCostByCategory('activities'))}
                      </span>
                    </div>

                    {/* Comida Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-ink-100 bg-ink-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-ink-100/50">
                          <Utensils className="w-4 h-4 text-ink-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-ink-600 block">Comida</span>
                          <span className="text-[10px] text-ink-400">Restaurantes y snacks</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-ink-700 font-sans">
                        {formatCurrency(getDayCostByCategory('food'))}
                      </span>
                    </div>

                    {/* Alojamiento Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-ink-100 bg-ink-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-ink-100/50">
                          <Bed className="w-4 h-4 text-ink-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-ink-600 block">Alojamiento</span>
                          <span className="text-[10px] text-ink-400">Hoteles del día</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-ink-700 font-sans">
                        {formatCurrency(getDayCostByCategory('hotel'))}
                      </span>
                    </div>

                  </div>

                  {/* Total Day Cost Indicator */}
                  <div className="mt-5 pt-4 border-t border-ink-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-ink-800">Total del día</span>
                    <span className="text-lg font-black text-ink-600 font-sans">
                      {formatCurrency(
                        getDayCostByCategory('transport') +
                        getDayCostByCategory('activities') +
                        getDayCostByCategory('food') +
                        getDayCostByCategory('hotel')
                      )}
                    </span>
                  </div>

                </div>

                {/* Automatically calculated trip expenses */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-ink-100">
                  <h3 className="text-sm font-bold text-ink-700 mb-3 flex items-center gap-2 font-sans">
                    <Euro className="w-5 h-5 text-ink-500" />
                    Gastos Acumulados
                  </h3>
                  <div className="rounded-xl bg-ink-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">Total registrado</p>
                    <p className="mt-1 text-2xl font-black text-ink-800">{formatCurrency(totalTripSpent)}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-500">Se calcula automáticamente con los importes de las actividades del itinerario.</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DESCRIPCIÓN */}
          {activeTab === 'descripcion' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-ink-100 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-ink-800 font-sans">Sobre este viaje</h2>
                <p className="text-ink-600 mt-4 leading-relaxed text-base whitespace-pre-line font-sans">
                  {activeTrip.description || 'Aún no se ha añadido una descripción para este viaje. ¡Edita tu viaje para añadir detalles del itinerario!'}
                </p>
              </div>

              <div className="border-t border-ink-100 pt-6">
                <h3 className="text-lg font-bold text-ink-800 mb-4 font-sans">Métricas del Viaje</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-ink-50 p-4 rounded-xl border border-ink-100 text-center">
                    <span className="text-xs font-semibold text-ink-400 uppercase">Días Totales</span>
                    <p className="text-2xl font-black text-ink-800 mt-1 font-sans">{tripDates.length}</p>
                  </div>
                  <div className="bg-ink-50 p-4 rounded-xl border border-ink-100 text-center">
                    <span className="text-xs font-semibold text-ink-400 uppercase">Actividades</span>
                    <p className="text-2xl font-black text-ink-800 mt-1 font-sans">{activeTrip.activities.length}</p>
                  </div>
                  <div className="bg-ink-50 p-4 rounded-xl border border-ink-100 text-center">
                    <span className="text-xs font-semibold text-ink-400 uppercase">Gasto Total</span>
                    <p className="text-2xl font-black text-ink-600 mt-1 font-sans">{formatCurrency(totalTripSpent)}</p>
                  </div>
                  <div className="bg-ink-50 p-4 rounded-xl border border-ink-100 text-center">
                    <span className="text-xs font-semibold text-ink-400 uppercase">Promedio Diario</span>
                    <p className="text-2xl font-black text-ink-600 mt-1 font-sans">
                      {formatCurrency(totalTripSpent / (tripDates.length || 1))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETALLES */}
          {activeTab === 'detalles' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left col: Cost Breakdown */}
              <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-ink-100 space-y-6">
                <h3 className="text-lg font-bold text-ink-800 border-b border-ink-100 pb-3 font-sans">Desglose de Gastos</h3>
                <div className="space-y-4">
                  
                  {/* Transport */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-ink-500 mb-1">
                      <span>Transporte</span>
                      <span>{formatCurrency(totalTransport)}</span>
                    </div>
                    <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-ink-500" style={{ width: `${totalTripSpent > 0 ? (totalTransport / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-ink-500 mb-1">
                      <span>Alojamiento</span>
                      <span>{formatCurrency(totalHotels)}</span>
                    </div>
                    <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-ink-500" style={{ width: `${totalTripSpent > 0 ? (totalHotels / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Excursions */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-ink-500 mb-1">
                      <span>Actividades</span>
                      <span>{formatCurrency(totalActivities)}</span>
                    </div>
                    <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-ink-500" style={{ width: `${totalTripSpent > 0 ? (totalActivities / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Food */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-ink-500 mb-1">
                      <span>Comida</span>
                      <span>{formatCurrency(totalFood)}</span>
                    </div>
                    <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-ink-500" style={{ width: `${totalTripSpent > 0 ? (totalFood / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right cols: List of all key elements (Flights & Accommodation summary) */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-ink-100 space-y-6">
                <h3 className="text-lg font-bold text-ink-800 border-b border-ink-100 pb-3 font-sans">Vuelos y Hoteles Reservados</h3>
                
                {/* Hotels list */}
                <div>
                  <h4 className="text-sm font-bold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-1.5 font-sans">
                    <Bed className="w-4 h-4 text-ink-500" />
                    Hoteles / Alojamientos
                  </h4>
                  {activeTrip.activities.filter(a => a.type === 'hotel').length === 0 ? (
                    <p className="text-xs text-ink-400 bg-ink-50 p-3 rounded-xl border border-ink-100 border-dashed font-sans">
                      No hay hoteles reservados en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeTrip.activities.filter(a => a.type === 'hotel').map(a => {
                        const h = a as HotelActivity;
                        return (
                          <div key={h.id} className="flex justify-between items-center p-3 rounded-xl border border-ink-100 hover:bg-ink-50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-ink-700 font-sans">{h.hotelName}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-xs text-ink-400 font-sans">{h.address}</p>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-ink-600 hover:text-ink-800 transition-colors inline-flex items-center gap-0.5 hover:underline"
                                  title="Cómo llegar"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Cómo llegar</span>
                                </a>
                              </div>
                            </div>
                            <div className="text-right font-sans">
                              <span className="text-xs font-semibold text-ink-400">
                                {h.checkoutDate && h.checkoutDate !== h.date
                                  ? `${formatDateSimple(h.date)} - ${formatDateSimple(h.checkoutDate)}`
                                  : formatDateSimple(h.date)}
                              </span>
                              <p className="text-sm font-extrabold text-ink-700 mt-0.5">{formatCurrency(h.price)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Flights list */}
                <div className="pt-4 border-t border-ink-100">
                  <h4 className="text-sm font-bold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-1.5 font-sans">
                    <Plane className="w-4 h-4 text-ink-500" />
                    Vuelos Registrados
                  </h4>
                  {activeTrip.activities.filter(a => a.type === 'flight').length === 0 ? (
                    <p className="text-xs text-ink-400 bg-ink-50 p-3 rounded-xl border border-ink-100 border-dashed font-sans">
                      No hay vuelos en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeTrip.activities.filter(a => a.type === 'flight').map(a => {
                        const f = a as FlightActivity;
                        return (
                          <div key={f.id} className="flex justify-between items-center p-3 rounded-xl border border-ink-100 hover:bg-ink-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-ink-700 font-sans">{f.flightNumber}</span>
                                <span className="text-xs text-ink-600 bg-ink-50 px-2 py-0.5 rounded font-semibold border border-ink-100">{f.airline}</span>
                                {f.legs && f.legs.length > 1 && (
                                  <span className="text-[10px] text-ink-700 bg-ink-50 px-2 py-0.5 rounded font-bold border border-ink-200">
                                    {f.legs.length - 1} {f.legs.length - 1 === 1 ? 'escala' : 'escalas'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-400 mt-1 font-medium font-sans">
                                {f.origin} {' -> '} {f.destination}
                                {f.legs && f.legs.length > 1 && ` (vía ${f.legs.slice(0, -1).map(l => l.destination).join(', ')})`}
                              </p>
                            </div>
                            <div className="text-right font-sans">
                              <span className="text-xs font-semibold text-ink-400">{f.date} ({f.time})</span>
                              <p className="text-sm font-extrabold text-ink-700 mt-0.5">{formatCurrency(f.price)}</p>
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-ink-100 space-y-4">
              <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-ink-500" />
                  <h3 className="text-lg font-bold text-ink-800 font-sans">Notas de Viaje</h3>
                </div>
                <button
                  className="font-semibold wanderlust-primary-button shadow-none bg-ink-900 hover:bg-ink-800 text-white rounded-xl h-9 px-4 flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                  onClick={handleSaveNotes}
                >
                  Guardar Notas
                </button>
              </div>

              <textarea
                placeholder="Escribe aquí cualquier detalle crucial de tu viaje: seguros médicos, alquileres de coches, teléfonos de emergencia, números de pasaporte..."
                className="w-full min-h-[350px] p-4 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50/50 leading-relaxed font-sans text-sm resize-y"
                value={notesText}
                onChange={(e) => setNoteDraft({ tripId: activeTrip.id, value: e.target.value })}
              />
              <p className="text-[11px] text-ink-400 text-right italic font-medium font-sans">
                * Haz clic en &quot;Guardar Notas&quot; para guardar tus cambios permanentemente en el navegador.
              </p>
            </div>
          )}

          {/* TAB 5: CONFIGURACIÓN (solo para sesión autenticada) */}
          {activeTab === 'configuracion' && (
            <TripNotificationSettings tripId={activeTrip.id} />
          )}

        </div>

      </main>

      <ItineraryAssistantChat trip={activeTrip} />

      {/* Custom Modal: Agregar / Editar Actividad */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-2xl border border-ink-100 shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
              <h2 className="text-xl font-bold text-ink-800 flex items-center gap-2 font-sans">
                <Plus className="text-ink-500 w-6 h-6" />
                {editingActivity ? 'Editar Actividad' : 'Añadir Actividad'}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-ink-400 hover:text-ink-600 hover:bg-ink-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Select Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">
                  Tipo de Elemento
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23454545%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
                  value={actType}
                  onChange={(e) => setActType(e.target.value as ActivityType)}
                >
                  <option value="flight">Vuelo (Avión)</option>
                  <option value="transfer">Traslado (Taxi, Bus, Tren, Caminar)</option>
                  <option value="hotel">Alojamiento (Hotel, Apartamento)</option>
                  <option value="excursion">Actividad / Excursión</option>
                  <option value="food">Comida (Desayuno, Almuerzo, Cena)</option>
                </select>
              </div>

              {/* Common Inputs: Time and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Hora *</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Costo (en Euros, ej: 45 para 45 €) (Opcional)</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm font-semibold pointer-events-none">€</span>
                    <input
                      type="number"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. 45"
                      value={actPrice}
                      onChange={(e) => setActPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Fields based on actType */}
              
              {/* 1. VUELO */}
              {actType === 'flight' && (
                <div className="space-y-4 pt-2 border-t border-ink-100">
                  <div className="space-y-4">
                    {flightLegs.map((leg, idx) => {
                      const layoverTime = idx > 0 ? calculateLayover(flightLegs[idx - 1], leg, selectedDate) : '';

                      return (
                        <div key={idx} className="space-y-3">
                          {/* Layover alert info between legs */}
                          {idx > 0 && layoverTime && (
                            <div className="bg-ink-50 border border-ink-200 text-ink-800 rounded-xl p-3 text-xs font-semibold flex items-center justify-between shadow-sm">
                              <span>Conexión en <strong className="text-ink-900">{flightLegs[idx - 1].destination}</strong></span>
                              <span className="bg-ink-100 text-ink-900 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">Espera: {layoverTime}</span>
                            </div>
                          )}

                          {/* Leg Segment Block */}
                          <div className="bg-ink-50 border border-ink-200 rounded-2xl p-4 space-y-3 relative">
                            <div className="flex items-center justify-between border-b border-ink-200 pb-2">
                              <span className="text-xs font-extrabold text-ink-600 uppercase tracking-widest">
                                Trayecto {idx + 1} {flightLegs.length > 1 ? `(${leg.origin || '?' } → ${leg.destination || '?'})` : ''}
                              </span>
                              {flightLegs.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFlightLegs(flightLegs.filter((_, i) => i !== idx));
                                  }}
                                  className="text-ink-500 hover:text-ink-700 hover:bg-ink-50 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-0"
                                >
                                  Eliminar Trayecto
                                </button>
                              )}
                            </div>

                            {/* Airports */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Aeropuerto Origen *</label>
                                <input
                                  type="text"
                                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-sm h-10 font-medium"
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
                                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Aeropuerto Destino *</label>
                                <input
                                  type="text"
                                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-sm h-10 font-medium"
                                  placeholder="Ej. AUH"
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

                            {/* Flight details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Código de Vuelo *</label>
                                <input
                                  type="text"
                                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-sm h-10 font-medium"
                                  placeholder="Ej. EY116"
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
                                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Aerolínea *</label>
                                <input
                                  type="text"
                                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-sm h-10 font-medium"
                                  placeholder="Ej. Etihad Airways"
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

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1 bg-white p-2.5 rounded-xl border border-ink-100">
                                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block">Salida</span>
                                <div className="space-y-1 mt-1">
                                  <label className="text-[9px] font-semibold text-ink-400 uppercase tracking-wider">Fecha *</label>
                                  <input
                                    type="date"
                                    className="w-full px-2 py-1 rounded-lg border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-xs h-8"
                                    min={activeTrip.startDate}
                                    max={activeTrip.endDate}
                                    value={leg.departureDate || selectedDate}
                                    onChange={(e) => {
                                      const updated = [...flightLegs];
                                      updated[idx].departureDate = e.target.value;
                                      if (!updated[idx].arrivalDate || updated[idx].arrivalDate < e.target.value) {
                                        updated[idx].arrivalDate = e.target.value;
                                      }
                                      setFlightLegs(updated);
                                    }}
                                    required
                                  />
                                </div>
                                <div className="space-y-1 mt-1">
                                  <label className="text-[9px] font-semibold text-ink-400 uppercase tracking-wider">Hora *</label>
                                  <input
                                    type="time"
                                    className="w-full px-2 py-1 rounded-lg border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-xs h-8"
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

                              <div className="space-y-1 bg-white p-2.5 rounded-xl border border-ink-100">
                                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block">Llegada</span>
                                <div className="space-y-1 mt-1">
                                  <label className="text-[9px] font-semibold text-ink-400 uppercase tracking-wider">Fecha *</label>
                                  <input
                                    type="date"
                                    className="w-full px-2 py-1 rounded-lg border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-xs h-8"
                                    min={leg.departureDate || activeTrip.startDate}
                                    max={activeTrip.endDate}
                                    value={leg.arrivalDate || leg.departureDate || selectedDate}
                                    onChange={(e) => {
                                      const updated = [...flightLegs];
                                      updated[idx].arrivalDate = e.target.value;
                                      setFlightLegs(updated);
                                    }}
                                    required
                                  />
                                </div>
                                <div className="space-y-1 mt-1">
                                  <label className="text-[9px] font-semibold text-ink-400 uppercase tracking-wider">Hora *</label>
                                  <input
                                    type="time"
                                    className="w-full px-2 py-1 rounded-lg border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-white text-xs h-8"
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
                        </div>
                      );
                    })}
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
                        }
                      ]);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 h-10 border border-dashed border-ink-300 hover:border-ink-500 rounded-xl bg-ink-50/25 hover:bg-ink-50/50 text-ink-700 hover:text-ink-800 transition-colors text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Escala / Conexión
                  </button>
                </div>
              )}

              {/* 2. TRASLADO */}
              {actType === 'transfer' && (
                <div className="space-y-4 pt-2 border-t border-ink-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">
                      Medio de Transporte
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23454545%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
                      value={transType}
                      onChange={(e) => setTransType(e.target.value as TransferActivity['transportType'])}
                    >
                      <option value="taxi">Taxi / Coche</option>
                      <option value="bus">Autobús</option>
                      <option value="train">Tren</option>
                      <option value="metro">Metro</option>
                      <option value="walking">Caminando</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Origen</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                        placeholder="Ej. Aeropuerto"
                        value={transOrigin}
                        onChange={(e) => setTransOrigin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Destino</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                        placeholder="Ej. Hotel Canopi"
                        value={transDest}
                        onChange={(e) => setTransDest(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Duración Aprox. (ej: 30 - 45 min)</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. 30 - 45 min"
                      value={transDuration}
                      onChange={(e) => setTransDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Notas / Recomendaciones (Opcional)</label>
                    <textarea
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm font-medium font-sans p-3 min-h-[70px]"
                      placeholder="Ej. Opción 1: Grab (Precio: 250.000-350.000 VND)"
                      rows={2}
                      value={transDescription}
                      onChange={(e) => setTransDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 3. HOTEL */}
              {actType === 'hotel' && (
                <div className="space-y-4 pt-2 border-t border-ink-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Nombre del Hotel / Alojamiento</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. Canopi by Hilton"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Dirección</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. 12 Phan Chu Trinh, Hanoi"
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Fecha Entrada *</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
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
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Fecha Salida *</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                        min={hotelCheckInDate || activeTrip.startDate}
                        max={activeTrip.endDate}
                        value={hotelCheckOutDate}
                        onChange={(e) => setHotelCheckOutDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {hotelCheckInDate && hotelCheckOutDate && (
                    <div className="bg-ink-50/50 border border-ink-100 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-700 uppercase tracking-wider">Duración de la Estancia</span>
                      <span className="text-sm font-extrabold text-ink-900">
                        {getNights(hotelCheckInDate, hotelCheckOutDate)} {getNights(hotelCheckInDate, hotelCheckOutDate) === 1 ? 'noche' : 'noches'}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Check-in (Hora)</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                        placeholder="Ej. 15:00"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Check-out (Hora)</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                        placeholder="Ej. 12:00"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Notas / Recomendaciones (Opcional)</label>
                    <textarea
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm font-medium font-sans p-3 min-h-[70px]"
                      placeholder="Ej. Código de reserva, desayuno incluido, o peticiones especiales..."
                      rows={2}
                      value={hotelDescription}
                      onChange={(e) => setHotelDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 4. EXCURSION */}
              {actType === 'excursion' && (
                <div className="space-y-4 pt-2 border-t border-ink-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Título de la Actividad / Excursión</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. Kayak en Bahía de Halong"
                      value={excursionTitle}
                      onChange={(e) => setExcursionTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Descripción</label>
                    <textarea
                      placeholder="Detalles sobre el punto de encuentro, qué llevar, etc..."
                      className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 h-20 resize-none text-sm font-sans"
                      value={excursionDesc}
                      onChange={(e) => setExcursionDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Duración Aprox. (ej: 4 horas)</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. 4 horas"
                      value={excursionDur}
                      onChange={(e) => setExcursionDur(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 5. FOOD */}
              {actType === 'food' && (
                <div className="space-y-4 pt-2 border-t border-ink-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Nombre del Establecimiento / Restaurante</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 font-medium"
                      placeholder="Ej. Bun Cha Huong Lien"
                      value={foodRestName}
                      onChange={(e) => setFoodRestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider block mb-1">Tipo de Comida</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23454545%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value as FoodActivity['mealType'])}
                    >
                      <option value="breakfast">Desayuno</option>
                      <option value="lunch">Almuerzo</option>
                      <option value="dinner">Cena</option>
                      <option value="snack">Snack / Café</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Descripción o Platos recomendados</label>
                    <textarea
                      placeholder="Ej. Probar el Bun Cha y los rollitos de primavera..."
                      className="w-full px-3 py-2 rounded-xl border border-ink-200 focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900 text-ink-700 bg-ink-50 h-20 resize-none text-sm font-sans"
                      value={foodDesc}
                      onChange={(e) => setFoodDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-ink-100 flex items-center justify-end gap-2 bg-ink-50/50">
              <button 
                type="button"
                className="font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-800 rounded-xl h-10 px-4 text-sm transition-colors cursor-pointer bg-transparent border-0"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="font-semibold wanderlust-primary-button shadow-none bg-ink-900 hover:bg-ink-800 text-white rounded-xl px-5 h-10 text-sm transition-all active:scale-95 cursor-pointer"
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
