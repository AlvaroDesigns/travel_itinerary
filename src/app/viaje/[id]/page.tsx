'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useTravel,
  Activity,
  ActivityType,
  FlightActivity,
  TransferActivity,
  HotelActivity,
  ExcursionActivity,
  FoodActivity,
  Trip,
} from '@/context/TravelContext';
import { DashboardShell } from '@/components/DashboardShell';
import { WanderlustLoader } from '@/components/WanderlustLoader';
import { HeroUIDateRangePicker } from '@/components/HeroUIDateRangePicker';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Plane,
  Car,
  Bed,
  MapPin,
  Utensils,
  Clock,
  Sparkles,
  Settings,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  GripVertical,
  Type,
  Heading,
  Route,
  ListOrdered,
  DollarSign,
  Paperclip,
  CalendarCheck,
  Ship,
  Train,
  Info,
  Layers,
  Save,
  FileText,
  Users,
  Palette,
  Globe,
  X,
  Copy,
  Check,
  Undo2,
  Redo2,
  Upload,
  Eye,
  Download,
  Luggage,
  ShieldCheck,
  CreditCard,
  Building,
  Navigation,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Phone,
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  MessageSquare,
  Send,
  Mic,
  Maximize2,
  Minimize2,
  Bot,
  UserCheck,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export type BlockType =
  | 'text'
  | 'title'
  | 'itinerary'
  | 'services_summary'
  | 'price'
  | 'file'
  | 'booking'
  | 'hotel'
  | 'flight'
  | 'activity'
  | 'food'
  | 'cruise'
  | 'transport'
  | 'train'
  | 'info';

export interface EditorBlock {
  id: string;
  type: BlockType;
  title?: string;
  content?: string;
  data?: Record<string, any>;
}

const AIRLINE_PREFIX_MAP: Record<string, string> = {
  FR: 'Ryanair',
  IB: 'Iberia',
  I2: 'Iberia Express',
  UX: 'Air Europa',
  VY: 'Vueling',
  EY: 'Etihad Airways',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  LH: 'Lufthansa',
  AF: 'Air France',
  BA: 'British Airways',
  KL: 'KLM',
  U2: 'easyJet',
  EZY: 'easyJet',
  EZS: 'easyJet',
  TP: 'TAP Air Portugal',
  AZ: 'ITA Airways',
  ITY: 'ITA Airways',
  DL: 'Delta Air Lines',
  AA: 'American Airlines',
  UA: 'United Airlines',
  TK: 'Turkish Airlines',
  AV: 'Avianca',
  LA: 'LATAM Airlines',
  LX: 'Swiss International Air Lines',
  OS: 'Austrian Airlines',
  SN: 'Brussels Airlines',
  SK: 'SAS',
  AY: 'Finnair',
  W6: 'Wizz Air',
  WZZ: 'Wizz Air',
  TO: 'Transavia',
  HV: 'Transavia',
  NT: 'Binter Canarias',
  YW: 'Air Nostrum',
  V7: 'Volotea',
  NO: 'Neos',
  SQ: 'Singapore Airlines',
  CX: 'Cathay Pacific',
  JL: 'Japan Airlines',
  NH: 'ANA',
};

function detectAirlineFromFlightNumber(flightNum?: string): string | null {
  if (!flightNum) return null;
  const clean = flightNum.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return null;

  // 1. Try 3-character ICAO code first (e.g. EZY, WZZ, ITY)
  if (clean.length >= 3) {
    const p3 = clean.slice(0, 3);
    if (AIRLINE_PREFIX_MAP[p3]) {
      return AIRLINE_PREFIX_MAP[p3];
    }
  }

  // 2. Try 2-character IATA code (e.g. FR, IB, I2, U2, VY, UX, LH, AF, BA, EK, etc.)
  if (clean.length >= 2) {
    const p2 = clean.slice(0, 2);
    if (AIRLINE_PREFIX_MAP[p2]) {
      return AIRLINE_PREFIX_MAP[p2];
    }
  }

  return null;
}

function getAirlineIataCode(flightNum?: string, airlineName?: string): string | null {
  if (flightNum) {
    const clean = flightNum.trim().toUpperCase().replace(/\s+/g, '');
    if (clean.length >= 3 && AIRLINE_PREFIX_MAP[clean.slice(0, 3)]) {
      const p3 = clean.slice(0, 3);
      return p3.length === 2 ? p3 : p3.slice(0, 2);
    }
    if (clean.length >= 2 && AIRLINE_PREFIX_MAP[clean.slice(0, 2)]) {
      return clean.slice(0, 2);
    }
    const match = clean.match(/^([A-Z0-9]{2})/);
    if (match) return match[1];
  }
  if (airlineName) {
    const lower = airlineName.toLowerCase();
    for (const [code, name] of Object.entries(AIRLINE_PREFIX_MAP)) {
      if (name.toLowerCase() === lower || lower.includes(name.toLowerCase())) {
        return code.length === 2 ? code : code.slice(0, 2);
      }
    }
  }
  return null;
}

function getAirlineLogoUrl(flightNum?: string, airlineName?: string): string | null {
  const code = getAirlineIataCode(flightNum, airlineName);
  if (!code) return null;
  return `https://cdn.logitravel.com/webmobile/vuelos/images/logo_${code.toUpperCase()}.png`;
}

const ACTIVITY_MODAL_IMAGES: Record<string, string> = {
  flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
  excursion: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
  food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  transfer: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=80',
};

