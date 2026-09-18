"use client";

import { BookingPaymentModal } from "@/components/BookingPaymentModal";
import { TripIncludesModal } from "@/components/TripIncludesModal";
import { DashboardShell } from "@/components/DashboardShell";
import { HeroUIDateRangePicker } from "@/components/HeroUIDateRangePicker";
import { ShareTripModal } from "@/components/ShareTripModal";
import { TripNotFound } from "@/components/TripNotFound";
import { WanderlustLoader } from "@/components/WanderlustLoader";
import {
  Activity,
  ActivityType,
  BookingActivity,
  ExcursionActivity,
  FlightActivity,
  FoodActivity,
  HotelActivity,
  TransferActivity,
  useTravel,
} from "@/context/TravelContext";
import {
  searchNominatimAddresses,
  searchPhotonAddresses,
} from "@/lib/api-client";
import { TRIP_TEMPLATES, TripTemplate } from "@/lib/templates-data";
import { isAgencyUser } from "@/lib/user-utils";
import {
  formatDayDate as formatDayDateUtil,
  formatDayFullLabel as formatDayFullLabelUtil,
  formatFullDate as formatFullDateUtil,
  formatPrice as formatPriceUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
  getDatesBetween,
  getDayActivities,
  getDayIndex as getDayIndexUtil,
  getLanguageLocale as getLanguageLocaleUtil,
  getNextDateStr,
} from "@/utils";
import {
  ArrowLeft,
  Ban,
  Bed,
  BookOpen,
  Bot,
  Calendar,
  CalendarCheck,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Copy,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Globe,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Info,
  Layers,
  ListChecks,
  ListOrdered,
  Lock,
  MapPin,
  Palette,
  Paperclip,
  Plane,
  Plus,
  Route,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Ship,
  Sparkles,
  Sun,
  Train,
  Trash2,
  Type,
  Upload,
  Users,
  Utensils,
  Video,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useMemo, useRef, useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export type BlockType =
  | "text"
  | "title"
  | "itinerary"
  | "services_summary"
  | "conditions"
  | "price"
  | "file"
  | "booking"
  | "hotel"
  | "flight"
  | "activity"
  | "food"
  | "cruise"
  | "transport"
  | "train"
  | "info"
  | "gallery"
  | "video"
  | "notes"
  | "emergency"
  | "weather";

export interface EditorBlock {
  id: string;
  type: BlockType;
  title?: string;
  content?: string;
  data?: Record<string, any>;
}

export interface PersonalizationSettings {
  useAccountTheme: boolean;
  selectedTheme: "classic" | "elegant" | "bold" | "minimal";
  logoUrl?: string;
  showLogoInPublic: boolean;
  primaryColor: string;
  fontFamily: string;
  headerStyle: "compact" | "standard" | "immersive";
}

export interface LanguageSettings {
  selectedLanguage: "es" | "en" | "fr" | "de" | "it" | "pt";
  currency: "EUR" | "USD" | "GBP";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  autoTranslate: boolean;
}

export interface ThemeConfig {
  id: "classic" | "elegant" | "bold" | "minimal";
  name: string;
  isAccountTheme?: boolean;
  previewType: "classic" | "elegant" | "bold" | "minimal";
}

const THEMES: ThemeConfig[] = [
  {
    id: "classic",
    name: "Classic",
    isAccountTheme: true,
    previewType: "classic",
  },
  { id: "elegant", name: "Elegant", previewType: "elegant" },
  { id: "bold", name: "Bold", previewType: "bold" },
  { id: "minimal", name: "Minimal", previewType: "minimal" },
];

const COLOR_PALETTES = [
  { name: "Azul Eléctrico", value: "#0066FF", bg: "bg-[#0066FF]" },
  { name: "Índigo Royal", value: "#140b2a", bg: "bg-[#140b2a]" },
  { name: "Esmeralda", value: "#059669", bg: "bg-[#059669]" },
  { name: "Océano", value: "#0284c7", bg: "bg-[#0284c7]" },
  { name: "Rosa Coral", value: "#e11d48", bg: "bg-[#e11d48]" },
  { name: "Púrpura Profundo", value: "#7c3aed", bg: "bg-[#7c3aed]" },
];

const FONTS = [
  { name: "Outfit (Predeterminada)", value: "var(--font-outfit), sans-serif" },
  { name: "Inter (Moderna & Limpia)", value: "Inter, sans-serif" },
  { name: "Playfair Display (Editorial)", value: "Playfair Display, serif" },
  {
    name: "Plus Jakarta Sans (Geométrica)",
    value: "Plus Jakarta Sans, sans-serif",
  },
];

const AIRLINE_PREFIX_MAP: Record<string, string> = {
  FR: "Ryanair",
  IB: "Iberia",
  I2: "Iberia Express",
  UX: "Air Europa",
  VY: "Vueling",
  EY: "Etihad Airways",
  EK: "Emirates",
  QR: "Qatar Airways",
  LH: "Lufthansa",
  AF: "Air France",
  BA: "British Airways",
  KL: "KLM",
  U2: "easyJet",
  EZY: "easyJet",
  EZS: "easyJet",
  TP: "TAP Air Portugal",
  AZ: "ITA Airways",
  ITY: "ITA Airways",
  DL: "Delta Air Lines",
  AA: "American Airlines",
  UA: "United Airlines",
  TK: "Turkish Airlines",
  AV: "Avianca",
  LA: "LATAM Airlines",
  LX: "Swiss International Air Lines",
  OS: "Austrian Airlines",
  SN: "Brussels Airlines",
  SK: "SAS",
  AY: "Finnair",
  W6: "Wizz Air",
  WZZ: "Wizz Air",
  TO: "Transavia",
  HV: "Transavia",
  NT: "Binter Canarias",
  YW: "Air Nostrum",
  V7: "Volotea",
  NO: "Neos",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  JL: "Japan Airlines",
  NH: "ANA",
};

function detectAirlineFromFlightNumber(flightNum?: string): string | null {
  if (!flightNum) return null;
  const clean = flightNum.trim().toUpperCase().replace(/\s+/g, "");
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

function getAirlineIataCode(
  flightNum?: string,
  airlineName?: string,
): string | null {
  if (flightNum) {
    const clean = flightNum.trim().toUpperCase().replace(/\s+/g, "");
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

function getAirlineLogoUrl(
  flightNum?: string,
  airlineName?: string,
): string | null {
  const code = getAirlineIataCode(flightNum, airlineName);
  if (!code) return null;
  return `https://cdn.logitravel.com/webmobile/vuelos/images/logo_${code.toUpperCase()}.png`;
}

const ACTIVITY_MODAL_IMAGES: Record<string, string> = {
  flight:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80",
  hotel:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
  excursion:
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80",
  food: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
  transfer:
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=80",
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
  const flightLogo =
    type === "flight" ? getAirlineLogoUrl(flightNumber, airline) : null;
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
    <div className="flex h-full w-full items-center justify-center text-[#0066FF]">
      {type === "flight" && <Plane className="h-4 w-4" />}
      {type === "hotel" && <Bed className="h-4 w-4" />}
      {type === "excursion" && <MapPin className="h-4 w-4" />}
      {type === "food" && <Utensils className="h-4 w-4" />}
      {type === "transfer" && <Car className="h-4 w-4" />}
    </div>
  );
}

function ActivityCardIcon({
  act,
  isDraft,
}: {
  act: Activity;
  isDraft: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [act.customIconUrl, act.type]);

  const customUrl = act.customIconUrl?.trim();
  const flightLogo =
    act.type === "flight"
      ? getAirlineLogoUrl(act.flightNumber, act.airline)
      : null;
  const effectiveSrc = !hasError && (customUrl || flightLogo);

  const isFlightLogo = act.type === "flight" && Boolean(effectiveSrc);

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden transition-transform ${
        isFlightLogo
          ? "rounded-full bg-white border border-slate-200 shadow-xs p-0"
          : effectiveSrc
            ? "rounded-2xl bg-white border border-slate-100 shadow-2xs overflow-hidden"
            : isDraft
              ? "rounded-2xl bg-amber-100 text-amber-700"
              : "rounded-2xl bg-[#eff6ff] text-[#0066FF]"
      }`}
    >
      {effectiveSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effectiveSrc}
          alt={act.type}
          className={`h-full w-full ${isFlightLogo ? "object-cover rounded-full" : "object-cover rounded-2xl"}`}
          onError={() => setHasError(true)}
        />
      ) : (
        <>
          {act.type === "flight" && <Plane className="h-5 w-5" />}
          {act.type === "hotel" && <Bed className="h-5 w-5" />}
          {act.type === "excursion" && <MapPin className="h-5 w-5" />}
          {act.type === "food" && <Utensils className="h-5 w-5" />}
          {act.type === "transfer" && <Car className="h-5 w-5" />}
          {act.type === "booking" && (
            <CalendarCheck className="h-5 w-5 text-[#0066FF]" />
          )}
          {act.type === "conditions" && (
            <div className="flex items-center -space-x-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 border border-rose-300">
                <Ban className="h-2.5 w-2.5 stroke-[3]" />
              </span>
            </div>
          )}
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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
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
  sender: "user" | "agent";
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
    user,
  } = useTravel();

  const isAgency = isAgencyUser(user);
  const router = useRouter();

  // Right Panel State (Bloques, Agente IA, Plantillas, Personalización, Idioma, Viajeros, Documento)
  const [rightPanelTab, setRightPanelTab] = useState<
    | "blocks"
    | "agent"
    | "templates"
    | "personalization"
    | "languages"
    | "clients"
    | "document"
  >("blocks");
  const [isMobileRightPanelOpen, setIsMobileRightPanelOpen] = useState(false);

  // Block Category Accordions
  const [blockCategoriesOpen, setBlockCategoriesOpen] = useState<{
    esenciales: boolean;
    servicios: boolean;
    multimedia: boolean;
    otros: boolean;
  }>({
    esenciales: true,
    servicios: true,
    multimedia: true,
    otros: true,
  });

  const toggleBlockCategory = (
    cat: "esenciales" | "servicios" | "multimedia" | "otros",
  ) => {
    setBlockCategoriesOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Language settings state
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    selectedLanguage: "es",
    currency: "EUR",
    dateFormat: "DD/MM/YYYY",
    autoTranslate: true,
  });

  // Itinerary View Mode: 'day' (per-day tab view) vs 'all' (full trip continuous view)
  const [itineraryViewMode, setItineraryViewMode] = useState<"day" | "all">(
    "day",
  );

  // Load saved itinerary view mode from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("travel_itinerary_view_mode") as
        | "day"
        | "all"
        | null;
      if (savedMode === "day" || savedMode === "all") {
        setItineraryViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage errors (e.g. incognito/restricted)
    }
  }, []);

  const changeItineraryViewMode = (mode: "day" | "all") => {
    setItineraryViewMode(mode);
    try {
      localStorage.setItem("travel_itinerary_view_mode", mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Drag and Drop States
  const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(
    null,
  );
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [dragOverDayDate, setDragOverDayDate] = useState<string | null>(null);
  const [targetModalDate, setTargetModalDate] = useState<string>("");

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
  const [tripTitleInput, setTripTitleInput] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(2500);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState("");

  // Personalization settings State
  const proposalLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [themeSettings, setThemeSettings] = useState<PersonalizationSettings>({
    useAccountTheme: true,
    selectedTheme: "classic",
    logoUrl: "/wanderlust_horizontal_negro.png",
    showLogoInPublic: true,
    primaryColor: "#0066FF",
    fontFamily: "var(--font-outfit), sans-serif",
    headerStyle: "standard",
  });

  // Effective agency logo for the itinerary proposal
  const effectiveDisplayLogo = useMemo(() => {
    if (
      themeSettings.logoUrl &&
      themeSettings.logoUrl !== "/wanderlust_horizontal_negro.png"
    ) {
      return themeSettings.logoUrl;
    }
    if (user?.agencyLogo) {
      return user.agencyLogo;
    }
    return "/wanderlust_horizontal_negro.png";
  }, [themeSettings.logoUrl, user?.agencyLogo]);

  // Load trip-specific logo override or account agency logo on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tripSpecificLogo = id
        ? localStorage.getItem(`wanderlust_trip_logo_${id}`)
        : null;
      const agencyLogo = user?.agencyLogo;

      if (tripSpecificLogo) {
        setThemeSettings((prev) => ({ ...prev, logoUrl: tripSpecificLogo }));
      } else if (agencyLogo) {
        setThemeSettings((prev) => ({ ...prev, logoUrl: agencyLogo }));
      }
    }
  }, [id, user?.agencyLogo]);

  // Sync themeSettings whenever user.agencyLogo updates
  useEffect(() => {
    const globalLogo = user?.agencyLogo;

    if (globalLogo) {
      setThemeSettings((prev) => {
        const tripSpecific =
          typeof window !== "undefined" && id
            ? localStorage.getItem(`wanderlust_trip_logo_${id}`)
            : null;
        if (
          !tripSpecific ||
          prev.useAccountTheme ||
          prev.logoUrl === "/wanderlust_horizontal_negro.png" ||
          !prev.logoUrl
        ) {
          return { ...prev, logoUrl: globalLogo };
        }
        return prev;
      });
    }
  }, [user?.agencyLogo, id]);

  // Listen to live agency logo updates (e.g. from Cuenta -> Apariencia)
  useEffect(() => {
    const handleLogoEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newLogo = customEvent.detail;
      setThemeSettings((prev) => ({
        ...prev,
        logoUrl: newLogo || "/wanderlust_horizontal_negro.png",
      }));
    };

    window.addEventListener(
      "wanderlust:agency-logo-updated",
      handleLogoEvent as EventListener,
    );
    return () => {
      window.removeEventListener(
        "wanderlust:agency-logo-updated",
        handleLogoEvent as EventListener,
      );
    };
  }, []);

  const handleUpdateThemeSettings = (
    newSettings: Partial<PersonalizationSettings>,
  ) => {
    setThemeSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined" && id && newSettings.logoUrl !== undefined) {
        if (
          newSettings.logoUrl === "/wanderlust_horizontal_negro.png" ||
          !newSettings.logoUrl
        ) {
          localStorage.removeItem(`wanderlust_trip_logo_${id}`);
        } else {
          localStorage.setItem(`wanderlust_trip_logo_${id}`, newSettings.logoUrl);
        }
      }
      return updated;
    });
    showToast("🎨 Personalización actualizada");
  };

  const handleProposalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("⚠️ El logotipo no debe superar los 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          handleUpdateThemeSettings({ logoUrl: dataUrl });
          showToast("✨ Logotipo de la propuesta actualizado");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyTemplate = async (template: TripTemplate) => {
    if (!activeTrip) return;
    const tripDatesList = getDatesBetween(
      activeTrip.startDate,
      activeTrip.endDate,
    );

    const newActivities: Activity[] = template.activities.map((item, idx) => {
      const targetDate = tripDatesList[item.dayOffset] || tripDatesList[0];
      const baseId = `tpl-${Date.now()}-${idx}`;
      if (item.type === "flight") {
        const flightAct: FlightActivity = {
          id: baseId,
          type: "flight",
          date: targetDate,
          time: item.time,
          price: item.price,
          flightNumber: item.details?.flightNumber || "",
          airline: item.details?.airline || "",
          origin: item.details?.origin || "",
          destination: item.details?.destination || "",
          arrivalTime: item.details?.arrivalTime || "12:30",
          description: item.details?.description || item.title || "",
        };
        return flightAct;
      } else if (item.type === "hotel") {
        const hotelAct: HotelActivity = {
          id: baseId,
          type: "hotel",
          date: targetDate,
          time: item.time,
          price: item.price,
          hotelName: item.details?.hotelName || item.title,
          address: item.details?.address || "",
          checkIn: item.details?.checkIn || "14:00",
          checkOut: item.details?.checkOut || "11:00",
          description:
            item.details?.roomType || item.details?.description || "",
        };
        return hotelAct;
      } else if (item.type === "food") {
        const foodAct: FoodActivity = {
          id: baseId,
          type: "food",
          date: targetDate,
          time: item.time,
          price: item.price,
          restaurantName: item.details?.restaurantName || item.title,
          mealType: "dinner",
          description: item.details?.notes || item.details?.description || "",
        };
        return foodAct;
      } else if (item.type === "transfer") {
        const transferAct: TransferActivity = {
          id: baseId,
          type: "transfer",
          date: targetDate,
          time: item.time,
          price: item.price,
          transportType: "taxi",
          origin:
            item.details?.from ||
            item.details?.pickupLocation ||
            item.details?.origin ||
            "",
          destination: item.details?.to || item.details?.destination || "",
          duration: item.details?.duration || "45 min",
          description:
            item.details?.vehicleType || item.details?.description || "",
        };
        return transferAct;
      } else {
        const excursionAct: ExcursionActivity = {
          id: baseId,
          type: "excursion",
          date: targetDate,
          time: item.time,
          price: item.price,
          title: item.details?.title || item.title,
          duration: item.details?.duration || "3 horas",
          description: item.details?.location
            ? `Ubicación: ${item.details.location}`
            : item.details?.description || "",
        };
        return excursionAct;
      }
    });

    await updateTrip({
      ...activeTrip,
      imageUrl: activeTrip.imageUrl || template.imageUrl,
      budget: template.estimatedBudget || activeTrip.budget,
      activities: [...activeTrip.activities, ...newActivities],
    });
    showToast(
      `✨ Plantilla "${template.title}" aplicada (+${newActivities.length} actividades)`,
    );
  };

  // Selected Day in Itinerary
  const [selectedDayDate, setSelectedDayDate] = useState<string>("");

  // Delete Activity Confirmation Dialog State
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // Activity Edit Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("flight");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Booking / Payment Conditions Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBookingActivity, setEditingBookingActivity] =
    useState<BookingActivity | null>(null);

  // Trip Includes & Excludes Modal State
  const [isIncludesModalOpen, setIsIncludesModalOpen] = useState(false);
  const [editingIncludesActivity, setEditingIncludesActivity] = useState<any>(null);
  const [collapsedIncludesCards, setCollapsedIncludesCards] = useState<Record<string, boolean>>({});

  // Activity Form Fields
  const [actTime, setActTime] = useState("10:00");
  const [actPrice, setActPrice] = useState<number>(0);
  const [actDescription, setActDescription] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState("14:00");
  const [hotelCheckOut, setHotelCheckOut] = useState("11:00");
  const [hotelCheckoutDate, setHotelCheckoutDate] = useState("");
  const [excursionTitle, setExcursionTitle] = useState("");
  const [excursionDesc, setExcursionDesc] = useState("");
  const [excursionDuration, setExcursionDuration] = useState("3 horas");
  const [restaurantName, setRestaurantName] = useState("");
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");
  const [transferType, setTransferType] = useState<
    "taxi" | "bus" | "train" | "metro" | "walking" | "other"
  >("taxi");
  const [transferOrigin, setTransferOrigin] = useState("");
  const [transferDest, setTransferDest] = useState("");
  const [transferDuration, setTransferDuration] = useState("45 min");
  const [customIconUrl, setCustomIconUrl] = useState("");

  // AeroDataBox Flight Lookup State & Action
  const [isLookingUpFlight, setIsLookingUpFlight] = useState(false);

  const handleLookupFlight = async () => {
    const clean = flightNumber.trim();
    if (!clean) {
      showToast("⚠️ Introduce un número de vuelo (ej: EY116, AA100, IB3820)");
      return;
    }

    const targetDate =
      targetModalDate || (editingActivity ? editingActivity.date : activeDate);
    setIsLookingUpFlight(true);

    try {
      const queryParams = new URLSearchParams({ flightNumber: clean });
      if (targetDate) {
        queryParams.set("date", targetDate);
      }
      if (origin.trim()) {
        queryParams.set("origin", origin.trim());
      }
      if (destination.trim()) {
        queryParams.set("destination", destination.trim());
      }

      const res = await fetch(`/api/flights/lookup?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.airline) setAirline(data.airline);
        if (data.origin) setOrigin(data.origin);
        if (data.destination) setDestination(data.destination);
        if (data.departureTime) setActTime(data.departureTime);
        if (data.arrivalTime) setArrivalTime(data.arrivalTime);
        if (data.flightNumber) setFlightNumber(data.flightNumber);

        const extras: string[] = [];
        if (data.departureTerminal) extras.push(`Terminal salida: ${data.departureTerminal}`);
        if (data.arrivalTerminal) extras.push(`Terminal llegada: ${data.arrivalTerminal}`);
        if (data.aircraftModel) extras.push(`Aeronave: ${data.aircraftModel}`);

        if (extras.length > 0 && !actDescription.trim()) {
          setActDescription(extras.join(" • "));
        }

        showToast(
          `✈️ Vuelo ${data.flightNumber || clean} autocompletado (${data.source === "google-flights2" ? "Google Flights" : "AeroDataBox"})`
        );
      } else {
        showToast(
          data.message ||
            `⚠️ No se encontró información para el vuelo ${clean}. Revisa el código.`
        );
      }
    } catch (err) {
      console.error("Error al buscar vuelo:", err);
      showToast("⚠️ Error al conectar con el servicio de vuelos");
    } finally {
      setIsLookingUpFlight(false);
    }
  };

  // Smart Hotel Lookup State & Action
  const [isLookingUpHotel, setIsLookingUpHotel] = useState(false);

  const handleLookupHotel = async () => {
    const clean = hotelName.trim();
    if (!clean) {
      showToast("⚠️ Introduce el nombre del hotel para autocompletar");
      return;
    }

    setIsLookingUpHotel(true);

    try {
      const queryParams = new URLSearchParams({ query: clean });
      const tripDest = (activeTrip as any)?.destination || activeTrip?.name || "";
      if (tripDest) {
        queryParams.set("city", tripDest);
      }

      const res = await fetch(`/api/hotels/lookup?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.hotelName) setHotelName(data.hotelName);
        if (data.address) setHotelAddress(data.address);
        if (data.photoUrl && (!customIconUrl || !customIconUrl.trim())) {
          setCustomIconUrl(data.photoUrl);
        }
        if (data.description && (!actDescription || !actDescription.trim())) {
          setActDescription(data.description);
        }
        if (data.checkInTime && (!actTime || actTime === "10:00" || actTime === "09:00" || actTime === "14:00")) {
          setActTime(data.checkInTime);
        }
        if (data.checkOutTime) {
          setHotelCheckOut(data.checkOutTime);
        }

        const starsStr = data.stars ? ` (${data.stars}⭐)` : "";
        showToast(
          `🏨 ${data.hotelName}${starsStr} autocompletado con éxito`
        );
      } else {
        showToast(
          data.message ||
            `⚠️ No se encontró información para "${clean}". Revisa el nombre.`
        );
      }
    } catch (err) {
      console.error("Error al buscar hotel:", err);
      showToast("⚠️ Error al conectar con el servicio de hoteles");
    } finally {
      setIsLookingUpHotel(false);
    }
  };

  // Address / Location Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<
    { title: string; subtitle: string; full: string }[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [activeAddressField, setActiveAddressField] = useState<
    "hotelAddress" | "transferOrigin" | "transferDest" | null
  >(null);
  const addressSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchAddress = (
    value: string,
    field: "hotelAddress" | "transferOrigin" | "transferDest",
  ) => {
    setActiveAddressField(field);
    if (field === "hotelAddress") setHotelAddress(value);
    else if (field === "transferOrigin") setTransferOrigin(value);
    else if (field === "transferDest") setTransferDest(value);

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
        let list = await searchPhotonAddresses(clean);
        if (!list || list.length === 0) {
          list = await searchNominatimAddresses(clean);
        }
        setAddressSuggestions(list);
        setShowAddressSuggestions(list.length > 0);
      } catch (err) {
        console.warn("Error en la búsqueda de dirección:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 280);
  };

  const handleSelectAddressSuggestion = (item: {
    title: string;
    subtitle: string;
    full: string;
  }) => {
    const chosenTitle = item.title || item.full;
    if (activeAddressField === "hotelAddress") {
      setHotelAddress(item.full || chosenTitle);
    } else if (activeAddressField === "transferOrigin") {
      setTransferOrigin(chosenTitle);
    } else if (activeAddressField === "transferDest") {
      setTransferDest(chosenTitle);
    }
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setActiveAddressField(null);
  };

  const handleAddressChange = (value: string) => {
    handleSearchAddress(value, "hotelAddress");
  };

  // AI Agent Chat State
  const [chatInput, setChatInput] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [appliedActionKeys, setAppliedActionKeys] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "agent",
      text: "¡Hola! Soy tu asistente de viaje Wanderlust. Puedo sugerirte hoteles de lujo, vuelos, restaurantes locales y generar itinerarios para cada día.",
      timestamp: "Ahora",
    },
    {
      id: "msg-2",
      sender: "agent",
      text: '¿En qué te puedo ayudar hoy? Puedes pedirme por ejemplo: "Añadir un restaurante típico para cenar" o "Buscar excursión en catamarán".',
      timestamp: "Ahora",
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
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAgentThinking]);

  // Trip Dates & Active Day calculation (Hooks must always run before early returns)
  const tripDates = useMemo(() => {
    if (!activeTrip) return [];
    return getDatesBetween(activeTrip.startDate, activeTrip.endDate);
  }, [activeTrip?.startDate, activeTrip?.endDate]);

  const activeDate = useMemo(() => {
    if (!tripDates.length) return "";
    return tripDates.includes(selectedDayDate)
      ? selectedDayDate
      : tripDates[0] || "";
  }, [tripDates, selectedDayDate]);

  // Activities for selected day (including check-out reminders for accommodations)
  const rawDayActivities = useMemo(() => {
    if (!activeTrip?.activities || !activeDate) return [];
    return getDayActivities(activeTrip.activities, activeDate);
  }, [activeTrip?.activities, activeDate]);

  const dayActivities = useMemo(() => {
    return rawDayActivities.filter(
      (a) => a.type !== "conditions" && !(a as any).isIncludesBlock,
    );
  }, [rawDayActivities]);

  // Trip Includes & Excludes activity block (rendered outside of the days, at the bottom)
  const tripIncludesActivity = useMemo(() => {
    if (!activeTrip?.activities) return null;
    return (
      activeTrip.activities.find(
        (a) =>
          a.type === "conditions" ||
          (a as any).isIncludesBlock ||
          (typeof (a as any).title === "string" &&
            (a as any).title.toLowerCase().includes("incluye")),
      ) || null
    );
  }, [activeTrip?.activities]);

  // Sumatoria total de todos los gastos de las actividades del viaje
  const totalTripExpenses = useMemo(() => {
    if (!activeTrip?.activities) return 0;
    return activeTrip.activities.reduce(
      (sum, act) => sum + (Number(act.price) || 0),
      0,
    );
  }, [activeTrip?.activities]);

  if (isLoading) {
    return <WanderlustLoader />;
  }

  if (!activeTrip) {
    return <TripNotFound />;
  }

  const tripCode = getTripCode(activeTrip.id);

  // Dynamic Currency & Price Formatters (delegated to @/utils)
  const getCurrencySymbol = () =>
    getCurrencySymbolUtil(languageSettings.currency);
  const formatPrice = (amount?: number | string | null) =>
    formatPriceUtil(amount, languageSettings.currency);

  // Dynamic Date Formatters (delegated to @/utils)
  const formatDayDate = (dateStr: string) =>
    formatDayDateUtil(dateStr, languageSettings.dateFormat);
  const formatFullDate = (dateStr: string) =>
    formatFullDateUtil(dateStr, languageSettings.dateFormat);
  const getLanguageLocale = () =>
    getLanguageLocaleUtil(languageSettings.selectedLanguage);
  const getDayIndex = (dateStr: string) => getDayIndexUtil(dateStr, tripDates);
  const formatDayFullLabel = (dateStr: string) =>
    formatDayFullLabelUtil(dateStr, {
      language: languageSettings.selectedLanguage,
      dateFormat: languageSettings.dateFormat,
    });

  // -------------------------------------------------------------
  // Drag and Drop Handlers
  // -------------------------------------------------------------
  const handleDragStartFromPalette = (type: BlockType, e?: React.DragEvent) => {
    setDraggedBlockType(type);
    if (e) {
      e.dataTransfer.setData("text/plain", type);
      e.dataTransfer.effectAllowed = "copyMove";
    }
  };

  const handleActivityDragStart = (act: Activity, e: React.DragEvent) => {
    setDraggedActivity(act);
    e.dataTransfer.setData("text/plain", act.id);
    e.dataTransfer.effectAllowed = "move";
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
        showToast(
          `🔄 Actividad movida al Día ${dayIdx} (${formatDayDate(targetDate)})`,
        );
      }
      setDraggedActivity(null);
      return;
    }

    // If dropping a block from palette:
    const rawType = (draggedBlockType ||
      e.dataTransfer.getData("text/plain")) as BlockType;
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
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAgentThinking(true);

    try {
      const response = await fetch("/api/assistant/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo obtener respuesta del agente",
        );
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text:
          data.message ||
          "He preparado una recomendación personalizada para tu viaje.",
        timestamp: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedAction: data.suggestedAction || undefined,
        suggestedActions:
          Array.isArray(data.suggestedActions) &&
          data.suggestedActions.length > 0
            ? data.suggestedActions
            : undefined,
      };

      setChatMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("AI agent error:", err);
      const errorMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `Lo siento, ha ocurrido un problema al consultar con el asistente: ${
          err instanceof Error ? err.message : "Error de conexión"
        }. Por favor, inténtalo de nuevo.`,
        timestamp: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const handleApplySuggestedAction = async (
    action: SuggestedActionItem,
    actionKey?: string,
  ) => {
    const targetDate = action.date || targetModalDate || activeDate;
    if (action.type === "food") {
      const foodPayload: Omit<FoodActivity, "id"> = {
        type: "food",
        date: targetDate,
        time: action.payload?.time || "20:30",
        price: Number(action.payload?.price) || 50,
        restaurantName:
          action.payload?.restaurantName ||
          action.payload?.title ||
          action.label ||
          "Restaurante Recomendado",
        mealType: action.payload?.mealType || "dinner",
        description: action.payload?.description || "",
      };
      await addActivity(activeTrip.id, foodPayload);
    } else if (action.type === "hotel") {
      const hotelPayload: Omit<HotelActivity, "id"> = {
        type: "hotel",
        date: targetDate,
        time: action.payload?.time || "15:00",
        price: Number(action.payload?.price) || 150,
        hotelName:
          action.payload?.hotelName ||
          action.payload?.title ||
          action.label ||
          "Alojamiento Recomendado",
        address: action.payload?.address || "",
        checkIn: action.payload?.checkIn || "15:00",
        checkOut: action.payload?.checkOut || "12:00",
        description: action.payload?.description || "",
      };
      await addActivity(activeTrip.id, hotelPayload);
    } else if (action.type === "excursion") {
      const excursionPayload: Omit<ExcursionActivity, "id"> = {
        type: "excursion",
        date: targetDate,
        time: action.payload?.time || "10:00",
        price: Number(action.payload?.price) || 70,
        title: action.payload?.title || action.label || "Excursión / Actividad",
        duration: action.payload?.duration || "3 horas",
        description: action.payload?.description || "",
      };
      await addActivity(activeTrip.id, excursionPayload);
    } else if (action.type === "flight") {
      const flightPayload: Omit<FlightActivity, "id"> = {
        type: "flight",
        date: targetDate,
        time: action.payload?.time || "11:00",
        price: Number(action.payload?.price) || 300,
        flightNumber: action.payload?.flightNumber || "FLIGHT",
        airline: action.payload?.airline || "Aerolínea",
        origin: action.payload?.origin || "Origen",
        destination: action.payload?.destination || "Destino",
        arrivalTime: action.payload?.arrivalTime || "",
      };
      await addActivity(activeTrip.id, flightPayload);
    } else if (action.type === "transfer") {
      const transferPayload: Omit<TransferActivity, "id"> = {
        type: "transfer",
        date: targetDate,
        time: action.payload?.time || "09:00",
        price: Number(action.payload?.price) || 30,
        transportType: action.payload?.transportType || "train",
        origin: action.payload?.origin || "Origen",
        destination: action.payload?.destination || "Destino",
        duration: action.payload?.duration || "45 min",
        description: action.payload?.description || "",
      };
      await addActivity(activeTrip.id, transferPayload);
    }

    if (actionKey) {
      setAppliedActionKeys((prev) =>
        prev.includes(actionKey) ? prev : [...prev, actionKey],
      );
    }
    showToast(
      `✨ ${action.label || "Actividad"} añadido con éxito al itinerario.`,
    );
  };

  const handleApplyAllSuggestedActions = async (
    actions: SuggestedActionItem[],
    msgId: string,
  ) => {
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
  const handleOpenAddActivity = (
    type: ActivityType = "flight",
    forDate?: string,
  ) => {
    const effectiveDate = forDate || activeDate;
    setEditingActivity(null);
    setTargetModalDate(effectiveDate);
    setActivityType(type);
    setActTime("10:00");
    setActPrice(0);
    setActDescription("");
    setCustomIconUrl("");
    setFlightNumber("");
    setAirline("");
    setOrigin("");
    setDestination("");
    setArrivalTime("");
    setHotelName("");
    setHotelAddress("");
    setHotelCheckIn("14:00");
    setHotelCheckOut("11:00");
    setHotelCheckoutDate(getNextDateStr(effectiveDate));
    setExcursionTitle("");
    setExcursionDesc("");
    setRestaurantName("");
    setTransferOrigin("");
    setTransferDest("");
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (rawAct: Activity) => {
    // If opening from a checkout card, resolve original hotel parent activity
    const originalAct = rawAct.isCheckout
      ? activeTrip.activities.find(
          (a) => a.id === (rawAct.originalId || rawAct.id),
        ) || rawAct
      : rawAct;
    const act = originalAct;

    if (act.type === "booking") {
      setEditingBookingActivity(act as BookingActivity);
      setIsBookingModalOpen(true);
      return;
    }

    if (
      act.type === "conditions" ||
      (act as any).isIncludesBlock ||
      (act as any).title?.toLowerCase().includes("incluye")
    ) {
      setEditingIncludesActivity(act);
      setIsIncludesModalOpen(true);
      return;
    }

    setEditingActivity(act);
    setTargetModalDate(act.date);
    setActivityType(act.type);
    setActTime(act.time);
    setActPrice(act.price || 0);
    setActDescription(act.description || "");
    setCustomIconUrl(act.customIconUrl || "");

    if (act.type === "flight") {
      const detected = detectAirlineFromFlightNumber(act.flightNumber);
      setFlightNumber(act.flightNumber || "");
      setAirline(act.airline || detected || "");
      setOrigin(act.origin || "");
      setDestination(act.destination || "");
      setArrivalTime(act.arrivalTime || "");
    } else if (act.type === "hotel") {
      setHotelName(act.hotelName || "");
      setHotelAddress(act.address || "");
      setHotelCheckIn(act.checkIn || "14:00");
      setHotelCheckOut(act.checkOut || "11:00");
      setHotelCheckoutDate(
        act.checkoutDate || (act.date ? getNextDateStr(act.date) : ""),
      );
    } else if (act.type === "excursion") {
      setExcursionTitle(act.title || "");
      setExcursionDesc(act.description || "");
      setExcursionDuration(act.duration || "3 horas");
    } else if (act.type === "food") {
      setRestaurantName(act.restaurantName || "");
      setMealType(act.mealType || "lunch");
    } else if (act.type === "transfer") {
      setTransferType(act.transportType || "taxi");
      setTransferOrigin(act.origin || "");
      setTransferDest(act.destination || "");
      setTransferDuration(act.duration || "45 min");
    }
    setIsActivityModalOpen(true);
  };

  const handleDuplicateActivity = async (
    act: Activity,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const targetId = act.isCheckout ? act.originalId || act.id : act.id;
    const base = activeTrip.activities.find((a) => a.id === targetId) || act;
    const { id: _id, ...rest } = base;
    await addActivity(activeTrip.id, {
      ...rest,
      time: rest.time,
    });
    showToast("📄 Actividad duplicada");
  };

  const handleRequestDeleteActivity = (actId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Check if it's a checkout virtual id
    const found = activeTrip.activities.find(
      (a) => a.id === actId || `${a.id}-checkout` === actId,
    );
    setActivityToDelete(found ? found.id : actId);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete || !activeTrip) return;
    const idToDelete = activityToDelete;
    setActivityToDelete(null);
    await deleteActivity(activeTrip.id, idToDelete);
    showToast("🗑 Actividad eliminada del itinerario");
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const actDateToUse =
      targetModalDate || (editingActivity ? editingActivity.date : activeDate);

    let activityPayload:
      | Omit<FlightActivity, "id">
      | Omit<HotelActivity, "id">
      | Omit<ExcursionActivity, "id">
      | Omit<FoodActivity, "id">
      | Omit<TransferActivity, "id">;

    if (activityType === "flight") {
      activityPayload = {
        type: "flight",
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        flightNumber: flightNumber || "IB3820",
        airline:
          airline || detectAirlineFromFlightNumber(flightNumber) || "Vuelo",
        origin: origin || "Madrid (MAD)",
        destination: destination || "Cancún (CUN)",
        arrivalTime: arrivalTime || "14:30",
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === "hotel") {
      activityPayload = {
        type: "hotel",
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        hotelName: hotelName || "Grand Hotel & Spa",
        address: hotelAddress || "Playa del Carmen, México",
        checkIn: hotelCheckIn,
        checkOut: hotelCheckOut,
        checkoutDate: hotelCheckoutDate || undefined,
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === "excursion") {
      activityPayload = {
        type: "excursion",
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        title: excursionTitle || "Tour Guiado y Entradas",
        description: actDescription.trim() || excursionDesc.trim() || undefined,
        duration: excursionDuration,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else if (activityType === "food") {
      activityPayload = {
        type: "food",
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        restaurantName: restaurantName || "Restaurante Gourmet",
        mealType,
        description: actDescription.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
      };
    } else {
      activityPayload = {
        type: "transfer",
        date: actDateToUse,
        time: actTime,
        price: Number(actPrice) || 0,
        transportType: transferType,
        origin: transferOrigin || "Aeropuerto",
        destination: transferDest || "Hotel Resort",
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
      showToast("✏ Actividad actualizada");
    } else {
      await addActivity(activeTrip.id, activityPayload);
      showToast("➕ Actividad añadida");
    }

    setIsActivityModalOpen(false);
  };

  const handleSaveTripTitle = () => {
    if (tripTitleInput.trim() && tripTitleInput !== activeTrip.name) {
      updateTrip({
        ...activeTrip,
        name: tripTitleInput.trim(),
      });
      showToast("💾 Título actualizado");
    }
    setIsEditingTitle(false);
  };

  const handleCopyClientLink = () => {
    const url = `${window.location.origin}/publico/${encodeURIComponent(tripCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("🔗 ¡Enlace de cliente copiado al portapapeles!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateBlankActivity = async (
    type: BlockType,
    openModalImmediately: boolean = true,
    targetDate?: string,
  ) => {
    if (!activeTrip) return;
    const dateToUse = targetDate || activeDate;

    let newPayload:
      | Omit<FlightActivity, "id">
      | Omit<HotelActivity, "id">
      | Omit<ExcursionActivity, "id">
      | Omit<FoodActivity, "id">
      | Omit<TransferActivity, "id">;

    if (type === "flight") {
      newPayload = {
        type: "flight",
        date: dateToUse,
        time: "10:00",
        price: 0,
        flightNumber: "",
        airline: "",
        origin: "",
        destination: "",
        arrivalTime: "",
      };
    } else if (type === "hotel") {
      newPayload = {
        type: "hotel",
        date: dateToUse,
        time: "14:00",
        price: 0,
        hotelName: "",
        address: "",
        checkIn: "14:00",
        checkOut: "11:00",
        checkoutDate: getNextDateStr(dateToUse),
        description: "",
      };
    } else if (type === "food") {
      newPayload = {
        type: "food",
        date: dateToUse,
        time: "13:30",
        price: 0,
        restaurantName: "",
        mealType: "lunch",
        description: "",
      };
    } else if (type === "transport" || (type as string) === "transfer") {
      newPayload = {
        type: "transfer",
        date: dateToUse,
        time: "09:00",
        price: 0,
        transportType: "taxi",
        origin: "",
        destination: "",
        duration: "30 min",
        description: "",
      };
    } else if (type === "price") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "12:00",
        price: 0,
        title: "Desglose de Tarifas y Precios",
        duration: "-",
        description: "Detalle de importes, suplementos y condiciones de pago.",
      };
    } else if (type === "info") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "09:00",
        price: 0,
        title: "Información del Destino",
        duration: "-",
        description: "Recomendaciones, huso horario, documentación y moneda.",
      };
    } else if (type === "booking") {
      setEditingBookingActivity(null);
      setTargetModalDate(dateToUse);
      setIsBookingModalOpen(true);
      return;
    } else if (type === "file") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "08:00",
        price: 0,
        title: "Documentos & Vouchers",
        duration: "-",
        description: "Billetes electrónicos, pólizas y bonos confirmados.",
      };
    } else if (type === "text") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "09:00",
        price: 0,
        title: "Nota / Texto Informativo",
        duration: "-",
        description:
          "Escribe aquí la información descriptiva, mensaje de bienvenida o recomendaciones del día.",
      };
    } else if (type === "title") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "08:30",
        price: 0,
        title: "Título de Sección",
        duration: "-",
        description: "",
      };
    } else if (type === "itinerary") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "08:00",
        price: 0,
        title: "Resumen de Ruta e Itinerario",
        duration: "-",
        description:
          "Visión global del recorrido, distancias y paradas programadas.",
      };
    } else if (type === "services_summary") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "12:30",
        price: 0,
        title: "Documentos & Billetes del Viaje",
        duration: "-",
        description:
          "Billetes electrónicos, bonos de alojamiento (vouchers) y póliza de seguro Wanderlust Assistance.",
      };
    } else if (type === "conditions") {
      setEditingIncludesActivity(null);
      setTargetModalDate(dateToUse);
      setIsIncludesModalOpen(true);
      return;
    } else if (type === "cruise") {
      newPayload = {
        type: "transfer",
        date: dateToUse,
        time: "16:00",
        price: 0,
        transportType: "other",
        origin: "Puerto de Salida",
        destination: "Alta Mar / Puerto de Escala",
        duration: "Navegación",
        description:
          "Embarque en crucero, camarote asignado y régimen todo incluido.",
      };
    } else if (type === "train") {
      newPayload = {
        type: "transfer",
        date: dateToUse,
        time: "09:30",
        price: 0,
        transportType: "train",
        origin: "Estación de Origen",
        destination: "Estación de Destino",
        duration: "2h 15m",
        description: "Tren de alta velocidad, billetes y asientos reservados.",
      };
    } else if (type === "gallery") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "17:00",
        price: 0,
        title: "Galería Fotográfica del Destino",
        duration: "-",
        description:
          "Álbum visual de los lugares más espectaculares del viaje.",
      };
    } else if (type === "video") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "18:00",
        price: 0,
        title: "Vídeo Promocional & Guía Visual",
        duration: "-",
        description: "Presentación audiovisual de las experiencias reservadas.",
      };
    } else if (type === "notes") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "19:00",
        price: 0,
        title: "Notas Importantes & Políticas",
        duration: "-",
        description:
          "Normativa local, requisitos de entrada y políticas de cancelación.",
      };
    } else if (type === "emergency") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "00:00",
        price: 0,
        title: "Asistencia 24/7 & Teléfonos de Emergencia",
        duration: "-",
        description:
          "Contacto directo de la agencia y número de póliza médica de asistencia.",
      };
    } else if (type === "weather") {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "07:00",
        price: 0,
        title: "Clima & Recomendaciones de Equipaje",
        duration: "-",
        description:
          "Temperatura prevista, tipo de calzado y vestimenta aconsejada.",
      };
    } else {
      newPayload = {
        type: "excursion",
        date: dateToUse,
        time: "10:00",
        price: 0,
        title: "",
        duration: "2 horas",
        description: "",
      };
    }

    const created = await addActivity(activeTrip.id, newPayload);
    const dayIdx = getDayIndex(dateToUse);
    showToast(
      `✨ Bloque añadido al Día ${dayIdx} (${formatDayDate(dateToUse)})`,
    );

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

  // Render Dedicated Full-Width Includes & Excludes Component (Matching design)
  const renderIncludesActivityCard = (act: Activity) => {
    const isBeingDragged = draggedActivity?.id === act.id;
    const isCollapsed = collapsedIncludesCards[act.id] ?? false;

    const title = (act as any).title || "Qué incluye y qué no incluye";
    const includesList: string[] =
      Array.isArray((act as any).includes) && (act as any).includes.length > 0
        ? (act as any).includes
        : [
            "Vuelo Madrid - Hanói / Ho Chi Minh - Madrid con la compañía aérea Etihad Airways",
            "Traslados aeropuerto - hotel - aeropuerto en vehículo privado con aire acondicionado",
            "Alojamiento en hoteles previstos o similares (Soleil Boutique Hanoi, Viettrekking Sapa, Tam Coc Serenity...)",
            "Vuelos internos según programa (Hanói - Da Nang - Ho Chi Minh con Vietnam Airlines)",
            "Tren nocturno Hanói - Sapa y autobús cama confortable a Ninh Binh",
            "Visitas y excursiones mencionadas en el itinerario (Ha Long, Tam Coc, Fansipan, Hội An)",
            "Guía acompañante de habla hispana durante todo el circuito",
            "Seguro de asistencia médica y cobertura de equipaje en viaje",
          ];

    const excludesList: string[] =
      Array.isArray((act as any).excludes) && (act as any).excludes.length > 0
        ? (act as any).excludes
        : [
            "Visado de entrada a Vietnam (si aplica para estancias superiores a 45 días)",
            "Propinas para guías y chóferes (a discreción del viajero)",
            "Bebidas y comidas no especificadas expresamente en el itinerario",
            "Gastos personales y compras extraordinarias",
          ];

    const departureCities: string =
      (act as any).departureCities ||
      "Madrid, Barcelona, Valencia, Bilbao, Málaga, Palma de Mallorca, Alicante, Sevilla, Oporto, Lisboa";

    const categories: string[] =
      Array.isArray((act as any).categories) && (act as any).categories.length > 0
        ? (act as any).categories
        : [
            "Cultural",
            "Naturaleza & Aventura",
            "Confirmación inmediata",
            "Mejor Precio Garantizado",
          ];

    const connectedDestinations: string[] =
      Array.isArray((act as any).connectedDestinations) && (act as any).connectedDestinations.length > 0
        ? (act as any).connectedDestinations
        : [
            "Hanói",
            "Sapa",
            "Bahía de Ha Long",
            "Ninh Binh",
            "Huế",
            "Hội An",
            "Da Nang",
            "Ho Chi Minh (Saigón)",
          ];

    const getInclusionIcon = (itemText: string) => {
      const lower = itemText.toLowerCase();
      if (lower.includes("vuelo") || lower.includes("aéreo") || lower.includes("aereo") || lower.includes("avion") || lower.includes("avión")) {
        return <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("hotel") || lower.includes("alojamiento") || lower.includes("estancia") || lower.includes("noche")) {
        return <Bed className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("tren") || lower.includes("ferrocarril")) {
        return <Train className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("traslado") || lower.includes("bus") || lower.includes("autobús") || lower.includes("coche") || lower.includes("vehículo")) {
        return <Car className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("guía") || lower.includes("guia") || lower.includes("acompañante")) {
        return <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("seguro") || lower.includes("póliza") || lower.includes("asistencia médica") || lower.includes("asistencia")) {
        return <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      if (lower.includes("visita") || lower.includes("excursión") || lower.includes("excursion") || lower.includes("itinerario")) {
        return <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5" />;
      }
      return <Check className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />;
    };

    return (
      <div
        key={act.id || "trip-includes-block"}
        className="group relative rounded-3xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden transition-all text-left hover:shadow-md hover:border-teal-500/40"
      >
        {/* Top Header Bar */}
        <div className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 select-none bg-white">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Green Check Circle */}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600 bg-emerald-50/40 shrink-0">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>

            {/* Red Ban Circle */}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-500 text-rose-500 bg-rose-50/40 shrink-0">
              <Ban className="h-4 w-4 stroke-[2.5]" />
            </span>

            {/* Title */}
            <h3
              onClick={() => handleOpenEditActivity(act)}
              className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight hover:text-teal-700 transition-colors cursor-pointer truncate"
            >
              {title}
            </h3>

            <span className="hidden md:inline-flex rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
              {includesList.length} incluidos
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleOpenEditActivity(act)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-teal-400 hover:text-teal-700 transition-all cursor-pointer shadow-2xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setCollapsedIncludesCards((prev) => ({
                  ...prev,
                  [act.id]: !isCollapsed,
                }))
              }
              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
              title={isCollapsed ? "Expandir" : "Plegar"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Accordion Body */}
        {!isCollapsed && (
          <div className="p-6 sm:p-8 pt-2 sm:pt-3 border-t border-zinc-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
              {/* Left Column: Tu viaje incluye & No incluye */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4 sm:space-y-5">
                  <h4 className="text-base sm:text-lg font-bold text-teal-600 tracking-tight">
                    Tu viaje incluye:
                  </h4>

                  <div className="space-y-4 sm:space-y-5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    {includesList.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3.5">
                        {getInclusionIcon(item)}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {excludesList.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <h4 className="text-base font-bold text-rose-600 tracking-tight flex items-center gap-2">
                      <Ban className="h-4 w-4 text-rose-500" />
                      No incluye:
                    </h4>
                    <div className="space-y-2.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {excludesList.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Salidas, Categorías, Circuitos */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-7">
                {departureCities && (
                  <div className="space-y-2">
                    <h5 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Salidas desde:
                    </h5>
                    <p className="text-xs sm:text-sm text-teal-700 leading-relaxed font-normal">
                      {departureCities}
                    </p>
                  </div>
                )}

                {categories.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Categorías.
                    </h5>
                    <div className="flex flex-col space-y-1 text-xs sm:text-sm text-teal-700">
                      {categories.map((cat, idx) => (
                        <span key={idx}>{cat}</span>
                      ))}
                    </div>
                  </div>
                )}

                {connectedDestinations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Más circuitos que pasan por:
                    </h5>
                    <div className="flex flex-col space-y-1 text-xs sm:text-sm text-teal-700">
                      {connectedDestinations.map((dest, idx) => (
                        <span key={idx}>{dest}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Reusable Activity Card Renderer with Drag & Drop Handle and Theme Shapes
  const renderActivityCard = (act: Activity) => {
    if (act.type === "conditions" || (act as any).isIncludesBlock) {
      return null;
    }
    const isDraft =
      (act.type === "flight" && !act.airline && !act.flightNumber) ||
      (act.type === "hotel" && !act.hotelName) ||
      (act.type === "excursion" && !act.title) ||
      (act.type === "food" && !act.restaurantName) ||
      (act.type === "transfer" && !act.origin && !act.destination);

    const isBeingDragged = draggedActivity?.id === act.id;
    const hasFullImage = Boolean(act.customIconUrl && act.customIconUrl.trim());
    const theme = themeSettings.selectedTheme;

    // Theme-specific wrapper classes
    const getCardThemeClasses = () => {
      if (isBeingDragged) {
        return "opacity-40 scale-[0.98] border-dashed border-[#0066FF] bg-[#eff6ff]/40 rounded-2xl";
      }
      switch (theme) {
        case "bold":
          return isDraft
            ? "rounded-lg border-2 border-amber-500 border-l-[8px] border-l-amber-500 bg-amber-50/40 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5"
            : "rounded-lg border-2 border-[#0f172a] border-l-[8px] border-l-[#0066FF] bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5";
        case "elegant":
          return isDraft
            ? "rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/40 via-stone-50/30 to-white shadow-xs hover:shadow-lg hover:border-amber-400"
            : "rounded-2xl border border-stone-200/90 bg-gradient-to-r from-white via-[#fcfaf7] to-[#fbf8f2]/40 shadow-xs hover:shadow-md hover:border-amber-300";
        case "minimal":
          return isDraft
            ? "border-b-2 border-dashed border-amber-300 bg-amber-50/20 hover:bg-amber-50/40 rounded-none shadow-none py-3.5 px-2"
            : "border-b border-zinc-200/90 bg-transparent hover:bg-zinc-50/70 rounded-none shadow-none py-3.5 px-2";
        case "classic":
        default:
          return isDraft
            ? "rounded-2xl border border-amber-300 bg-amber-50/30 hover:border-[#0066FF] hover:bg-white hover:shadow-md shadow-xs"
            : "rounded-2xl border border-[#eaecf0] bg-white hover:border-[#0066FF]/50 hover:shadow-md shadow-xs";
      }
    };

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
        className={`group relative flex flex-row items-stretch transition-all cursor-pointer overflow-hidden min-h-[135px] sm:min-h-[150px] ${getCardThemeClasses()}`}
      >
        {/* Left: Full-height image when customUrl exists (1/3 width or framed thumbnail) */}
        {hasFullImage && (
          <div
            className={`shrink-0 relative overflow-hidden self-stretch ${
              theme === "minimal"
                ? "w-24 min-w-[96px] max-w-[120px] m-2 rounded-lg bg-zinc-100"
                : theme === "elegant"
                  ? "w-1/3 min-w-[110px] max-w-[200px] p-2 bg-stone-50 border-r border-stone-100"
                  : theme === "bold"
                    ? "w-1/3 min-w-[110px] max-w-[200px] bg-slate-200 border-r-2 border-[#0f172a]"
                    : "w-1/3 min-w-[110px] max-w-[200px] bg-slate-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={act.customIconUrl!}
              alt={act.type}
              className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                theme === "elegant" ? "rounded-xl shadow-xs" : ""
              }`}
            />
          </div>
        )}

        <div className="w-2/3 flex-1 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 min-w-0">
          {/* Left: Drag Handle + Type Icon + Activity Info */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            {/* Drag Grab Handle */}
            <div
              className={`hidden sm:flex items-center self-center py-2 -ml-1 text-[#98a2b3] hover:text-[#344054] cursor-grab active:cursor-grabbing transition-colors ${
                theme === "bold" ? "text-slate-900 font-black" : ""
              }`}
              title="Arrastra para mover a otro día"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {!hasFullImage && (
              <div
                className={
                  theme === "bold"
                    ? "shrink-0 rounded-md border-2 border-[#0f172a] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] overflow-hidden"
                    : theme === "elegant"
                      ? "shrink-0 rounded-full border border-stone-200 shadow-2xs overflow-hidden"
                      : theme === "minimal"
                        ? "shrink-0 rounded-md overflow-hidden"
                        : ""
                }
              >
                <ActivityCardIcon act={act} isDraft={isDraft} />
              </div>
            )}

            <div className="space-y-1 min-w-0 flex-1">
              {/* Title per Type */}
              {act.type === "flight" &&
                (() => {
                  const effectiveAirline =
                    detectAirlineFromFlightNumber(act.flightNumber) ||
                    act.airline ||
                    "Vuelo";
                  return (
                    <h3
                      className={`text-sm sm:text-base font-bold truncate ${
                        theme === "bold"
                          ? "font-black uppercase tracking-tight text-[#0f172a]"
                          : theme === "elegant"
                            ? "font-serif text-stone-900 font-bold"
                            : theme === "minimal"
                              ? "font-medium text-zinc-900"
                              : "text-[#101828]"
                      }`}
                    >
                      {act.flightNumber || act.airline
                        ? `${effectiveAirline} ${act.flightNumber ? `(${act.flightNumber})` : ""}`
                        : "Vuelo pendiente de configurar"}
                    </h3>
                  );
                })()}

              {act.type === "hotel" && (
                <h3
                  className={`text-sm sm:text-base font-bold truncate ${
                    theme === "bold"
                      ? "font-black uppercase tracking-tight text-[#0f172a]"
                      : theme === "elegant"
                        ? "font-serif text-stone-900 font-bold"
                        : theme === "minimal"
                          ? "font-medium text-zinc-900"
                          : "text-[#101828]"
                  }`}
                >
                  {act.isCheckout
                    ? `Check-out: ${act.hotelName || "Alojamiento"}`
                    : act.hotelName || "Alojamiento pendiente de configurar"}
                </h3>
              )}

              {act.type === "excursion" && (
                <h3
                  className={`text-sm sm:text-base font-bold truncate ${
                    theme === "bold"
                      ? "font-black uppercase tracking-tight text-[#0f172a]"
                      : theme === "elegant"
                        ? "font-serif text-stone-900 font-bold"
                        : theme === "minimal"
                          ? "font-medium text-zinc-900"
                          : "text-[#101828]"
                  }`}
                >
                  {act.title || "Actividad / Excursión sin título"}
                </h3>
              )}

              {act.type === "food" && (
                <h3
                  className={`text-sm sm:text-base font-bold truncate ${
                    theme === "bold"
                      ? "font-black uppercase tracking-tight text-[#0f172a]"
                      : theme === "elegant"
                        ? "font-serif text-stone-900 font-bold"
                        : theme === "minimal"
                          ? "font-medium text-zinc-900"
                          : "text-[#101828]"
                  }`}
                >
                  {act.restaurantName || "Restaurante pendiente de configurar"}
                </h3>
              )}

              {act.type === "transfer" && (
                <h3
                  className={`text-sm sm:text-base font-bold truncate ${
                    theme === "bold"
                      ? "font-black uppercase tracking-tight text-[#0f172a]"
                      : theme === "elegant"
                        ? "font-serif text-stone-900 font-bold"
                        : theme === "minimal"
                          ? "font-medium text-zinc-900"
                          : "text-[#101828]"
                  }`}
                >
                  {act.origin || act.destination
                    ? `Traslado en ${act.transportType || "transporte"}`
                    : "Traslado pendiente de configurar"}
                </h3>
              )}

              {/* Badges: Time, Category, Price / Draft */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 mb-1">
                <span
                  className={`flex items-center gap-1 text-[11px] font-bold ${
                    theme === "bold"
                      ? "rounded-xs border border-[#0f172a] bg-slate-100 text-[#0f172a] px-2 py-0.5"
                      : theme === "elegant"
                        ? "rounded-md border border-stone-200 bg-stone-50/90 text-stone-700 px-2.5 py-0.5"
                        : theme === "minimal"
                          ? "text-zinc-500 font-mono text-[11px]"
                          : "rounded-full bg-[#f4f5f8] px-2.5 py-0.5 text-[#344054]"
                  }`}
                >
                  <Clock className="h-3 w-3 text-[#0066FF]" />
                  {act.time}
                </span>

                <span
                  className={`text-[10px] font-bold uppercase ${
                    theme === "bold"
                      ? "rounded-xs border border-[#0f172a] bg-[#0f172a] text-white px-2 py-0.5 tracking-wider"
                      : theme === "elegant"
                        ? "rounded-md border border-amber-200 bg-amber-50/70 text-amber-900 px-2.5 py-0.5 tracking-wide"
                        : theme === "minimal"
                          ? "rounded-sm bg-zinc-100 text-zinc-700 px-2 py-0.5 font-medium"
                          : act.isCheckout
                            ? "rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-0.5"
                            : "rounded-full bg-[#e0f2fe] text-[#0369a1] px-2.5 py-0.5"
                  }`}
                >
                  {act.type === "flight"
                    ? "Vuelo"
                    : act.type === "hotel"
                      ? act.isCheckout
                        ? "Check-out"
                        : "Alojamiento"
                      : act.type === "excursion"
                        ? "Excursión"
                        : act.type === "food"
                          ? "Gastronomía"
                          : act.type === "booking"
                            ? "Módulo de Reservas & Pagos"
                            : "Traslado"}
                </span>

                {isDraft ? (
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold ${
                      theme === "bold"
                        ? "rounded-xs border border-amber-500 bg-amber-100 text-amber-950 px-2 py-0.5"
                        : theme === "elegant"
                          ? "rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-2.5 py-0.5"
                          : theme === "minimal"
                            ? "text-amber-700 font-medium"
                            : "rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-amber-800"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Sin completar
                  </span>
                ) : act.price ? (
                  <span
                    className={`text-[11px] font-bold ${
                      theme === "bold"
                        ? "rounded-xs border border-[#0f172a] bg-[#ecfdf3] text-[#027a48] px-2.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                        : theme === "elegant"
                          ? "rounded-md bg-stone-50 border border-stone-200 px-2.5 py-0.5 font-serif font-bold text-stone-800"
                          : theme === "minimal"
                            ? "text-zinc-900 font-semibold bg-zinc-100 px-2 py-0.5 rounded-full"
                            : "rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-[#027a48]"
                    }`}
                  >
                    {formatPrice(act.price)}
                  </span>
                ) : null}
              </div>

              {/* Specific Subtitle & Details per Type */}
              {act.type === "flight" && (
                <p className="text-xs text-[#667085] truncate">
                  {act.origin || act.destination
                    ? `${act.origin || "Origen"} → ${act.destination || "Destino"} · Llegada: ${act.arrivalTime || "-"}`
                    : "Haz clic en Editar para indicar vuelos y horarios."}
                </p>
              )}

              {act.type === "hotel" && (
                <div>
                  {act.isCheckout ? (
                    <div>
                      {act.address && (
                        <p className="text-xs text-[#667085] truncate">
                          {act.address}
                        </p>
                      )}
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        Salida de la estancia antes de las{" "}
                        {act.checkOut || act.time || "11:00"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[#667085] truncate">
                        {act.address
                          ? `${act.address} · Check-in: ${act.checkIn || "14:00"} - Check-out: ${act.checkOut || "11:00"}`
                          : "Haz clic en Editar para indicar hotel, check-in y dirección."}
                      </p>
                      {act.description && (
                        <p className="text-xs text-[#475467] mt-1 line-clamp-2">
                          {act.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {act.type === "excursion" && (
                <div>
                  <p className="text-xs text-[#667085] truncate">
                    {act.duration
                      ? `Duración: ${act.duration}`
                      : "Haz clic en Editar para rellenar la actividad."}
                  </p>
                  {act.description && (
                    <p className="text-xs text-[#475467] mt-1 line-clamp-2">
                      {act.description}
                    </p>
                  )}
                </div>
              )}

              {act.type === "food" && (
                <div>
                  <p className="text-xs text-[#667085] truncate">
                    Tipo:{" "}
                    {act.mealType === "breakfast"
                      ? "Desayuno"
                      : act.mealType === "lunch"
                        ? "Almuerzo"
                        : act.mealType === "dinner"
                          ? "Cena"
                          : "Snack"}
                  </p>
                  {act.description && (
                    <p className="text-xs text-[#475467] mt-1 line-clamp-2">
                      {act.description}
                    </p>
                  )}
                </div>
              )}

              {act.type === "transfer" && (
                <p className="text-xs text-[#667085] truncate">
                  {act.origin || act.destination
                    ? `${act.origin || "Origen"} → ${act.destination || "Destino"} (${act.duration || "30 min"})`
                    : "Haz clic en Editar para indicar origen, destino y transporte."}
                </p>
              )}

              {act.type === "booking" && (
                <div className="space-y-1">
                  <p className="text-xs text-[#667085] truncate">
                    Pasarela:{" "}
                    <strong className="text-[#101828] uppercase font-bold">
                      {(act as BookingActivity).paymentProvider || "redsys"}
                    </strong>{" "}
                    · Depósito inicial:{" "}
                    <strong className="text-[#0066FF] font-bold">
                      {(act as BookingActivity).depositAmount ||
                        Math.round((act.price || 1250) * 0.2)}{" "}
                      €
                    </strong>
                  </p>
                  {act.description && (
                    <p className="text-xs text-[#475467] line-clamp-2">
                      {act.description}
                    </p>
                  )}
                </div>
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                theme === "bold"
                  ? isDraft
                    ? "rounded-md border-2 border-slate-900 bg-amber-400 text-slate-950 font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    : "rounded-md border-2 border-slate-900 bg-[#0066FF] text-white font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                  : theme === "elegant"
                    ? isDraft
                      ? "rounded-xl border border-amber-300 bg-amber-100 text-amber-900 font-serif"
                      : "rounded-xl border border-stone-200 bg-stone-900 text-white hover:bg-stone-800 font-serif"
                    : theme === "minimal"
                      ? isDraft
                        ? "rounded-md bg-amber-100 text-amber-900"
                        : "rounded-md border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                      : isDraft
                        ? "rounded-full bg-[#0066FF] text-white hover:bg-[#0052CC]"
                        : "rounded-full border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f4f5f8] hover:border-[#0066FF]"
              }`}
            >
              <Edit2
                className={`h-3.5 w-3.5 ${isDraft && theme === "classic" ? "text-white" : theme === "bold" ? "text-current" : "text-[#0066FF]"}`}
              />
              <span>{isDraft ? "Rellenar datos" : "Editar"}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleDuplicateActivity(act, e)}
              title="Duplicar actividad"
              className={`p-1.5 transition-colors cursor-pointer ${
                theme === "bold"
                  ? "rounded-md border-2 border-slate-900 bg-white text-slate-900 font-black shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-100"
                  : theme === "elegant"
                    ? "rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : theme === "minimal"
                      ? "rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                      : "rounded-full p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#344054]"
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => handleRequestDeleteActivity(act.id, e)}
              title="Eliminar actividad"
              className={`p-1.5 transition-colors cursor-pointer ${
                theme === "bold"
                  ? "rounded-md border-2 border-slate-900 bg-rose-50 text-rose-700 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:bg-rose-100"
                  : theme === "elegant"
                    ? "rounded-lg border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                    : theme === "minimal"
                      ? "rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      : "rounded-full p-1.5 text-[#98a2b3] hover:bg-[#fee4e2] hover:text-[#d92d20]"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Categorized Block definitions for the Right Panel
  const essentialBlocks = [
    {
      type: "text",
      label: "Texto descriptivo",
      desc: "Párrafos, notas o mensajes",
      icon: Type,
      color: "text-sky-600 bg-sky-50",
    },
    {
      type: "title",
      label: "Título de sección",
      desc: "Separador y encabezado",
      icon: Heading,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      type: "itinerary",
      label: "Ruta e Itinerario",
      desc: "Resumen global del recorrido",
      icon: Route,
      color: "text-blue-600 bg-blue-50",
    },
    {
      type: "conditions",
      label: "Qué incluye",
      desc: "Qué incluye y qué no incluye tu viaje",
      icon: ListChecks,
      color: "text-teal-600 bg-teal-50",
    },
    {
      type: "price",
      label: "Desglose de Precios",
      desc: "Tabla de importes y condiciones",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50",
    },
    {
      type: "file",
      label: "Documentos & Vouchers",
      desc: "PDFs, pólizas y billetes",
      icon: Paperclip,
      color: "text-purple-600 bg-purple-50",
    },
    {
      type: "booking",
      label: "Módulo de Reservas",
      desc: "Plazos de pago y depósito",
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  const travelServiceBlocks = [
    {
      type: "flight",
      label: "Vuelo & Conexiones",
      desc: "Horarios, aerolínea y terminales",
      icon: Plane,
      color: "text-sky-600 bg-sky-50",
    },
    {
      type: "hotel",
      label: "Alojamiento & Hotel",
      desc: "Resort, check-in y servicios",
      icon: Bed,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      type: "activity",
      label: "Excursión / Tour",
      desc: "Visita guiada, entradas y duración",
      icon: MapPin,
      color: "text-blue-600 bg-blue-50",
    },
    {
      type: "food",
      label: "Restaurante / Comida",
      desc: "Desayuno, almuerzo o cena gourmet",
      icon: Utensils,
      color: "text-amber-600 bg-amber-50",
    },
    {
      type: "transport",
      label: "Traslado privado / Taxi",
      desc: "Recogida con chofer o minivan",
      icon: Car,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      type: "cruise",
      label: "Crucero & Navegación",
      desc: "Embarque, camarote y escala",
      icon: Ship,
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      type: "train",
      label: "Tren de alta velocidad",
      desc: "Estación, billete y asientos",
      icon: Train,
      color: "text-violet-600 bg-violet-50",
    },
    {
      type: "info",
      label: "Información del Destino",
      desc: "Visados, moneda y recomendaciones",
      icon: Info,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  const multimediaBlocks = [
    {
      type: "gallery",
      label: "Galería de fotos",
      desc: "Álbum fotográfico del destino",
      icon: ImageIcon,
      color: "text-fuchsia-600 bg-fuchsia-50",
    },
    {
      type: "video",
      label: "Vídeo promocional",
      desc: "Presentación interactiva y guía",
      icon: Video,
      color: "text-pink-600 bg-pink-50",
    },
  ];

  const otherBlocks = [
    {
      type: "notes",
      label: "Notas & FAQ",
      desc: "Políticas, avisos y condiciones",
      icon: FileText,
      color: "text-slate-600 bg-slate-100",
    },
    {
      type: "emergency",
      label: "Asistencia 24/7",
      desc: "Teléfonos de urgencia y seguro",
      icon: ShieldCheck,
      color: "text-red-600 bg-red-50",
    },
    {
      type: "weather",
      label: "Clima & Consejos",
      desc: "Pronóstico y tipo de equipaje",
      icon: Sun,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  const renderBlockItem = (
    item: {
      type: string;
      label: string;
      desc: string;
      icon: any;
      color: string;
    },
    isMobile: boolean,
  ) => {
    const Icon = item.icon;
    return (
      <div
        key={item.type}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", item.type);
          handleDragStartFromPalette(item.type as BlockType, e);
        }}
        onDragEnd={() => setDraggedBlockType(null)}
        onClick={() => {
          handleAddBlockDirectly(item.type as BlockType);
          if (isMobile) setIsMobileRightPanelOpen(false);
        }}
        className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-white p-3 text-left transition-all hover:border-[#0066FF] hover:shadow-md group cursor-grab active:cursor-grabbing select-none"
      >
        <GripVertical className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#0066FF] transition-colors shrink-0" />
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-[#101828] group-hover:text-[#0066FF] transition-colors">
            {item.label}
          </h4>
          <p className="text-[11px] text-[#667085] truncate">{item.desc}</p>
        </div>
        <Plus className="h-4 w-4 text-[#98a2b3] group-hover:text-[#0066FF] shrink-0" />
      </div>
    );
  };

  const renderRightPanelContent = (isMobile = false) => (
    <div className="rounded-3xl border border-[#eaecf0] bg-white shadow-xl overflow-hidden flex flex-row h-full">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT LATERAL INNER DOCK (Only visible when on Bloques / Tools) */}
      {/* ------------------------------------------------------------- */}
      {rightPanelTab !== "agent" && (
        <div className="flex flex-col items-center justify-between border-r border-[#eaecf0] bg-[#fafbfc] py-3 px-1.5 w-12 shrink-0 select-none animate-fade-in">
          <div className="flex flex-col items-center gap-2 w-full">
            {[
              { id: "blocks", label: "Bloques", icon: Layers },
              { id: "templates", label: "Plantillas", icon: BookOpen },
              { id: "personalization", label: "Diseño", icon: Palette },
              { id: "languages", label: "Idioma", icon: Globe },
              { id: "clients", label: "Viajeros", icon: Users },
              { id: "document", label: "Documento", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = rightPanelTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRightPanelTab(item.id as any)}
                  title={item.label}
                  className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0066FF] text-white shadow-sm shadow-[#0066FF]/30"
                      : "text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-[#0066FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-white" : "group-hover:scale-110"} transition-transform`}
                  />
                </button>
              );
            })}
          </div>

          {/* Bottom indicator */}
          <div className="pt-2 border-t border-zinc-200/80 flex flex-col items-center">
            <div
              className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              title="Sincronizado"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. RIGHT MAIN CONTENT AREA                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white">
        {/* Top Header: ONLY 2 Tabs (Bloques & Agente IA) */}
        <div className="border-b border-[#eaecf0] bg-[#fafafa] p-2.5 shrink-0">
          <div className="flex items-center justify-between gap-1 mb-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#475467]">
              Herramientas de viaje
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10px] font-bold text-[#027a48]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a] animate-pulse" />
                Online
              </span>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsMobileRightPanelOpen(false)}
                  className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Segmented 2-Tab Bar (ONLY Bloques vs Agente IA) */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#f4f4f5] p-1 border border-[#e4e4e7]/70">
            <button
              type="button"
              onClick={() => setRightPanelTab("blocks")}
              title="Bloques"
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rightPanelTab === "blocks"
                  ? "bg-white text-[#101828] shadow-xs"
                  : "text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]"
              }`}
            >
              <Layers
                className={`h-4 w-4 ${rightPanelTab === "blocks" ? "text-[#0066FF]" : "text-[#71717a]"}`}
              />
              <span>Bloques</span>
            </button>

            <button
              type="button"
              onClick={() => setRightPanelTab("agent")}
              title="Agente IA"
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rightPanelTab === "agent"
                  ? "bg-white text-[#101828] shadow-xs"
                  : "text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]"
              }`}
            >
              <Sparkles
                className={`h-4 w-4 ${rightPanelTab === "agent" ? "text-[#0066FF]" : "text-[#71717a]"}`}
              />
              <span>Agente IA</span>
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: BLOQUES (Esenciales, Servicios, Multimedia, Otros)      */}
        {/* ============================================================= */}
        {rightPanelTab === "blocks" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
            <div className="rounded-2xl border border-[#0066FF]/20 bg-[#eff6ff]/40 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1e3a8a]">
                <strong>Arrastra</strong> cualquier bloque al itinerario o{" "}
                <strong>haz clic</strong> para añadirlo al día ({activeDate}).
              </p>
            </div>

            {/* 1. SERVICIOS DE VIAJE */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleBlockCategory("servicios")}
                className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  {blockCategoriesOpen.servicios ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  Servicios de viaje
                </span>
                <span className="text-[10px] font-semibold text-[#98a2b3]">
                  ({travelServiceBlocks.length})
                </span>
              </button>
              {blockCategoriesOpen.servicios && (
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {travelServiceBlocks.map((item) =>
                    renderBlockItem(item, isMobile),
                  )}
                </div>
              )}
            </div>

            {/* 2. ESENCIALES */}
            <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => toggleBlockCategory("esenciales")}
                className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  {blockCategoriesOpen.esenciales ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  Esenciales & Estructura
                </span>
                <span className="text-[10px] font-semibold text-[#98a2b3]">
                  ({essentialBlocks.length})
                </span>
              </button>
              {blockCategoriesOpen.esenciales && (
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {essentialBlocks.map((item) =>
                    renderBlockItem(item, isMobile),
                  )}
                </div>
              )}
            </div>

            {/* 3. MULTIMEDIA */}
            <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => toggleBlockCategory("multimedia")}
                className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  {blockCategoriesOpen.multimedia ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  Multimedia
                </span>
                <span className="text-[10px] font-semibold text-[#98a2b3]">
                  ({multimediaBlocks.length})
                </span>
              </button>
              {blockCategoriesOpen.multimedia && (
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {multimediaBlocks.map((item) =>
                    renderBlockItem(item, isMobile),
                  )}
                </div>
              )}
            </div>

            {/* 4. OTROS */}
            <div className="space-y-2 pt-2 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => toggleBlockCategory("otros")}
                className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-[#344054] hover:text-[#0066FF] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  {blockCategoriesOpen.otros ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  Otros & Asistencia
                </span>
                <span className="text-[10px] font-semibold text-[#98a2b3]">
                  ({otherBlocks.length})
                </span>
              </button>
              {blockCategoriesOpen.otros && (
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {otherBlocks.map((item) => renderBlockItem(item, isMobile))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: AGENTE IA (Interactive Chat)                           */}
        {/* ============================================================= */}
        {rightPanelTab === "agent" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#18181b] text-white rounded-br-xs"
                        : "bg-[#f4f5f8] text-[#101828] border border-[#eaecf0] rounded-bl-xs"
                    }`}
                  >
                    {msg.sender === "agent" && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0066FF] mb-1">
                        <Bot className="h-3.5 w-3.5" />
                        <span>Wanderlust Agent</span>
                      </div>
                    )}
                    <p>{msg.text}</p>

                    {/* Suggested Action Cards (Single or Multiple) */}
                    {(() => {
                      const actions: SuggestedActionItem[] =
                        msg.suggestedActions && msg.suggestedActions.length > 0
                          ? msg.suggestedActions
                          : msg.suggestedAction
                            ? [msg.suggestedAction]
                            : [];

                      if (actions.length === 0) return null;

                      const allApplied = actions.every((_, idx) =>
                        appliedActionKeys.includes(`${msg.id}-${idx}`),
                      );

                      return (
                        <div className="mt-3 pt-3 border-t border-[#eaecf0] space-y-2">
                          {actions.length > 1 && !allApplied && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyAllSuggestedActions(actions, msg.id)
                              }
                              className="w-full mb-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#101828] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1f2937] transition-all cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-[#14b8a6]" />
                              <span>
                                + Añadir todas ({actions.length}) al itinerario
                              </span>
                            </button>
                          )}

                          {actions.map((act, idx) => {
                            const actionKey = `${msg.id}-${idx}`;
                            const isApplied =
                              appliedActionKeys.includes(actionKey);

                            return (
                              <div
                                key={actionKey}
                                className={`rounded-xl border p-2.5 transition-all text-left ${
                                  isApplied
                                    ? "bg-[#f0fdf4] border-[#bbf7d0]"
                                    : "bg-white border-[#e5e7eb] shadow-2xs hover:border-[#0066FF]/40"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0052CC]">
                                      {act.type === "food" && (
                                        <Utensils className="h-3.5 w-3.5" />
                                      )}
                                      {act.type === "hotel" && (
                                        <Bed className="h-3.5 w-3.5" />
                                      )}
                                      {act.type === "excursion" && (
                                        <Compass className="h-3.5 w-3.5" />
                                      )}
                                      {act.type === "flight" && (
                                        <Plane className="h-3.5 w-3.5" />
                                      )}
                                      {act.type === "transfer" && (
                                        <Car className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#101828] truncate">
                                        {act.label ||
                                          act.payload?.restaurantName ||
                                          act.payload?.hotelName ||
                                          act.payload?.title ||
                                          "Propuesta"}
                                      </p>
                                      {act.date && (
                                        <p className="text-[10px] text-[#667085]">
                                          📅 {act.date}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {act.payload?.price ? (
                                    <span className="shrink-0 text-[11px] font-bold text-[#0052CC] bg-[#eff6ff] px-1.5 py-0.5 rounded-md">
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
                                      onClick={() =>
                                        handleApplySuggestedAction(
                                          act,
                                          actionKey,
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#0066FF] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
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
                  <span className="text-[9px] text-[#98a2b3] mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isAgentThinking && (
                <div className="flex items-center gap-2 text-xs text-[#667085] bg-[#f4f5f8] rounded-2xl p-3 border border-[#eaecf0] max-w-[80%]">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-[#0066FF]" />
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
                  "Cena romántica",
                  "Excursión snorkel",
                  "Hotel 5 estrellas",
                  "Vuelo directo",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSendMessage(`Recomienda un ${chip}`)}
                    className="rounded-full bg-[#f4f5f8] px-2.5 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#eff6ff] hover:text-[#0052CC] transition-colors cursor-pointer"
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
                  className="w-full rounded-full border border-[#d0d5dd] bg-white py-2 pl-4 pr-16 text-xs text-[#101828] placeholder-[#98a2b3] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0066FF] text-white disabled:opacity-40 hover:bg-[#0052CC] transition-colors cursor-pointer"
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

        {/* ============================================================= */}
        {/* TAB 3: PLANTILLAS DE INSPIRACIÓN                              */}
        {/* ============================================================= */}
        {rightPanelTab === "templates" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
            <div className="rounded-2xl border border-[#0066FF]/20 bg-[#eff6ff]/40 p-3 flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1e3a8a]">
                  Plantillas de itinerario prediseñadas
                </p>
                <p className="text-[11px] text-[#0052CC] mt-0.5">
                  Aplica una plantilla para importar actividades y servicios
                  configurados directamente en este viaje.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {TRIP_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group rounded-2xl border border-zinc-200 bg-white p-3.5 hover:border-[#0066FF] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tpl.imageUrl}
                      alt={tpl.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                      {tpl.code}
                    </div>
                    <div className="absolute top-2 right-2 rounded-full bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      {tpl.category}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900 group-hover:text-[#0066FF] transition-colors leading-snug">
                      {tpl.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-zinc-100">
                    <div className="text-[11px] text-zinc-600 font-medium">
                      <span>{tpl.durationDays} días</span> ·{" "}
                      <strong className="text-zinc-900 font-bold">
                        ~{tpl.estimatedBudget} €
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleApplyTemplate(tpl);
                        if (isMobile) setIsMobileRightPanelOpen(false);
                      }}
                      className="rounded-xl bg-[#0066FF] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Aplicar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: PERSONALIZACIÓN & DISEÑO                               */}
        {/* ============================================================= */}
        {rightPanelTab === "personalization" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 [scrollbar-width:thin]">
            {/* 1. SECCIÓN TEMA */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Tema de la Propuesta
              </h4>

              {/* Account Theme Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-[#eaecf0] bg-[#fafafa] p-3 transition hover:bg-[#f4f5f8]">
                <input
                  type="checkbox"
                  checked={themeSettings.useAccountTheme}
                  onChange={(e) =>
                    handleUpdateThemeSettings({
                      useAccountTheme: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#101828]">
                    Usar el tema de tu cuenta
                  </span>
                  <p className="text-[11px] text-[#667085]">
                    Ahora mismo:{" "}
                    <strong className="text-[#0066FF] capitalize">
                      {themeSettings.selectedTheme}
                    </strong>
                  </p>
                </div>
              </label>

              {/* Grid of Themes */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {THEMES.map((th) => {
                  const isSelected = themeSettings.selectedTheme === th.id;
                  return (
                    <div
                      key={th.id}
                      className={`group relative flex flex-col justify-between rounded-2xl border-2 p-3 transition-all ${
                        isSelected
                          ? "border-[#0066FF] bg-[#f0fdfa]/40 shadow-sm"
                          : "border-[#eaecf0] bg-white hover:border-zinc-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-[#101828]">
                          {th.name}
                        </span>
                      </div>

                      {/* Wireframe Layout Sketch */}
                      <div className="h-14 w-full rounded-xl bg-zinc-100/90 border border-zinc-200/80 p-1.5 flex flex-col justify-between overflow-hidden">
                        {th.previewType === "classic" && (
                          <>
                            <div className="h-2 w-1/3 rounded bg-zinc-300" />
                            <div className="h-1.5 w-2/3 rounded bg-zinc-200" />
                            <div className="grid grid-cols-2 gap-1 mt-1">
                              <div className="h-5 rounded bg-zinc-300/80" />
                              <div className="h-5 rounded bg-zinc-300/80" />
                            </div>
                          </>
                        )}
                        {th.previewType === "elegant" && (
                          <div className="flex flex-col items-center justify-center h-full gap-1">
                            <div className="h-2 w-1/2 rounded-full bg-zinc-400" />
                            <div className="h-6 w-4/5 rounded bg-zinc-300/80" />
                          </div>
                        )}
                        {th.previewType === "bold" && (
                          <>
                            <div className="h-3 w-full rounded bg-zinc-400/80" />
                            <div className="flex gap-1 mt-1">
                              <div className="h-6 w-2/3 rounded bg-zinc-300" />
                              <div className="h-6 w-1/3 rounded bg-zinc-200" />
                            </div>
                          </>
                        )}
                        {th.previewType === "minimal" && (
                          <>
                            <div className="flex justify-between">
                              <div className="h-2 w-2/5 rounded bg-zinc-400" />
                              <div className="h-2 w-1/5 rounded bg-zinc-300" />
                            </div>
                            <div className="space-y-1 mt-1">
                              <div className="h-2.5 w-full rounded bg-zinc-200" />
                              <div className="h-2.5 w-full rounded bg-zinc-200" />
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateThemeSettings({ selectedTheme: th.id })
                        }
                        className={`mt-2.5 w-full rounded-xl py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0066FF] text-white shadow-xs"
                            : "border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
                        }`}
                      >
                        {isSelected ? "Activo" : "Seleccionar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SECCIÓN LOGOTIPO */}
            {isAgency || Boolean(user?.agencyLogo) || Boolean(effectiveDisplayLogo !== "/wanderlust_horizontal_negro.png") ? (
              <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                      Logotipo de la Agencia
                    </h4>
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-[#0066FF]">
                      Agencia
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    PNG / SVG
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-[#eaecf0] bg-[#fafafa] p-3">
                  <div className="relative h-12 w-28 shrink-0 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveDisplayLogo}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#101828] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={themeSettings.showLogoInPublic}
                        onChange={(e) =>
                          handleUpdateThemeSettings({
                            showLogoInPublic: e.target.checked,
                          })
                        }
                        className="rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span>Mostrar en propuesta</span>
                    </label>

                    <input
                      type="file"
                      ref={proposalLogoInputRef}
                      onChange={handleProposalLogoUpload}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => proposalLogoInputRef.current?.click()}
                        className="text-[10px] font-bold text-[#0066FF] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Cambiar logo</span>
                      </button>

                      {themeSettings.logoUrl &&
                        themeSettings.logoUrl !==
                          "/wanderlust_horizontal_negro.png" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateThemeSettings({
                                logoUrl: "/wanderlust_horizontal_negro.png",
                              });
                              showToast("Restaurado logotipo Wanderlust");
                            }}
                            className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 hover:underline cursor-pointer"
                          >
                            Restaurar Wanderlust
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                    Logotipo
                  </h4>
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
                      La marca personalizada en propuestas está disponible
                      exclusivamente para <strong>cuentas de Agencia</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SECCIÓN COLORES DE MARCA */}
            <div className="space-y-3 pt-4 border-t border-[#eaecf0]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Color Principal
              </h4>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PALETTES.map((col) => {
                  const isColActive = themeSettings.primaryColor === col.value;
                  return (
                    <button
                      key={col.value}
                      type="button"
                      title={col.name}
                      onClick={() =>
                        handleUpdateThemeSettings({ primaryColor: col.value })
                      }
                      className={`h-9 w-9 rounded-full ${col.bg} flex items-center justify-center transition-transform cursor-pointer ${
                        isColActive
                          ? "ring-3 ring-offset-2 ring-[#0066FF] scale-110 shadow-sm"
                          : "hover:scale-105 opacity-90"
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
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Tipografía
              </h4>
              <select
                value={themeSettings.fontFamily}
                onChange={(e) =>
                  handleUpdateThemeSettings({ fontFamily: e.target.value })
                }
                className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden focus:ring-2 focus:ring-[#0066FF]/20 font-medium"
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
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Altura de Portada
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "compact", label: "Compacta" },
                  { id: "standard", label: "Estándar" },
                  { id: "immersive", label: "Inmersiva" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      handleUpdateThemeSettings({ headerStyle: opt.id as any })
                    }
                    className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                      themeSettings.headerStyle === opt.id
                        ? "bg-[#101828] text-white shadow-xs"
                        : "border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: IDIOMA & CONFIGURACIÓN REGIONAL                        */}
        {/* ============================================================= */}
        {rightPanelTab === "languages" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 [scrollbar-width:thin]">
            {/* 1. Idioma principal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Idioma de la Propuesta
              </h4>
              <div className="space-y-2">
                {[
                  { code: "es", label: "Español (Castellano)", flag: "🇪🇸" },
                  { code: "en", label: "English (UK / US)", flag: "🇬🇧" },
                  { code: "fr", label: "Français", flag: "🇫🇷" },
                  { code: "de", label: "Deutsch", flag: "🇩🇪" },
                  { code: "it", label: "Italiano", flag: "🇮🇹" },
                  { code: "pt", label: "Português", flag: "🇵🇹" },
                ].map((lang) => {
                  const isSelected =
                    languageSettings.selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguageSettings((prev) => ({
                          ...prev,
                          selectedLanguage: lang.code as any,
                        }));
                        showToast(`🌐 Idioma cambiado a ${lang.label}`);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl p-3 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#eff6ff] border-2 border-[#0066FF] text-[#0052CC] shadow-xs"
                          : "border border-[#eaecf0] bg-white text-[#344054] hover:bg-[#fafafa]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[#0066FF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Moneda de cotización */}
            <div className="space-y-2 pt-4 border-t border-[#eaecf0]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Moneda
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "EUR", label: "€ EUR" },
                  { id: "USD", label: "$ USD" },
                  { id: "GBP", label: "£ GBP" },
                ].map((cur) => (
                  <button
                    key={cur.id}
                    type="button"
                    onClick={() => {
                      setLanguageSettings((prev) => ({
                        ...prev,
                        currency: cur.id as any,
                      }));
                      showToast(`💱 Moneda cambiada a ${cur.id}`);
                    }}
                    className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                      languageSettings.currency === cur.id
                        ? "bg-[#101828] text-white shadow-xs"
                        : "border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
                    }`}
                  >
                    {cur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Formato de fechas */}
            <div className="space-y-2 pt-4 border-t border-[#eaecf0]">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#344054]">
                Formato de Fecha
              </h4>
              <select
                value={languageSettings.dateFormat}
                onChange={(e) => {
                  setLanguageSettings((prev) => ({
                    ...prev,
                    dateFormat: e.target.value as any,
                  }));
                  showToast("📅 Formato de fecha actualizado");
                }}
                className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (ej: 18/09/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (ej: 09/18/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ej: 2026-09-18)</option>
              </select>
            </div>

            {/* 4. Traducción Automática */}
            <div className="space-y-2 pt-4 border-t border-[#eaecf0]">
              <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-xl border border-[#eaecf0] bg-[#fafafa] p-3">
                <input
                  type="checkbox"
                  checked={languageSettings.autoTranslate}
                  onChange={(e) => {
                    setLanguageSettings((prev) => ({
                      ...prev,
                      autoTranslate: e.target.checked,
                    }));
                    showToast(
                      e.target.checked
                        ? "✨ Traducción IA activada"
                        : "Traducción IA desactivada",
                    );
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#0066FF] focus:ring-[#0066FF]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#101828]">
                    Traducción dinámica con IA
                  </span>
                  <p className="text-[11px] text-[#667085]">
                    Traduce automáticamente títulos y notas a la lengua del
                    cliente cuando acceda al portal.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 6: VIAJEROS & CLIENTES                                    */}
        {/* ============================================================= */}
        {rightPanelTab === "clients" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
            <div className="rounded-2xl border border-[#0066FF]/20 bg-[#eff6ff]/40 p-3 flex items-start gap-2.5">
              <Users className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1e3a8a]">
                  Pasajeros & Viajeros del itinerario
                </p>
                <p className="text-[11px] text-[#0052CC] mt-0.5">
                  Datos asignados de los clientes para billetes, traslados y
                  reservas.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101828] text-white font-bold text-xs">
                  P1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#101828]">
                    Pasajero Principal
                  </h4>
                  <p className="text-[11px] text-[#667085]">
                    Asignado automáticamente al viaje
                  </p>
                </div>
              </div>
              <div className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <p className="font-medium">📧 Contacto: viajero@ejemplo.com</p>
                <p className="font-medium mt-1">📱 Teléfono: +34 600 000 000</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 7: DOCUMENTO & EXPORTACIÓN                                */}
        {/* ============================================================= */}
        {rightPanelTab === "document" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
            <div className="rounded-2xl border border-[#0066FF]/20 bg-[#eff6ff]/40 p-3 flex items-start gap-2.5">
              <FileText className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1e3a8a]">
                  Exportación de la propuesta
                </p>
                <p className="text-[11px] text-[#0052CC] mt-0.5">
                  Genera versiones impresas o digitales listas para entregar al
                  viajero.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#101828]">
                Documento PDF
              </h4>
              <p className="text-[11px] text-[#667085]">
                Incluye vuelos, reservas, vouchers y descripción del itinerario
                con la marca de la agencia.
              </p>
              <button
                type="button"
                onClick={() =>
                  showToast("📄 Preparando descarga del dossier PDF...")
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0066FF] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Descargar propuesta en PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell activeMenu="viajes" hideSidebar={true}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#101828]/95 px-5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-fade-in border border-white/10">
          <Sparkles className="h-4 w-4 text-[#0066FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace: Responsive Layout */}
      <div className="flex flex-col xl:flex-row w-full h-auto xl:h-[calc(100vh-6.5rem)] xl:overflow-hidden gap-0 relative bg-zinc-50/50 rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs">
        {/* CENTER: ITINERARY CANVAS (Scrolls independently on xl) */}
        <div
          style={{ fontFamily: themeSettings.fontFamily }}
          className="flex-1 w-full overflow-y-visible xl:overflow-y-auto p-4 sm:p-6 pb-20 space-y-5 sm:space-y-6 [scrollbar-width:thin] min-w-0 bg-white"
        >
          {/* Breadcrumb Navigation & Top Action Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-[#667085] flex-wrap">
              <Link
                href="/viajes"
                className="hover:text-[#0066FF] transition-colors flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Mis viajes</span>
              </Link>
              <span>/</span>
              <span className="font-bold text-[#101828] truncate max-w-[140px] sm:max-w-[240px]">
                {activeTrip.name}
              </span>
              <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-bold text-[#0052CC] shrink-0">
                Itinerario
              </span>
            </nav>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileRightPanelOpen(true)}
                className="xl:hidden flex items-center gap-1.5 rounded-full border border-[#0066FF]/40 bg-[#eff6ff] px-3.5 py-1.5 text-xs font-bold text-[#0052CC] shadow-2xs hover:bg-[#b2dfdb] transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0066FF]" />
                <span>Bloques & Agente IA</span>
              </button>

              <Link
                href={`/viaje/${id}/configuracion`}
                className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] shadow-xs transition-all cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-[#667085]" />
                <span>Configuración</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-[#667085]" />
                <span>Compartir</span>
              </button>

              <Link
                href={`/publico/${encodeURIComponent(tripCode)}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-full bg-[#0066FF] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Preview</span>
              </Link>
            </div>
          </div>

          {/* Trip Header Banner Card */}
          <div
            className={`relative overflow-hidden transition-all duration-300 ${
              themeSettings.selectedTheme === "bold"
                ? "rounded-xl border-2 border-slate-900 bg-slate-900 text-white p-6 shadow-[6px_6px_0px_0px_rgba(0,150,136,1)]"
                : themeSettings.selectedTheme === "elegant"
                  ? "rounded-3xl border border-stone-200/80 bg-gradient-to-b from-[#fefdfb] via-white to-[#fbf9f5] p-6 sm:p-8 shadow-sm text-center flex flex-col items-center"
                  : themeSettings.selectedTheme === "minimal"
                    ? "border-b border-zinc-200 bg-transparent p-4 sm:p-6 rounded-none shadow-none"
                    : "rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs"
            }`}
          >
            {themeSettings.showLogoInPublic && (
              <div
                className={`mb-3 flex items-center justify-between pb-3 ${
                  themeSettings.selectedTheme === "bold"
                    ? "border-b border-white/20"
                    : "border-b border-zinc-100"
                } w-full`}
              >
                <div className="group/logo relative flex items-center gap-2">
                  <div
                    onClick={() => {
                      setLogoUrlInput(
                        effectiveDisplayLogo !== "/wanderlust_horizontal_negro.png"
                          ? effectiveDisplayLogo
                          : ""
                      );
                      setIsLogoModalOpen(true);
                    }}
                    className="relative flex items-center min-h-[44px] min-w-[100px] rounded-xl p-2 transition-all hover:bg-black/5 hover:ring-2 hover:ring-[#0066FF]/40 cursor-pointer"
                    title="Haz clic para cambiar el logotipo (URL o subir archivo)"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={effectiveDisplayLogo}
                      alt="Logo Agencia"
                      className="h-9 sm:h-10 min-h-[36px] max-h-12 min-w-[90px] max-w-[190px] w-auto object-contain transition-opacity group-hover/logo:opacity-85"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover/logo:opacity-100">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Cambiar logo</span>
                      </span>
                    </div>
                  </div>

                  {effectiveDisplayLogo !== "/wanderlust_horizontal_negro.png" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateThemeSettings({
                          logoUrl: "/wanderlust_horizontal_negro.png",
                        });
                        showToast("Logotipo restaurado a Wanderlust");
                      }}
                      className="opacity-0 group-hover/logo:opacity-100 text-[10px] text-[#667085] hover:text-[#101828] underline transition-opacity cursor-pointer"
                      title="Restaurar logotipo por defecto"
                    >
                      Restaurar
                    </button>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    themeSettings.selectedTheme === "bold"
                      ? "text-blue-400 font-mono"
                      : "text-[#667085]"
                  }`}
                >
                  Propuesta Oficial
                </span>
              </div>
            )}

            <div
              className={`flex flex-col sm:flex-row justify-between gap-4 w-full ${
                themeSettings.selectedTheme === "elegant"
                  ? "sm:items-center sm:justify-center text-center"
                  : "sm:items-center"
              }`}
            >
              <div
                className={
                  themeSettings.selectedTheme === "elegant"
                    ? "flex flex-col items-center"
                    : ""
                }
              >
                <div
                  style={{
                    color:
                      themeSettings.selectedTheme === "bold"
                        ? "#5eead4"
                        : themeSettings.primaryColor,
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold mb-2 ${
                    themeSettings.selectedTheme === "bold"
                      ? "rounded-xs border border-blue-500/40 bg-blue-950/60 font-black uppercase"
                      : themeSettings.selectedTheme === "elegant"
                        ? "rounded-full bg-amber-50/80 border border-amber-200 text-amber-900 font-serif"
                        : themeSettings.selectedTheme === "minimal"
                          ? "bg-zinc-100 text-zinc-700 rounded-sm"
                          : "rounded-full bg-[#eff6ff]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Propuesta de Viaje Personalizada</span>
                </div>

                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tripTitleInput}
                      onChange={(e) => setTripTitleInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveTripTitle()
                      }
                      className={`rounded-2xl border px-3 py-1 text-2xl font-extrabold focus:outline-hidden ${
                        themeSettings.selectedTheme === "bold"
                          ? "border-blue-400 bg-slate-800 text-white"
                          : "border-[#0066FF] text-[#101828] ring-2 ring-[#0066FF]/20"
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveTripTitle}
                      className="rounded-full bg-[#0066FF] p-2 text-white hover:bg-[#0052CC] transition-all cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingTitle(true)}
                    className="group flex cursor-pointer items-center gap-2 mt-1"
                  >
                    <h1
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors ${
                        themeSettings.selectedTheme === "bold"
                          ? "text-white font-black uppercase tracking-tight"
                          : themeSettings.selectedTheme === "elegant"
                            ? "font-serif text-[#1e293b] font-normal text-3xl sm:text-4xl"
                            : themeSettings.selectedTheme === "minimal"
                              ? "text-zinc-900 font-light"
                              : "text-[#101828]"
                      }`}
                    >
                      {activeTrip.name}
                    </h1>
                    <Edit2 className="h-4 w-4 text-[#98a2b3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                <p
                  className={`mt-2 text-xs flex flex-wrap items-center gap-2 ${
                    themeSettings.selectedTheme === "bold"
                      ? "text-slate-300"
                      : themeSettings.selectedTheme === "elegant"
                        ? "text-stone-600 justify-center font-serif"
                        : "text-[#667085]"
                  }`}
                >
                  <span>Código:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                      themeSettings.selectedTheme === "bold"
                        ? "bg-slate-800 text-blue-400 border border-slate-700"
                        : "bg-[#f2f4f7] text-[#344054]"
                    }`}
                  >
                    {tripCode}
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(true)}
                    className="font-medium hover:text-[#0066FF] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#0066FF]" />
                    <span>
                      {formatFullDate(activeTrip.startDate)} —{" "}
                      {formatFullDate(activeTrip.endDate)}
                    </span>
                  </button>
                  <span>·</span>
                  <span>{tripDates.length} días</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(
                      totalTripExpenses > 0
                        ? totalTripExpenses
                        : activeTrip.budget || 0,
                    );
                    setIsBudgetModalOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    themeSettings.selectedTheme === "bold"
                      ? "rounded-md border-2 border-blue-400 bg-slate-800 text-blue-300 hover:bg-slate-700"
                      : themeSettings.selectedTheme === "elegant"
                        ? "rounded-full border border-stone-300 bg-white font-serif text-stone-800 hover:bg-stone-50"
                        : themeSettings.selectedTheme === "minimal"
                          ? "rounded-md border border-zinc-200 bg-white text-zinc-700"
                          : "rounded-full border border-[#eaecf0] bg-[#f8fafc] text-[#344054] hover:bg-[#eaecf0]"
                  }`}
                  title="Haz clic para ver y editar el presupuesto o gastos"
                >
                  <Wallet className="h-3.5 w-3.5 text-[#0066FF]" />
                  <span>
                    Total gastos:{" "}
                    {formatPrice(
                      totalTripExpenses > 0
                        ? totalTripExpenses
                        : activeTrip.budget || 0,
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Header Media */}
            <div
              className={`group relative mt-5 flex min-h-[140px] flex-col items-center justify-center text-center transition-colors overflow-hidden w-full ${
                themeSettings.selectedTheme === "bold"
                  ? "rounded-lg border-2 border-slate-700 bg-slate-800/80 p-2"
                  : themeSettings.selectedTheme === "elegant"
                    ? "rounded-2xl border border-stone-200 bg-stone-50/60 p-2 shadow-xs"
                    : themeSettings.selectedTheme === "minimal"
                      ? "rounded-none border-0 bg-transparent p-0"
                      : "rounded-2xl border-2 border-dashed border-[#d0d5dd] bg-[#fafafa] p-3 hover:border-[#0066FF] hover:bg-[#eff6ff]/20"
              }`}
            >
              {activeTrip.imageUrl ? (
                <div
                  className={`relative w-full overflow-hidden transition-all duration-300 ${
                    themeSettings.selectedTheme === "bold"
                      ? "rounded-md border border-slate-700"
                      : themeSettings.selectedTheme === "elegant"
                        ? "rounded-xl shadow-xs"
                        : themeSettings.selectedTheme === "minimal"
                          ? "rounded-lg"
                          : "rounded-xl"
                  } ${
                    themeSettings.headerStyle === "compact"
                      ? "h-32"
                      : themeSettings.headerStyle === "immersive"
                        ? "h-72"
                        : "h-48"
                  }`}
                >
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
                        setPhotoUrlInput(activeTrip.imageUrl || "");
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
                    setPhotoUrlInput("");
                    setIsPhotoModalOpen(true);
                  }}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-[#0066FF] shadow-2xs">
                    <Upload className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#0066FF]">
                    Añadir imagen de portada
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Day-by-Day / All-Trip Itinerary Section with Theme Shapes */}
          <div
            className={`transition-all duration-300 ${
              themeSettings.selectedTheme === "bold"
                ? "rounded-xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-6"
                : themeSettings.selectedTheme === "elegant"
                  ? "rounded-3xl border border-stone-200/80 bg-[#faf8f5]/40 p-6 sm:p-8 shadow-sm space-y-6"
                  : themeSettings.selectedTheme === "minimal"
                    ? "border-0 bg-transparent p-0 sm:p-2 shadow-none space-y-6"
                    : "rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-6"
            }`}
          >
            {/* Header: Title + View Mode Switcher + Add Activity */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 ${
                themeSettings.selectedTheme === "bold"
                  ? "border-b-2 border-slate-900"
                  : "border-b border-[#eaecf0]"
              }`}
            >
              <div>
                <h2
                  className={`text-lg font-bold ${
                    themeSettings.selectedTheme === "bold"
                      ? "font-black uppercase tracking-tight text-slate-950"
                      : themeSettings.selectedTheme === "elegant"
                        ? "font-serif text-stone-900"
                        : "text-[#101828]"
                  }`}
                >
                  {itineraryViewMode === "day"
                    ? "Itinerario día a día"
                    : "Itinerario completo del viaje"}
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  {itineraryViewMode === "day"
                    ? "Selecciona un día, reordena actividades o arrastra entre días."
                    : "Vista continua de todos los días. Arrastra actividades de un día a otro libremente."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* View Switcher: Por día vs Todo el viaje */}
                <div
                  className={`flex items-center gap-1 p-1 ${
                    themeSettings.selectedTheme === "bold"
                      ? "rounded-md border-2 border-slate-900 bg-slate-100 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                      : themeSettings.selectedTheme === "elegant"
                        ? "rounded-full bg-stone-100/90 border border-stone-200 shadow-2xs font-serif"
                        : themeSettings.selectedTheme === "minimal"
                          ? "rounded-md bg-zinc-100 border border-zinc-200"
                          : "rounded-full bg-[#f4f4f5] border border-[#e4e4e7]/70 shadow-2xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => changeItineraryViewMode("day")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
                      itineraryViewMode === "day"
                        ? themeSettings.selectedTheme === "bold"
                          ? "rounded-xs bg-slate-900 text-white"
                          : themeSettings.selectedTheme === "elegant"
                            ? "rounded-full bg-white text-stone-900 shadow-xs"
                            : themeSettings.selectedTheme === "minimal"
                              ? "rounded-sm bg-white text-zinc-900 shadow-2xs"
                              : "rounded-full bg-white text-[#101828] shadow-xs"
                        : "text-[#71717a] hover:text-[#18181b]"
                    }`}
                  >
                    <Calendar
                      className={`h-3.5 w-3.5 ${itineraryViewMode === "day" ? "text-[#0066FF]" : "text-[#a1a1aa]"}`}
                    />
                    <span>Por día</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => changeItineraryViewMode("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
                      itineraryViewMode === "all"
                        ? themeSettings.selectedTheme === "bold"
                          ? "rounded-xs bg-slate-900 text-white"
                          : themeSettings.selectedTheme === "elegant"
                            ? "rounded-full bg-white text-stone-900 shadow-xs"
                            : themeSettings.selectedTheme === "minimal"
                              ? "rounded-sm bg-white text-zinc-900 shadow-2xs"
                              : "rounded-full bg-white text-[#101828] shadow-xs"
                        : "text-[#71717a] hover:text-[#18181b]"
                    }`}
                  >
                    <ListOrdered
                      className={`h-3.5 w-3.5 ${itineraryViewMode === "all" ? "text-[#0066FF]" : "text-[#a1a1aa]"}`}
                    />
                    <span>Todo el viaje</span>
                    <span className="rounded-full bg-[#eff6ff] text-[#0052CC] px-1.5 py-0.2 text-[10px] font-bold">
                      {activeTrip.activities.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddActivity("flight", activeDate)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    themeSettings.selectedTheme === "bold"
                      ? "rounded-md border-2 border-slate-900 bg-[#0066FF] text-white font-black shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                      : themeSettings.selectedTheme === "elegant"
                        ? "rounded-full bg-stone-900 text-white hover:bg-stone-800 font-serif shadow-xs"
                        : themeSettings.selectedTheme === "minimal"
                          ? "rounded-md border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                          : "rounded-full bg-[#0066FF] text-white shadow-xs hover:bg-[#0052CC]"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir actividad</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* VIEW 1: POR DÍA (Single-Day Tab View with Drop Targets)   */}
            {/* ========================================================= */}
            {itineraryViewMode === "day" && (
              <div className="space-y-6 animate-fade-in">
                {/* Day Selector Tabs (Acts as Drop Targets for Moving Activities) */}
                <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
                  <div
                    className={`inline-flex items-center gap-1 p-1 ${
                      themeSettings.selectedTheme === "bold"
                        ? "rounded-lg border-2 border-slate-900 bg-slate-100 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                        : themeSettings.selectedTheme === "elegant"
                          ? "rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs font-serif"
                          : themeSettings.selectedTheme === "minimal"
                            ? "border-b border-zinc-200 pb-2 bg-transparent gap-3"
                            : "rounded-full bg-[#f4f4f5] border border-[#e4e4e7]/70 shadow-2xs"
                    }`}
                  >
                    {tripDates.map((dateStr, dIdx) => {
                      const isSelected = activeDate === dateStr;
                      const isDropTarget = dragOverDayDate === dateStr;
                      const actsCount = activeTrip.activities.filter((a) => {
                        if (a.date === dateStr) return true;
                        if (a.type === "hotel") {
                          let checkoutDay = a.checkoutDate
                            ? a.checkoutDate.trim()
                            : "";
                          if (!checkoutDay || checkoutDay === a.date)
                            checkoutDay = getNextDateStr(a.date);
                          if (
                            checkoutDay &&
                            checkoutDay !== a.date &&
                            checkoutDay === dateStr
                          )
                            return true;
                        }
                        return false;
                      }).length;

                      const getTabClasses = () => {
                        if (isDropTarget) {
                          return "ring-2 ring-[#0066FF] bg-[#eff6ff] text-[#0052CC] scale-105 shadow-md";
                        }
                        if (themeSettings.selectedTheme === "bold") {
                          return isSelected
                            ? "rounded-md border-2 border-slate-900 bg-[#0066FF] text-white font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            : "rounded-md text-slate-700 hover:text-slate-950 font-bold hover:bg-slate-200";
                        }
                        if (themeSettings.selectedTheme === "elegant") {
                          return isSelected
                            ? "rounded-full bg-stone-900 text-white shadow-sm font-serif"
                            : "text-stone-600 hover:text-stone-900 font-serif";
                        }
                        if (themeSettings.selectedTheme === "minimal") {
                          return isSelected
                            ? "border-b-2 border-[#0066FF] text-[#0066FF] font-bold rounded-none pb-1"
                            : "text-zinc-500 hover:text-zinc-900 rounded-none pb-1";
                        }
                        return isSelected
                          ? "rounded-full bg-white text-[#18181b] shadow-sm"
                          : "rounded-full text-[#71717a] hover:text-[#18181b] hover:bg-black/[0.02]";
                      };

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDayDate(dateStr)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverDayDate(dateStr);
                          }}
                          onDragLeave={() => setDragOverDayDate(null)}
                          onDrop={(e) => handleDropOnDate(dateStr, e)}
                          className={`shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${getTabClasses()}`}
                        >
                          <Calendar
                            className={`h-3.5 w-3.5 ${
                              isDropTarget || isSelected
                                ? "text-[#0066FF]"
                                : "text-[#a1a1aa]"
                            }`}
                          />
                          <span>Día {dIdx + 1}</span>
                          <span className="text-[11px] opacity-60 font-normal">
                            ({formatDayDate(dateStr)})
                          </span>
                          {actsCount > 0 && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                                themeSettings.selectedTheme === "bold"
                                  ? isSelected
                                    ? "bg-slate-900 text-white rounded-xs"
                                    : "bg-slate-300 text-slate-800 rounded-xs"
                                  : themeSettings.selectedTheme === "elegant"
                                    ? isSelected
                                      ? "bg-amber-400 text-stone-900 rounded-full"
                                      : "bg-stone-200 text-stone-700 rounded-full"
                                    : isSelected
                                      ? "bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7] rounded-full"
                                      : "bg-[#e4e4e7] text-[#71717a] rounded-full"
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
                    <div
                      className={`text-center p-8 transition-all ${
                        themeSettings.selectedTheme === "bold"
                          ? "rounded-lg border-2 border-dashed border-slate-900 bg-slate-50"
                          : themeSettings.selectedTheme === "elegant"
                            ? "rounded-2xl border border-stone-200 bg-stone-50/50"
                            : themeSettings.selectedTheme === "minimal"
                              ? "rounded-none border-b border-zinc-200 bg-transparent py-8"
                              : "rounded-2xl border-2 border-dashed border-[#eaecf0] bg-[#fafafa]"
                      }`}
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#0066FF] mb-3">
                        <Plane className="h-6 w-6" />
                      </div>
                      <h3
                        className={`text-sm font-bold ${
                          themeSettings.selectedTheme === "bold"
                            ? "font-black uppercase text-slate-900"
                            : themeSettings.selectedTheme === "elegant"
                              ? "font-serif text-stone-900 text-base"
                              : "text-[#101828]"
                        }`}
                      >
                        No hay actividades para este día
                      </h3>
                      <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1 mb-4">
                        Arrastra cualquier bloque desde el panel derecho o haz
                        clic para añadir un bloque vacío y completarlo.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateBlankActivity(
                              "flight",
                              true,
                              activeDate,
                            )
                          }
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Vuelo
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateBlankActivity("hotel", true, activeDate)
                          }
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Alojamiento
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateBlankActivity(
                              "activity",
                              true,
                              activeDate,
                            )
                          }
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Tour / Excursión
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateBlankActivity("food", true, activeDate)
                          }
                          className="rounded-full border border-[#d0d5dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        >
                          + Restaurante
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateBlankActivity(
                              "transport",
                              true,
                              activeDate,
                            )
                          }
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
                    className={`flex flex-col items-center justify-center py-4 px-4 text-center transition-all ${
                      themeSettings.selectedTheme === "bold"
                        ? "rounded-md border-2 border-dashed border-slate-900 bg-slate-50"
                        : themeSettings.selectedTheme === "elegant"
                          ? "rounded-2xl border border-dashed border-stone-300 bg-stone-50/40"
                          : themeSettings.selectedTheme === "minimal"
                            ? "border border-dashed border-zinc-300 bg-transparent rounded-md"
                            : "rounded-2xl border-2 border-dashed border-[#eaecf0] bg-[#fafafa]"
                    } ${
                      dragOverDayDate === activeDate
                        ? "border-[#0066FF] bg-[#eff6ff]/60 ring-4 ring-[#0066FF]/20 scale-[1.01]"
                        : ""
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0066FF] shadow-2xs mb-1">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-medium text-[#667085]">
                      Arrastra un bloque o actividad aquí para el Día{" "}
                      {getDayIndex(activeDate)} ({formatDayDate(activeDate)})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: TODO EL VIAJE (Continuous Full Trip View)         */}
            {/* ========================================================= */}
            {itineraryViewMode === "all" && (
              <div className="space-y-8 animate-fade-in">
                {tripDates.map((dateStr, dIdx) => {
                  const acts = activeTrip.activities.filter(
                    (a) =>
                      a.date === dateStr &&
                      a.type !== "conditions" &&
                      !(a as any).isIncludesBlock,
                  );
                  const isDayOver = dragOverDayDate === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverDayDate(dateStr);
                      }}
                      onDragLeave={() => setDragOverDayDate(null)}
                      onDrop={(e) => handleDropOnDate(dateStr, e)}
                      className={`transition-all space-y-4 ${
                        themeSettings.selectedTheme === "bold"
                          ? "rounded-lg border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                          : themeSettings.selectedTheme === "elegant"
                            ? "rounded-2xl border border-stone-200/80 bg-[#fdfcfb] p-5 shadow-xs"
                            : themeSettings.selectedTheme === "minimal"
                              ? "border-b border-zinc-200/90 bg-transparent p-4 rounded-none shadow-none"
                              : "rounded-2xl border border-[#eaecf0] bg-[#fafbfc] p-5"
                      } ${
                        isDayOver
                          ? "border-[#0066FF] bg-[#eff6ff]/30 ring-2 ring-[#0066FF]/30 shadow-md"
                          : ""
                      }`}
                    >
                      {/* Day Header */}
                      <div
                        className={`flex flex-wrap items-center justify-between gap-3 pb-3 ${
                          themeSettings.selectedTheme === "bold"
                            ? "border-b-2 border-slate-900"
                            : "border-b border-[#eaecf0]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold shadow-2xs ${
                              themeSettings.selectedTheme === "bold"
                                ? "rounded-xs border border-slate-900 bg-slate-900 text-white font-black uppercase"
                                : themeSettings.selectedTheme === "elegant"
                                  ? "rounded-full bg-stone-900 text-white font-serif"
                                  : themeSettings.selectedTheme === "minimal"
                                    ? "rounded-sm bg-zinc-900 text-white font-medium"
                                    : "rounded-full border border-slate-900 text-white"
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5  text-black" />
                            <span className=" text-black">Día {dIdx + 1}</span>
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              themeSettings.selectedTheme === "bold"
                                ? "font-black uppercase tracking-tight text-slate-950"
                                : themeSettings.selectedTheme === "elegant"
                                  ? "font-serif text-stone-900"
                                  : "text-[#101828]"
                            }`}
                          >
                            {formatDayFullLabel(dateStr)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-bold ${
                              themeSettings.selectedTheme === "bold"
                                ? "rounded-xs border border-slate-900 bg-slate-100 text-slate-900"
                                : "rounded-full bg-[#eaecf0] text-[#344054]"
                            }`}
                          >
                            {acts.length}{" "}
                            {acts.length === 1 ? "actividad" : "actividades"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenAddActivity("flight", dateStr)
                            }
                            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                              themeSettings.selectedTheme === "bold"
                                ? "rounded-xs border border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                                : themeSettings.selectedTheme === "elegant"
                                  ? "rounded-full border border-stone-200 bg-white font-serif text-stone-800 hover:bg-stone-50"
                                  : "rounded-full border border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb] hover:border-[#0066FF]"
                            }`}
                          >
                            <Plus className="h-3 w-3 text-[#0066FF]" />
                            <span>Añadir a Día {dIdx + 1}</span>
                          </button>
                        </div>
                      </div>

                      {/* Day Activities List */}
                      <div className="space-y-3">
                        {acts.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#d0d5dd] bg-white/70 p-5 text-center">
                            <p className="text-xs text-[#667085]">
                              Sin actividades programadas para el Día {dIdx + 1}
                              . Arrastra un bloque aquí o actividades de otro
                              día.
                            </p>
                          </div>
                        ) : (
                          acts.map((act) => renderActivityCard(act))
                        )}

                        {/* Interactive Drop Zone for this Day */}
                        <div
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 px-4 text-center transition-all ${
                            isDayOver
                              ? "border-[#0066FF] bg-[#eff6ff] text-[#0052CC]"
                              : "border-[#e4e4e7] bg-white text-[#667085]"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5 text-[#0066FF]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================= */}
            {/* SECCIÓN GLOBAL: QUÉ INCLUYE Y QUÉ NO INCLUYE (ABAJO)       */}
            {/* ========================================================= */}
            <div className="pt-6 sm:pt-8 border-t border-zinc-200/80">
              {renderIncludesActivityCard(
                tripIncludesActivity ||
                  ({
                    id: `includes-${activeTrip.id}`,
                    type: "conditions",
                    date: activeTrip.startDate,
                    time: "18:00",
                    price: 0,
                    title: "Qué incluye y qué no incluye",
                    isIncludesBlock: true,
                  } as any),
              )}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* DESKTOP RIGHT PANEL: FIXED AGENTE IA & BLOQUES (xl:flex)       */}
        {/* ============================================================= */}
        <aside className="hidden xl:flex w-88 2xl:w-[410px] shrink-0 h-full flex-col">
          {renderRightPanelContent(false)}
        </aside>

        {/* ============================================================= */}
        {/* MOBILE SLIDE-OVER DRAWER (Visible when open on <xl)            */}
        {/* ============================================================= */}
        {isMobileRightPanelOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsMobileRightPanelOpen(false)}
            />

            {/* Slide-out Menu Panel */}
            <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-left p-3 sm:p-4">
              {renderRightPanelContent(true)}
            </aside>
          </div>
        )}
      </div>

      {/* Floating Mobile Action Trigger */}
      <div className="fixed bottom-5 right-5 z-40 xl:hidden">
        <button
          type="button"
          onClick={() => setIsMobileRightPanelOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#101828] px-4 py-3 text-xs font-bold text-white shadow-2xl border border-white/20 hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="h-4 w-4 text-[#14b8a6]" />
          <span>Bloques & Agente IA</span>
        </button>
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
                src={
                  ACTIVITY_MODAL_IMAGES[activityType] ||
                  ACTIVITY_MODAL_IMAGES.excursion
                }
                alt={activityType}
                className="absolute inset-0 h-full w-full object-cover opacity-90 scale-105 transition-transform duration-700 hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25" />

              {/* Top Badges */}
              <div className="relative z-10 flex items-center justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold text-white shadow-xs">
                  {activityType === "flight" && (
                    <Plane className="h-3.5 w-3.5 text-[#93C5FD]" />
                  )}
                  {activityType === "hotel" && (
                    <Bed className="h-3.5 w-3.5 text-[#93C5FD]" />
                  )}
                  {activityType === "excursion" && (
                    <MapPin className="h-3.5 w-3.5 text-[#93C5FD]" />
                  )}
                  {activityType === "food" && (
                    <Utensils className="h-3.5 w-3.5 text-[#93C5FD]" />
                  )}
                  {activityType === "transfer" && (
                    <Car className="h-3.5 w-3.5 text-[#93C5FD]" />
                  )}
                  <span className="capitalize">
                    {activityType === "flight" && "Vuelo"}
                    {activityType === "hotel" && "Alojamiento"}
                    {activityType === "excursion" && "Tour / Actividad"}
                    {activityType === "food" && "Gastronomía"}
                    {activityType === "transfer" && "Traslado"}
                  </span>
                </span>
              </div>

              {/* Bottom Contextual Preview */}
              <div className="relative z-10 space-y-2 pt-12 md:pt-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#93C5FD]">
                  {editingActivity ? "Editando servicio" : "Nuevo servicio"}
                </p>

                {activityType === "flight" && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {origin || "Origen"} → {destination || "Destino"}
                    </h4>
                    <div className="mt-1.5 flex items-center gap-2">
                      {getAirlineLogoUrl(flightNumber, airline) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getAirlineLogoUrl(flightNumber, airline)!}
                          alt={airline || "Aerolínea"}
                          className="h-5.5 w-auto max-w-[55px] object-contain bg-white rounded px-1 py-0.5 shadow-2xs"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <p className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                        <span className="font-bold text-[#93C5FD]">
                          {airline || "Aerolínea"}
                        </span>
                        {flightNumber && <span>· Vuelo {flightNumber}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90 mt-2 font-mono">
                      <span className="font-bold text-white">
                        {actTime || "10:00"}
                      </span>
                      <span>➔</span>
                      <span className="font-bold text-[#93C5FD]">
                        {arrivalTime || "—"}
                      </span>
                    </div>
                  </div>
                )}

                {activityType === "hotel" && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {hotelName || "Nombre del Alojamiento"}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                      {hotelAddress || "Ubicación / Dirección"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/90 mt-2.5 font-medium">
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                        Entrada: {targetModalDate || activeDate} (
                        {hotelCheckIn || "14:00"})
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                        Salida: {hotelCheckoutDate || "—"} (
                        {hotelCheckOut || "11:00"})
                      </span>
                    </div>
                  </div>
                )}

                {activityType === "excursion" && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {excursionTitle || "Título de la Actividad"}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      {excursionDuration || "Duración estimada"}
                    </p>
                  </div>
                )}

                {activityType === "food" && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {restaurantName || "Restaurante Gourmet"}
                    </h4>
                    <p className="text-xs text-[#93C5FD] mt-1 capitalize font-bold">
                      {mealType === "breakfast" && "Desayuno"}
                      {mealType === "lunch" && "Almuerzo / Comida"}
                      {mealType === "dinner" && "Cena gourmet"}
                      {mealType === "snack" && "Snack / Degustación"}
                    </p>
                  </div>
                )}

                {activityType === "transfer" && (
                  <div>
                    <h4 className="text-lg font-black text-white leading-tight">
                      {transferOrigin || "Origen"} → {transferDest || "Destino"}
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      {transferDuration || "30 - 45 min"} · {transferType}
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
                      {editingActivity
                        ? "Editar actividad"
                        : "Añadir nueva actividad"}
                    </h3>
                    <p className="text-xs text-[#667085]">
                      {editingActivity
                        ? "Modifica los detalles del servicio seleccionado."
                        : "Configura los datos del servicio para el día seleccionado."}
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
                      { id: "flight", label: "Vuelo", icon: Plane },
                      { id: "hotel", label: "Alojamiento", icon: Bed },
                      { id: "excursion", label: "Excursión", icon: MapPin },
                      { id: "food", label: "Restaurante", icon: Utensils },
                      { id: "transfer", label: "Traslado", icon: Car },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActivityType(tab.id as ActivityType)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          activityType === tab.id
                            ? "bg-white text-[#101828] shadow-xs"
                            : "text-[#71717a] hover:text-[#18181b]"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5 text-[#0066FF]" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* FORM BODY */}
                <form
                  onSubmit={handleSaveActivity}
                  id="activityForm"
                  className="space-y-3.5"
                >
                  {/* Vuelo Fields (NUEVO ORDEN) */}
                  {activityType === "flight" && (
                    <div className="space-y-3">
                      {/* 1. Nº de Vuelo con auto-detección y botón Autocompletar con AeroDataBox */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-[#344054]">
                            Nº de Vuelo
                          </label>
                          {(airline || detectAirlineFromFlightNumber(flightNumber)) && (
                            <span className="text-[11px] font-semibold text-[#0052CC] bg-[#eff6ff] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              ✈ {airline || detectAirlineFromFlightNumber(flightNumber)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={flightNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFlightNumber(val);
                                const autoAirline =
                                  detectAirlineFromFlightNumber(val);
                                if (autoAirline && !airline) {
                                  setAirline(autoAirline);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleLookupFlight();
                                }
                              }}
                              placeholder="ej: EY116, AA100 o IB3820"
                              className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium uppercase placeholder:normal-case"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleLookupFlight}
                            disabled={isLookingUpFlight || !flightNumber.trim()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white text-xs font-semibold shadow-xs hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Recuperar información del vuelo con AeroDataBox"
                          >
                            {isLookingUpFlight ? (
                              <>
                                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Buscando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Autocompletar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-[#667085] flex items-center gap-1">
                          <span>💡 Pulsa autocompletar para cargar aerolínea, origen, destino y horarios automáticamente vía AeroDataBox.</span>
                        </p>
                      </div>

                      {/* 1b. Aerolínea (editable) */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Aerolínea
                        </label>
                        <input
                          type="text"
                          value={airline}
                          onChange={(e) => setAirline(e.target.value)}
                          placeholder="ej: Etihad Airways, Iberia, Ryanair..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
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
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
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
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
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
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
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
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* 4. Precio estimado opcional */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€){" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>

                      {/* 5. Más detalles (opcional) */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles{" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Detalles del billete, terminal, equipaje o notas adicionales..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hotel Fields */}
                  {activityType === "hotel" && (
                    <div className="space-y-3">
                      {/* 1. Nombre del Alojamiento + Botón Autocompletar */}
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Nombre del Alojamiento
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={hotelName}
                              onChange={(e) => setHotelName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleLookupHotel();
                                }
                              }}
                              placeholder="ej: Marina Bay Sands, Hotel Arts, The Ritz..."
                              required
                              className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleLookupHotel}
                            disabled={isLookingUpHotel || !hotelName.trim()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white text-xs font-semibold shadow-xs hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Recuperar dirección, fotos, descripción y horarios automáticamente"
                          >
                            {isLookingUpHotel ? (
                              <>
                                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Buscando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Autocompletar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-[#667085] flex items-center gap-1">
                          <span>💡 Pulsa autocompletar para cargar dirección oficial, foto, descripción y horarios automáticamente.</span>
                        </p>
                      </div>
                      <div className="relative">
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Dirección / Ubicación
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={hotelAddress}
                            onChange={(e) =>
                              handleSearchAddress(
                                e.target.value,
                                "hotelAddress",
                              )
                            }
                            onFocus={() => {
                              if (
                                addressSuggestions.length > 0 &&
                                activeAddressField === "hotelAddress"
                              )
                                setShowAddressSuggestions(true);
                            }}
                            placeholder="ej: Via Vicinale Ludovico Lazzaro Zamenhof 5, Pisa"
                            className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {isSearchingAddress &&
                            activeAddressField === "hotelAddress" ? (
                              <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                            )}
                          </div>
                        </div>

                        {/* Address Autocomplete Dropdown */}
                        {showAddressSuggestions &&
                          activeAddressField === "hotelAddress" &&
                          addressSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                              <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                                <span>Sugerencias de dirección</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAddressSuggestions(false)
                                  }
                                  className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              {addressSuggestions.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    handleSelectAddressSuggestion(item)
                                  }
                                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                                >
                                  <MapPin className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#101828] group-hover:text-[#0052CC] truncate">
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
                      {/* Fechas de Entrada y Salida */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Fecha de entrada / Check-in
                          </label>
                          <input
                            type="date"
                            value={targetModalDate || activeDate}
                            onChange={(e) => {
                              const newInDate = e.target.value;
                              setTargetModalDate(newInDate);
                              if (
                                !hotelCheckoutDate ||
                                hotelCheckoutDate <= newInDate
                              ) {
                                setHotelCheckoutDate(getNextDateStr(newInDate));
                              }
                            }}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Fecha de salida / Check-out{" "}
                            <span className="text-[10px] font-normal text-[#98a2b3]">
                              (opcional)
                            </span>
                          </label>
                          <input
                            type="date"
                            value={hotelCheckoutDate}
                            onChange={(e) =>
                              setHotelCheckoutDate(e.target.value)
                            }
                            min={targetModalDate || activeDate}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      {/* Horas de Check-in y Check-out */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora Check-in
                          </label>
                          <input
                            type="time"
                            value={hotelCheckIn}
                            onChange={(e) => setHotelCheckIn(e.target.value)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora Check-out
                          </label>
                          <input
                            type="time"
                            value={hotelCheckOut}
                            onChange={(e) => setHotelCheckOut(e.target.value)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles / Tipo de habitación{" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          rows={2}
                          placeholder="Tipo de cama, régimen de comidas, vistas o notas de la reserva..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€){" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Excursion Fields */}
                  {activityType === "excursion" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Título de la actividad
                        </label>
                        <input
                          type="text"
                          value={excursionTitle}
                          onChange={(e) => setExcursionTitle(e.target.value)}
                          placeholder="ej: Tour en Catamarán Privado con Snorkel"
                          required
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora de inicio
                          </label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Duración
                          </label>
                          <input
                            type="text"
                            value={excursionDuration}
                            onChange={(e) =>
                              setExcursionDuration(e.target.value)
                            }
                            placeholder="ej: 4 horas"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles / Servicios incluidos{" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={actDescription || excursionDesc}
                          onChange={(e) => {
                            setActDescription(e.target.value);
                            setExcursionDesc(e.target.value);
                          }}
                          rows={2}
                          placeholder="Describe la experiencia y detalles de la visita..."
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Precio estimado (€){" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Food Fields */}
                  {activityType === "food" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Nombre del Restaurante
                        </label>
                        <input
                          type="text"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="ej: Restaurante Cenacolo"
                          required
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora de inicio
                          </label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Momento del día
                          </label>
                          <select
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value as any)}
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
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
                          Precio estimado (€){" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={actPrice}
                          onChange={(e) => setActPrice(Number(e.target.value))}
                          min={0}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles{" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Mesa reservada, tipo de menú, código de vestimenta o notas..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Transfer Fields */}
                  {activityType === "transfer" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Tipo de transporte
                          </label>
                          <select
                            value={transferType}
                            onChange={(e) =>
                              setTransferType(e.target.value as any)
                            }
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
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
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Duración estimada
                          </label>
                          <input
                            type="text"
                            value={transferDuration}
                            onChange={(e) =>
                              setTransferDuration(e.target.value)
                            }
                            placeholder="ej: 45 min"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Origen with Location Autocomplete */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Origen
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={transferOrigin}
                              onChange={(e) =>
                                handleSearchAddress(
                                  e.target.value,
                                  "transferOrigin",
                                )
                              }
                              onFocus={() => {
                                if (
                                  addressSuggestions.length > 0 &&
                                  activeAddressField === "transferOrigin"
                                )
                                  setShowAddressSuggestions(true);
                              }}
                              placeholder="ej: Aeropuerto Pisa / Estación"
                              className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isSearchingAddress &&
                              activeAddressField === "transferOrigin" ? (
                                <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                              )}
                            </div>
                          </div>

                          {/* Autocomplete Dropdown for Origen */}
                          {showAddressSuggestions &&
                            activeAddressField === "transferOrigin" &&
                            addressSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                                <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                                  <span>Sugerencias de origen</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAddressSuggestions(false)
                                    }
                                    className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {addressSuggestions.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      handleSelectAddressSuggestion(item)
                                    }
                                    className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                                  >
                                    <MapPin className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#101828] group-hover:text-[#0052CC] truncate">
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
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Destino
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={transferDest}
                              onChange={(e) =>
                                handleSearchAddress(
                                  e.target.value,
                                  "transferDest",
                                )
                              }
                              onFocus={() => {
                                if (
                                  addressSuggestions.length > 0 &&
                                  activeAddressField === "transferDest"
                                )
                                  setShowAddressSuggestions(true);
                              }}
                              placeholder="ej: Hotel Grand Palace / Centro"
                              className="w-full rounded-2xl border border-[#d0d5dd] pl-3.5 pr-9 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {isSearchingAddress &&
                              activeAddressField === "transferDest" ? (
                                <span className="h-3.5 w-3.5 block rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-[#98a2b3]" />
                              )}
                            </div>
                          </div>

                          {/* Autocomplete Dropdown for Destino */}
                          {showAddressSuggestions &&
                            activeAddressField === "transferDest" &&
                            addressSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl bg-white border border-[#eaecf0] shadow-2xl overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
                                <div className="px-3 py-1.5 bg-[#f8fafc] border-b border-[#eaecf0] flex items-center justify-between text-[10px] font-bold text-[#667085]">
                                  <span>Sugerencias de destino</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAddressSuggestions(false)
                                    }
                                    className="text-[#98a2b3] hover:text-[#101828] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {addressSuggestions.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      handleSelectAddressSuggestion(item)
                                    }
                                    className="w-full px-3.5 py-2.5 text-left hover:bg-[#f0fdfa] transition-colors border-b border-[#f2f4f7] last:border-0 flex items-start gap-2.5 cursor-pointer group"
                                  >
                                    <MapPin className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-[#101828] group-hover:text-[#0052CC] truncate">
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
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Hora de inicio
                          </label>
                          <input
                            type="time"
                            value={actTime}
                            onChange={(e) => setActTime(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#344054] mb-1">
                            Precio estimado (€){" "}
                            <span className="text-[10px] font-normal text-[#98a2b3]">
                              (opcional)
                            </span>
                          </label>
                          <input
                            type="number"
                            value={actPrice}
                            onChange={(e) =>
                              setActPrice(Number(e.target.value))
                            }
                            min={0}
                            placeholder="0"
                            className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">
                          Más detalles{" "}
                          <span className="text-[10px] font-normal text-[#98a2b3]">
                            (opcional)
                          </span>
                        </label>
                        <textarea
                          value={actDescription}
                          onChange={(e) => setActDescription(e.target.value)}
                          placeholder="Punto de encuentro, conductor, matrícula o notas del traslado..."
                          rows={2}
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Field: URL de Icono / Imagen personalizada */}
                  <div className="pt-3 border-t border-[#eaecf0]">
                    <label className="block text-xs font-bold text-[#344054] mb-1">
                      Icono o Imagen personalizada{" "}
                      <span className="text-[10px] font-normal text-[#98a2b3]">
                        (URL externa opcional)
                      </span>
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
                          className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden font-medium"
                        />
                      </div>
                      {customIconUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomIconUrl("")}
                          className="rounded-xl border border-[#e4e4e7] p-2 text-xs text-[#71717a] hover:bg-[#f4f4f5] cursor-pointer"
                          title="Quitar URL"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1">
                      Pega el enlace a un logo o imagen externa (Airbnb,
                      Booking, Renfe, TripAdvisor, etc.). Si la URL no carga o
                      está vacía, se mostrará el icono por defecto.
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
                  className="rounded-full bg-[#0066FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
                >
                  {editingActivity ? "Guardar cambios" : "Añadir al itinerario"}
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
              Esta acción eliminará el bloque del itinerario para el{" "}
              <strong>Día ({activeDate})</strong>. No se puede deshacer.
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
                <Wallet className="h-4 w-4 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-[#101828]">
                  Presupuesto & Gastos del viaje
                </h3>
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
                showToast("💰 Presupuesto actualizado");
              }}
              className="space-y-4"
            >
              {totalTripExpenses > 0 && (
                <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[#667085] block text-[11px]">
                      Suma de actividades del viaje:
                    </span>
                    <span className="font-extrabold text-[#101828] text-sm">
                      {formatPrice(totalTripExpenses)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBudgetInput(totalTripExpenses)}
                    className="rounded-xl bg-white border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#0066FF] hover:bg-blue-50 transition cursor-pointer shadow-2xs"
                  >
                    Usar esta suma
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">
                  Importe ({getCurrencySymbol()})
                </label>
                <input
                  type="number"
                  min={0}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  required
                  className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2.5 text-sm font-bold text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
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
                  className="rounded-full bg-[#0066FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
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
                <Upload className="h-4 w-4 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-[#101828]">
                  Foto de portada
                </h3>
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
                showToast("🖼 Foto de portada actualizada");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                  className="w-full rounded-2xl border border-[#d0d5dd] px-3.5 py-2.5 text-xs text-[#101828] focus:border-[#0066FF] focus:outline-hidden"
                />
              </div>

              {photoUrlInput && (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#eaecf0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrlInput}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
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
                  className="rounded-full bg-[#0066FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
                >
                  Actualizar portada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PROPOSAL LOGO MODAL (TWO COLUMNS BRANDING STYLE)              */}
      {/* ============================================================= */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in text-left text-[#101828]">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
              {/* COLUMNA IZQUIERDA: Imagen de marca & Filosofía White-Label */}
              <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white overflow-hidden bg-[#0c111d]">
                {/* Imagen de fondo generada con overlay de gradientes */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/brand-logo-cover.jpg"
                    alt="Identidad de marca y logotipo"
                    fill
                    priority
                    className="object-cover object-center scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c111d] via-[#0c111d]/70 to-[#0c111d]/40" />
                  <div className="absolute inset-0 bg-radial from-transparent to-[#0c111d]/60" />
                </div>

                {/* Badge superior */}
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-md border border-white/20">
                    <Sparkles className="h-3.5 w-3.5 text-[#00C6FF]" />
                    <span className="text-xs font-extrabold tracking-wide uppercase text-white">
                      Wanderlust Branding
                    </span>
                  </div>
                </div>

                {/* Contenido inferior */}
                <div className="relative z-10 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300">
                      Personalización de Marca
                    </span>
                    <h3 className="text-2xl font-black leading-tight text-white tracking-tight">
                      Tu marca en cada propuesta de viaje.
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-200 font-medium">
                      Configura la identidad visual de tus propuestas con el logotipo oficial de tu agencia para ofrecer a tus clientes una experiencia 100% personalizada.
                    </p>
                  </div>

                  {/* Viñetas destacadas */}
                  <div className="space-y-2 pt-3 border-t border-white/15">
                    <div className="flex items-center gap-2 text-xs text-zinc-200">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                        ✓
                      </span>
                      <span>Propuestas 100% marca blanca</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-200">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                        ✓
                      </span>
                      <span>Compatible con URLs externas, PNG y SVG</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-200">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066FF]/40 text-[#93C5FD] text-[11px] font-bold">
                        ✓
                      </span>
                      <span>Sincronización instantánea con el cliente</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Formulario de configuración de logotipo */}
              <div className="md:col-span-7 flex flex-col p-6 sm:p-8 bg-white overflow-y-auto max-h-[85vh]">
                <div className="flex items-start justify-between pb-4 border-b border-[#f2f4f7] shrink-0">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#101828]">
                      Logotipo de la propuesta
                    </h2>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Introduce la URL de tu logotipo o sube una imagen de marca
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(false)}
                    className="rounded-full p-2 text-[#667085] hover:bg-[#f2f4f7] hover:text-[#101828] transition cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (logoUrlInput.trim()) {
                      handleUpdateThemeSettings({ logoUrl: logoUrlInput.trim() });
                      setIsLogoModalOpen(false);
                      showToast("✨ Logotipo actualizado");
                    }
                  }}
                  className="mt-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] mb-1.5">
                        URL del logotipo (PNG, SVG, JPG, WebP)
                      </label>
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://tu-agencia.com/logo.png"
                        className="w-full rounded-xl border border-[#d0d5dd] bg-[#f8fafc] px-3.5 py-2.5 text-xs font-mono text-[#101828] focus:border-[#0066FF] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    {/* Separador O subir archivo */}
                    <div className="relative flex items-center justify-center my-1">
                      <hr className="w-full border-[#eaecf0]" />
                      <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-[#98a2b3]">
                        o sube un archivo
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="local-logo-file-2col"
                        className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#d0d5dd] bg-[#f9fafb] p-3.5 text-center hover:bg-blue-50/40 hover:border-[#0066FF]/50 transition cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-[#0066FF]" />
                        <span className="text-xs font-semibold text-[#344054]">
                          Haz clic para seleccionar imagen de tu equipo
                        </span>
                        <span className="text-[10px] text-[#667085]">
                          PNG, SVG, JPG o WebP (Fondo transparente recomendado)
                        </span>
                        <input
                          id="local-logo-file-2col"
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                showToast("⚠️ El archivo no debe superar 2 MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (reader.result) {
                                  setLogoUrlInput(reader.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Previsualización */}
                    {logoUrlInput && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[#475467]">
                          Vista previa:
                        </span>
                        <div className="relative min-h-[64px] w-full rounded-2xl bg-[#fafafa] border border-[#eaecf0] p-3 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrlInput}
                            alt="Vista previa logotipo"
                            className="max-h-12 max-w-[200px] w-auto h-auto object-contain"
                            onError={() => {
                              showToast("⚠️ No se ha podido cargar la imagen de la URL");
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer anclado abajo */}
                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#f2f4f7] mt-8 shrink-0">
                    {themeSettings.logoUrl &&
                    themeSettings.logoUrl !== "/wanderlust_horizontal_negro.png" ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateThemeSettings({
                            logoUrl: "/wanderlust_horizontal_negro.png",
                          });
                          setIsLogoModalOpen(false);
                          showToast("Logotipo restaurado a Wanderlust");
                        }}
                        className="text-xs font-semibold text-[#d92d20] hover:underline cursor-pointer"
                      >
                        Restaurar por defecto
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLogoModalOpen(false)}
                        className="rounded-xl border border-[#d0d5dd] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!logoUrlInput.trim()}
                        className="rounded-xl bg-[#0066FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer disabled:opacity-50"
                      >
                        Guardar logo
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Picker Modal */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0066FF]" />
                <h3 className="text-sm font-bold text-[#101828]">
                  Modificar fechas del viaje
                </h3>
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
                showToast("📅 Fechas de viaje actualizadas");
              }}
            />

            <div className="flex justify-end pt-4 border-t border-[#eaecf0] mt-4">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="rounded-full bg-[#0066FF] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0052CC] transition-all cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Booking & Payment Conditions Modal */}
      <BookingPaymentModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBookingActivity(null);
        }}
        activity={editingBookingActivity}
        defaultDate={targetModalDate || activeDate || activeTrip.startDate}
        onSave={async (data) => {
          if (editingBookingActivity) {
            await updateActivity(activeTrip.id, {
              ...editingBookingActivity,
              ...data,
              type: "booking",
            } as BookingActivity);
            showToast("✅ Condiciones de reserva actualizadas");
          } else {
            const dateToUse =
              targetModalDate || activeDate || activeTrip.startDate;
            const newBooking: BookingActivity = {
              id: `booking-${Date.now()}`,
              type: "booking",
              title: data.title || "Condiciones de Reserva y Plazos de Pago",
              date: dateToUse,
              time: data.time || "11:00",
              price: data.price || 1250,
              totalAmount: data.totalAmount || 1250,
              depositAmount: data.depositAmount || 250,
              depositPercentage: data.depositPercentage || 20,
              secondPaymentAmount: data.secondPaymentAmount || 500,
              secondPaymentDate: data.secondPaymentDate || "",
              finalPaymentAmount: data.finalPaymentAmount || 500,
              finalPaymentDate: data.finalPaymentDate || "",
              paymentProvider: data.paymentProvider || "redsys",
              cancellationPolicy: data.cancellationPolicy || "",
              description: data.description || data.cancellationPolicy || "",
              autoPaymentEnabled: data.autoPaymentEnabled ?? true,
            };
            await addActivity(activeTrip.id, newBooking);
            showToast("✅ Módulo de reservas y pagos añadido");
          }
          setIsBookingModalOpen(false);
          setEditingBookingActivity(null);
        }}
        onDelete={(actId) => {
          handleRequestDeleteActivity(actId);
        }}
      />

      {/* Trip Includes & Excludes Modal */}
      <TripIncludesModal
        isOpen={isIncludesModalOpen}
        onClose={() => {
          setIsIncludesModalOpen(false);
          setEditingIncludesActivity(null);
        }}
        activity={editingIncludesActivity}
        defaultDate={targetModalDate || activeDate || activeTrip?.startDate}
        tripName={activeTrip?.name || ""}
        onSave={async (data) => {
          if (!activeTrip) return;
          if (editingIncludesActivity) {
            await updateActivity(activeTrip.id, {
              ...editingIncludesActivity,
              ...data,
              type: "conditions",
            } as any);
            showToast("✅ Bloque 'Qué incluye y qué no incluye' actualizado");
          } else {
            const dateToUse =
              targetModalDate || activeDate || activeTrip.startDate;
            const newIncludesAct = {
              id: `conditions-${Date.now()}`,
              type: "conditions",
              title: data.title || "Qué incluye y qué no incluye",
              date: dateToUse,
              time: data.time || "10:00",
              price: 0,
              description: data.description || "",
              includes: data.includes || [],
              excludes: data.excludes || [],
              departureCities: data.departureCities || "",
              categories: data.categories || [],
              connectedDestinations: data.connectedDestinations || [],
              isIncludesBlock: true,
            };
            await addActivity(activeTrip.id, newIncludesAct as any);
            showToast("✅ Bloque 'Qué incluye y qué no incluye' añadido");
          }
          setIsIncludesModalOpen(false);
          setEditingIncludesActivity(null);
        }}
        onDelete={(actId) => {
          handleRequestDeleteActivity(actId);
        }}
      />

      <ShareTripModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripId={activeTrip?.id || id}
        tripName={activeTrip?.name || "Itinerario de viaje"}
        tripCode={tripCode}
      />
    </DashboardShell>
  );
}
