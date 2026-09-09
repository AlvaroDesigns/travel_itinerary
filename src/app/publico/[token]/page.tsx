"use client";

import {
  Bed,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  LockKeyhole,
  MapPin,
  PhoneCall,
  Plane,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  UserCog,
  Luggage,
  LogOut,
  UtensilsCrossed,
  X,
  CreditCard,
  CalendarCheck,
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  LayoutDashboard,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useTravel } from "@/context/TravelContext";
import { RedsysLogo } from "@/components/RedsysLogo";
import { UserAvatarDisplay } from "@/components/AvatarPickerModal";
import { WanderlustLoader } from "@/components/WanderlustLoader";

interface PageProps {
  params: Promise<{ token: string }>;
}

type PublicActivity = {
  id: string;
  type: string;
  date: string;
  time: string;
  title?: string;
  price?: number;
  isCheckout?: boolean;
  originalId?: string;
  checkoutDate?: string;
  checkIn?: string;
  checkOut?: string;
  hotelName?: string;
  totalAmount?: number;
  depositAmount?: number;
  depositPercentage?: number;
  secondPaymentAmount?: number;
  secondPaymentDate?: string;
  finalPaymentAmount?: number;
  finalPaymentDate?: string;
  paymentProvider?: "redsys" | "stripe";
  cancellationPolicy?: string;
  autoPaymentEnabled?: boolean;
  [key: string]: unknown;
};

type PublicTrip = {
  name: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  description: string | null;
  showExpenses: boolean;
  paymentProviders?: { redsys?: boolean; stripe?: boolean; inespay?: boolean };
  activities: PublicActivity[];
};

type PublicTripResponse =
  | { available: true; trip: PublicTrip }
  | { available: false; availableAt: string };

function toDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toDate(date));
}

