'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTravel, Activity, ActivityType, FlightActivity, TransferActivity, HotelActivity, ExcursionActivity, FoodActivity } from '@/context/TravelContext';
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
  Compass,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ViajeDetalle({ params }: PageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const {
    trips,
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

  // Selected Day State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('itinerario');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Activity Form States
  const [actType, setActType] = useState<ActivityType>('flight');
  const [actTime, setActTime] = useState('09:00');
  const [actPrice, setActPrice] = useState('');

  // Type-specific Form States
  const [flightNo, setFlightNo] = useState('');
  const [airline, setAirline] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

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

  const [excursionTitle, setExcursionTitle] = useState('');
  const [excursionDesc, setExcursionDesc] = useState('');
  const [excursionDur, setExcursionDur] = useState('');

  const [foodRestName, setFoodRestName] = useState('');
  const [foodType, setFoodType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [foodDesc, setFoodDesc] = useState('');

  // Notes state
  const [notesText, setNotesText] = useState('');

  // Sync active trip by URL param
  useEffect(() => {
    if (id) {
      setActiveTripById(id);
    }
  }, [id, trips]);

  // Set default selected date and notes once trip loads
  useEffect(() => {
    if (activeTrip) {
      setNotesText(activeTrip.notes || '');
      if (!selectedDate || !getDatesInRange(activeTrip.startDate, activeTrip.endDate).includes(selectedDate)) {
        setSelectedDate(activeTrip.startDate);
      }
    }
  }, [activeTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-2 animate-bounce">
          <Compass className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-extrabold text-slate-400 tracking-widest uppercase">Cargando detalles de tu viaje...</span>
        </div>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 text-slate-500">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Viaje no encontrado</h2>
        <p className="mt-2 text-sm text-slate-400">El viaje que buscas no existe o fue eliminado.</p>
        <Link href="/" className="mt-6">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 font-semibold transition-all active:scale-95 cursor-pointer text-sm shadow-md">
            Volver a Mis Viajes
          </button>
        </Link>
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

  const tripDates = getDatesInRange(activeTrip.startDate, activeTrip.endDate);

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
  const dayActivities = activeTrip.activities.filter((act) => act.date === selectedDate);

  const getDayCostByCategory = (category: 'transport' | 'activities' | 'hotel' | 'food') => {
    return dayActivities
      .filter((act) => {
        if (category === 'transport') return act.type === 'flight' || act.type === 'transfer';
        if (category === 'activities') return act.type === 'excursion';
        if (category === 'hotel') return act.type === 'hotel';
        if (category === 'food') return act.type === 'food';
        return false;
      })
      .reduce((sum, act) => sum + act.price, 0);
  };

  // Calculations for whole trip
  const totalTripSpent = activeTrip.activities.reduce((sum, act) => sum + act.price, 0);
  const budgetProgress = Math.min((totalTripSpent / activeTrip.budget) * 100, 100);

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
            className="text-indigo-600 hover:text-indigo-850 font-bold underline break-all font-sans"
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
    setFlightNo('');
    setAirline('');
    setOrigin('');
    setDestination('');
    setArrivalTime('');
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
      setFlightNo(f.flightNumber);
      setAirline(f.airline);
      setOrigin(f.origin);
      setDestination(f.destination);
      setArrivalTime(f.arrivalTime);
    } else if (act.type === 'transfer') {
      const t = act as TransferActivity;
      setTransType(t.transportType);
      setTransOrigin(t.origin);
      setTransDest(t.destination);
      setTransDuration(t.duration);
      setTransDescription((t as any).description || '');
    } else if (act.type === 'hotel') {
      const h = act as HotelActivity;
      setHotelName(h.hotelName);
      setHotelAddress(h.address);
      setHotelCheckIn(h.checkIn);
      setHotelCheckOut(h.checkOut);
      setHotelDescription(h.description || '');
    } else if (act.type === 'excursion') {
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
    if (!actTime) {
      alert('Por favor, indica la hora.');
      return;
    }

    const priceNum = parseFloat(actPrice);
    
    // Construct activity object
    let activityData: any = {
      type: actType,
      date: selectedDate,
      time: actTime,
      price: isNaN(priceNum) ? 0 : priceNum,
    };

    if (actType === 'flight') {
      activityData = {
        ...activityData,
        flightNumber: flightNo || 'S/N',
        airline: airline || 'Aerolínea',
        origin: origin || 'Origen',
        destination: destination || 'Destino',
        arrivalTime: arrivalTime || '12:00',
      };
    } else if (actType === 'transfer') {
      activityData = {
        ...activityData,
        transportType: transType,
        origin: transOrigin || 'Origen',
        destination: transDest || 'Destino',
        duration: transDuration || '15 min',
        description: transDescription || '',
      };
    } else if (actType === 'hotel') {
      activityData = {
        ...activityData,
        hotelName: hotelName || 'Hotel',
        address: hotelAddress || 'Dirección',
        checkIn: hotelCheckIn || '15:00',
        checkOut: hotelCheckOut || '12:00',
        description: hotelDescription || '',
      };
    } else if (actType === 'excursion') {
      activityData = {
        ...activityData,
        title: excursionTitle || 'Excursión',
        description: excursionDesc || '',
        duration: excursionDur || '2 horas',
      };
    } else if (actType === 'food') {
      activityData = {
        ...activityData,
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
    <div className="flex-1 pb-16 bg-slate-50">
      {/* Dynamic Header Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeTrip.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
          alt={activeTrip.name}
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
        
        {/* Top bar over banner */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Link href="/">
            <button
              className="bg-white/95 text-slate-800 border border-slate-100 hover:bg-slate-100 shadow-lg min-w-10 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-all active:scale-95"
              title="Volver a mis viajes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Usuario</span>
                <span className="text-xs font-bold text-indigo-300 drop-shadow-md">{user.email}</span>
              </div>
            )}
            {user && <div className="w-px h-6 bg-white/20 hidden sm:block"></div>}
            {user && (
              <button
                onClick={logout}
                className="bg-slate-900/80 hover:bg-red-600/90 text-white border border-white/10 hover:border-transparent px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md active:scale-95 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            )}
            <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10">
              {tripDates.length} {tripDates.length === 1 ? 'Día' : 'Días'}
            </span>
          </div>
        </div>

        {/* Floating Destination Info */}
        <div className="absolute bottom-5 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="text-white">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md font-sans">
              {activeTrip.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-slate-300 text-sm">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">
                {formatDateLabel(activeTrip.startDate).day} {formatDateLabel(activeTrip.startDate).month}
                {' -> '}
                {formatDateLabel(activeTrip.endDate).day} {formatDateLabel(activeTrip.endDate).month} de {activeTrip.endDate.split('-')[0]}
              </span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-white min-w-[150px] md:min-w-[200px] text-left md:text-right self-start md:self-auto w-fit md:w-auto">
            <p className="text-xs uppercase tracking-wider text-cyan-300 font-semibold">Presupuesto del Viaje</p>
            <p className="text-2xl font-black mt-0.5">{formatCurrency(activeTrip.budget)}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Custom Tab Switcher */}
        <div className="flex gap-6 border-b border-slate-200 mb-8">
          {[
            { id: 'itinerario', label: 'Itinerario' },
            { id: 'descripcion', label: 'Descripción' },
            { id: 'detalles', label: 'Detalles' },
            { id: 'notas', label: 'Notas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div>
          
          {/* TAB 1: ITINERARIO */}
          {activeTab === 'itinerario' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Timeline list & Selector (Left / center, 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Horizontal Day Selector */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                    Días del viaje
                  </h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                    {tripDates.map((date, idx) => {
                      const active = selectedDate === date;
                      const { day, month } = formatDateLabel(date);
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center justify-center min-w-[70px] h-[75px] rounded-xl border transition-all ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85">
                            Día {idx + 1}
                          </span>
                          <span className="text-lg font-black leading-tight mt-0.5">{day}</span>
                          <span className="text-[10px] font-medium uppercase">{month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Activities List */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 font-sans">Plan del Día</h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        {dayActivities.length === 0 ? 'Sin actividades programadas' : `${dayActivities.length} actividades planificadas`}
                      </p>
                    </div>
                    <button
                      id="btn-add-activity"
                      className="font-semibold shadow-md shadow-indigo-500/10 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl h-10 px-4 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-sm font-sans"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Elemento
                    </button>
                  </div>

                  {/* Vertical Timeline */}
                  {dayActivities.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Clock className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
                      <h4 className="font-bold text-slate-600 font-sans">No hay nada planeado para hoy</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed font-sans">
                        Añade vuelos, traslados, hoteles o excursiones para dar forma a tu itinerario diario.
                      </p>
                      <button
                        className="mt-4 font-semibold border border-indigo-100 rounded-xl bg-indigo-50 text-indigo-700 h-9 px-3.5 hover:bg-indigo-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                        onClick={handleOpenAdd}
                      >
                        Añadir mi primer elemento
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 pl-5 sm:pl-6 ml-2.5 sm:ml-4 space-y-6 sm:space-y-8 py-2">
                      {dayActivities.map((act) => {
                        // Icon mapping
                        const iconMap = {
                          flight: <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />,
                          transfer: <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600" />,
                          hotel: <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600" />,
                          excursion: <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
                          food: <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />,
                        };
                        
                        // Color mapping
                        const borderMap = {
                          flight: 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/20',
                          transfer: 'border-cyan-100 hover:border-cyan-300 bg-cyan-50/20',
                          hotel: 'border-pink-100 hover:border-pink-300 bg-pink-50/20',
                          excursion: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20',
                          food: 'border-amber-100 hover:border-amber-300 bg-amber-50/20',
                        };

                        const badgeMap = {
                          flight: <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Vuelo</span>,
                          transfer: <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">Traslado</span>,
                          hotel: <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-pink-100 text-pink-700 border border-pink-200">Hotel</span>,
                          excursion: <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Actividad</span>,
                          food: <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Comida</span>,
                        };

                        return (
                          <div key={act.id} className="relative group/item">
                            
                            {/* Dot element on left timeline */}
                            <div className="absolute -left-[31px] sm:-left-[37px] top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-white border border-slate-100 shadow-md z-10 transition-transform group-hover/item:scale-110">
                              {iconMap[act.type]}
                            </div>

                            {/* Card Content */}
                            <div className={`border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden rounded-2xl bg-white ${borderMap[act.type]}`}>
                              <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  
                                  {/* Badge / Type & Time info */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1 font-sans">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {act.time}
                                    </span>
                                    {badgeMap[act.type]}
                                    {act.price > 0 && (
                                      <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                                        {formatCurrency(act.price)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Flight rendering */}
                                  {act.type === 'flight' && (
                                    <div>
                                      <h4 className="text-base font-bold text-slate-800 font-sans">
                                        Vuelo {(act as FlightActivity).flightNumber} - {(act as FlightActivity).airline}
                                      </h4>
                                      <div className="flex items-center gap-3 text-sm text-slate-600 mt-1 font-medium bg-white/60 p-2 rounded-lg border border-slate-100/50 max-w-fit flex-wrap">
                                        <span className="font-bold text-slate-700">{(act as FlightActivity).origin}</span>
                                        <span className="text-xs text-slate-400 font-sans">
                                          (Salida: {act.time})
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                        <span className="font-bold text-slate-700">{(act as FlightActivity).destination}</span>
                                        <span className="text-xs text-slate-400 font-sans">
                                          (Llegada: {(act as FlightActivity).arrivalTime})
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Transfer rendering */}
                                  {act.type === 'transfer' && (
                                    <div>
                                      <h4 className="text-base font-bold text-slate-800 font-sans">
                                        Traslado en {
                                          (act as TransferActivity).transportType === 'taxi' ? 'Taxi' :
                                          (act as TransferActivity).transportType === 'bus' ? 'Autobús' :
                                          (act as TransferActivity).transportType === 'train' ? 'Tren' :
                                          (act as TransferActivity).transportType === 'metro' ? 'Metro' :
                                          (act as TransferActivity).transportType === 'walking' ? 'Caminando' : 'Otro'
                                        }
                                      </h4>
                                      <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{(act as TransferActivity).origin} {' -> '} {(act as TransferActivity).destination}</span>
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1 bg-white/60 px-2 py-1 rounded border border-slate-100/50 max-w-fit font-sans">
                                        Duración: {(act as TransferActivity).duration}
                                      </p>
                                      {/* Custom transfer description */}
                                      {(act as any).description && (
                                        <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed font-sans italic bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50 border-dashed break-words">
                                          {renderDescriptionWithLinks((act as any).description)}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Hotel rendering */}
                                  {act.type === 'hotel' && (
                                    <div>
                                      <h4 className="text-base font-bold text-slate-800 font-sans">
                                        Alojamiento en {(act as HotelActivity).hotelName}
                                      </h4>
                                      <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{(act as HotelActivity).address}</span>
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-medium font-sans">
                                        <span className="text-slate-400">Check-in: <strong className="text-slate-600">{(act as HotelActivity).checkIn}</strong></span>
                                        <span className="text-slate-400">Check-out: <strong className="text-slate-600">{(act as HotelActivity).checkOut}</strong></span>
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((act as HotelActivity).address)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 rounded-lg px-2.5 py-1 transition-all font-bold hover:scale-[1.02] active:scale-[0.98] cursor-pointer ml-auto sm:ml-0"
                                        >
                                          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                          <span>Cómo llegar</span>
                                        </a>
                                      </div>
                                      {/* Custom hotel description/notes */}
                                      {(act as HotelActivity).description && (
                                        <p className="text-sm text-slate-500 mt-2.5 max-w-lg leading-relaxed font-sans italic bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50 border-dashed break-words">
                                          {renderDescriptionWithLinks((act as HotelActivity).description || '')}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Excursion rendering */}
                                  {act.type === 'excursion' && (
                                    <div>
                                      <h4 className="text-base font-bold text-slate-800 font-sans">
                                        {(act as ExcursionActivity).title}
                                      </h4>
                                      {(act as ExcursionActivity).description && (
                                        <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed font-sans break-words">
                                          {renderDescriptionWithLinks((act as ExcursionActivity).description)}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-400 mt-1.5 bg-white/60 px-2 py-1 rounded border border-slate-100/50 max-w-fit font-sans">
                                        Duración: {(act as ExcursionActivity).duration}
                                      </p>
                                    </div>
                                  )}

                                  {/* Food rendering */}
                                  {act.type === 'food' && (
                                    <div>
                                      <h4 className="text-base font-bold text-slate-800 font-sans">
                                        Comida: {(act as FoodActivity).restaurantName}
                                      </h4>
                                      <div className="flex gap-2 items-center mt-1">
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-800 capitalize">
                                          {
                                            (act as FoodActivity).mealType === 'breakfast' ? 'Desayuno' :
                                            (act as FoodActivity).mealType === 'lunch' ? 'Almuerzo' :
                                            (act as FoodActivity).mealType === 'dinner' ? 'Cena' : 'Snack'
                                          }
                                        </span>
                                      </div>
                                      {(act as FoodActivity).description && (
                                        <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed font-sans break-words">
                                          {renderDescriptionWithLinks((act as FoodActivity).description)}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                </div>

                                {/* Actions */}
                                <div className="flex flex-row md:flex-col items-center justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 md:border-l border-slate-100 md:pl-4 min-w-[70px]">
                                  <button
                                    className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                    onClick={() => handleOpenEdit(act)}
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que quieres eliminar esta actividad del itinerario?')) {
                                        deleteActivity(activeTrip.id, act.id);
                                      }
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 font-sans">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Gastos del Día (Por Persona)
                  </h3>
                  
                  {/* Category boxes */}
                  <div className="space-y-3">
                    
                    {/* Transporte Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-rose-100/50">
                          <Car className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-rose-600 block">Transporte</span>
                          <span className="text-[10px] text-slate-400">Vuelos y traslados</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 font-sans">
                        {formatCurrency(getDayCostByCategory('transport'))}
                      </span>
                    </div>

                    {/* Actividades Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100/50">
                          <Map className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 block">Actividades</span>
                          <span className="text-[10px] text-slate-400">Excursiones y visitas</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 font-sans">
                        {formatCurrency(getDayCostByCategory('activities'))}
                      </span>
                    </div>

                    {/* Comida Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-amber-100 bg-amber-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100/50">
                          <Utensils className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-amber-600 block">Comida</span>
                          <span className="text-[10px] text-slate-400">Restaurantes y snacks</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 font-sans">
                        {formatCurrency(getDayCostByCategory('food'))}
                      </span>
                    </div>

                    {/* Alojamiento Box */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-pink-100 bg-pink-50/35">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-pink-100/50">
                          <Bed className="w-4 h-4 text-pink-500" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-pink-600 block">Alojamiento</span>
                          <span className="text-[10px] text-slate-400">Hoteles del día</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-700 font-sans">
                        {formatCurrency(getDayCostByCategory('hotel'))}
                      </span>
                    </div>

                  </div>

                  {/* Total Day Cost Indicator */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Total del día</span>
                    <span className="text-lg font-black text-indigo-600 font-sans">
                      {formatCurrency(
                        getDayCostByCategory('transport') +
                        getDayCostByCategory('activities') +
                        getDayCostByCategory('food') +
                        getDayCostByCategory('hotel')
                      )}
                    </span>
                  </div>

                </div>

                {/* General Budget Progress Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 font-sans">
                    <Euro className="w-5 h-5 text-cyan-500" />
                    Gastos Acumulados
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end font-sans">
                      <span className="text-xs font-semibold text-slate-500">Progreso del presupuesto</span>
                      <span className="text-sm font-black text-slate-700">
                        {formatCurrency(totalTripSpent)} / {formatCurrency(activeTrip.budget)}
                      </span>
                    </div>
                    {/* Custom progress bar to replace HeroUI progress */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${budgetProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wide font-sans">
                      <span>Restante:</span>
                      <span className={activeTrip.budget - totalTripSpent < 0 ? 'text-red-500 font-bold' : 'text-slate-600'}>
                        {formatCurrency(activeTrip.budget - totalTripSpent)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DESCRIPCIÓN */}
          {activeTab === 'descripcion' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 font-sans">Sobre este viaje</h2>
                <p className="text-slate-600 mt-4 leading-relaxed text-base whitespace-pre-line font-sans">
                  {activeTrip.description || 'Aún no se ha añadido una descripción para este viaje. ¡Edita tu viaje para añadir detalles del itinerario!'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 font-sans">Métricas del Viaje</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Días Totales</span>
                    <p className="text-2xl font-black text-slate-800 mt-1 font-sans">{tripDates.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Actividades</span>
                    <p className="text-2xl font-black text-slate-800 mt-1 font-sans">{activeTrip.activities.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Gasto Total</span>
                    <p className="text-2xl font-black text-indigo-600 mt-1 font-sans">{formatCurrency(totalTripSpent)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Promedio Diario</span>
                    <p className="text-2xl font-black text-cyan-600 mt-1 font-sans">
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
              <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 font-sans">Desglose de Gastos</h3>
                <div className="space-y-4">
                  
                  {/* Transport */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Transporte</span>
                      <span>{formatCurrency(totalTransport)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${totalTripSpent > 0 ? (totalTransport / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Alojamiento</span>
                      <span>{formatCurrency(totalHotels)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500" style={{ width: `${totalTripSpent > 0 ? (totalHotels / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Excursions */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Actividades</span>
                      <span>{formatCurrency(totalActivities)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${totalTripSpent > 0 ? (totalActivities / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Food */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Comida</span>
                      <span>{formatCurrency(totalFood)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${totalTripSpent > 0 ? (totalFood / totalTripSpent) * 100 : 0}%` }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right cols: List of all key elements (Flights & Accommodation summary) */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 font-sans">Vuelos y Hoteles Reservados</h3>
                
                {/* Hotels list */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5 font-sans">
                    <Bed className="w-4 h-4 text-pink-500" />
                    Hoteles / Alojamientos
                  </h4>
                  {activeTrip.activities.filter(a => a.type === 'hotel').length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 border-dashed font-sans">
                      No hay hoteles reservados en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeTrip.activities.filter(a => a.type === 'hotel').map(a => {
                        const h = a as HotelActivity;
                        return (
                          <div key={h.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-slate-700 font-sans">{h.hotelName}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-xs text-slate-400 font-sans">{h.address}</p>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-0.5 hover:underline"
                                  title="Cómo llegar"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Cómo llegar</span>
                                </a>
                              </div>
                            </div>
                            <div className="text-right font-sans">
                              <span className="text-xs font-semibold text-slate-400">{h.date}</span>
                              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatCurrency(h.price)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Flights list */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5 font-sans">
                    <Plane className="w-4 h-4 text-indigo-500" />
                    Vuelos Registrados
                  </h4>
                  {activeTrip.activities.filter(a => a.type === 'flight').length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 border-dashed font-sans">
                      No hay vuelos en el itinerario.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeTrip.activities.filter(a => a.type === 'flight').map(a => {
                        const f = a as FlightActivity;
                        return (
                          <div key={f.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 font-sans">{f.flightNumber}</span>
                                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-100">{f.airline}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 font-medium font-sans">{f.origin} {' -> '} {f.destination}</p>
                            </div>
                            <div className="text-right font-sans">
                              <span className="text-xs font-semibold text-slate-400">{f.date} ({f.time})</span>
                              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatCurrency(f.price)}</p>
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-800 font-sans">Notas de Viaje</h3>
                </div>
                <button
                  className="font-semibold shadow-md shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-4 flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs"
                  onClick={handleSaveNotes}
                >
                  Guardar Notas
                </button>
              </div>

              <textarea
                placeholder="Escribe aquí cualquier detalle crucial de tu viaje: seguros médicos, alquileres de coches, teléfonos de emergencia, números de pasaporte..."
                className="w-full min-h-[350px] p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50/50 leading-relaxed font-sans text-sm resize-y"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 text-right italic font-medium font-sans">
                * Haz clic en "Guardar Notas" para guardar tus cambios permanentemente en el navegador.
              </p>
            </div>
          )}

        </div>

      </main>

      {/* Custom Modal: Agregar / Editar Actividad */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-sans">
                <Plus className="text-indigo-500 w-6 h-6" />
                {editingActivity ? 'Editar Actividad' : 'Añadir Actividad'}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Select Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Tipo de Elemento
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
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
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hora *</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo (en Euros, ej: 45 para 45 €) (Opcional)</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">€</span>
                    <input
                      type="number"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
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
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Código de Vuelo</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. H389"
                        value={flightNo}
                        onChange={(e) => setFlightNo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aerolínea</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. Avianca"
                        value={airline}
                        onChange={(e) => setAirline(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aeropuerto Origen</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. MAD"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aeropuerto Destino</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. HAN"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hora Estimada de Llegada</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 2. TRASLADO */}
              {actType === 'transfer' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Medio de Transporte
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
                      value={transType}
                      onChange={(e) => setTransType(e.target.value as any)}
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
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Origen</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. Aeropuerto"
                        value={transOrigin}
                        onChange={(e) => setTransOrigin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Destino</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. Hotel Canopi"
                        value={transDest}
                        onChange={(e) => setTransDest(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración Aprox. (ej: 30 - 45 min)</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. 30 - 45 min"
                      value={transDuration}
                      onChange={(e) => setTransDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas / Recomendaciones (Opcional)</label>
                    <textarea
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm font-medium font-sans p-3 min-h-[70px]"
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
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Hotel / Alojamiento</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. Canopi by Hilton"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dirección</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. 12 Phan Chu Trinh, Hanoi"
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in (Hora)</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. 15:00"
                        value={hotelCheckIn}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-out (Hora)</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                        placeholder="Ej. 12:00"
                        value={hotelCheckOut}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas / Recomendaciones (Opcional)</label>
                    <textarea
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm font-medium font-sans p-3 min-h-[70px]"
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
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Título de la Actividad / Excursión</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. Kayak en Bahía de Halong"
                      value={excursionTitle}
                      onChange={(e) => setExcursionTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</label>
                    <textarea
                      placeholder="Detalles sobre el punto de encuentro, qué llevar, etc..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 h-20 resize-none text-sm font-sans"
                      value={excursionDesc}
                      onChange={(e) => setExcursionDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración Aprox. (ej: 4 horas)</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. 4 horas"
                      value={excursionDur}
                      onChange={(e) => setExcursionDur(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 5. FOOD */}
              {actType === 'food' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Establecimiento / Restaurante</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 font-medium"
                      placeholder="Ej. Bun Cha Huong Lien"
                      value={foodRestName}
                      onChange={(e) => setFoodRestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tipo de Comida</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_0.75rem] bg-[right_0.75rem_center] bg-no-repeat pr-8"
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value as any)}
                    >
                      <option value="breakfast">Desayuno</option>
                      <option value="lunch">Almuerzo</option>
                      <option value="dinner">Cena</option>
                      <option value="snack">Snack / Café</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción o Platos recomendados</label>
                    <textarea
                      placeholder="Ej. Probar el Bun Cha y los rollitos de primavera..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 h-20 resize-none text-sm font-sans"
                      value={foodDesc}
                      onChange={(e) => setFoodDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button 
                type="button"
                className="font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl h-10 px-4 text-sm transition-colors cursor-pointer bg-transparent border-0" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="font-semibold shadow-md shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 text-sm transition-all active:scale-95 cursor-pointer" 
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