function ModalIconPreview({
  customUrl,
  type,
  flightNumber,
  airline,
}: {
  customUrl?: string;
  type: ActivityType;
  flightNumber?: string;
  airline?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [customUrl]);

  const trimmed = customUrl?.trim();
  const flightLogo = type === 'flight' ? getAirlineLogoUrl(flightNumber, airline) : null;
  const effectiveSrc = !hasError && (trimmed || flightLogo);

  if (effectiveSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={effectiveSrc}
        alt="Icono"
        className="h-full w-full object-contain p-0.5"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center text-[#009688]">
      {type === 'flight' && <Plane className="h-4 w-4" />}
      {type === 'hotel' && <Bed className="h-4 w-4" />}
      {type === 'excursion' && <MapPin className="h-4 w-4" />}
      {type === 'food' && <Utensils className="h-4 w-4" />}
      {type === 'transfer' && <Car className="h-4 w-4" />}
    </div>
  );
}

function ActivityCardIcon({ act, isDraft }: { act: Activity; isDraft: boolean }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [act.customIconUrl, act.type]);

  const customUrl = act.customIconUrl?.trim();
  const flightLogo = act.type === 'flight' ? getAirlineLogoUrl(act.flightNumber, act.airline) : null;
  const effectiveSrc = !hasError && (customUrl || flightLogo);

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden transition-transform ${
        effectiveSrc
          ? 'bg-white border border-slate-100 shadow-2xs p-1'
          : isDraft
          ? 'bg-amber-100 text-amber-700'
          : 'bg-[#e0f2f1] text-[#009688]'
      }`}
    >
      {effectiveSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effectiveSrc}
          alt={act.type}
          className="h-full w-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <>
          {act.type === 'flight' && <Plane className="h-5 w-5" />}
          {act.type === 'hotel' && <Bed className="h-5 w-5" />}
          {act.type === 'excursion' && <MapPin className="h-5 w-5" />}
          {act.type === 'food' && <Utensils className="h-5 w-5" />}
          {act.type === 'transfer' && <Car className="h-5 w-5" />}
        </>
      )}
    </div>
  );
}

function getTripCode(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let n = Math.abs(hash) + 12345678;
  for (let i = 0; i < 10; i++) {
    result += chars[n % chars.length];
    n = Math.floor(n / chars.length) + (i * 7 + 11);
  }
  return result;
}

interface SuggestedActionItem {
  id?: string;
  type: ActivityType;
  label: string;
  date?: string;
  payload: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedAction?: SuggestedActionItem;
  suggestedActions?: SuggestedActionItem[];
}

export default function ViajeDetalle({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const {
    activeTrip,
    setActiveTripById,
    updateTrip,
    addActivity,
    updateActivity,
    deleteActivity,
    isLoading,
  } = useTravel();

  const router = useRouter();

  // Right Panel State (Bloques FIRST by default, then Agente IA)
  const [rightPanelTab, setRightPanelTab] = useState<'blocks' | 'agent'>('blocks');

  // Itinerary View Mode: 'day' (per-day tab view) vs 'all' (full trip continuous view)
  const [itineraryViewMode, setItineraryViewMode] = useState<'day' | 'all'>('day');

  // Load saved itinerary view mode from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('travel_itinerary_view_mode') as 'day' | 'all' | null;
      if (savedMode === 'day' || savedMode === 'all') {
        setItineraryViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage errors (e.g. incognito/restricted)
    }
  }, []);

  const changeItineraryViewMode = (mode: 'day' | 'all') => {
    setItineraryViewMode(mode);
    try {
      localStorage.setItem('travel_itinerary_view_mode', mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Drag and Drop States
  const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverDayDate, setDragOverDayDate] = useState<string | null>(null);
  const [targetModalDate, setTargetModalDate] = useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Trip Header Edit State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tripTitleInput, setTripTitleInput] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(2500);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Day in Itinerary
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');

  // Delete Activity Confirmation Dialog State
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // Activity Edit Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('flight');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Activity Form Fields
  const [actTime, setActTime] = useState('10:00');
  const [actPrice, setActPrice] = useState<number>(0);
  const [actDescription, setActDescription] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('14:00');
  const [hotelCheckOut, setHotelCheckOut] = useState('11:00');
  const [hotelCheckoutDate, setHotelCheckoutDate] = useState('');
  const [excursionTitle, setExcursionTitle] = useState('');
  const [excursionDesc, setExcursionDesc] = useState('');
  const [excursionDuration, setExcursionDuration] = useState('3 horas');
  const [restaurantName, setRestaurantName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [transferType, setTransferType] = useState<'taxi' | 'bus' | 'train' | 'metro' | 'walking' | 'other'>('taxi');
  const [transferOrigin, setTransferOrigin] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferDuration, setTransferDuration] = useState('45 min');
  const [customIconUrl, setCustomIconUrl] = useState('');

  // Address / Location Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<{ title: string; subtitle: string; full: string }[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [activeAddressField, setActiveAddressField] = useState<'hotelAddress' | 'transferOrigin' | 'transferDest' | null>(null);
  const addressSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchAddress = (
    value: string,
    field: 'hotelAddress' | 'transferOrigin' | 'transferDest'
  ) => {
    setActiveAddressField(field);
    if (field === 'hotelAddress') setHotelAddress(value);
    else if (field === 'transferOrigin') setTransferOrigin(value);
    else if (field === 'transferDest') setTransferDest(value);

    if (addressSearchTimeoutRef.current) {
      clearTimeout(addressSearchTimeoutRef.current);
    }

    const clean = value.trim();
    if (clean.length < 2) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    addressSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=5&lang=es`);
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const list = data.features.map((f: any) => {
              const p = f.properties || {};
              const streetName = p.street ? (p.street + (p.housenumber ? ` ${p.housenumber}` : '')) : (p.name || '');
              const details = [p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
              const full = [streetName || p.name, details].filter(Boolean).join(', ');
              return {
                title: streetName || p.name || full,
                subtitle: details,
                full: full || p.name || clean,
              };
            });
            setAddressSuggestions(list);
            setShowAddressSuggestions(true);
            setIsSearchingAddress(false);
            return;
          }
        }

        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'es' } }
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            const list = nomData.map((item: any) => {
              const parts = (item.display_name || '').split(', ');
              const title = parts.slice(0, 2).join(', ');
              const subtitle = parts.slice(2).join(', ');
              return {
                title: title || item.display_name,
                subtitle: subtitle,
                full: item.display_name,
              };
            });
            setAddressSuggestions(list);
            setShowAddressSuggestions(true);
          }
        }
      } catch {
        // Fallback silently
      } finally {
        setIsSearchingAddress(false);
      }
    }, 280);
  };

  const handleSelectAddressSuggestion = (item: { title: string; subtitle: string; full: string }) => {
    const chosenTitle = item.title || item.full;
    if (activeAddressField === 'hotelAddress') {
      setHotelAddress(item.full || chosenTitle);
    } else if (activeAddressField === 'transferOrigin') {
      setTransferOrigin(chosenTitle);
    } else if (activeAddressField === 'transferDest') {
      setTransferDest(chosenTitle);
    }
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setActiveAddressField(null);
  };

  const handleAddressChange = (value: string) => {
    handleSearchAddress(value, 'hotelAddress');
  };

  // AI Agent Chat State
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [appliedActionKeys, setAppliedActionKeys] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'agent',
      text: '¡Hola! Soy tu asistente de viaje Wanderlust. Puedo sugerirte hoteles de lujo, vuelos, restaurantes locales y generar itinerarios para cada día.',
      timestamp: 'Ahora',
    },
    {
      id: 'msg-2',
      sender: 'agent',
      text: '¿En qué te puedo ayudar hoy? Puedes pedirme por ejemplo: "Añadir un restaurante típico para cenar" o "Buscar excursión en catamarán".',
      timestamp: 'Ahora',
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load Active Trip
  useEffect(() => {
    setActiveTripById(id);
  }, [id, setActiveTripById]);

  useEffect(() => {
    if (activeTrip) {
      setTripTitleInput(activeTrip.name);
      if (!selectedDayDate) {
        setSelectedDayDate(activeTrip.startDate);
      }
    }
  }, [activeTrip, selectedDayDate]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAgentThinking]);

  if (isLoading || !activeTrip) {
    return <WanderlustLoader />;
  }

  const tripCode = getTripCode(activeTrip.id);

  // Local date parser to avoid UTC timezone offsets
  const parseLocalDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
    return new Date(dateStr);
  };

  // Generate Date Range Days without timezone shifts
  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates: string[] = [];
    const curr = parseLocalDate(startDate);
    const last = parseLocalDate(endDate);
    if (isNaN(curr.getTime()) || isNaN(last.getTime())) return [startDate];
    while (curr <= last) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      curr.setDate(curr.getDate() + 1);
    }
    return dates.length > 0 ? dates : [startDate];
  };

  const tripDates = getDatesBetween(activeTrip.startDate, activeTrip.endDate);
  const activeDate = tripDates.includes(selectedDayDate) ? selectedDayDate : tripDates[0];

  // Helper date formatters
  const formatDayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  const getDayIndex = (dateStr: string) => {
    const idx = tripDates.indexOf(dateStr);
    return idx >= 0 ? idx + 1 : 1;
  };

  const formatDayFullLabel = (dateStr: string) => {
    try {
      const d = parseLocalDate(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
      const capitalizedWd = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${capitalizedWd}, ${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

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

  // Activities for selected day (including check-out reminders for accommodations)
  const dayActivities: Activity[] = [];
  if (activeTrip?.activities) {
    activeTrip.activities.forEach((act) => {
      if (act.date === activeDate) {
        dayActivities.push(act);
      }
      if (act.type === 'hotel') {
        let checkoutDay = act.checkoutDate ? act.checkoutDate.trim() : '';
        if (!checkoutDay || checkoutDay === act.date) {
          checkoutDay = getNextDateStr(act.date);
        }
        if (checkoutDay && checkoutDay !== act.date && checkoutDay === activeDate) {
          dayActivities.push({
            ...act,
            id: `${act.id}-checkout`,
            originalId: act.id,
            isCheckout: true,
            date: checkoutDay,
            time: act.checkOut || '11:00',
            price: 0,
          });
        }
      }
    });
    dayActivities.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }

  // -------------------------------------------------------------
  // Drag and Drop Handlers
  // -------------------------------------------------------------
  const handleDragStartFromPalette = (type: BlockType, e?: React.DragEvent) => {
    setDraggedBlockType(type);
    if (e) {
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  const handleActivityDragStart = (act: Activity, e: React.DragEvent) => {
    setDraggedActivity(act);
    e.dataTransfer.setData('text/plain', act.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDate = async (targetDate: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDayDate(null);

    // If moving an existing activity:
    if (draggedActivity) {
      if (draggedActivity.date !== targetDate) {
        await updateActivity(activeTrip.id, {
          ...draggedActivity,
          date: targetDate,
        });
        const dayIdx = getDayIndex(targetDate);
        showToast(`🔄 Actividad movida al Día ${dayIdx} (${formatDayDate(targetDate)})`);
      }
      setDraggedActivity(null);
      return;
    }

    // If dropping a block from palette:
    const rawType = (draggedBlockType || e.dataTransfer.getData('text/plain')) as BlockType;
    if (rawType) {
      handleCreateBlankActivity(rawType, true, targetDate);
      setDraggedBlockType(null);
    }
  };

  // -------------------------------------------------------------
  // AI Agent Handlers (Groq Powered with API_AI)
  // -------------------------------------------------------------
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isAgentThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAgentThinking(true);

    try {
      const response = await fetch('/api/assistant/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip.id,
          message: query,
          activeDate,
          tripContext: {
            name: activeTrip.name,
            startDate: activeTrip.startDate,
            endDate: activeTrip.endDate,
            budget: activeTrip.budget,
            activities: activeTrip.activities,
          },
          history: chatMessages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener respuesta del agente');
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.message || 'He preparado una recomendación personalizada para tu viaje.',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: data.suggestedAction || undefined,
        suggestedActions: Array.isArray(data.suggestedActions) && data.suggestedActions.length > 0 ? data.suggestedActions : undefined,
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error('AI agent error:', err);
      const errorMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: `Lo siento, ha ocurrido un problema al consultar con el asistente: ${
          err instanceof Error ? err.message : 'Error de conexión'
        }. Por favor, inténtalo de nuevo.`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const handleApplySuggestedAction = async (action: SuggestedActionItem, actionKey?: string) => {
    const targetDate = action.date || targetModalDate || activeDate;
    if (action.type === 'food') {
      const foodPayload: Omit<FoodActivity, 'id'> = {
        type: 'food',
        date: targetDate,
        time: action.payload?.time || '20:30',
        price: Number(action.payload?.price) || 50,
        restaurantName: action.payload?.restaurantName || action.payload?.title || action.label || 'Restaurante Recomendado',
        mealType: action.payload?.mealType || 'dinner',
        description: action.payload?.description || '',
      };
      await addActivity(activeTrip.id, foodPayload);
    } else if (action.type === 'hotel') {
      const hotelPayload: Omit<HotelActivity, 'id'> = {
        type: 'hotel',
        date: targetDate,
        time: action.payload?.time || '15:00',
        price: Number(action.payload?.price) || 150,
        hotelName: action.payload?.hotelName || action.payload?.title || action.label || 'Alojamiento Recomendado',
        address: action.payload?.address || '',
        checkIn: action.payload?.checkIn || '15:00',
        checkOut: action.payload?.checkOut || '12:00',
        description: action.payload?.description || '',
      };
      await addActivity(activeTrip.id, hotelPayload);
    } else if (action.type === 'excursion') {
      const excursionPayload: Omit<ExcursionActivity, 'id'> = {
        type: 'excursion',
        date: targetDate,
        time: action.payload?.time || '10:00',
        price: Number(action.payload?.price) || 70,
        title: action.payload?.title || action.label || 'Excursión / Actividad',
        duration: action.payload?.duration || '3 horas',
        description: action.payload?.description || '',
      };
      await addActivity(activeTrip.id, excursionPayload);
    } else if (action.type === 'flight') {
      const flightPayload: Omit<FlightActivity, 'id'> = {
        type: 'flight',
        date: targetDate,
        time: action.payload?.time || '11:00',
        price: Number(action.payload?.price) || 300,
        flightNumber: action.payload?.flightNumber || 'FLIGHT',
        airline: action.payload?.airline || 'Aerolínea',
        origin: action.payload?.origin || 'Origen',
        destination: action.payload?.destination || 'Destino',
        arrivalTime: action.payload?.arrivalTime || '',
      };
      await addActivity(activeTrip.id, flightPayload);
    } else if (action.type === 'transfer') {
      const transferPayload: Omit<TransferActivity, 'id'> = {
        type: 'transfer',
        date: targetDate,
        time: action.payload?.time || '09:00',
        price: Number(action.payload?.price) || 30,
        transportType: action.payload?.transportType || 'train',
        origin: action.payload?.origin || 'Origen',
        destination: action.payload?.destination || 'Destino',
        duration: action.payload?.duration || '45 min',
        description: action.payload?.description || '',
      };
      await addActivity(activeTrip.id, transferPayload);
    }

    if (actionKey) {
      setAppliedActionKeys((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]));
    }
    showToast(`✨ ${action.label || 'Actividad'} añadido con éxito al itinerario.`);
  };

  const handleApplyAllSuggestedActions = async (actions: SuggestedActionItem[], msgId: string) => {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionKey = `${msgId}-${i}`;
      if (!appliedActionKeys.includes(actionKey)) {
        await handleApplySuggestedAction(action, actionKey);
      }
    }
  };

  // -------------------------------------------------------------
  // Activity / Block Editing Handlers
  // -------------------------------------------------------------
  const handleOpenAddActivity = (type: ActivityType = 'flight', forDate?: string) => {
    const effectiveDate = forDate || activeDate;
    setEditingActivity(null);
    setTargetModalDate(effectiveDate);
    setActivityType(type);
    setActTime('10:00');
    setActPrice(0);
    setActDescription('');
    setCustomIconUrl('');
    setFlightNumber('');
    setAirline('');
    setOrigin('');
    setDestination('');
    setArrivalTime('');
    setHotelName('');
    setHotelAddress('');
    setHotelCheckIn('14:00');
    setHotelCheckOut('11:00');
    setHotelCheckoutDate(getNextDateStr(effectiveDate));
    setExcursionTitle('');
    setExcursionDesc('');
    setRestaurantName('');
    setTransferOrigin('');
    setTransferDest('');
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (rawAct: Activity) => {
    // If opening from a checkout card, resolve original hotel parent activity
    const originalAct = rawAct.isCheckout
      ? activeTrip.activities.find((a) => a.id === (rawAct.originalId || rawAct.id)) || rawAct
      : rawAct;
    const act = originalAct;

    setEditingActivity(act);
    setTargetModalDate(act.date);
    setActivityType(act.type);
    setActTime(act.time);
    setActPrice(act.price || 0);
    setActDescription(act.description || '');
    setCustomIconUrl(act.customIconUrl || '');

    if (act.type === 'flight') {
      const detected = detectAirlineFromFlightNumber(act.flightNumber);
      setFlightNumber(act.flightNumber || '');
      setAirline(detected || act.airline || '');
      setOrigin(act.origin || '');
      setDestination(act.destination || '');
      setArrivalTime(act.arrivalTime || '');
    } else if (act.type === 'hotel') {
      setHotelName(act.hotelName || '');
      setHotelAddress(act.address || '');
      setHotelCheckIn(act.checkIn || '14:00');
      setHotelCheckOut(act.checkOut || '11:00');
      setHotelCheckoutDate(act.checkoutDate || (act.date ? getNextDateStr(act.date) : ''));
    } else if (act.type === 'excursion') {
      setExcursionTitle(act.title || '');
      setExcursionDesc(act.description || '');
      setExcursionDuration(act.duration || '3 horas');
    } else if (act.type === 'food') {
      setRestaurantName(act.restaurantName || '');
      setMealType(act.mealType || 'lunch');
    } else if (act.type === 'transfer') {
      setTransferType(act.transportType || 'taxi');
      setTransferOrigin(act.origin || '');
      setTransferDest(act.destination || '');
      setTransferDuration(act.duration || '45 min');
    }
    setIsActivityModalOpen(true);
  };

  const handleDuplicateActivity = async (act: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetId = act.isCheckout ? (act.originalId || act.id) : act.id;
    const base = activeTrip.activities.find((a) => a.id === targetId) || act;
    const { id: _id, ...rest } = base;
    await addActivity(activeTrip.id, {
      ...rest,
      time: rest.time,
    });
    showToast('📄 Actividad duplicada');
  };

  const handleRequestDeleteActivity = (actId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Check if it's a checkout virtual id
    const found = activeTrip.activities.find((a) => a.id === actId || `${a.id}-checkout` === actId);
    setActivityToDelete(found ? found.id : actId);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete || !activeTrip) return;
    const idToDelete = activityToDelete;
    setActivityToDelete(null);
    await deleteActivity(activeTrip.id, idToDelete);
    showToast('🗑 Actividad eliminada del itinerario');
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const actDateToUse = targetModalDate || (editingActivity ? editingActivity.date : activeDate);

    let activityPayload:
      | Omit<FlightActivity, 'id'>
      | Omit<HotelActivity, 'id'>
      | Omit<ExcursionActivity, 'id'>
      | Omit<FoodActivity, 'id'>
      | Omit<TransferActivity, 'id'>;

    if (activityType === 'flight') {
      activityPayload = {
        type: 'flight',
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        flightNumber: flightNumber || 'IB3820',
        airline: detectAirlineFromFlightNumber(flightNumber) || airline || 'Vuelo',
        origin: origin || 'Madrid (MAD)',
        destination: destination || 'Cancún (CUN)',
        arrivalTime: arrivalTime || '14:30',
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === 'hotel') {
      activityPayload = {
        type: 'hotel',
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        hotelName: hotelName || 'Grand Hotel & Spa',
        address: hotelAddress || 'Playa del Carmen, México',
        checkIn: hotelCheckIn,
        checkOut: hotelCheckOut,
        checkoutDate: hotelCheckoutDate || undefined,
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === 'excursion') {
      activityPayload = {
        type: 'excursion',
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        title: excursionTitle || 'Tour Guiado y Entradas',
        description: actDescription.trim() || excursionDesc.trim() || undefined,
        duration: excursionDuration,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === 'food') {
      activityPayload = {
        type: 'food',
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        restaurantName: restaurantName || 'Restaurante Gourmet',
        mealType,
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else {
      activityPayload = {
        type: 'transfer',
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        transportType: transferType,
        origin: transferOrigin || 'Aeropuerto',
        destination: transferDest || 'Hotel Resort',
        duration: transferDuration,
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    }

    if (editingActivity) {
      await updateActivity(activeTrip.id, {
        ...activityPayload,
        id: editingActivity.id,
      });
      showToast('✏ Actividad actualizada');
    } else {
      await addActivity(activeTrip.id, activityPayload);
      showToast('➕ Actividad añadida');
    }

    setIsActivityModalOpen(false);
  };

  const handleSaveTripTitle = () => {
    if (tripTitleInput.trim() && tripTitleInput !== activeTrip.name) {
      updateTrip({
        ...activeTrip,
        name: tripTitleInput.trim(),
      });
      showToast('💾 Título actualizado');
    }
    setIsEditingTitle(false);
  };

  const handleCopyClientLink = () => {
    const url = `${window.location.origin}/publico/${encodeURIComponent(tripCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('🔗 ¡Enlace de cliente copiado al portapapeles!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateBlankActivity = async (
    type: BlockType,
    openModalImmediately: boolean = true,
    targetDate?: string
  ) => {
    if (!activeTrip) return;
    const dateToUse = targetDate || activeDate;

    let newPayload:
      | Omit<FlightActivity, 'id'>
      | Omit<HotelActivity, 'id'>
      | Omit<ExcursionActivity, 'id'>
      | Omit<FoodActivity, 'id'>
      | Omit<TransferActivity, 'id'>;

    if (type === 'flight') {
      newPayload = {
        type: 'flight',
        date: dateToUse,
        time: '10:00',
        price: 0,
        flightNumber: '',
        airline: '',
        origin: '',
        destination: '',
        arrivalTime: '',
      };
    } else if (type === 'hotel') {
      newPayload = {
        type: 'hotel',
        date: dateToUse,
        time: '14:00',
        price: 0,
        hotelName: '',
        address: '',
        checkIn: '14:00',
        checkOut: '11:00',
        description: '',
      };
    } else if (type === 'food') {
      newPayload = {
        type: 'food',
        date: dateToUse,
        time: '13:30',
        price: 0,
        restaurantName: '',
        mealType: 'lunch',
        description: '',
      };
    } else if (type === 'transport' || (type as string) === 'transfer') {
      newPayload = {
        type: 'transfer',
        date: dateToUse,
        time: '09:00',
        price: 0,
        transportType: 'taxi',
        origin: '',
        destination: '',
        duration: '30 min',
        description: '',
      };
    } else if (type === 'price') {
      newPayload = {
        type: 'excursion',
        date: dateToUse,
        time: '12:00',
        price: 0,
        title: 'Desglose de Tarifas y Precios',
        duration: '-',
        description: 'Detalle de importes, suplementos y condiciones de pago.',
      };
    } else if (type === 'info') {
      newPayload = {
        type: 'excursion',
        date: dateToUse,
        time: '09:00',
        price: 0,
        title: 'Información del Destino',
        duration: '-',
        description: 'Recomendaciones, huso horario, documentación y moneda.',
      };
    } else if (type === 'booking') {
      newPayload = {
        type: 'excursion',
        date: dateToUse,
        time: '11:00',
        price: 0,
        title: 'Condiciones de Reserva',
        duration: '-',
        description: 'Calendario de pagos, política de cambios y cancelaciones.',
      };
    } else if (type === 'file') {
      newPayload = {
        type: 'excursion',
        date: dateToUse,
        time: '08:00',
        price: 0,
        title: 'Documentos & Vouchers',
        duration: '-',
        description: 'Billetes electrónicos, pólizas y bonos confirmados.',
      };
    } else {
      newPayload = {
        type: 'excursion',
        date: dateToUse,
        time: '10:00',
        price: 0,
        title: '',
        duration: '2 horas',
        description: '',
      };
    }

    const created = await addActivity(activeTrip.id, newPayload);
    const dayIdx = getDayIndex(dateToUse);
    showToast(`✨ Bloque añadido al Día ${dayIdx} (${formatDayDate(dateToUse)})`);

    if (openModalImmediately) {
      if (created) {
        handleOpenEditActivity(created);
      } else {
        handleOpenAddActivity(newPayload.type, dateToUse);
      }
    }
  };

  const handleAddBlockDirectly = (type: BlockType, targetDate?: string) => {
    handleCreateBlankActivity(type, true, targetDate || activeDate);
  };

  // Reusable Activity Card Renderer with Drag & Drop Handle
  const renderActivityCard = (act: Activity) => {
    const isDraft =
      (act.type === 'flight' && !act.airline && !act.flightNumber) ||
      (act.type === 'hotel' && !act.hotelName) ||
      (act.type === 'excursion' && !act.title) ||
      (act.type === 'food' && !act.restaurantName) ||
      (act.type === 'transfer' && !act.origin && !act.destination);

    const isBeingDragged = draggedActivity?.id === act.id;
    const hasFullImage = Boolean(act.customIconUrl && act.customIconUrl.trim());

    return (
      <div
        key={act.id}
        draggable={true}
        onDragStart={(e) => handleActivityDragStart(act, e)}
        onDragEnd={() => {
          setDraggedActivity(null);
          setDragOverDayDate(null);
        }}
        onClick={() => handleOpenEditActivity(act)}
        className={`group relative flex flex-row items-stretch rounded-2xl border shadow-xs transition-all cursor-pointer overflow-hidden min-h-[135px] sm:min-h-[150px] ${
          isBeingDragged
            ? 'opacity-40 scale-[0.98] border-dashed border-[#009688] bg-[#e0f2f1]/40'
            : isDraft
            ? 'border-amber-300 bg-amber-50/30 hover:border-[#009688] hover:bg-white hover:shadow-md'
            : 'border-[#eaecf0] bg-white hover:border-[#009688]/50 hover:shadow-md'
        }`}
      >
        {/* Left: Full-height image when customUrl exists (1/3 width) */}
        {hasFullImage && (
          <div className="w-1/3 min-w-[110px] max-w-[200px] shrink-0 relative bg-slate-100 overflow-hidden self-stretch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={act.customIconUrl!}
              alt={act.type}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="w-2/3 flex-1 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 min-w-0">
          {/* Left: Drag Handle + Type Icon + Activity Info */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {/* Drag Grab Handle */}
            <div
              className="hidden sm:flex items-center self-center py-2 -ml-1 text-[#98a2b3] hover:text-[#344054] cursor-grab active:cursor-grabbing transition-colors"
              title="Arrastra para mover a otro día"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {!hasFullImage && <ActivityCardIcon act={act} isDraft={isDraft} />}

            <div className="space-y-1 min-w-0 flex-1">
              {/* Title per Type */}
              {act.type === 'flight' && (() => {
                const effectiveAirline = detectAirlineFromFlightNumber(act.flightNumber) || act.airline || 'Vuelo';
                return (
                  <h3 className="text-sm font-bold text-[#101828] truncate">
                    {act.flightNumber || act.airline
                      ? `${effectiveAirline} ${act.flightNumber ? `(${act.flightNumber})` : ''}`
                      : 'Vuelo pendiente de configurar'}
                  </h3>
                );
              })()}

              {act.type === 'hotel' && (
                <h3 className="text-sm font-bold text-[#101828] truncate">
                  {act.isCheckout
                    ? `Check-out: ${act.hotelName || 'Alojamiento'}`
                    : act.hotelName || 'Alojamiento pendiente de configurar'}
                </h3>
              )}

              {act.type === 'excursion' && (
                <h3 className="text-sm font-bold text-[#101828] truncate">
                  {act.title || 'Actividad / Excursión sin título'}
                </h3>
              )}

              {act.type === 'food' && (
                <h3 className="text-sm font-bold text-[#101828] truncate">
                  {act.restaurantName || 'Restaurante pendiente de configurar'}
                </h3>
              )}

              {act.type === 'transfer' && (
                <h3 className="text-sm font-bold text-[#101828] truncate">
                  {act.origin || act.destination
                    ? `Traslado en ${act.transportType || 'transporte'}`
                    : 'Traslado pendiente de configurar'}
                </h3>
              )}

              {/* Badges: Time, Category, Price / Draft */}
              <div className="flex flex-wrap items-center gap-2 mt-0.5 mb-1">
                <span className="rounded-full bg-[#f4f5f8] px-2.5 py-0.5 text-[11px] font-bold text-[#344054] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#009688]" />
                  {act.time}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    act.isCheckout
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-[#e0f2fe] text-[#0369a1]'
                  }`}
                >
                  {act.type === 'flight'
                    ? 'Vuelo'
                    : act.type === 'hotel'
                    ? act.isCheckout
                      ? 'Check-out Alojamiento'
                      : 'Alojamiento'
                    : act.type === 'excursion'
                    ? 'Excursión'
                    : act.type === 'food'
                    ? 'Gastronomía'
                    : 'Traslado'}
                </span>
                {isDraft ? (
                  <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Bloque vacío (sin rellenar)
                  </span>
                ) : act.price ? (
                  <span className="rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-[11px] font-bold text-[#027a48]">
                    {act.price} €
                  </span>
                ) : null}
              </div>

              {/* Specific Subtitle & Details per Type */}
              {act.type === 'flight' && (
                <p className="text-xs text-[#667085] truncate">
                  {act.origin || act.destination
                    ? `${act.origin || 'Origen'} → ${act.destination || 'Destino'} · Llegada: ${act.arrivalTime || '-'}`
                    : 'Haz clic en Editar para indicar vuelos y horarios.'}
                </p>
              )}

              {act.type === 'hotel' && (
                <div>
                  {act.isCheckout ? (
                    <div>
                      {act.address && (
                        <p className="text-xs text-[#667085] truncate">
                          {act.address}
                        </p>
                      )}
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        Salida de la estancia antes de las {act.checkOut || act.time || '11:00'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[#667085] truncate">
                        {act.address
                          ? `${act.address} · Check-in: ${act.checkIn || '14:00'} - Check-out: ${act.checkOut || '11:00'}`
                          : 'Haz clic en Editar para indicar hotel, check-in y dirección.'}
                      </p>
                      {act.description && (
                        <p className="text-xs text-[#475467] mt-1 line-clamp-2">{act.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {act.type === 'excursion' && (
                <div>
                  <p className="text-xs text-[#667085] truncate">
                    {act.duration ? `Duración: ${act.duration}` : 'Haz clic en Editar para rellenar la actividad.'}
                  </p>
                  {act.description && (
                    <p className="text-xs text-[#475467] mt-1 line-clamp-2">{act.description}</p>
                  )}
                </div>
              )}

              {act.type === 'food' && (
                <div>
                  <p className="text-xs text-[#667085] truncate">
                    Tipo: {act.mealType === 'breakfast' ? 'Desayuno' : act.mealType === 'lunch' ? 'Almuerzo' : act.mealType === 'dinner' ? 'Cena' : 'Snack'}
                  </p>
                  {act.description && (
                    <p className="text-xs text-[#475467] mt-1 line-clamp-2">{act.description}</p>
                  )}
                </div>
              )}

              {act.type === 'transfer' && (
                <p className="text-xs text-[#667085] truncate">
                  {act.origin || act.destination
                    ? `${act.origin || 'Origen'} → ${act.destination || 'Destino'} (${act.duration || '30 min'})`
                    : 'Haz clic en Editar para indicar origen, destino y transporte.'}
                </p>
              )}
            </div>
          </div>

          {/* Right: EDIT, Duplicate, Delete Action Buttons */}
          <div
            className="flex items-center gap-1.5 self-end sm:self-center shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleOpenEditActivity(act)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isDraft
                  ? 'bg-[#009688] text-white hover:bg-[#00796b]'
                  : 'border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f4f5f8] hover:border-[#009688]'
              }`}
            >
              <Edit2 className={`h-3.5 w-3.5 ${isDraft ? 'text-white' : 'text-[#009688]'}`} />
              <span>{isDraft ? 'Rellenar datos' : 'Editar'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleDuplicateActivity(act, e)}
              title="Duplicar actividad"
              className="rounded-full p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#344054] transition-colors cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => handleRequestDeleteActivity(act.id, e)}
              title="Eliminar actividad"
              className="rounded-full p-1.5 text-[#98a2b3] hover:bg-[#fee4e2] hover:text-[#d92d20] transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Block definitions for drag & drop palette
  const serviceBlocks = [
    { type: 'flight', label: 'Vuelo & Conexiones', desc: 'Horarios, aerolínea y terminales', icon: Plane, color: 'text-sky-600 bg-sky-50' },
    { type: 'hotel', label: 'Alojamiento & Hotel', desc: 'Resort, check-in y servicios', icon: Bed, color: 'text-indigo-600 bg-indigo-50' },
    { type: 'activity', label: 'Excursión / Tour', desc: 'Visita guiada, entradas y duración', icon: MapPin, color: 'text-teal-600 bg-teal-50' },
    { type: 'food', label: 'Restaurante / Comida', desc: 'Desayuno, almuerzo o cena gourmet', icon: Utensils, color: 'text-amber-600 bg-amber-50' },
    { type: 'transport', label: 'Traslado privado / Taxi', desc: 'Recogida con chofer o minivan', icon: Car, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const structureBlocks = [
    { type: 'price', label: 'Desglose de Precios', desc: 'Tabla de importes y conceptos', icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
    { type: 'info', label: 'Información del Destino', desc: 'Visados, moneda y recomendaciones', icon: Info, color: 'text-purple-600 bg-purple-50' },
    { type: 'booking', label: 'Módulo de Reservas', desc: 'Condiciones de pago y depósito', icon: CalendarCheck, color: 'text-blue-600 bg-blue-50' },
    { type: 'file', label: 'Documentos & Vouchers', desc: 'PDFs, pólizas y billetes', icon: Paperclip, color: 'text-zinc-600 bg-zinc-100' },
  ];

  return (
    <DashboardShell activeMenu="viajes" hideSidebar={true}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#101828]/95 px-5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-fade-in border border-white/10">
          <Sparkles className="h-4 w-4 text-[#009688]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace: Fixed 2-Column Hostinger Layout */}
      <div className="flex w-full h-[calc(100vh-6.5rem)] overflow-hidden gap-6">
        {/* ============================================================= */}
        {/* LEFT / CENTER: ITINERARY CANVAS (Scrolls independently)        */}
        {/* ============================================================= */}
        <div className="flex-1 overflow-y-auto pr-1 pb-16 space-y-6 [scrollbar-width:thin] min-w-0">
          {/* Breadcrumb Navigation & Top Action Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-2 text-xs text-[#667085]">
              <Link href="/viajes" className="hover:text-[#009688] transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Mis viajes</span>
              </Link>
              <span>/</span>
              <span className="font-bold text-[#101828] truncate max-w-[240px]">{activeTrip.name}</span>
              <span className="rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#00796b]">
                Itinerario
              </span>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyClientLink}
                className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-[#667085]" />
                <span>{copiedLink ? '¡Copiado!' : 'Compartir'}</span>
              </button>

              <Link
                href={`/publico/${encodeURIComponent(tripCode)}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-full bg-[#009688] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Portal del viajero</span>
              </Link>
            </div>
          </div>

          {/* Trip Header Banner Card */}
          <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e0f2f1] px-3 py-1 text-xs font-bold text-[#009688] mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Propuesta de Viaje Personalizada</span>
                </div>

                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tripTitleInput}
                      onChange={(e) => setTripTitleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTripTitle()}
                      className="rounded-2xl border border-[#009688] px-3 py-1 text-2xl font-extrabold text-[#101828] focus:outline-hidden ring-2 ring-[#009688]/20"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveTripTitle}
                      className="rounded-full bg-[#009688] p-2 text-white hover:bg-[#00796b] transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingTitle(true)}
                    className="group flex cursor-pointer items-center gap-2 mt-1"
                  >
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight group-hover:text-[#009688] transition-colors">
                      {activeTrip.name}
                    </h1>
                    <Edit2 className="h-4 w-4 text-[#98a2b3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                <p className="mt-2 text-xs text-[#667085] flex flex-wrap items-center gap-2">
                  <span>Código:</span>
                  <span className="font-mono font-bold text-[#344054] bg-[#f2f4f7] px-2 py-0.5 rounded-md">
                    {tripCode}
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(true)}
                    className="font-medium hover:text-[#009688] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#009688]" />
                    <span>{formatFullDate(activeTrip.startDate)} — {formatFullDate(activeTrip.endDate)}</span>
                  </button>
                  <span>·</span>
                  <span>{tripDates.length} días</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(activeTrip.budget || 2500);
                    setIsBudgetModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#eaecf0] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#344054] hover:bg-[#eaecf0] transition-colors cursor-pointer"
                >
                  <DollarSign className="h-3.5 w-3.5 text-[#009688]" />
                  <span>Presupuesto: {activeTrip.budget || 2500} €</span>
                </button>
              </div>
            </div>

            {/* Header Media */}
            <div className="group relative mt-5 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d0d5dd] bg-[#fafafa] p-3 text-center transition-colors hover:border-[#009688] hover:bg-[#e0f2f1]/20 overflow-hidden">
              {activeTrip.imageUrl ? (
                <div className="relative h-44 w-full overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTrip.imageUrl}
                    alt={activeTrip.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrlInput(activeTrip.imageUrl || '');
                        setIsPhotoModalOpen(true);
                      }}
                      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#101828] shadow-md hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cambiar foto de portada
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="cursor-pointer py-3"
                  onClick={() => {
                    setPhotoUrlInput('');
                    setIsPhotoModalOpen(true);
                  }}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f2f1] text-[#009688] shadow-2xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#009688]">
                    Añadir imagen de portada
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Day-by-Day / All-Trip Itinerary Section with Drag & Drop Zone */}
          <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-6">
            {/* Header: Title + View Mode Switcher + Add Activity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eaecf0] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#101828]">
                  {itineraryViewMode === 'day' ? 'Itinerario día a día' : 'Itinerario completo del viaje'}
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  {itineraryViewMode === 'day'
                    ? 'Selecciona un día, reordena actividades o arrastra entre días.'
                    : 'Vista continua de todos los días. Arrastra actividades de un día a otro libremente.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Switcher: Por día vs Todo el viaje */}
                <div className="flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => changeItineraryViewMode('day')}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
                      itineraryViewMode === 'day'
                        ? 'bg-white text-[#101828] shadow-xs'
                        : 'text-[#71717a] hover:text-[#18181b]'
                    }`}
                  >
                    <Calendar className={`h-3.5 w-3.5 ${itineraryViewMode === 'day' ? 'text-[#009688]' : 'text-[#a1a1aa]'}`} />
                    <span>Por día</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => changeItineraryViewMode('all')}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
                      itineraryViewMode === 'all'
                        ? 'bg-white text-[#101828] shadow-xs'
                        : 'text-[#71717a] hover:text-[#18181b]'
                    }`}
                  >
                    <ListOrdered className={`h-3.5 w-3.5 ${itineraryViewMode === 'all' ? 'text-[#009688]' : 'text-[#a1a1aa]'}`} />
                    <span>Todo el viaje</span>
                    <span className="rounded-full bg-[#e0f2f1] text-[#00796b] px-1.5 py-0.2 text-[10px] font-bold">
                      {activeTrip.activities.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddActivity('flight', activeDate)}
                  className="flex items-center gap-1.5 rounded-full bg-[#009688] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir actividad</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 1: POR DÍA (Single-Day Tab View with Drop Targets)   */}
            {/* ========================================================= */}
            {itineraryViewMode === 'day' && (
              <div className="space-y-6 animate-fade-in">
                {/* Day Selector Tabs (Acts as Drop Targets for Moving Activities) */}
                <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70 shadow-2xs">
                    {tripDates.map((dateStr, dIdx) => {
                      const isSelected = activeDate === dateStr;
                      const isDropTarget = dragOverDayDate === dateStr;
                      const actsCount = activeTrip.activities.filter((a) => {
                        if (a.date === dateStr) return true;
                        if (a.type === 'hotel') {
                          let checkoutDay = a.checkoutDate ? a.checkoutDate.trim() : '';
                          if (!checkoutDay || checkoutDay === a.date) checkoutDay = getNextDateStr(a.date);
                          if (checkoutDay && checkoutDay !== a.date && checkoutDay === dateStr) return true;
                        }
                        return false;
                      }).length;

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDayDate(dateStr)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverDayDate(dateStr);
                          }}
                          onDragLeave={() => setDragOverDayDate(null)}
                          onDrop={(e) => handleDropOnDate(dateStr, e)}
                          className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                            isDropTarget
                              ? 'ring-2 ring-[#009688] bg-[#e0f2f1] text-[#00796b] scale-105 shadow-md'
                              : isSelected
                              ? 'bg-white text-[#18181b] shadow-sm'
                              : 'text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]'
                          }`}
                        >
                          <Calendar
                            className={`h-3.5 w-3.5 ${
                              isDropTarget || isSelected ? 'text-[#009688]' : 'text-[#a1a1aa]'
                            }`}
                          />
                          <span>Día {dIdx + 1}</span>
                          <span className="text-[11px] opacity-60 font-normal">
                            ({formatDayDate(dateStr)})
                          </span>
                          {actsCount > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]'
                                  : 'bg-[#e4e4e7] text-[#71717a]'
                              }`}
                            >
                              {actsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Activities List */}
                <div className="space-y-4 pt-1">
                  {dayActivities.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-[#eaecf0] bg-[#fafafa] p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                        <Plane className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[#101828]">No hay actividades para este día</h3>
                      <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1 mb-4">
                        Arrastra cualquier bloque desde el panel derecho o haz clic para añadir un bloque vacío y completarlo.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateBlankActivity('flight', true, activeDate)}
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Vuelo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateBlankActivity('hotel', true, activeDate)}
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Alojamiento
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateBlankActivity('activity', true, activeDate)}
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Tour / Excursión
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateBlankActivity('food', true, activeDate)}
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Restaurante
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateBlankActivity('transport', true, activeDate)}
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Traslado
                        </button>
                      </div>
                    </div>
                  ) : (
                    dayActivities.map((act) => renderActivityCard(act))
                  )}

                  {/* Interactive Drag & Drop Area for active day */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverDayDate(activeDate);
                    }}
                    onDragLeave={() => setDragOverDayDate(null)}
                    onDrop={(e) => handleDropOnDate(activeDate, e)}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-4 px-4 text-center transition-all ${
                      dragOverDayDate === activeDate
                        ? 'border-[#009688] bg-[#e0f2f1]/60 ring-4 ring-[#009688]/20 scale-[1.01]'
                        : 'border-[#eaecf0] bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#009688] shadow-2xs mb-1">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-medium text-[#667085]">
                      Arrastra un bloque o actividad aquí para el Día {getDayIndex(activeDate)} ({formatDayDate(activeDate)})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: TODO EL VIAJE (Continuous Full Trip View)         */}
            {/* ========================================================= */}
            {itineraryViewMode === 'all' && (
              <div className="space-y-8 animate-fade-in">
                {tripDates.map((dateStr, dIdx) => {
                  const acts = activeTrip.activities.filter((a) => a.date === dateStr);
                  const isDayOver = dragOverDayDate === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverDayDate(dateStr);
                      }}
                      onDragLeave={() => setDragOverDayDate(null)}
                      onDrop={(e) => handleDropOnDate(dateStr, e)}
                      className={`rounded-2xl border p-5 transition-all space-y-4 ${
                        isDayOver
                          ? 'border-[#009688] bg-[#e0f2f1]/30 ring-2 ring-[#009688]/30 shadow-md'
                          : 'border-[#eaecf0] bg-[#fafbfc]'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaecf0] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 rounded-full bg-[#101828] text-white px-3 py-1 text-xs font-bold shadow-2xs">
                            <Calendar className="h-3.5 w-3.5 text-[#009688]" />
                            <span>Día {dIdx + 1}</span>
                          </span>
                          <span className="text-sm font-bold text-[#101828]">
                            {formatDayFullLabel(dateStr)}
                          </span>
                          <span className="rounded-full bg-[#eaecf0] px-2.5 py-0.5 text-[11px] font-bold text-[#344054]">
                            {acts.length} {acts.length === 1 ? 'actividad' : 'actividades'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAddActivity('flight', dateStr)}
                            className="flex items-center gap-1 rounded-full border border-[#d0d5dd] bg-white px-3 py-1 text-xs font-bold text-[#344054] hover:bg-[#f9fafb] hover:border-[#009688] shadow-2xs transition-all cursor-pointer"
                          >
                            <Plus className="h-3 w-3 text-[#009688]" />
                            <span>Añadir a Día {dIdx + 1}</span>
                          </button>
                        </div>
                      </div>

                      {/* Day Activities List */}
                      <div className="space-y-3">
                        {acts.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#d0d5dd] bg-white/70 p-5 text-center">
                            <p className="text-xs text-[#667085]">
                              Sin actividades programadas para el Día {dIdx + 1}. Arrastra un bloque aquí o actividades de otro día.
                            </p>
                          </div>
                        ) : (
                          acts.map((act) => renderActivityCard(act))
                        )}

                        {/* Interactive Drop Zone for this Day */}
                        <div
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 px-4 text-center transition-all ${
                            isDayOver
                              ? 'border-[#009688] bg-[#e0f2f1] text-[#00796b]'
                              : 'border-[#e4e4e7] bg-white text-[#667085]'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5 text-[#009688]" />
                          <span className="text-xs font-semibold">
                            Arrastra aquí una actividad o bloque para el Día {dIdx + 1} ({formatDayDate(dateStr)})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT PANEL: FIXED HOSTINGER-STYLE AGENTE IA & BLOQUES        */}
        {/* ============================================================= */}
        <aside className="w-full lg:w-[380px] shrink-0 h-full flex flex-col">
          <div className="rounded-3xl border border-[#eaecf0] bg-white shadow-xl overflow-hidden flex flex-col h-full">
            {/* Drawer Header with HeroUI Tab Switcher: BLOQUES FIRST, AGENTE IA SECOND */}
            <div className="flex items-center justify-between border-b border-[#eaecf0] bg-[#fafafa] p-3.5">
              <div className="flex items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('blocks')}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    rightPanelTab === 'blocks'
                      ? 'bg-white text-[#101828] shadow-xs'
                      : 'text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-[#009688]" />
                  <span>Bloques</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('agent')}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    rightPanelTab === 'agent'
                      ? 'bg-white text-[#101828] shadow-xs'
                      : 'text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#009688]" />
                  <span>Agente IA</span>
                </button>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10px] font-bold text-[#027a48]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a] animate-pulse" />
                Online
              </span>
            </div>

            {/* TAB 1: BLOQUES (Drag & Drop + Click to Add) */}
            {rightPanelTab === 'blocks' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
                <div className="rounded-2xl border border-[#009688]/20 bg-[#e0f2f1]/40 p-3 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-[#009688] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#004d40]">
                    <strong>Arrastra</strong> cualquier bloque hacia el itinerario o <strong>haz clic</strong> sobre él para añadirlo al día seleccionado ({activeDate}).
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3]">Servicios de viaje</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {serviceBlocks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.type}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.type);
                            handleDragStartFromPalette(item.type as BlockType);
                          }}
                          onDragEnd={() => setDraggedBlockType(null)}
                          onClick={() => handleAddBlockDirectly(item.type as BlockType)}
                          className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left transition-all hover:border-[#009688] hover:shadow-md group cursor-grab active:cursor-grabbing select-none"
                        >
                          <GripVertical className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#009688] transition-colors shrink-0" />
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#101828] group-hover:text-[#009688] transition-colors">
                              {item.label}
                            </h4>
                            <p className="text-[11px] text-[#667085] truncate">{item.desc}</p>
                          </div>
                          <Plus className="h-4 w-4 text-[#98a2b3] group-hover:text-[#009688] shrink-0" />
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3] pt-2">Estructura & Gestión</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {structureBlocks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.type}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.type);
                            handleDragStartFromPalette(item.type as BlockType);
                          }}
                          onDragEnd={() => setDraggedBlockType(null)}
                          onClick={() => handleAddBlockDirectly(item.type as BlockType)}
                          className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left transition-all hover:border-[#009688] hover:shadow-md group cursor-grab active:cursor-grabbing select-none"
                        >
                          <GripVertical className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#009688] transition-colors shrink-0" />
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-[#101828] group-hover:text-[#009688] transition-colors">
                              {item.label}
                            </h4>
                            <p className="text-[11px] text-[#667085] truncate">{item.desc}</p>
                          </div>
                          <Plus className="h-4 w-4 text-[#98a2b3] group-hover:text-[#009688] shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AGENTE IA (Interactive Chat) */}
            {rightPanelTab === 'agent' && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#18181b] text-white rounded-br-xs'
                            : 'bg-[#f4f5f8] text-[#101828] border border-[#eaecf0] rounded-bl-xs'
                        }`}
                      >
                        {msg.sender === 'agent' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#009688] mb-1">
                            <Bot className="h-3.5 w-3.5" />
                            <span>Wanderlust Agent</span>
                          </div>
                        )}
                        <p>{msg.text}</p>

                        {/* Suggested Action Cards (Single or Multiple) */}
                        {(() => {
                          const actions: SuggestedActionItem[] = msg.suggestedActions && msg.suggestedActions.length > 0
                            ? msg.suggestedActions
                            : msg.suggestedAction
                            ? [msg.suggestedAction]
                            : [];

                          if (actions.length === 0) return null;

                          const allApplied = actions.every((_, idx) => appliedActionKeys.includes(`${msg.id}-${idx}`));

                          return (
                            <div className="mt-3 pt-3 border-t border-[#eaecf0] space-y-2">
                              {actions.length > 1 && !allApplied && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyAllSuggestedActions(actions, msg.id)}
                                  className="w-full mb-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#101828] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1f2937] transition-all cursor-pointer"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-[#14b8a6]" />
                                  <span>+ Añadir todas ({actions.length}) al itinerario</span>
                                </button>
                              )}

                              {actions.map((act, idx) => {
                                const actionKey = `${msg.id}-${idx}`;
                                const isApplied = appliedActionKeys.includes(actionKey);

                                return (
                                  <div
                                    key={actionKey}
                                    className={`rounded-xl border p-2.5 transition-all text-left ${
                                      isApplied
                                        ? 'bg-[#f0fdf4] border-[#bbf7d0]'
                                        : 'bg-white border-[#e5e7eb] shadow-2xs hover:border-[#009688]/40'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#e0f2f1] text-[#00796b]">
                                          {act.type === 'food' && <Utensils className="h-3.5 w-3.5" />}
                                          {act.type === 'hotel' && <Bed className="h-3.5 w-3.5" />}
                                          {act.type === 'excursion' && <Compass className="h-3.5 w-3.5" />}
                                          {act.type === 'flight' && <Plane className="h-3.5 w-3.5" />}
                                          {act.type === 'transfer' && <Car className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-[#101828] truncate">
                                            {act.label || act.payload?.restaurantName || act.payload?.hotelName || act.payload?.title || 'Propuesta'}
                                          </p>
                                          {act.date && (
                                            <p className="text-[10px] text-[#667085]">
                                              📅 {act.date}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {act.payload?.price ? (
                                        <span className="shrink-0 text-[11px] font-bold text-[#00796b] bg-[#e0f2f1] px-1.5 py-0.5 rounded-md">
                                          {act.payload.price}€
                                        </span>
                                      ) : null}
                                    </div>

                                    {act.payload?.description && (
                                      <p className="text-[11px] text-[#475467] line-clamp-2 mb-2">
                                        {act.payload.description}
                                      </p>
                                    )}

                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                      <div className="flex items-center gap-2 text-[10px] text-[#667085]">
                                        {act.payload?.time && (
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="h-3 w-3" />
                                            {act.payload.time}
                                          </span>
                                        )}
                                        {act.payload?.duration && (
                                          <span>• {act.payload.duration}</span>
                                        )}
                                      </div>

                                      {isApplied ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                                          <Check className="h-3.5 w-3.5" />
                                          Añadido
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleApplySuggestedAction(act, actionKey)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-[#009688] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
                                        >
                                          <Plus className="h-3 w-3" />
                                          Añadir
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                      <span className="text-[9px] text-[#98a2b3] mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}

                  {isAgentThinking && (
                    <div className="flex items-center gap-2 text-xs text-[#667085] bg-[#f4f5f8] rounded-2xl p-3 border border-[#eaecf0] max-w-[80%]">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-[#009688]" />
                      <span>Generando recomendaciones...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Suggested Prompt Chips */}
                <div className="border-t border-[#eaecf0] px-3 pt-2 pb-1 bg-white">
                  <p className="text-[10px] font-bold text-[#98a2b3] uppercase tracking-wider mb-1.5">
                    Sugerencias rápidas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Cena romántica',
                      'Excursión snorkel',
                      'Hotel 5 estrellas',
                      'Vuelo directo',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSendMessage(`Recomienda un ${chip}`)}
                        className="rounded-full bg-[#f4f5f8] px-2.5 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#e0f2f1] hover:text-[#00796b] transition-colors cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 bg-white border-t border-[#eaecf0]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Continúa la conversación..."
                      className="w-full rounded-full border border-[#d0d5dd] bg-white py-2 pl-4 pr-16 text-xs text-[#101828] placeholder-[#98a2b3] focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688]/20"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#009688] text-white disabled:opacity-40 hover:bg-[#00796b] transition-colors cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>
                  <p className="text-[10px] text-center text-[#98a2b3] mt-1.5">
                    La inteligencia artificial puede cometer errores.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ============================================================= */}
      {/* ACTIVITY EDIT / CREATE MODAL (2-COLUMN MODERN MODAL)          */}
      {/* ============================================================= */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl animate-scale-in max-h-[92vh] overflow-hidden flex flex-col md:flex-row">
            {/* --------------------------------------------------------- */}
            {/* LEFT COLUMN: CONTEXTUAL INSPIRING IMAGE & LIVE SUMMARY    */}
            {/* --------------------------------------------------------- */}
            <div className="md:w-5/12 lg:w-4/12 relative bg-[#0c111d] flex flex-col justify-between p-6 text-white min-h-[180px] md:min-h-[540px] overflow-hidden shrink-0">
              {/* Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ACTIVITY_MODAL_IMAGES[activityType] || ACTIVITY_MODAL_IMAGES.excursion}
                alt={activityType}
                className="absolute inset-0 h-full w-full object-cover opacity-90 scale-105 transition-transform duration-700 hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25" />

              {/* Top Badges */}
              <div className="relative z-10 flex items-center justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold text-white shadow-xs">
                  {activityType === 'flight' && <Plane className="h-3.5 w-3.5 text-[#80cbc4]" />}
                  {activityType === 'hotel' && <Bed className="h-3.5 w-3.5 text-[#80cbc4]" />}
                  {activityType === 'excursion' && <MapPin className="h-3.5 w-3.5 text-[#80cbc4]" />}
                  {activityType === 'food' && <Utensils className="h-3.5 w-3.5 text-[#80cbc4]" />}
                  {activityType === 'transfer' && <Car className="h-3.5 w-3.5 text-[#80cbc4]" />}
                  <span className="capitalize">
                    {activityType === 'flight' && 'Vuelo'}
                    {activityType === 'hotel' && 'Alojamiento'}
                    {activityType === 'excursion' && 'Tour / Actividad'}
                    {activityType === 'food' && 'Gastronomía'}
                    {activityType === 'transfer' && 'Traslado'}
                  </span>
                </span>
              </div>

              {/* Bottom Contextual Preview */}
              <div className="relative z-10 space-y-2 pt-12 md:pt-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#80cbc4]">
                  {editingActivity ? 'Editando servicio' : 'Nuevo servicio'}
                </p>

                {activityType === 'flight' && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {origin || 'Origen'} → {destination || 'Destino'}
                    </h4>
                    <div className="mt-1.5 flex items-center gap-2">
                      {getAirlineLogoUrl(flightNumber, airline) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAirlineLogoUrl(flightNumber, airline)!}
                          alt={airline || 'Aerolínea'}
                          className="h-5.5 w-auto max-w-[55px] object-contain bg-white rounded px-1 py-0.5 shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <p className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                        <span className="font-bold text-[#80cbc4]">{airline || 'Aerolínea'}</span>
                        {flightNumber && <span>· Vuelo {flightNumber}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90 mt-2 font-mono">
                      <span className="font-bold text-white">{actTime || '10:00'}</span>
                      <span>➔</span>
                      <span className="font-bold text-[#80cbc4]">{arrivalTime || '—'}</span>
                    </div>
                  </div>
                )}

                {activityType === 'hotel' && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {hotelName || 'Nombre del Alojamiento'}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                      {hotelAddress || 'Ubicación / Dirección'}
                    </p>
                  </div>
                )}

                {activityType === 'excursion' && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {excursionTitle || 'Título de la Actividad'}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      {excursionDuration || 'Duración estimada'}
                    </p>
                  </div>
                )}

                {activityType === 'food' && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {restaurantName || 'Restaurante Gourmet'}
                    </h4>
                    <p className="text-xs text-[#80cbc4] mt-1 capitalize font-bold">
                      {mealType === 'breakfast' && 'Desayuno'}
                      {mealType === 'lunch' && 'Almuerzo / Comida'}
                      {mealType === 'dinner' && 'Cena gourmet'}
                      {mealType === 'snack' && 'Snack / Degustación'}
                    </p>
                  </div>
                )}

                {activityType === 'transfer' && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {transferOrigin || 'Origen'} → {transferDest || 'Destino'}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      {transferDuration || '30 - 45 min'} · {transferType}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* RIGHT COLUMN: FORM                                        */}
            {/* --------------------------------------------------------- */}
            <div className="md:w-7/12 lg:w-8/12 p-6 md:p-7 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[600px]">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#eaecf0] pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#101828]">
                      {editingActivity ? 'Editar actividad' : 'Añadir nueva actividad'}
                    </h3>
                    <p className="text-xs text-[#667085]">
                      {editingActivity
                        ? 'Modifica los detalles del servicio seleccionado.'
                        : 'Configura los datos del servicio para el día seleccionado.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="rounded-full p-2 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#101828] cursor-pointer transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Type Switcher if Creating */}
                {!editingActivity && (
                  <div className="mb-4 flex flex-wrap items-center gap-1 rounded-full bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70">
                    {[
                      { id: 'flight', label: 'Vuelo', icon: Plane },
                      { id: 'hotel', label: 'Alojamiento', icon: Bed },
                      { id: 'excursion', label: 'Excursión', icon: MapPin },
                      { id: 'food', label: 'Restaurante', icon: Utensils },
                      { id: 'transfer', label: 'Traslado', icon: Car },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActivityType(tab.id as ActivityType)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          activityType === tab.id
                            ? 'bg-white text-[#101828] shadow-xs'
                            : 'text-[#71717a] hover:text-[#18181b]'
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5 text-[#009688]" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* FORM BODY */}
                <form onSubmit={handleSaveActivity} id="activityForm" className="space-y-3.5">
                  {/* Vuelo Fields (NUEVO ORDEN) */}
                  {activityType === 'flight' && (
                    <div className="space-y-3">
                      {/* 1. Nº de Vuelo con auto-detección de aerolínea */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-[#344054]">
                            Nº de Vuelo
                          </label>
                          {detectAirlineFromFlightNumber(flightNumber) && (
                            <span className="text-[11px] font-semibold text-[#00796b] bg-[#e0f2f1] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              ✈ {detectAirlineFromFlightNumber(flightNumber)}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={flightNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFlightNumber(val);
                            const autoAirline = detectAirlineFromFlightNumber(val);
                            if (autoAirline) {
                              setAirline(autoAirline);
                            }
                          }}
                          placeholder="ej: FR1486 o IB3820"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden font-medium"
                        />
                      </div>

                      {/* 2. Origen & Destino */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Origen
                          </label>
                          <input
                            type="text"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            placeholder="ej: PMI"
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Destino
                          </label>
                          <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="ej: PSA"
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      {/* 3. Hora de inicio (Salida) & Hora de llegada */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora de inicio (Salida)
                          </label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora de llegada estimada
                          </label>
                          <input
                            type="time"
                            value={arrivalTime}
                            onChange={(e) => setArrivalTime(e.target.value)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* 4. Precio estimado opcional */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€) <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>

                      {/* 5. Más detalles (opcional) */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Detalles del billete, terminal, equipaje o notas adicionales..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hotel Fields */}
                  {activityType === 'hotel' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">Nombre del Alojamiento</label>
                        <input
                          type="text"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                          placeholder="ej: The Grand Luxury Resort & Spa"
                          required
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-[#344054] mb-1">Dirección / Ubicación</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={hotelAddress}
                            onChange={(e) => handleSearchAddress(e.target.value, 'hotelAddress')}
                            onFocus={() => {
                              if (addressSuggestions.length > 0 && activeAddressField === 'hotelAddress') setShowAddressSuggestions(true);
                            }}
                            placeholder="ej: Via Vicinale Ludovico Lazzaro Zamenhof 5, Pisa"
                            className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {isSearchingAddress && activeAddressField === 'hotelAddress' ? (
                              <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#009688] border-t-transparent animate-spin" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                            )}
                          </div>
                        </div>

                        {/* Address Autocomplete Dropdown */}
                        {showAddressSuggestions && activeAddressField === 'hotelAddress' && addressSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                            <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                              <span>Sugerencias de dirección</span>
                              <button
                                type="button"
                                onClick={() => setShowAddressSuggestions(false)}
                                className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            {addressSuggestions.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectAddressSuggestion(item)}
                                className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                              >
                                <MapPin className="h-4 w-4 text-[#009688] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#101828] group-hover:text-[#00796b] truncate">
                                    {item.title}
                                  </p>
                                  {item.subtitle && (
                                    <p className="text-[10px] text-[#667085] truncate mt-0.5">
                                      {item.subtitle}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Hora Check-in</label>
                          <input
                            type="time"
                            value={hotelCheckIn}
                            onChange={(e) => setHotelCheckIn(e.target.value)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Hora Check-out</label>
                          <input
                            type="time"
                            value={hotelCheckOut}
                            onChange={(e) => setHotelCheckOut(e.target.value)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Fecha de salida / Check-out <span className="text-[10px] font-normal text-[#98a2b3]">(opcional, día siguiente por defecto)</span>
                        </label>
                        <input
                          type="date"
                          value={hotelCheckoutDate}
                          onChange={(e) => setHotelCheckoutDate(e.target.value)}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">Más detalles / Tipo de habitación <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span></label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          rows={2}
                          placeholder="Tipo de cama, régimen de comidas, vistas o notas de la reserva..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€) <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Excursion Fields */}
                  {activityType === 'excursion' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">Título de la actividad</label>
                        <input
                          type="text"
                          value={excursionTitle}
                          onChange={(e) => setExcursionTitle(e.target.value)}
                          placeholder="ej: Tour en Catamarán Privado con Snorkel"
                          required
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Hora de inicio</label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Duración</label>
                          <input
                            type="text"
                            value={excursionDuration}
                            onChange={(e) => setExcursionDuration(e.target.value)}
                            placeholder="ej: 4 horas"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">Más detalles / Servicios incluidos <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span></label>
                        <textarea
                          value={actDescription || excursionDesc}
                          onChange={(e) => {
                            setActDescription(e.target.value);
                            setExcursionDesc(e.target.value);
                          }}
                          rows={2}
                          placeholder="Describe la experiencia y detalles de la visita..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€) <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Food Fields */}
                  {activityType === 'food' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">Nombre del Restaurante</label>
                        <input
                          type="text"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="ej: Restaurante Cenacolo"
                          required
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Hora de inicio</label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Momento del día</label>
                          <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value as any)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          >
                            <option value="breakfast">Desayuno</option>
                            <option value="lunch">Almuerzo / Comida</option>
                            <option value="dinner">Cena gourmet</option>
                            <option value="snack">Snack / Degustación</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€) <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Mesa reservada, tipo de menú, código de vestimenta o notas..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Transfer Fields */}
                  {activityType === 'transfer' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Tipo de transporte</label>
                          <select
                            value={transferType}
                            onChange={(e) => setTransferType(e.target.value as any)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          >
                            <option value="taxi">Taxi / Coche privado</option>
                            <option value="bus">Autobús / Minivan</option>
                            <option value="train">Tren</option>
                            <option value="metro">Metro</option>
                            <option value="walking">A pie</option>
                            <option value="other">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Duración estimada</label>
                          <input
                            type="text"
                            value={transferDuration}
                            onChange={(e) => setTransferDuration(e.target.value)}
                            placeholder="ej: 45 min"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Origen with Location Autocomplete */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-[#344054] mb-1">Origen</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={transferOrigin}
                              onChange={(e) => handleSearchAddress(e.target.value, 'transferOrigin')}
                              onFocus={() => {
                                if (addressSuggestions.length > 0 && activeAddressField === 'transferOrigin') setShowAddressSuggestions(true);
                              }}
                              placeholder="ej: Aeropuerto Pisa / Estación"
                              className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isSearchingAddress && activeAddressField === 'transferOrigin' ? (
                                <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#009688] border-t-transparent animate-spin" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                              )}
                            </div>
                          </div>

                          {/* Autocomplete Dropdown for Origen */}
                          {showAddressSuggestions && activeAddressField === 'transferOrigin' && addressSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                              <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                                <span>Sugerencias de origen</span>
                                <button
                                  type="button"
                                  onClick={() => setShowAddressSuggestions(false)}
                                  className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              {addressSuggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectAddressSuggestion(item)}
                                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                                >
                                  <MapPin className="h-4 w-4 text-[#009688] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#101828] group-hover:text-[#00796b] truncate">
                                      {item.title}
                                    </p>
                                    {item.subtitle && (
                                      <p className="text-[10px] text-[#667085] truncate mt-0.5">
                                        {item.subtitle}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Destino with Location Autocomplete */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-[#344054] mb-1">Destino</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={transferDest}
                              onChange={(e) => handleSearchAddress(e.target.value, 'transferDest')}
                              onFocus={() => {
                                if (addressSuggestions.length > 0 && activeAddressField === 'transferDest') setShowAddressSuggestions(true);
                              }}
                              placeholder="ej: Hotel Grand Palace / Centro"
                              className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isSearchingAddress && activeAddressField === 'transferDest' ? (
                                <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#009688] border-t-transparent animate-spin" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                              )}
                            </div>
                          </div>

                          {/* Autocomplete Dropdown for Destino */}
                          {showAddressSuggestions && activeAddressField === 'transferDest' && addressSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                              <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                                <span>Sugerencias de destino</span>
                                <button
                                  type="button"
                                  onClick={() => setShowAddressSuggestions(false)}
                                  className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              {addressSuggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectAddressSuggestion(item)}
                                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                                >
                                  <MapPin className="h-4 w-4 text-[#009688] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#101828] group-hover:text-[#00796b] truncate">
                                      {item.title}
                                    </p>
                                    {item.subtitle && (
                                      <p className="text-[10px] text-[#667085] truncate mt-0.5">
                                        {item.subtitle}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">Hora de inicio</label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Precio estimado (€) <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                          </label>
                          <input
                            type="number"
                            value={actPrice}
                            onChange={(e) => setActPrice(Number(e.target.value))}
                            min={0}
                            placeholder="0"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles <span className="text-[10px] font-normal text-[#98a2b3]">(opcional)</span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Punto de encuentro, conductor, matrícula o notas del traslado..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Field: URL de Icono / Imagen personalizada */}
                  <div className="pt-3 border-t border-[#eaecf0]">
                    <label className="block text-xs font-bold text-[#344054] mb-1">
                      Icono o Imagen personalizada <span className="text-[10px] font-normal text-[#98a2b3]">(URL externa opcional)</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eaecf0] bg-[#fafafa] overflow-hidden p-1 shadow-2xs">
                        <ModalIconPreview
                          customUrl={customIconUrl}
                          type={activityType}
                          flightNumber={flightNumber}
                          airline={airline}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="url"
                          value={customIconUrl}
                          onChange={(e) => setCustomIconUrl(e.target.value)}
                          placeholder="ej: https://logo.clearbit.com/airbnb.com o URL de imagen..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden font-medium"
                        />
                      </div>
                      {customIconUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomIconUrl('')}
                          className="rounded-xl border border-[#e4e4e7] p-2 text-xs text-[#71717a] hover:bg-[#f4f4f5] cursor-pointer"
                          title="Quitar URL"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1">
                      Pega el enlace a un logo o imagen externa (Airbnb, Booking, Renfe, TripAdvisor, etc.). Si la URL no carga o está vacía, se mostrará el icono por defecto.
                    </p>
                  </div>
                </form>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="activityForm"
                  className="rounded-full bg-[#009688] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
                >
                  {editingActivity ? 'Guardar cambios' : 'Añadir al itinerario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* DELETE ACTIVITY CONFIRMATION MODAL                            */}
      {/* ============================================================= */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-bold text-[#101828]">
              ¿Eliminar esta actividad?
            </h3>
            <p className="text-xs text-[#667085] mt-1.5 mb-6 leading-relaxed">
              Esta acción eliminará el bloque del itinerario para el <strong>Día ({activeDate})</strong>. No se puede deshacer.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                className="flex-1 rounded-full border border-[#d0d5dd] bg-white py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteActivity}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* BUDGET EDIT MODAL                                             */}
      {/* ============================================================= */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#009688]" />
                <h3 className="text-sm font-bold text-[#101828]">Presupuesto total del viaje</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="rounded-full p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#101828] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTrip({ ...activeTrip, budget: Number(budgetInput) || 0 });
                setIsBudgetModalOpen(false);
                showToast('💰 Presupuesto actualizado');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">Importe estimado (€)</label>
                <input
                  type="number"
                  min={0}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  required
                  className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2.5 text-sm font-bold text-[#101828] focus:border-[#009688] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#009688] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* COVER PHOTO MODAL                                             */}
      {/* ============================================================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#009688]" />
                <h3 className="text-sm font-bold text-[#101828]">Foto de portada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="rounded-full p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#101828] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTrip({ ...activeTrip, imageUrl: photoUrlInput.trim() });
                setIsPhotoModalOpen(false);
                showToast('🖼 Foto de portada actualizada');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">URL de la imagen</label>
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                  className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2.5 text-xs text-[#101828] focus:border-[#009688] focus:outline-hidden"
                />
              </div>

              {photoUrlInput && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#eaecf0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrlInput} alt="Vista previa" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#009688] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
                >
                  Actualizar portada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Range Picker Modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#009688]" />
                <h3 className="text-sm font-bold text-[#101828]">Modificar fechas del viaje</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="rounded-full p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#101828] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <HeroUIDateRangePicker
              startDate={activeTrip.startDate}
              endDate={activeTrip.endDate}
              onChange={({ startDate, endDate }) => {
                updateTrip({
                  ...activeTrip,
                  startDate,
                  endDate,
                });
                showToast('📅 Fechas de viaje actualizadas');
              }}
            />

            <div className="flex justify-end pt-4 border-t border-[#eaecf0] mt-4">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="rounded-full bg-[#009688] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00796b] transition-all cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