function formatDayLabel(date: string) {
  const d = toDate(date);
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  const dayNum = d.getDate();
  const month = new Intl.DateTimeFormat("es-ES", { month: "short" })
    .format(d)
    .replace(".", "");
  return { weekday, dayNum, month };
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(toDate(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function tripDuration(startDate: string, endDate: string) {
  const diff =
    Math.round(
      (toDate(endDate).getTime() - toDate(startDate).getTime()) / 86_400_000,
    ) + 1;
  return Math.max(1, diff);
}

function tripDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = toDate(startDate);
  const end = toDate(endDate);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function extractAirportCode(locationStr?: string) {
  if (!locationStr) return "---";
  const match = locationStr.match(/\(([A-Z0-9]{3,4})\)/i);
  if (match) return match[1].toUpperCase();
  const trimmed = locationStr.trim();
  if (trimmed.length <= 4) return trimmed.toUpperCase();
  return trimmed.slice(0, 3).toUpperCase();
}

function calculateLayoverDuration(
  arrivalTime?: string,
  departureTime?: string,
) {
  if (!arrivalTime || !departureTime) return "";
  const [arrH, arrM] = arrivalTime.split(":").map(Number);
  const [depH, depM] = departureTime.split(":").map(Number);
  if (isNaN(arrH) || isNaN(arrM) || isNaN(depH) || isNaN(depM)) return "";

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
  const num = (flightNumber || "").toUpperCase().trim();
  const name = (airlineName || "").toLowerCase();

  let code = "";
  let airlineOfficialName = airlineName || "Vuelo Comercial";
  let bgColor = "bg-[#009688]";
  let textColor = "text-white";
  let borderColor = "border-[#009688]/40";
  let logoText = "FL";

  if (num.startsWith("FR") || name.includes("ryanair")) {
    code = "FR";
    airlineOfficialName = "Ryanair";
    bgColor = "bg-[#073590]";
    textColor = "text-[#f1c40f]";
    borderColor = "border-[#073590]/40";
    logoText = "FR";
  } else if (
    num.startsWith("IB") ||
    num.startsWith("I2") ||
    name.includes("iberia")
  ) {
    code = "IB";
    airlineOfficialName = num.startsWith("I2") ? "Iberia Express" : "Iberia";
    bgColor = "bg-[#d71920]";
    textColor = "text-white";
    borderColor = "border-[#d71920]/40";
    logoText = "IB";
  } else if (num.startsWith("VY") || name.includes("vueling")) {
    code = "VY";
    airlineOfficialName = "Vueling";
    bgColor = "bg-[#ffd200]";
    textColor = "text-[#101828]";
    borderColor = "border-[#ffd200]/50";
    logoText = "VY";
  } else if (num.startsWith("UX") || name.includes("europa")) {
    code = "UX";
    airlineOfficialName = "Air Europa";
    bgColor = "bg-[#0073ce]";
    textColor = "text-white";
    borderColor = "border-[#0073ce]/40";
    logoText = "UX";
  } else if (num.startsWith("LH") || name.includes("lufthansa")) {
    code = "LH";
    airlineOfficialName = "Lufthansa";
    bgColor = "bg-[#05164d]";
    textColor = "text-[#ffaa00]";
    borderColor = "border-[#05164d]/40";
    logoText = "LH";
  } else if (num.startsWith("AF") || name.includes("air france")) {
    code = "AF";
    airlineOfficialName = "Air France";
    bgColor = "bg-[#002157]";
    textColor = "text-white";
    borderColor = "border-[#002157]/40";
    logoText = "AF";
  } else if (num.startsWith("BA") || name.includes("british")) {
    code = "BA";
    airlineOfficialName = "British Airways";
    bgColor = "bg-[#075aaa]";
    textColor = "text-white";
    borderColor = "border-[#075aaa]/40";
    logoText = "BA";
  } else if (num.startsWith("EK") || name.includes("emirates")) {
    code = "EK";
    airlineOfficialName = "Emirates";
    bgColor = "bg-[#d71920]";
    textColor = "text-white";
    borderColor = "border-[#d71920]/40";
    logoText = "EK";
  } else if (num.startsWith("QR") || name.includes("qatar")) {
    code = "QR";
    airlineOfficialName = "Qatar Airways";
    bgColor = "bg-[#5c0632]";
    textColor = "text-white";
    borderColor = "border-[#5c0632]/40";
    logoText = "QR";
  } else if (num.startsWith("KL") || name.includes("klm")) {
    code = "KL";
    airlineOfficialName = "KLM";
    bgColor = "bg-[#00a1de]";
    textColor = "text-white";
    borderColor = "border-[#00a1de]/40";
    logoText = "KL";
  } else if (num.startsWith("EY") || name.includes("etihad")) {
    code = "EY";
    airlineOfficialName = "Etihad Airways";
    bgColor = "bg-[#b38b3f]";
    textColor = "text-white";
    borderColor = "border-[#b38b3f]/40";
    logoText = "EY";
  } else if (
    num.startsWith("U2") ||
    num.startsWith("EZY") ||
    num.startsWith("EZS") ||
    name.includes("easyjet")
  ) {
    code = "U2";
    airlineOfficialName = "easyJet";
    bgColor = "bg-[#ff6600]";
    textColor = "text-white";
    borderColor = "border-[#ff6600]/40";
    logoText = "EZ";
  } else if (num.startsWith("TK") || name.includes("turkish")) {
    code = "TK";
    airlineOfficialName = "Turkish Airlines";
    bgColor = "bg-[#e81932]";
    textColor = "text-white";
    borderColor = "border-[#e81932]/40";
    logoText = "TK";
  } else if (num.startsWith("TP") || name.includes("tap")) {
    code = "TP";
    airlineOfficialName = "TAP Air Portugal";
    bgColor = "bg-[#009b48]";
    textColor = "text-white";
    borderColor = "border-[#009b48]/40";
    logoText = "TP";
  } else if (
    num.startsWith("AZ") ||
    num.startsWith("ITY") ||
    name.includes("ita")
  ) {
    code = "AZ";
    airlineOfficialName = "ITA Airways";
    bgColor = "bg-[#00387b]";
    textColor = "text-white";
    borderColor = "border-[#00387b]/40";
    logoText = "AZ";
  } else if (name.includes("volotea") || num.startsWith("V7")) {
    code = "V7";
    airlineOfficialName = airlineName || "Volotea";
    bgColor = "bg-[#e5004c]";
    textColor = "text-white";
    borderColor = "border-[#e5004c]/40";
    logoText = "V7";
  } else if (
    name.includes("wizz") ||
    num.startsWith("W6") ||
    num.startsWith("WZZ")
  ) {
    code = "W6";
    airlineOfficialName = airlineName || "Wizz Air";
    bgColor = "bg-[#cb0081]";
    textColor = "text-white";
    borderColor = "border-[#cb0081]/40";
    logoText = "W6";
  } else {
    const match = num.match(/^([A-Z0-9]{2})/);
    code = match ? match[1] : "";
    const cleanName = airlineName || "Vuelo";
    logoText =
      cleanName
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || (code ? code : "FL");
  }

  const logoUrl = code
    ? `https://cdn.logitravel.com/webmobile/vuelos/images/logo_${code.toUpperCase()}.png`
    : null;

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
  const customUrl =
    typeof act.customIconUrl === "string" ? act.customIconUrl.trim() : null;
  const isHotel = act.type === "hotel";
  const isFood = act.type === "food";
  const isTransfer = act.type === "transfer";
  const isExcursion = act.type === "excursion";
  const isBooking = act.type === "booking" || act.type === "pago";

  useEffect(() => {
    setImgError(false);
  }, [act.customIconUrl, act.type]);

  if (customUrl && !imgError) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#eaecf0] shadow-2xs z-10 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0 overflow-hidden p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customUrl}
          alt={String(act.type || "actividad")}
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
      {isBooking && <CalendarCheck className="h-5 w-5" />}
      {act.type === "flight" && <Plane className="h-5 w-5" />}
    </div>
  );
}

function hasActivityDetails(act: PublicActivity): boolean {
  if (act.type === "booking" || act.type === "pago") return true;
  if (typeof act.description === "string" && act.description.trim().length > 0)
    return true;
  if (typeof act.notes === "string" && act.notes.trim().length > 0) return true;
  if (act.type === "flight" && Array.isArray(act.legs) && act.legs.length > 1)
    return true;
  return false;
}

function PublicActivityCardItem({
  act,
  trip,
  onSelect,
  onNavigateToPayments,
}: {
  act: PublicActivity;
  trip: PublicTrip;
  onSelect: (act: PublicActivity) => void;
  onNavigateToPayments?: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const customUrl =
    typeof act.customIconUrl === "string" && act.customIconUrl.trim().length > 0
      ? act.customIconUrl.trim()
      : null;
  const isHotel = act.type === "hotel";
  const isFood = act.type === "food";
  const isTransfer = act.type === "transfer";
  const isExcursion = act.type === "excursion";
  const isBooking = act.type === "booking" || act.type === "pago";
  const isClickable = hasActivityDetails(act);
  const showFullImage = Boolean(customUrl && !imgError);

  useEffect(() => {
    setImgError(false);
  }, [act.customIconUrl]);

  return (
    <div
      onClick={() => isClickable && onSelect(act)}
      className={`group relative flex flex-row items-stretch rounded-3xl border border-[#eaecf0] bg-white shadow-xs transition-all overflow-hidden min-h-[140px] sm:min-h-[155px] ${
        isClickable
          ? "cursor-pointer hover:border-[#009688] hover:shadow-md"
          : ""
      }`}
    >
      {showFullImage ? (
        <div className="w-1/3 min-w-[110px] max-w-[220px] shrink-0 relative bg-slate-100 overflow-hidden self-stretch">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customUrl!}
            alt={String(
              act.title || act.hotelName || act.restaurantName || act.type,
            )}
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
            {isBooking && <CalendarCheck className="h-5 w-5" />}
            {act.type === "flight" && <Plane className="h-5 w-5" />}
          </div>
        </div>
      )}

      <div className="w-2/3 flex-1 p-3.5 sm:p-5 min-w-0 flex flex-col justify-between">
        <div>
          {/* 1. Title */}
          {isHotel && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {act.isCheckout
                ? `Check-out: ${(act.hotelName as string) || "Alojamiento"}`
                : (act.hotelName as string) || "Hotel Resort & Spa"}
            </h3>
          )}

          {isExcursion && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.title as string) || "Tour y Excursión"}
            </h3>
          )}

          {isFood && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.restaurantName as string) || "Restaurante Exclusivo"}
            </h3>
          )}

          {isTransfer && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.origin as string) || "Origen"} →{" "}
              {(act.destination as string) || "Destino"}
            </h3>
          )}

          {act.type === "flight" && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.airline as string) || "Vuelo"}{" "}
              {act.flightNumber ? `(${act.flightNumber})` : ""}
            </h3>
          )}

          {isBooking && (
            <h3 className="text-sm sm:text-base font-extrabold text-[#101828] leading-tight">
              {(act.title as string) || "Condiciones de Reserva y Plazos de Pago"}
            </h3>
          )}

          {/* 2. Category & Time Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 mb-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                act.isCheckout
                  ? "bg-rose-50 border border-rose-200 text-rose-700"
                  : isBooking
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-[#f2f4f7] text-[#475467]"
              }`}
            >
              {isHotel &&
                (act.isCheckout ? "Check-out Alojamiento" : "Alojamiento")}
              {isFood && "Restaurante & Gastronomía"}
              {isTransfer && "Traslado Privado"}
              {isExcursion && "Actividad Guiada"}
              {isBooking && "Módulo de Pago & Reserva"}
              {act.type === "flight" && "Vuelo"}
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
                  Salida de la estancia antes de las{" "}
                  {String(act.checkOut || act.time || "11:00")}
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
              {(act.mealType as string) || "Comida"}
              {act.description ? ` · ${act.description}` : ""}
            </p>
          )}

          {isTransfer && (
            <p className="text-xs text-[#667085] mt-1">
              {act.duration ? `${act.duration as string} · ` : ""}
              {act.description
                ? String(act.description)
                : "Traslado confirmado"}
            </p>
          )}

          {isBooking && (
            <div className="space-y-1 mt-1">
              <p className="text-xs text-[#667085]">
                Pasarela: <strong className="text-[#101828] uppercase font-bold">{(act.paymentProvider as string) || "Redsys"}</strong> · Depósito inicial: <strong className="text-[#009688] font-bold">{Number(act.depositAmount || 250)} €</strong>
              </p>
              {Boolean(act.cancellationPolicy || act.description) && (
                <p className="text-xs text-[#475467] line-clamp-2">
                  {String(act.cancellationPolicy || act.description)}
                </p>
              )}
            </div>
          )}
        </div>

        {(Boolean(trip.showExpenses && act.price && act.price > 0) ||
          isClickable ||
          isBooking) && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-[#f2f4f7]">
            {isBooking ? (
              onNavigateToPayments ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToPayments();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#009688] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#00796b] shadow-xs cursor-pointer transition-all"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Ver plazos y pagar depósito</span>
                </button>
              ) : (
                <span className="rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-xs font-bold text-[#00796b]">
                  Depósito: {formatCurrency(Number(act.depositAmount || 250))}
                </span>
              )
            ) : trip.showExpenses && act.price && act.price > 0 ? (
              <span className="rounded-full bg-[#f8fafc] px-2.5 py-0.5 text-xs font-black text-[#101828] border border-[#eaecf0]">
                {formatCurrency(act.price)}
              </span>
            ) : (
              <div />
            )}

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
  const { user, logout } = useTravel();
  const [data, setData] = useState<PublicTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "itinerario" | "resumen" | "pagos" | "notas"
  >("itinerario");
  const [isProcessingRedsys, setIsProcessingRedsys] = useState(false);
  const [redsysError, setRedsysError] = useState<string | null>(null);
  const [pagoStatus, setPagoStatus] = useState<"ok" | "ko" | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<PublicActivity | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "deposit">("deposit");
  const [paymentMethod, setPaymentMethod] = useState<
    "redsys_card" | "redsys_bizum" | "stripe_card" | "stripe_apple_pay" | "stripe_google_pay" | "stripe_paypal"
  >("redsys_card");
  const [tempPaymentMethod, setTempPaymentMethod] = useState<
    "redsys_card" | "redsys_bizum" | "stripe_card" | "stripe_apple_pay" | "stripe_google_pay" | "stripe_paypal"
  >("redsys_card");
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [isPolicyInfoOpen, setIsPolicyInfoOpen] = useState(false);
  const [isPriceDetailModalOpen, setIsPriceDetailModalOpen] = useState(false);
  const [activePaymentProviders, setActivePaymentProviders] = useState<{ redsys: boolean; stripe: boolean }>({
    redsys: true,
    stripe: false,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((profile) => {
        if (profile?.preferences?.paymentProviders) {
          const pp = profile.preferences.paymentProviders;
          setActivePaymentProviders({
            redsys: pp.redsys?.connected !== false,
            stripe: Boolean(pp.stripe?.connected),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pago = urlParams.get("pago");
      if (pago === "ok") {
        setPagoStatus("ok");
        setActiveTab("pagos");
      } else if (pago === "ko") {
        setPagoStatus("ko");
        setActiveTab("pagos");
      }
    }
  }, []);

  const handlePayWithRedsys = async (depositAmount: number, tripName: string) => {
    setIsProcessingRedsys(true);
    setRedsysError(null);
    try {
      const res = await fetch("/api/payments/redsys/create-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          amount: depositAmount,
          description: `Depósito Reserva: ${tripName.slice(0, 50)}`,
        }),
      });

      const chargeData = await res.json();
      if (!res.ok || !chargeData.formUrl) {
        throw new Error(chargeData.error || "Error al conectar con la pasarela Redsys");
      }

      // Auto-create and submit form to Redsys SIS endpoint
      const form = document.createElement("form");
      form.method = "POST";
      form.action = chargeData.formUrl;

      Object.entries(chargeData.params).forEach(([key, val]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(val);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      setIsProcessingRedsys(false);
      setRedsysError(err instanceof Error ? err.message : "Error al iniciar el pago con Redsys");
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => setIsUserMenuOpen(false);
    if (isUserMenuOpen) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [isUserMenuOpen]);

  const getUserDisplayName = () => {
    if (user?.email) return user.email.split("@")[0];
    return "Usuario";
  };

  useEffect(() => {
    const controller = new AbortController();
    async function loadTrip() {
      try {
        const response = await fetch(
          `/api/public/trips/${encodeURIComponent(token)}`,
          {
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as PublicTripResponse & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(
            payload.error || "No se ha podido abrir el itinerario",
          );
        setData(payload);
        if (payload.available) {
          setSelectedDate(payload.trip.startDate);
          if (payload.trip.paymentProviders) {
            setActivePaymentProviders({
              redsys: payload.trip.paymentProviders.redsys !== false,
              stripe: Boolean(payload.trip.paymentProviders.stripe),
            });
          }
        }
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se ha podido abrir el itinerario",
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
          <h1 className="mt-5 text-xl font-extrabold text-[#101828]">
            Enlace no disponible
          </h1>
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
    return <WanderlustLoader />;
  }

  if (!data.available) {
    const availableAt = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
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
          <h1 className="mt-2 text-2xl font-extrabold text-[#101828]">
            Itinerario por descubrir
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-[#667085]">
            El itinerario se desbloqueará el {availableAt}.
          </p>
        </div>
      </main>
    );
  }

  const { trip } = data;
  const dates = tripDates(trip.startDate, trip.endDate);
  const activeDate =
    selectedDate && dates.includes(selectedDate)
      ? selectedDate
      : trip.startDate;
  const getNextDateStr = (dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts;
    const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
    const ny = nextDate.getUTCFullYear();
    const nm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
    const nd = String(nextDate.getUTCDate()).padStart(2, "0");
    return `${ny}-${nm}-${nd}`;
  };

  const activitiesByDate: Record<string, PublicActivity[]> = {};

  trip.activities.forEach((activity) => {
    // 1. Add primary activity to its scheduled date
    activitiesByDate[activity.date] = [
      ...(activitiesByDate[activity.date] || []),
      activity,
    ];

    // 2. If hotel, also register check-out on departure day (strictly after check-in date)
    if (activity.type === "hotel") {
      let checkoutDay =
        typeof activity.checkoutDate === "string"
          ? activity.checkoutDate.trim()
          : "";
      if (!checkoutDay || checkoutDay === activity.date) {
        checkoutDay = getNextDateStr(activity.date);
      }
      const checkoutTime = (activity.checkOut as string) || "11:00";

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
        activitiesByDate[checkoutDay] = [
          ...(activitiesByDate[checkoutDay] || []),
          checkoutAct,
        ];
      }
    }
  });

  // Sort each day chronologically by time
  Object.keys(activitiesByDate).forEach((d) => {
    activitiesByDate[d].sort((a, b) =>
      (a.time || "").localeCompare(b.time || ""),
    );
  });

  const activeActivities = activitiesByDate[activeDate] ?? [];
  const duration = tripDuration(trip.startDate, trip.endDate);
  const totalExpenses = trip.activities.reduce(
    (sum, a) => sum + (a.price || 0),
    0,
  );

  const bookingActivities = trip.activities.filter(
    (a) =>
      a.type === "booking" ||
      a.type === "pago" ||
      (typeof a.depositAmount === "number" && a.depositAmount > 0) ||
      (a.paymentProvider !== undefined && a.paymentProvider !== null),
  );
  const hasPaymentModule = bookingActivities.length > 0;
  const primaryBooking = bookingActivities[0] || null;

  const navTabs: {
    id: "itinerario" | "resumen" | "pagos" | "notas";
    label: string;
  }[] = [
    { id: "itinerario", label: "Itinerario" },
    { id: "resumen", label: "Resumen de servicios" },
    ...(hasPaymentModule
      ? [{ id: "pagos" as const, label: "Pagos & Depósito" }]
      : []),
    { id: "notas", label: "Notas" },
  ];

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({ title: trip.name, url: window.location.href });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
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
      <div className="relative w-full bg-[#0c111d] text-white rounded-b-[2rem] sm:rounded-b-[3rem] lg:rounded-b-[3.5rem] shadow-xl">
        {/* Cover Photo */}
        <div className="relative h-72 sm:h-84 md:h-[420px] lg:h-[460px] w-full overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem] lg:rounded-b-[3.5rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              trip.imageUrl ||
              "https://images.unsplash.com/photo-1512815046276-89d511254976?auto=format&fit=crop&w=1600&q=80"
            }
            alt={trip.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Top Floating Glass Bar inside Hero */}
        <div className="absolute top-0 inset-x-0 z-30 mx-auto max-w-7xl px-4 sm:px-8 pt-5 sm:pt-6 flex items-center justify-between">
          {/* Left: White Logo */}
          <Link
            href="/"
            className="flex items-center group transition-transform hover:scale-105"
            aria-label="Inicio"
          >
            <Image
              src="/wanderlust_horizontal_blanco.png"
              alt="Wanderlust"
              width={180}
              height={45}
              style={{ width: "auto", height: "auto" }}
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-md"
              priority
            />
          </Link>

          {/* Right: Actions (Share icon button + User Avatar Dropdown if logged in) */}
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

            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/login?redirect=/publico/${token}`}
                  className="rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 shadow-md px-3 sm:px-4 py-1.5 text-xs font-bold transition-all hover:scale-102"
                >
                  Inicia sesión
                </Link>
                <Link
                  href="/registro"
                  className="hidden sm:inline-flex rounded-full bg-[#009688] hover:bg-[#00796b] text-white shadow-md px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-102"
                >
                  Regístrate gratis
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  title={`Opciones de ${getUserDisplayName()}`}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all cursor-pointer overflow-hidden ${
                    isUserMenuOpen
                      ? "ring-2 ring-[#009688] shadow-lg"
                      : "hover:ring-2 hover:ring-white/40 shadow-md"
                  }`}
                >
                  <UserAvatarDisplay
                    avatar={user?.avatar || "traveler-girl-teal"}
                    name={getUserDisplayName()}
                    size="sm"
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-12 sm:top-14 z-50 w-64 rounded-3xl border border-[#eaecf0] bg-white p-2 shadow-2xl text-left animate-scale-in text-[#101828]"
                  >
                    {/* Header: User Name + Role */}
                    <div className="px-3 py-3 border-b border-[#eaecf0]">
                      <p className="text-sm font-bold text-[#101828] truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-[#667085] mt-0.5 truncate">
                        {user.email}
                      </p>
                      <span className="mt-1.5 inline-block rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#00796b]">
                        {user.role === "superuser" || user.role === "superadmin"
                          ? "SUPERUSER"
                          : user.role === "admin"
                          ? "Administrador"
                          : "Usuario"}
                      </span>
                    </div>

                    {/* Navigation Items */}
                    <div className="pt-2 pb-1 space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-[#009688]" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/viajes"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                      >
                        <Plane className="h-4 w-4 text-[#009688]" />
                        <span>Mis Viajes</span>
                      </Link>

                      <Link
                        href="/clientes"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                      >
                        <Users className="h-4 w-4 text-[#009688]" />
                        <span>Clientes</span>
                      </Link>

                      <Link
                        href="/cuenta"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                      >
                        <User className="h-4 w-4 text-[#667085]" />
                        <span>Mi cuenta</span>
                      </Link>

                      {(user.role === "admin" ||
                        user.role === "superadmin" ||
                        user.role === "superuser" ||
                        (user.tenantId && user.tenantId !== "particular")) && (
                        <Link
                          href="/usuarios"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                        >
                          <UserCog className="h-4 w-4 text-[#009688]" />
                          <span>Usuarios</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Item */}
                    <div className="pt-1 border-t border-[#eaecf0]">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#d92d20] hover:bg-[#fef3f2] transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-[#d92d20]" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
      {/* 2. NAVIGATION TABS (Segmented Tabs Style - Spacious & Touch-friendly) */}
      {/* ----------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-5 sm:pt-7">
        <div className="w-full overflow-x-auto pb-1 [scrollbar-width:none]">
          <div className="flex sm:inline-flex items-center gap-1.5 rounded-2xl sm:rounded-full bg-[#f1f3f5] p-1.5 border border-[#e4e7ec] shadow-xs w-full sm:w-auto">
            {navTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-initial text-center rounded-xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? "bg-white text-[#101828] shadow-md ring-1 ring-black/5"
                      : "text-[#667085] hover:text-[#101828] hover:bg-white/60"
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
      {/* 3. DÍAS SELECTOR (Solo visible en pestaña Itinerario)       */}
      {/* ----------------------------------------------------------- */}
      {activeTab === "itinerario" && (
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
                      ? "bg-[#009688] text-white shadow-lg shadow-[#009688]/30 scale-105 ring-2 ring-[#009688]/20"
                      : "bg-white text-[#475467] border border-[#eaecf0] shadow-xs hover:border-[#009688]/50 hover:bg-slate-50"
                  }`}
                  title={`${weekday} ${dayNum}`}
                >
                  <span
                    className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                      isSelected
                        ? "text-white/90"
                        : "text-[#667085] group-hover:text-[#101828]"
                    }`}
                  >
                    {weekday}
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black leading-tight mt-0.5 ${
                      isSelected ? "text-white" : "text-[#101828]"
                    }`}
                  >
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 4. MAIN CONTENT: 2-COLUMN RESPONSIVE LAYOUT                 */}
      {/* ----------------------------------------------------------- */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-5">
        {activeTab === "itinerario" && (
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
                  <h3 className="mt-3 text-base font-extrabold text-[#101828]">
                    Día libre para relajarse
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-[#667085] leading-relaxed">
                    No hay traslados ni horarios programados para esta jornada.
                    Aprovecha para explorar el destino o descansar en el hotel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeActivities.map((act) => {
                    const isFlight = act.type === "flight";
                    const isHotel = act.type === "hotel";
                    const isFood = act.type === "food";
                    const isTransfer = act.type === "transfer";
                    const isExcursion = act.type === "excursion";

                    const airlineMeta = isFlight
                      ? getAirlineMeta(
                          act.airline as string,
                          act.flightNumber as string,
                        )
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
                                leg.flightNumber ||
                                  (act.flightNumber as string),
                              );
                              const nextLeg = legs[lIdx + 1];

                              return (
                                <div key={lIdx} className="space-y-3">
                                  {/* Individual Card for this flight leg */}
                                  <div
                                    onClick={() =>
                                      hasActivityDetails(act) &&
                                      setSelectedActivity(act)
                                    }
                                    className={`group relative flex flex-col gap-3.5 rounded-3xl border border-[#eaecf0] bg-white p-4 sm:p-5 shadow-xs transition-all ${
                                      hasActivityDetails(act)
                                        ? "cursor-pointer hover:border-[#009688] hover:shadow-md"
                                        : ""
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
                                                  const target =
                                                    e.currentTarget;
                                                  target.style.display = "none";
                                                  if (target.parentElement) {
                                                    target.parentElement.className = `flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full font-black text-xs sm:text-sm tracking-tight shadow-xs border ${legAirlineMeta.bgColor} ${legAirlineMeta.textColor} ${legAirlineMeta.borderColor}`;
                                                    target.parentElement.innerText =
                                                      legAirlineMeta.logoText;
                                                  }
                                                }}
                                              />
                                            ) : (
                                              <div
                                                className={`flex h-full w-full items-center justify-center rounded-full font-black text-xs ${legAirlineMeta.bgColor} ${legAirlineMeta.textColor}`}
                                              >
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
                                                  : "Vuelo regular"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-bold text-[#15803d] flex items-center gap-1.5 shadow-2xs">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                                            <span>
                                              Tramo {lIdx + 1} de {legs.length}
                                            </span>
                                          </span>

                                          {lIdx === 0 &&
                                            trip.showExpenses &&
                                            act.price &&
                                            act.price > 0 && (
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
                                            {leg.origin || "Origen"}
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
                                            {leg.destination || "Destino"}
                                          </p>
                                          <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                            {extractAirportCode(
                                              leg.destination,
                                            )}
                                          </p>
                                          <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                            {leg.arrivalTime || "—"}
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
                                        const layoverTime =
                                          calculateLayoverDuration(
                                            leg.arrivalTime,
                                            nextLeg.departureTime,
                                          );
                                        return (
                                          <div className="relative z-10 rounded-full bg-[#fff7ed] border border-[#ffedd5] px-4 py-1.5 text-xs font-bold text-[#c2410c] shadow-xs flex items-center gap-2">
                                            <Clock3 className="h-3.5 w-3.5 text-[#ea580c]" />
                                            <span>
                                              Escala en{" "}
                                              {extractAirportCode(
                                                leg.destination,
                                              ) !== "---"
                                                ? extractAirportCode(
                                                    leg.destination,
                                                  )
                                                : leg.destination}
                                              {layoverTime
                                                ? ` · ${layoverTime}`
                                                : ""}
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
                          onClick={() =>
                            hasActivityDetails(act) && setSelectedActivity(act)
                          }
                          className={`group relative flex flex-col gap-3.5 rounded-3xl border border-[#eaecf0] bg-white p-4 sm:p-5 shadow-xs transition-all ${
                            hasActivityDetails(act)
                              ? "cursor-pointer hover:border-[#009688] hover:shadow-md"
                              : ""
                          }`}
                        >
                          <div className="w-full space-y-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#f2f4f7]">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 border border-[#eaecf0] shadow-2xs overflow-hidden"
                                  title={airlineMeta.name}
                                >
                                  {Boolean(
                                    (act.customIconUrl as string) ||
                                    airlineMeta.logoUrl,
                                  ) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={
                                        (act.customIconUrl as string)?.trim() ||
                                        airlineMeta.logoUrl!
                                      }
                                      alt={airlineMeta.name}
                                      className="h-full w-full object-contain"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = "none";
                                        if (target.parentElement) {
                                          target.parentElement.className = `flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs sm:text-sm tracking-tight shadow-xs border ${airlineMeta.bgColor} ${airlineMeta.textColor} ${airlineMeta.borderColor}`;
                                          target.parentElement.innerText =
                                            airlineMeta.logoText;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className={`flex h-full w-full items-center justify-center rounded-2xl font-black text-xs ${airlineMeta.bgColor} ${airlineMeta.textColor}`}
                                    >
                                      {airlineMeta.logoText}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-sm sm:text-base text-[#101828]">
                                    {airlineMeta.name}
                                  </span>
                                  <p className="text-[11px] font-bold text-[#475467] mt-0.5">
                                    {act.flightNumber
                                      ? `Vuelo ${act.flightNumber}`
                                      : "Vuelo regular"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-bold text-[#15803d] flex items-center gap-1.5 shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                                  <span>Directo (Non-Stop)</span>
                                </span>
                                {trip.showExpenses &&
                                  act.price &&
                                  act.price > 0 && (
                                    <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-black text-[#101828] border border-[#eaecf0]">
                                      {formatCurrency(act.price)}
                                    </span>
                                  )}
                              </div>
                            </div>

                            <div className="py-2 flex items-center justify-between gap-3 sm:gap-6">
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-semibold text-[#667085] truncate">
                                  {(act.origin as string) || "Origen"}
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
                                  {(act.destination as string) || "Destino"}
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                                  {extractAirportCode(
                                    act.destination as string,
                                  )}
                                </p>
                                <p className="text-xs sm:text-sm font-extrabold text-[#009688] mt-0.5">
                                  {(act.arrivalTime as string) || "—"}
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
                        onNavigateToPayments={() => setActiveTab("pagos")}
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
                    ? "Jornada libre para descansar o explorar a tu propio ritmo."
                    : `${activeActivities.length} ${
                        activeActivities.length === 1
                          ? "servicio programado"
                          : "servicios programados"
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
                  Todos los traslados, hoteles y actividades cuentan con seguro
                  de viaje y soporte directo durante toda tu estancia.
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
        {activeTab === "resumen" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Plane className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === "flight").length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">
                  Vuelos confirmados
                </p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Bed className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === "hotel").length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">
                  Noches de hotel
                </p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === "excursion").length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">
                  Excursiones y tours
                </p>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688] mb-3">
                  <Car className="h-6 w-6" />
                </div>
                <p className="text-3xl font-black text-[#101828]">
                  {trip.activities.filter((a) => a.type === "transfer").length}
                </p>
                <p className="text-xs font-bold text-[#667085] mt-1">
                  Traslados privados
                </p>
              </div>
            </div>

            {/* List of all Hotels */}
            <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-[#101828] uppercase tracking-wider">
                Alojamientos confirmados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trip.activities
                  .filter((a) => a.type === "hotel")
                  .map((hotelAct, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#eaecf0] p-4 bg-[#f8fafc] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#101828] text-sm">
                          {(hotelAct.hotelName as string) || "Hotel"}
                        </span>
                        <span className="rounded-full bg-[#e0f2f1] px-2.5 py-0.5 text-[10px] font-bold text-[#009688]">
                          {hotelAct.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#667085] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#009688]" />
                        <span>
                          {(hotelAct.address as string) || "Dirección"}
                        </span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB: CONFIRMAR Y PAGAR (AIRBNB STYLE 2-COLUMN CHECKOUT)     */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "pagos" && (() => {
          const baseTripAmount = Number(
            primaryBooking?.totalAmount ??
              (trip.showExpenses && primaryBooking?.price ? primaryBooking.price : 1250)
          );
          const depositPercentage = primaryBooking?.depositPercentage || 20;
          const depositAmount = Number(
            primaryBooking?.depositAmount ?? Math.round(baseTripAmount * (depositPercentage / 100))
          );

          const amountDueToday = paymentPlan === "full" ? baseTripAmount : depositAmount;
          const remainingBalance = Math.max(0, baseTripAmount - amountDueToday);

          return (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Payment Feedback Banners */}
              {pagoStatus === "ok" && (
                <div className="rounded-3xl border border-emerald-300 bg-emerald-50/90 p-5 sm:p-6 text-emerald-950 shadow-md flex items-start gap-3.5 animate-fade-in">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-emerald-950">
                      ¡Pago confirmado con éxito!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Tu transacción ha sido procesada correctamente a través de la pasarela bancaria oficial. La reserva de tu viaje queda confirmada y hemos enviado el recibo formal a tu correo.
                    </p>
                  </div>
                </div>
              )}

              {pagoStatus === "ko" && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-5 sm:p-6 text-rose-900 shadow-md flex items-start gap-3.5 animate-fade-in">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xs">
                    <X className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-rose-950">
                      Pago cancelado o no completado
                    </h3>
                    <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                      La operación no se ha completado en la pasarela. Puedes volver a intentarlo cuando desees o utilizar otra tarjeta bancaria.
                    </p>
                  </div>
                </div>
              )}

              {/* Main 2-Column Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-1">
                {/* ======================================================== */}
                {/* LEFT COLUMN: PAYMENT OPTIONS, METHOD & GREEN CTA         */}
                {/* ======================================================== */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Main Heading */}
                  <div className="flex items-center gap-3 pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("itinerario")}
                      className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                      title="Volver al itinerario"
                    >
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
                      Confirmar y pagar
                    </h1>
                  </div>

                  {/* Card 1: Elige cuándo quieres pagar */}
                  <div className="rounded-3xl border border-[#eaecf0] bg-white shadow-xs overflow-hidden">
                    <div className="p-6 pb-4">
                      <h3 className="text-base font-semibold text-[#101828]">
                        Elige cuándo quieres pagar
                      </h3>
                    </div>

                    {/* Option 1: Pagar todo ahora */}
                    <div
                      onClick={() => setPaymentPlan("full")}
                      className={`p-6 border-t border-[#f2f4f7] flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        paymentPlan === "full" ? "bg-zinc-50/60" : "hover:bg-zinc-50/30"
                      }`}
                    >
                      <div>
                        <span className="text-sm sm:text-base font-normal text-[#101828]">
                          Paga <span className="font-semibold">{formatCurrency(baseTripAmount)}</span> ahora
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentPlan === "full"
                              ? "border-[#101828]"
                              : "border-[#d0d5dd] bg-white"
                          }`}
                        >
                          {paymentPlan === "full" && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Depósito + Resto más adelante (Default) */}
                    <div
                      onClick={() => setPaymentPlan("deposit")}
                      className={`p-6 border-t border-[#f2f4f7] flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                        paymentPlan === "deposit" ? "bg-zinc-50/60" : "hover:bg-zinc-50/30"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-sm sm:text-base font-normal text-[#101828] block">
                          Paga una parte ahora y otra más adelante
                        </span>
                        <p className="text-xs sm:text-sm font-normal text-[#667085] leading-relaxed">
                          Paga <span className="font-medium text-[#101828]">{formatCurrency(depositAmount)}</span> ahora y{" "}
                          <span className="font-medium text-[#101828]">{formatCurrency(baseTripAmount - depositAmount)}</span> el{" "}
                          {primaryBooking?.finalPaymentDate
                            ? formatDate(primaryBooking.finalPaymentDate)
                            : "24 sept"}{" "}
                          Sin cargos adicionales.{" "}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPolicyInfoOpen(true);
                            }}
                            className="underline font-medium text-[#101828] hover:text-[#009688] cursor-pointer"
                          >
                            Más información
                          </button>
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5 flex items-center justify-center">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentPlan === "deposit"
                              ? "border-[#101828]"
                              : "border-[#d0d5dd] bg-white"
                          }`}
                        >
                          {paymentPlan === "deposit" && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Método de pago */}
                  <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-[#101828]">
                        Método de pago
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPaymentMethod(paymentMethod);
                          setIsPaymentMethodModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] hover:bg-[#eaecf0] text-xs font-semibold text-[#344054] transition-colors cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Selected Payment Method Display */}
                    <div className="flex items-center gap-3 py-1">
                      {paymentMethod === "redsys_card" && (
                        <>
                          <div className="flex items-center -space-x-1.5">
                            <span className="h-4 w-4 rounded-full bg-[#eb001b] inline-block shadow-2xs" />
                            <span className="h-4 w-4 rounded-full bg-[#f79e1b] inline-block shadow-2xs opacity-90" />
                          </div>
                          <span className="font-semibold text-sm text-[#101828]">
                            3418
                          </span>
                          <span className="text-xs text-[#667085] font-normal">
                            · Redsys TPV Seguro (Tarjeta de Crédito / Débito)
                          </span>
                        </>
                      )}

                      {paymentMethod === "redsys_bizum" && (
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[#009688] px-2 py-0.5 text-[11px] font-bold text-white">
                            BIZUM
                          </span>
                          <span className="font-semibold text-sm text-[#101828]">
                            Pago instantáneo con Bizum (Redsys)
                          </span>
                        </div>
                      )}

                      {paymentMethod === "stripe_apple_pay" && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-black"> Pay</span>
                          <span className="font-semibold text-sm text-[#101828]">
                            Apple Pay Seguro
                          </span>
                        </div>
                      )}

                      {paymentMethod === "stripe_card" && (
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="h-4 w-4 text-[#009688]" />
                          <span className="font-semibold text-sm text-[#101828]">
                            Tarjeta de crédito o débito
                          </span>
                          <span className="text-xs text-[#667085] font-normal">· Visa, Mastercard, Amex</span>
                        </div>
                      )}

                      {paymentMethod === "stripe_google_pay" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#5f6368] bg-slate-100 px-2 py-0.5 rounded">
                            G Pay
                          </span>
                          <span className="font-semibold text-sm text-[#101828]">
                            Google Pay
                          </span>
                        </div>
                      )}

                      {paymentMethod === "stripe_paypal" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#003087] bg-slate-100 px-2 py-0.5 rounded">
                            PayPal
                          </span>
                          <span className="font-semibold text-sm text-[#101828]">
                            PayPal Express
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Logos Strip (Dynamic based on active payment providers) */}
                    <div className="pt-2 border-t border-[#f2f4f7] flex flex-wrap items-center gap-2.5 text-[#98a2b3]">
                      <span className="text-[11px] font-bold tracking-wider text-[#1a1f71] bg-slate-100 px-2 py-0.5 rounded">
                        VISA
                      </span>
                      <span className="text-[11px] font-bold tracking-wider text-[#eb001b] bg-slate-100 px-2 py-0.5 rounded">
                        MC
                      </span>
                      {activePaymentProviders.stripe && (
                        <>
                          <span className="text-[11px] font-bold tracking-wider text-[#006fcf] bg-slate-100 px-2 py-0.5 rounded">
                            AMEX
                          </span>
                          <span className="text-[11px] font-bold text-black bg-slate-100 px-2 py-0.5 rounded">
                             Pay
                          </span>
                          <span className="text-[11px] font-bold text-[#003087] bg-slate-100 px-2 py-0.5 rounded">
                            PayPal
                          </span>
                          <span className="text-[11px] font-bold text-[#5f6368] bg-slate-100 px-2 py-0.5 rounded">
                            G Pay
                          </span>
                        </>
                      )}
                      {activePaymentProviders.redsys && (
                        <span className="text-[11px] font-bold text-[#00a896] bg-emerald-50 px-2 py-0.5 rounded">
                          bizum
                        </span>
                      )}
                      {activePaymentProviders.redsys && (
                        <div className="ml-auto">
                          <RedsysLogo size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message if Redsys fails */}
                  {redsysError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-medium">
                      {redsysError}
                    </div>
                  )}

                  {/* Terms Text & Green Action CTA */}
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-[#475467] font-normal">
                      Al seleccionar el botón, acepto{" "}
                      <button
                        type="button"
                        onClick={() => setIsPolicyInfoOpen(true)}
                        className="underline font-medium text-[#101828] hover:text-[#009688] cursor-pointer"
                      >
                        los términos de la reserva
                      </button>
                      .
                    </p>

                    {/* WANDERLUST GREEN BUTTON (Matching the rest of the web app) */}
                    <button
                      type="button"
                      onClick={() => handlePayWithRedsys(amountDueToday, trip.name)}
                      disabled={isProcessingRedsys}
                      className="w-full sm:w-auto min-w-[280px] rounded-2xl bg-[#009688] hover:bg-[#00796b] py-3.5 px-8 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#009688]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      {isProcessingRedsys ? (
                        <>
                          <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Conectando con pasarela segura...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Confirmar y pagar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* RIGHT COLUMN: URGENCY BANNER & SUMMARY CARD             */}
                {/* ======================================================== */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                  {/* Pink Urgency Banner */}
                  <div className="rounded-2xl border border-pink-200/80 bg-[#fdf2f8] p-4 text-pink-950 flex items-start gap-3 shadow-2xs">
                    <span className="text-base shrink-0 pt-0.5">💎</span>
                    <p className="text-xs sm:text-[13px] font-normal text-[#831843] leading-snug">
                      ¡Qué suerte! Tienes una oportunidad única de hacerte con este viaje, que suele estar reservado.
                    </p>
                  </div>

                  {/* Clean Summary Card */}
                  <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-7 shadow-lg shadow-black/5 space-y-5">
                    {/* Top Row: Thumbnail + Title + Rating */}
                    <div className="flex items-center gap-4">
                      <div className="h-18 w-20 sm:h-20 sm:w-24 shrink-0 rounded-2xl overflow-hidden bg-slate-200 shadow-xs relative">
                        {trip.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={trip.imageUrl}
                            alt={trip.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#009688]">
                            <Plane className="h-7 w-7" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-bold text-base sm:text-lg text-[#101828] leading-tight line-clamp-2">
                          {trip.name}
                        </h4>
                        <p className="text-xs text-[#475467] flex items-center gap-1 font-normal">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-[#101828]">5,0</span>
                          <span>(48)</span>
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f2f4f7]" />

                    {/* Cancelación gratuita */}
                    <div className="space-y-1">
                      <h5 className="font-semibold text-sm text-[#101828]">
                        Cancelación gratuita
                      </h5>
                      <p className="text-xs font-normal text-[#667085] leading-relaxed">
                        Si cancelas la reserva en un plazo de 24 horas, recibirás un reembolso completo.{" "}
                        <button
                          type="button"
                          onClick={() => setIsPolicyInfoOpen(true)}
                          className="underline font-medium text-[#101828] hover:text-[#009688] cursor-pointer"
                        >
                          Política entera
                        </button>
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f2f4f7]" />

                    {/* Fechas */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-[#101828] block">
                          Fechas
                        </span>
                        <span className="text-xs font-normal text-[#667085]">
                          {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("itinerario")}
                        className="px-3 py-1 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] hover:bg-[#eaecf0] text-xs font-semibold text-[#344054] transition-colors cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Viajeros */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-[#101828] block">
                          Viajeros
                        </span>
                        <span className="text-xs font-normal text-[#667085]">2 adultos</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("resumen")}
                        className="px-3 py-1 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] hover:bg-[#eaecf0] text-xs font-semibold text-[#344054] transition-colors cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f2f4f7]" />

                    {/* Detalles del precio */}
                    <div className="space-y-2 text-xs sm:text-sm text-[#475467]">
                      <h5 className="font-semibold text-sm text-[#101828] mb-1">
                        Detalles del precio
                      </h5>
                      <div className="flex justify-between font-normal">
                        <span>{tripDuration(trip.startDate, trip.endDate)} días de itinerario</span>
                        <span className="font-medium text-[#101828]">
                          {formatCurrency(baseTripAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between font-normal">
                        <span>Gastos de gestión y tasas</span>
                        <span className="font-medium text-emerald-700">Incluidos (0,00 €)</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f2f4f7]" />

                    {/* Total EUR */}
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold text-sm text-[#101828]">
                          Total <span className="underline">EUR</span>
                        </span>
                        <span className="font-bold text-base sm:text-lg text-[#101828]">
                          {formatCurrency(baseTripAmount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPriceDetailModalOpen(true)}
                        className="underline text-xs font-medium text-[#101828] hover:text-[#009688] cursor-pointer"
                      >
                        Desglose del precio
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f2f4f7]" />

                    {/* Fecha límite: hoy & Saldo restante */}
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between font-medium text-[#101828]">
                        <span>Fecha límite: hoy</span>
                        <span className="font-semibold">{formatCurrency(amountDueToday)}</span>
                      </div>
                      {remainingBalance > 0 && (
                        <div className="flex justify-between text-[#667085] font-normal">
                          <button
                            type="button"
                            onClick={() => setIsPolicyInfoOpen(true)}
                            className="underline text-left hover:text-[#101828] cursor-pointer"
                          >
                            Abonarás el importe restante antes de la salida
                          </button>
                          <span className="font-semibold text-[#101828]">
                            {formatCurrency(remainingBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* MODAL: MÉTODO DE PAGO (IMAGE 2 DESIGN)                    */}
              {/* ======================================================== */}
              {isPaymentMethodModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
                  onClick={() => setIsPaymentMethodModalOpen(false)}
                >
                  <div
                    className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with Close X */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#eaecf0]">
                      <h3 className="text-base sm:text-lg font-semibold text-[#101828]">
                        Método de pago
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsPaymentMethodModalOpen(false)}
                        className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Payment Options List */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {/* Redsys Primary Card (if Redsys is connected) */}
                      {activePaymentProviders.redsys && (
                        <div
                          onClick={() => setTempPaymentMethod("redsys_card")}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                            tempPaymentMethod === "redsys_card"
                              ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                              : "border-[#eaecf0] hover:bg-zinc-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center -space-x-1.5">
                              <span className="h-5 w-5 rounded-full bg-[#eb001b] inline-block shadow-2xs" />
                              <span className="h-5 w-5 rounded-full bg-[#f79e1b] inline-block shadow-2xs opacity-90" />
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-[#101828] block">
                                3418
                              </span>
                              <span className="text-xs text-[#667085] font-normal">
                                Tarjeta Bancaria (Redsys TPV Seguro)
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                            <div
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                tempPaymentMethod === "redsys_card"
                                  ? "border-[#101828]"
                                  : "border-[#d0d5dd] bg-white"
                              }`}
                            >
                              {tempPaymentMethod === "redsys_card" && (
                                <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section: O paga con */}
                      {(activePaymentProviders.stripe || activePaymentProviders.redsys) && (
                        <div className="pt-2">
                          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-2 px-1">
                            O paga con
                          </span>

                          <div className="space-y-2">
                            {/* STRIPE METHODS: Only shown if Stripe is active/connected */}
                            {activePaymentProviders.stripe && (
                              <>
                                {/* Apple Pay */}
                                <div
                                  onClick={() => setTempPaymentMethod("stripe_apple_pay")}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    tempPaymentMethod === "stripe_apple_pay"
                                      ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                                      : "border-[#eaecf0] hover:bg-zinc-50/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-black w-6 text-center"></span>
                                    <span className="font-medium text-sm text-[#101828]">Apple Pay</span>
                                  </div>
                                  <div className="shrink-0 flex items-center justify-center">
                                    <div
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        tempPaymentMethod === "stripe_apple_pay"
                                          ? "border-[#101828]"
                                          : "border-[#d0d5dd] bg-white"
                                      }`}
                                    >
                                      {tempPaymentMethod === "stripe_apple_pay" && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Tarjeta de crédito o débito (Stripe) */}
                                <div
                                  onClick={() => setTempPaymentMethod("stripe_card")}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    tempPaymentMethod === "stripe_card"
                                      ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                                      : "border-[#eaecf0] hover:bg-zinc-50/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5 text-[#344054]" />
                                    <div>
                                      <span className="font-medium text-sm text-[#101828] block">
                                        Tarjeta de crédito o débito
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-bold text-[#1a1f71]">VISA</span>
                                        <span className="text-[10px] font-bold text-[#eb001b]">MC</span>
                                        <span className="text-[10px] font-bold text-[#006fcf]">AMEX</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex items-center justify-center">
                                    <div
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        tempPaymentMethod === "stripe_card"
                                          ? "border-[#101828]"
                                          : "border-[#d0d5dd] bg-white"
                                      }`}
                                    >
                                      {tempPaymentMethod === "stripe_card" && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* PayPal */}
                                <div
                                  onClick={() => setTempPaymentMethod("stripe_paypal")}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    tempPaymentMethod === "stripe_paypal"
                                      ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                                      : "border-[#eaecf0] hover:bg-zinc-50/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-base font-bold text-[#003087]">🅿️</span>
                                    <span className="font-medium text-sm text-[#101828]">PayPal</span>
                                  </div>
                                  <div className="shrink-0 flex items-center justify-center">
                                    <div
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        tempPaymentMethod === "stripe_paypal"
                                          ? "border-[#101828]"
                                          : "border-[#d0d5dd] bg-white"
                                      }`}
                                    >
                                      {tempPaymentMethod === "stripe_paypal" && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Google Pay */}
                                <div
                                  onClick={() => setTempPaymentMethod("stripe_google_pay")}
                                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    tempPaymentMethod === "stripe_google_pay"
                                      ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                                      : "border-[#eaecf0] hover:bg-zinc-50/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-[#5f6368] bg-slate-100 px-2 py-0.5 rounded">G Pay</span>
                                    <span className="font-medium text-sm text-[#101828]">Google Pay</span>
                                  </div>
                                  <div className="shrink-0 flex items-center justify-center">
                                    <div
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        tempPaymentMethod === "stripe_google_pay"
                                          ? "border-[#101828]"
                                          : "border-[#d0d5dd] bg-white"
                                      }`}
                                    >
                                      {tempPaymentMethod === "stripe_google_pay" && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* BIZUM: Redsys Direct Mobile */}
                            {activePaymentProviders.redsys && (
                              <div
                                onClick={() => setTempPaymentMethod("redsys_bizum")}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  tempPaymentMethod === "redsys_bizum"
                                    ? "border-[#101828] bg-zinc-50/50 shadow-xs"
                                    : "border-[#eaecf0] hover:bg-zinc-50/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="rounded-md bg-[#009688] px-2 py-0.5 text-[10px] font-bold text-white">bizum</span>
                                  <span className="font-medium text-sm text-[#101828]">Bizum (Pago móvil directo)</span>
                                </div>
                                <div className="shrink-0 flex items-center justify-center">
                                  <div
                                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      tempPaymentMethod === "redsys_bizum"
                                        ? "border-[#101828]"
                                        : "border-[#d0d5dd] bg-white"
                                    }`}
                                  >
                                    {tempPaymentMethod === "redsys_bizum" && (
                                      <div className="h-2.5 w-2.5 rounded-full bg-[#101828]" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Section: No disponible */}
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-[#98a2b3] uppercase tracking-wider block mb-2 px-1">
                          No disponible
                        </span>
                        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-[#eaecf0] bg-zinc-50/40 opacity-60">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-[#1a1f71] bg-slate-100 px-2 py-0.5 rounded">VISA</span>
                            <div>
                              <span className="font-medium text-sm text-zinc-500 block">Débito 9309</span>
                              <span className="text-[11px] text-zinc-400 font-normal">Caducada</span>
                            </div>
                          </div>
                          <div className="h-5 w-5 rounded-full border border-zinc-300 bg-zinc-100" />
                        </div>
                      </div>
                    </div>

                    {/* Footer: Cancelar & Listo */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#eaecf0]">
                      <button
                        type="button"
                        onClick={() => setIsPaymentMethodModalOpen(false)}
                        className="text-sm font-medium text-[#101828] hover:underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod(tempPaymentMethod);
                          setIsPaymentMethodModalOpen(false);
                        }}
                        className="rounded-xl bg-[#222222] hover:bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Modal Términos y Política Entera */}
              {isPolicyInfoOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                  onClick={() => setIsPolicyInfoOpen(false)}
                >
                  <div
                    className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#eaecf0]">
                      <h3 className="text-base font-extrabold text-[#101828]">
                        Política de Reserva y Plazos
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsPolicyInfoOpen(false)}
                        className="p-1 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3 text-xs sm:text-sm text-[#475467] max-h-[60vh] overflow-y-auto pr-1">
                      <p className="leading-relaxed">
                        {(primaryBooking?.cancellationPolicy as string) ||
                          "Cancelación 100% gratuita dentro de las primeras 24 horas tras formalizar la reserva. Si cancelas con al menos 30 días de antelación al inicio del viaje, se devolverá todo el importe abonado salvo gastos de gestión de terceros."}
                      </p>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1 text-xs">
                        <span className="font-bold text-zinc-900 block">Estructura de Plazos Oficial:</span>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-600">
                          <li>1er Pago: Depósito del {depositPercentage}% hoy para bloquear vuelos y hoteles.</li>
                          <li>2º Pago: {primaryBooking?.secondPaymentDate ? formatDate(primaryBooking.secondPaymentDate) : '30-45 días antes de la salida'}.</li>
                          <li>Saldo Restante: {primaryBooking?.finalPaymentDate ? formatDate(primaryBooking.finalPaymentDate) : '15 días antes de viajar'}.</li>
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPolicyInfoOpen(false)}
                      className="w-full py-3 rounded-2xl bg-[#009688] text-white font-bold text-xs hover:bg-[#00796b] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Modal Desglose del Precio */}
              {isPriceDetailModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                  onClick={() => setIsPriceDetailModalOpen(false)}
                >
                  <div
                    className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#eaecf0]">
                      <h3 className="text-base font-extrabold text-[#101828]">
                        Desglose del Precio
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsPriceDetailModalOpen(false)}
                        className="p-1 rounded-full hover:bg-zinc-100 text-zinc-500 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2.5 text-xs sm:text-sm text-[#475467]">
                      <div className="flex justify-between">
                        <span>Paquete de viaje e itinerario completo:</span>
                        <span className="font-bold text-[#101828]">{formatCurrency(baseTripAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasas de emisión y carburante:</span>
                        <span className="font-semibold text-emerald-700">Incluidas</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Atención y soporte 24/7 en destino:</span>
                        <span className="font-semibold text-emerald-700">Gratis</span>
                      </div>
                      <div className="pt-2 border-t border-[#eaecf0] flex justify-between font-black text-base text-[#101828]">
                        <span>Total:</span>
                        <span>{formatCurrency(baseTripAmount)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPriceDetailModalOpen(false)}
                      className="w-full py-3 rounded-2xl bg-[#009688] text-white font-bold text-xs hover:bg-[#00796b] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* ----------------------------------------------------------- */}
        {/* TAB 3: NOTAS DEL VIAJE                                      */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "notas" && (
          <div className="space-y-6">
            {/* Trip Notes / Description Card */}
            {trip.description && (
              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 sm:p-8 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#101828]">
                      Notas generales del viaje
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Información clave y recomendaciones
                    </p>
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
                    <h4 className="text-sm font-extrabold text-[#101828]">
                      Atención y Soporte
                    </h4>
                    <p className="text-xs text-[#667085]">
                      Contacto durante el viaje
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#eaecf0] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">
                      Teléfono internacional:
                    </span>
                    <span className="font-bold text-[#101828]">
                      +34 91 123 4567
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">
                      WhatsApp de asistencia:
                    </span>
                    <span className="font-bold text-[#009688]">
                      +34 600 000 000
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#eaecf0] bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2f1] text-[#009688]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#101828]">
                      Póliza y Coberturas
                    </h4>
                    <p className="text-xs text-[#667085]">
                      Cobertura médica y cancelaciones
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#475467] leading-relaxed">
                  Tu viaje cuenta con póliza multiasistencia contratada que
                  cubre incidencias médicas, equipajes y traslados sanitarios.
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
                      "Servicio del Itinerario"}
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
              {(selectedActivity.type === "booking" || selectedActivity.type === "pago") && (
                <div className="rounded-2xl bg-[#f0fdfa] p-4 border border-[#ccfbf1] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#009688]">
                      Condiciones de Pago & Reserva
                    </span>
                    <span className="rounded-md bg-white border border-[#ccfbf1] px-2 py-0.5 text-[10px] font-black uppercase text-[#009688]">
                      {(selectedActivity.paymentProvider as string) || "Redsys"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-[#ccfbf1]/60">
                      <span className="text-[#667085] block text-[10px]">Depósito inicial:</span>
                      <span className="font-extrabold text-[#009688] text-sm">
                        {Number(selectedActivity.depositAmount || 250)} € ({Number(selectedActivity.depositPercentage || 20)}%)
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-[#ccfbf1]/60">
                      <span className="text-[#667085] block text-[10px]">Importe total:</span>
                      <span className="font-extrabold text-[#101828] text-sm">
                        {Number(selectedActivity.totalAmount || selectedActivity.price || 1250)} €
                      </span>
                    </div>
                  </div>
                  {Boolean(selectedActivity.cancellationPolicy) && (
                    <div className="pt-2 border-t border-[#ccfbf1]/60">
                      <span className="text-[10px] font-bold text-[#009688] uppercase block mb-1">
                        Política de cancelación:
                      </span>
                      <p className="text-[11px] text-[#475467] leading-relaxed">
                        {String(selectedActivity.cancellationPolicy)}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedActivity(null);
                      setActiveTab("pagos");
                    }}
                    className="w-full mt-2 rounded-xl bg-[#009688] py-2.5 text-xs font-bold text-white hover:bg-[#00796b] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Ir a la sección de Pagos & Depósito</span>
                  </button>
                </div>
              )}

              {selectedActivity.type === "flight" && (
                <div className="rounded-2xl bg-[#f0fdfa] p-4 border border-[#ccfbf1] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#009688]">
                      Itinerario de vuelo
                    </span>
                    <span className="font-extrabold text-[#101828]">
                      {(selectedActivity.airline as string) || "Aerolínea"} ·{" "}
                      {(selectedActivity.flightNumber as string) || "Vuelo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[#101828]">
                    <div>
                      <p className="text-xs text-[#667085]">Salida</p>
                      <p className="font-extrabold text-base">
                        {(selectedActivity.origin as string) || "Origen"}
                      </p>
                      <p className="text-xs text-[#009688]">
                        {selectedActivity.time}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <Plane className="h-4 w-4 text-[#009688] rotate-90" />
                      <span className="text-[10px] text-[#667085] mt-1">
                        {Array.isArray(selectedActivity.legs) &&
                        selectedActivity.legs.length > 1
                          ? `${selectedActivity.legs.length - 1} escala`
                          : "Directo"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#667085]">Llegada</p>
                      <p className="font-extrabold text-base">
                        {(selectedActivity.destination as string) || "Destino"}
                      </p>
                      <p className="text-xs text-[#009688]">
                        {(selectedActivity.arrivalTime as string) || "—"}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(selectedActivity.legs) &&
                    selectedActivity.legs.length > 1 && (
                      <div className="pt-2 border-t border-[#ccfbf1] space-y-2">
                        <p className="text-[10px] font-bold uppercase text-[#009688]">
                          Escalas programadas:
                        </p>
                        {selectedActivity.legs.map((leg: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-[11px] bg-white p-2 rounded-xl border border-[#ccfbf1]/60"
                          >
                            <span className="font-bold">
                              {leg.origin} → {leg.destination}
                            </span>
                            <span className="text-[#009688] font-semibold">
                              {leg.departureTime} - {leg.arrivalTime} (
                              {leg.flightNumber})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] p-3.5 border border-[#eaecf0]">
                <span className="font-semibold text-[#667085]">
                  Fecha y Hora:
                </span>
                <span className="font-bold text-[#101828]">
                  {selectedActivity.date} · {selectedActivity.time}
                </span>
              </div>

              {selectedActivity.price &&
                selectedActivity.price > 0 &&
                trip.showExpenses && (
                  <div className="flex items-center justify-between rounded-2xl bg-[#f0fdfa] p-3.5 border border-[#ccfbf1]">
                    <span className="font-semibold text-[#009688]">
                      Tarifa Incluida:
                    </span>
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
