"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  Plane,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Interactive Spotlight Card with cursor-following glow & corner accents
function SpotlightCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-inherit z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 102, 255, 0.14), transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Animated Audio / Pulse Bar Spectrum
function AnimatedAudioPulse() {
  return (
    <div className="flex items-end gap-1 h-5">
      {[0.4, 0.9, 0.5, 1.0, 0.6, 0.85, 0.35].map((multiplier, i) => (
        <motion.span
          key={i}
          animate={{
            height: ["4px", `${multiplier * 20}px`, "4px"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2 + (i % 3) * 0.25,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
          className="w-0.5 rounded-full bg-blue-400/90"
        />
      ))}
    </div>
  );
}

// Animated Flight Map Path Preview
function AnimatedFlightMap({ isLight = false }: { isLight?: boolean }) {
  return (
    <div
      className={`relative w-full h-36 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-colors ${
        isLight
          ? "bg-zinc-50 border border-black/10"
          : "bg-black/40 border border-white/10"
      }`}
    >
      {/* Background ambient map grid lines */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isLight
            ? "bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]"
            : "bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]"
        }`}
      />

      {/* SVG Arc Trajectory */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 400 120"
      >
        {/* Glow path */}
        <path
          d="M 40 90 Q 200 10 360 40"
          fill="none"
          stroke={
            isLight ? "rgba(0, 102, 255, 0.18)" : "rgba(0, 102, 255, 0.25)"
          }
          strokeWidth="3"
        />
        {/* Animated dashed flight line */}
        <motion.path
          d="M 40 90 Q 200 10 360 40"
          fill="none"
          stroke={isLight ? "#2563eb" : "#60a5fa"}
          strokeWidth="1.5"
          strokeDasharray="6 6"
          animate={{ strokeDashoffset: [0, -24] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
        />
      </svg>

      {/* Origin City: MAD */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <motion.span
              animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
              className="absolute w-3 h-3 rounded-full bg-blue-400"
            />
            <span
              className={`w-2 h-2 rounded-full relative z-10 ${isLight ? "bg-blue-600" : "bg-white"}`}
            />
          </div>
          <span
            className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${
              isLight ? "text-zinc-800" : "text-zinc-300"
            }`}
          >
            MAD · MADRID
          </span>
        </div>

        {/* Live Coordinate Ticker */}
        <div
          className={`hidden xs:flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] tracking-widest uppercase ${
            isLight ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>RADAR SATELITAL ACTIVO</span>
        </div>
      </div>

      {/* Middle Altitude & Status */}
      <div className="relative z-10 text-center">
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] tracking-wider ${
            isLight
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : "bg-blue-950/70 border border-blue-500/30 text-blue-300"
          }`}
        >
          <Plane className="w-3 h-3" />
          <span>QR-149 · FL380 · MACH 0.85</span>
        </motion.div>
      </div>

      {/* Destination City: HAN */}
      <div className="relative z-10 flex items-center justify-end gap-2">
        <span
          className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${
            isLight ? "text-zinc-800" : "text-zinc-300"
          }`}
        >
          HAN · HANÓI
        </span>
        <div className="relative flex items-center justify-center">
          <motion.span
            animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut",
              delay: 0.8,
            }}
            className="absolute w-3 h-3 rounded-full bg-emerald-400"
          />
          <span className="w-2 h-2 rounded-full bg-emerald-500 relative z-10" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<number | null>(
    null,
  );
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    agencyName: "",
    phone: "",
  });

  const destinations = [
    {
      code: "EXP-01",
      title: "Vietnam Mágico & Templos de Angkor",
      days: "14 Días · 2 Viajeros",
      price: "4.890 €",
      category: "Expedición Privada",
      image:
        "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      badge: "Bespoke",
      stops: ["Hanoi", "Ha Long", "Hoi An", "Siem Reap"],
      description:
        "Crucero privado en bahía de Lan Ha, gastronomía en templos ocultos de Hoi An y amanecer exclusivo en Angkor Wat.",
    },
    {
      code: "EXP-02",
      title: "Japón Tradicional & Kioto Secreto",
      days: "12 Días · 2 Viajeros",
      price: "6.200 €",
      category: "Inmersión Cultural",
      image:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
      badge: "Heritage",
      stops: ["Tokio", "Kyoto", "Nara", "Osaka"],
      description:
        "Ryokans centenarios con onsen privados, ceremonia del té con maestros zen y tren bala Shinkansen en Gran Class.",
    },
    {
      code: "EXP-03",
      title: "Luna de Miel Bali & Komodo Privado",
      days: "10 Días · Pareja",
      price: "5.450 €",
      category: "Signature Honeymoon",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
      badge: "Exclusivo",
      stops: ["Ubud", "Nusa Penida", "Komodo", "Seminyak"],
      description:
        "Villas sobre acantilados de Uluwatu, goleta de madera privada por el parque nacional de Komodo y cenas a la luz de las velas.",
    },
    {
      code: "EXP-04",
      title: "Safari Kenia & Costas de Zanzíbar",
      days: "11 Días · 4 Viajeros",
      price: "7.800 €",
      category: "Wilderness & Luxury",
      image:
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
      badge: "Aventura VIP",
      stops: ["Masai Mara", "Lago Nakuru", "Nairobi", "Zanzíbar"],
      description:
        "Campamentos de lona de ultra-lujo en la reserva nacional, avionetas privadas entre parques y descanso en villas oceánicas.",
    },
  ];

  const comparisonSteps = [
    {
      index: "01",
      total: "04",
      pill: "SINCRONIZACIÓN",
      title: "Sincronización Total",
      versus: "vs Documentos Muertos",
      wanderlustTitle: "WANDERLUST",
      wanderlustText:
        "Mapas interactivos en tiempo real, confirmaciones vivas y cobro directo de anticipos con tarjeta o Apple Pay en un solo enlace sincronizado.",
      wanderlustBullet1:
        "Actualizaciones automáticas que tus viajeros ven al instante sin reenviar archivos.",
      wanderlustBullet2:
        "Pasarela Stripe integrada con liquidación directa en tu cuenta bancaria.",
      oldWorldTitle: "El Viejo Mundo",
      oldWorldText:
        "PDFs estáticos de 40 páginas, cambios que se extravían por correos infinitos y transferencias bancarias manuales que demoran semanas.",
      oldWorldBullet1:
        "Versiones confusas (v1, v2_final, definitiva_ok.pdf) que confunden al cliente.",
      oldWorldBullet2:
        "Procesos de cobro por ventanilla con alta tasa de abandono.",
    },
    {
      index: "02",
      total: "04",
      pill: "LIQUIDACIÓN",
      title: "Cobro Inmediato",
      versus: "vs Cobranza Manual",
      wanderlustTitle: "WANDERLUST",
      wanderlustText:
        "Recibe pagos fraccionados o depósitos de señal vía Stripe Connect, Redsys o Bizum directamente integrados en el desglose del viaje.",
      wanderlustBullet1:
        "Depósitos directos sin intermediarios reteniendo tu flujo de caja.",
      wanderlustBullet2:
        "Notificaciones en tiempo real al registrarse cada abono del cliente.",
      oldWorldTitle: "El Viejo Mundo",
      oldWorldText:
        "Perseguir justificantes de transferencia bancaria por WhatsApp y cotejar extractos contables manualmente al final de mes.",
      oldWorldBullet1:
        "Falta de inmediatez en el bloqueo de hoteles y reservas críticas.",
      oldWorldBullet2:
        "Inseguridad percibida por el viajero en pagos internacionales.",
    },
    {
      index: "03",
      total: "04",
      pill: "MARCA BLANCA",
      title: "Tu Agencia en el Centro",
      versus: "vs Softwares Genéricos",
      wanderlustTitle: "WANDERLUST",
      wanderlustText:
        "Todo el dominio, logotipo y tipografía responden a la identidad de tu agencia. Tu cliente nunca percibe una plataforma externa.",
      wanderlustBullet1:
        "Dominio propio o enlace privado con los colores institucionales de tu marca.",
      wanderlustBullet2:
        "Presentación ejecutiva digna del segmento de lujo internacional.",
      oldWorldTitle: "El Viejo Mundo",
      oldWorldText:
        "Herramientas que muestran marcas de agua de terceros o formatos genéricos que devalúan el valor del diseño del asesor.",
      oldWorldBullet1:
        "Pérdida de autoridad y prestigio frente a agencias competidoras.",
      oldWorldBullet2:
        "Experiencia fragmentada entre diferentes proveedores sin hilo conductor.",
    },
    {
      index: "04",
      total: "04",
      pill: "MÓVIL TOTAL",
      title: "Web App de Bolsillo",
      versus: "vs Impresiones Papel",
      wanderlustTitle: "WANDERLUST",
      wanderlustText:
        "Tus clientes consultan horarios de vuelo, direcciones de hoteles y teléfonos de emergencia desde el navegador de su teléfono, sin instalar apps.",
      wanderlustBullet1:
        "Acceso offline ligero a números de emergencia y localizadores clave.",
      wanderlustBullet2:
        "Exportación a PDF editorial en un solo clic por si desean imprimir.",
      oldWorldTitle: "El Viejo Mundo",
      oldWorldText:
        "Carpetas de papel arrugadas en el equipaje de mano y PDFs pesados que no cargan con mala cobertura en destino.",
      oldWorldBullet1:
        "Llamadas de pánico al agente fuera de horario por datos extraviados.",
      oldWorldBullet2:
        "Nula capacidad de adaptación ante retrasos de vuelo imprevistos.",
    },
  ];

  const faqs = [
    {
      code: "01",
      q: "¿Qué diferencia a Wanderlust de un PDF o presentación tradicional?",
      a: "Wanderlust sustituye los archivos estáticos por una experiencia web interactiva, viva y sincronizada. Tu cliente recibe un enlace privado con mapa inteligente en tiempo real, cronograma día a día con horas exactas, reservas de vuelos, hoteles boutique y un botón de cobro directo de anticipos con tarjeta o Apple Pay.",
    },
    {
      code: "02",
      q: "¿Cómo funciona la integración de cobros con Stripe?",
      a: "Conectas tu cuenta de Stripe en segundos. Puedes configurar anticipos automáticos (por ejemplo, el 30% al aceptar) o el cobro completo. El importe se liquida de inmediato en la cuenta bancaria de tu agencia, sin intermediarios ni retenciones externas.",
    },
    {
      code: "03",
      q: "¿El viajero ve la marca de Wanderlust o la de mi agencia?",
      a: "Opera con marca blanca integral. Los itinerarios públicos llevan tu logotipo, tus colores corporativos y los datos de contacto directo de tu equipo comercial o concierge privado.",
    },
    {
      code: "04",
      q: "¿Puedo importar vuelos, hoteles y actividades fácilmente?",
      a: "Sí. Dispones de un editor por bloques que te permite arrastrar días, duplicar plantillas de destinos y cargar billetes o vouchers con un solo clic.",
    },
    {
      code: "05",
      q: "¿Cómo solicito acceso para mi agencia de viajes?",
      a: "Haz clic en el botón de Acceso Privado. Nuestro equipo revisará el perfil de tu agencia y te enviará las credenciales directas en menos de 24 horas laborables.",
    },
  ];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitted(true);
    setTimeout(() => {
      setRegisterSubmitted(false);
      setRegisterModalOpen(false);
      setRegisterForm({ name: "", email: "", agencyName: "", phone: "" });
    }, 2800);
  };

  return (
    <div
      className={`min-h-screen ${isLight ? "bg-[#f8f9fc] text-zinc-900 selection:bg-black selection:text-white" : "bg-[#000000] text-zinc-100 selection:bg-white selection:text-black"} font-sans relative overflow-x-hidden transition-colors duration-300`}
    >
      {/* Background cinematic dynamic lighting */}
      <motion.div
        animate={{
          opacity: isLight ? [0.03, 0.08, 0.03] : [0.06, 0.12, 0.06],
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 9,
          ease: "easeInOut",
        }}
        className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(circle,rgba(0,102,255,0.25)_0%,rgba(0,102,255,0.05)_40%,transparent_70%)] pointer-events-none z-0 blur-[80px]"
      />

      {/* ========================================================================= */}
      {/* 1. TOP BAR (Centered Brand Mark + TitanGate Private Access Pill)          */}
      {/* ========================================================================= */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? isLight
              ? "bg-[#f8f9fc]/85 backdrop-blur-xl border-b border-black/10 shadow-xs"
              : "bg-[#000000]/85 backdrop-blur-xl border-b border-white/10 shadow-xs"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 md:h-24 flex items-center justify-between">
          {/* Left: Horizontal Brand Logo */}
          <Link
            href="/"
            className="flex items-center group transition-opacity hover:opacity-90 py-1 shrink-0"
          >
            <div className="relative h-8 xs:h-9 sm:h-12 md:h-14 w-32 xs:w-40 sm:w-56 md:w-64">
              <Image
                src={
                  isLight
                    ? "/wanderlust_horizontal_negro.png"
                    : "/wanderlust_horizontal_blanco.png"
                }
                alt="Wanderlust"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Right: Theme Toggle + Iniciar Sesión + Registro Pill */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-4 shrink-0">
            <Link
              href="/login"
              className={`text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.16em] uppercase transition-colors px-1.5 sm:px-2.5 py-1 font-medium whitespace-nowrap ${
                isLight
                  ? "text-zinc-600 hover:text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className={`inline-flex items-center justify-center px-2.5 sm:px-4 h-7 sm:h-8 rounded-full text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.18em] uppercase transition-all cursor-pointer font-semibold whitespace-nowrap ${
                isLight
                  ? "text-zinc-950 bg-black/[0.06] hover:bg-black/10 border border-black/15 shadow-sm"
                  : "text-zinc-100 bg-white/[0.08] hover:bg-white/15 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              }`}
            >
              Registro
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* 2. HERO VIEWPORT (TitanGate Cinematic Centerpiece with Atmosphere)        */}
      {/* ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-24 sm:pt-28 md:pt-32 pb-12 overflow-hidden">
        {/* Background Cinematic Video from TitanGate */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`w-full h-full object-cover scale-105 transition-opacity duration-700 ${
              isLight ? "opacity-30" : "opacity-65"
            }`}
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          {/* Vignette and gradient masks for cinematic contrast & legibility */}
          {isLight ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,transparent_25%,#f8f9fc_85%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fc]/80 via-transparent to-[#f8f9fc]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,transparent_20%,#000000_85%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
            </>
          )}
        </div>

        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none z-1" />

        {/* Ambient atmospheric drifting light streak */}
        <motion.div
          animate={{
            opacity: [0.12, 0.22, 0.12],
            rotate: [-12, -8, -12],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/30 to-transparent blur-[90px] pointer-events-none z-1"
        />

        {/* Center Content Group */}
        <div className="my-auto max-w-5xl mx-auto space-y-8 z-10">
          {/* Micro-kicker (TitanGate "A CLOSED NETWORK") */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <span
              className={`text-[11px] sm:text-xs tracking-[0.3em] uppercase font-medium ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              Red Privada de Viajes
            </span>
          </motion.div>

          {/* TitanGate Giant Title (Pure Outfit sans, NO serif, tight leading) */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
            className={`text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-[-0.04em] leading-[0.94] max-w-5xl mx-auto break-words px-2 ${
              isLight ? "text-zinc-950" : "text-white"
            }`}
          >
            Una Nueva Clase <br />
            de Itinerarios
          </motion.h1>

          {/* Floating Nav Pill (TitanGate "VISION / OPPORTUNITIES / PIONEERS / MANIFESTO") */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
            className="pt-2 flex justify-center w-full"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`inline-flex items-center gap-2 xs:gap-3 sm:gap-6 px-3.5 sm:px-7 py-2 sm:py-2.5 rounded-full border backdrop-blur-xl text-[9px] xs:text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.22em] uppercase transition-all duration-300 max-w-[96vw] overflow-x-auto no-scrollbar whitespace-nowrap ${
                isLight
                  ? "border-black/10 bg-white/85 text-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                  : "border-white/15 bg-white/[0.04] text-zinc-300 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
              }`}
            >
              <a
                href="#manifiesto"
                className="hover:text-blue-500 transition-colors"
              >
                Visión
              </a>
              <span className={isLight ? "text-zinc-300" : "text-zinc-600"}>
                /
              </span>
              <a
                href="#arquitectura"
                className="hover:text-blue-500 transition-colors"
              >
                Arquitectura
              </a>
              <span className={isLight ? "text-zinc-300" : "text-zinc-600"}>
                /
              </span>
              <a
                href="#expediciones"
                className="hover:text-blue-500 transition-colors"
              >
                Expediciones
              </a>
              <span className={isLight ? "text-zinc-300" : "text-zinc-600"}>
                /
              </span>
              <a
                href="#red-privada"
                className="hover:text-blue-500 transition-colors"
              >
                Pioneros
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Viewport Bottom (TitanGate "Invitation Only. Unmatched access...") */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="z-10 pt-8 pb-4 space-y-6"
        >
          <p
            className={`text-xs sm:text-sm tracking-wide ${isLight ? "text-zinc-600" : "text-zinc-400"}`}
          >
            <span
              className={`font-medium ${isLight ? "text-zinc-950" : "text-white"}`}
            >
              Acceso Exclusivo.
            </span>{" "}
            <span className={isLight ? "text-zinc-600" : "text-zinc-500"}>
              Diseñado para agencias y creadores de viaje que exigen perfección
              absoluta.
            </span>
          </p>

          {/* Minimalist Mouse Scroll Indicator */}
          <motion.div
            whileHover={{ y: 2 }}
            className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div
              className={`w-3.5 h-6 rounded-full border flex items-start justify-center p-1 ${
                isLight ? "border-zinc-400" : "border-white/30"
              }`}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
                className={`w-1 h-1 rounded-full ${isLight ? "bg-zinc-800" : "bg-white"}`}
              />
            </div>
            <div
              className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${
                isLight ? "border-t-zinc-500" : "border-t-white/40"
              }`}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 1: MANIFESTO & GRID (TitanGate Section 1 Exact Pattern)       */}
      {/* ========================================================================= */}
      <section
        id="manifiesto"
        className={`relative border-t pt-10 pb-28 sm:pb-36 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Technical Metadata Bar (4 Columns across screen) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className={`grid grid-cols-1 md:grid-cols-4 gap-6 pb-16 text-[11px] tracking-[0.18em] uppercase ${
              isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            <div>
              <span
                className={`font-medium ${isLight ? "text-zinc-950" : "text-white"}`}
              >
                WNDR | WANDERLUST
              </span>
              <br />
              <span className="text-zinc-500">001 UNA NUEVA CLASE</span>
            </div>
            <div className="md:col-span-2">
              <span className={isLight ? "text-zinc-700" : "text-zinc-300"}>
                DONDE OTROS ENTREGAN PDFS ORDINARIOS,
              </span>{" "}
              <span className="text-zinc-500">
                NOSOTROS CONSTRUIMOS ARQUITECTURA DIGITAL VIVA.
              </span>
            </div>
            <div className="flex items-center justify-start md:justify-end gap-3 text-right">
              {/* Dynamic animated spectrum bars */}
              <AnimatedAudioPulse />
              <span
                className={`text-sm font-semibold tracking-widest pl-2 ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                WL 001_5
              </span>
            </div>
          </motion.div>

          {/* Giant Display Statement (TitanGate "Elite Private Market Opportunities. Tokenized.") */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="py-12 sm:py-20 max-w-6xl"
          >
            <h2
              className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.03em] leading-[1.04] ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              Itinerarios de Autor.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-[#0066FF]">
                Interactivos.
              </span>{" "}
              <span
                className={
                  isLight
                    ? "text-zinc-400 font-light"
                    : "text-zinc-600 font-light"
                }
              >
                Sincronizados.
              </span>
            </h2>
          </motion.div>

          {/* Plus Matrix Bottom Right */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`flex items-center justify-between pt-8 border-t text-zinc-500 ${
              isLight ? "border-black/5" : "border-white/5"
            }`}
          >
            <div
              className={`flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              <span>EXPLORA LA DIFERENCIA</span>
              <ArrowRight
                className={`w-3.5 h-3.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}
              />
            </div>
            <div
              className={`grid grid-cols-4 gap-2 text-xs select-none font-light ${
                isLight ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 2: HARDWARE & INTERACTIVE TERMINAL (TitanGate Section 2)       */}
      {/* ========================================================================= */}
      <section
        className={`relative border-t py-24 sm:py-32 overflow-hidden transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Architectural Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-5 space-y-8"
            >
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] tracking-[0.2em] uppercase ${
                  isLight
                    ? "border-black/10 bg-black/[0.03] text-zinc-600"
                    : "border-white/10 bg-white/[0.03] text-zinc-400"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-ping" />
                <span>TECNOLOGÍA DE GRADO INSTITUCIONAL</span>
              </div>

              <div className="space-y-6">
                <p
                  className={`text-2xl sm:text-3xl font-light leading-relaxed ${
                    isLight ? "text-zinc-900" : "text-zinc-100"
                  }`}
                >
                  Acceso sin precedentes a la cúspide del diseño de viajes a
                  medida, antes reservado a procesos manuales y documentos
                  estáticos.
                </p>
                <p
                  className={`text-xl sm:text-2xl font-normal ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Operaciones extraordinarias, liquidadas en segundos.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRegisterModalOpen(true)}
                  className={`px-6 py-3 rounded-full text-xs tracking-[0.16em] uppercase font-medium flex items-center gap-2 cursor-pointer transition-all ${
                    isLight
                      ? "bg-zinc-950 text-white shadow-md hover:bg-black"
                      : "text-zinc-950 bg-white shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:bg-zinc-200"
                  }`}
                >
                  <span>Solicitar Credenciales</span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 ${isLight ? "text-white" : "text-zinc-950"}`}
                  />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Column: High-End Obsidian Itinerary Interface with Animated Radar/Map */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-7"
            >
              <SpotlightCard
                className={`rounded-2xl border p-6 sm:p-8 corner-brackets transition-all ${
                  isLight
                    ? "bg-white border-black/10 text-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
                    : "bg-[#09090d]/90 border-white/15 text-zinc-100 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                }`}
              >
                {/* Interface Header */}
                <div
                  className={`flex items-center justify-between pb-5 border-b ${
                    isLight ? "border-black/10" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span
                      className={`text-xs tracking-[0.15em] uppercase font-medium ${
                        isLight ? "text-zinc-800" : "text-zinc-300"
                      }`}
                    >
                      ITINERARIO ACTIVO // VN-804
                    </span>
                  </div>
                  <div
                    className={`text-xs flex items-center gap-2 ${
                      isLight ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Sincronizado vía satélite</span>
                  </div>
                </div>

                {/* Animated Flight Path Radar */}
                <div className="mt-5">
                  <AnimatedFlightMap isLight={isLight} />
                </div>

                {/* Day-by-Day Luxury Card Preview */}
                <div className="mt-5 space-y-3.5">
                  {/* Flight Segment */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isLight
                        ? "border-black/10 bg-zinc-50/80"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isLight
                            ? "bg-blue-50 border border-blue-200 text-blue-600"
                            : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                        }`}
                      >
                        <Plane className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-[10px] sm:text-xs tracking-wider uppercase truncate ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
                        >
                          Vuelo Privado · Clase Ejecutiva
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-medium truncate ${isLight ? "text-zinc-900" : "text-white"}`}
                        >
                          Madrid (MAD) → Hanói (HAN) · Qatar Airways
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded self-start sm:self-auto shrink-0 ${
                        isLight
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      }`}
                    >
                      Confirmado
                    </span>
                  </motion.div>

                  {/* Hotel Segment */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isLight
                        ? "border-black/10 bg-zinc-50/80"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isLight
                            ? "bg-indigo-50 border border-indigo-200 text-indigo-600"
                            : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-[10px] sm:text-xs tracking-wider uppercase truncate ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
                        >
                          Alojamiento de Autor · 3 Noches
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-medium truncate ${isLight ? "text-zinc-900" : "text-white"}`}
                        >
                          Capella Hanoi · Opera Suite con Mayordomo
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded self-start sm:self-auto shrink-0 ${
                        isLight
                          ? "text-indigo-700 bg-indigo-50 border border-indigo-200"
                          : "text-indigo-300 bg-indigo-500/10 border border-indigo-500/20"
                      }`}
                    >
                      VIP Status
                    </span>
                  </motion.div>

                  {/* Payment Settlement Bar */}
                  <div
                    className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isLight
                        ? "border-black/10 bg-blue-50/60"
                        : "border-white/10 bg-gradient-to-r from-blue-950/40 via-blue-900/10 to-transparent"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-[11px] tracking-wider uppercase ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
                      >
                        Depósito Requerido (30%)
                      </div>
                      <div
                        className={`text-xl font-semibold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}
                      >
                        1.467,00 €
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setRegisterModalOpen(true)}
                      className="px-4 py-2 rounded-lg bg-[#0066FF] text-white text-xs font-medium tracking-wide flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Abonar con Stripe</span>
                    </motion.button>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 3: TITANGATE ARCHITECTURE CARDS (Enforcement vs Empty Promises)*/}
      {/* ========================================================================= */}
      <section
        id="arquitectura"
        className={`relative border-t py-24 sm:py-36 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`flex items-center gap-3 pb-8 text-[11px] tracking-[0.25em] uppercase ${
              isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            <span>ARQUITECTURA // COMPARATIVA DIRECTA</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Side: Step Counter & Bold Title */}
            <div className="lg:col-span-5 space-y-8 sticky top-28">
              {/* Step indicator (01 / 04) */}
              <div
                className={`inline-flex items-center gap-3 px-3.5 py-1 rounded-full border text-xs tracking-widest ${
                  isLight
                    ? "border-black/10 bg-black/[0.04] text-zinc-700"
                    : "border-white/15 bg-white/[0.04] text-zinc-300"
                }`}
              >
                <span
                  className={`font-semibold ${isLight ? "text-zinc-950" : "text-white"}`}
                >
                  {comparisonSteps[activeStep].index}
                </span>
                <span className={isLight ? "text-zinc-400" : "text-zinc-600"}>
                  /
                </span>
                <span className={isLight ? "text-zinc-500" : "text-zinc-500"}>
                  {comparisonSteps[activeStep].total}
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h3
                  className={`text-3xl sm:text-5xl font-semibold tracking-tight leading-tight ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  {comparisonSteps[activeStep].title}
                </h3>
                <p
                  className={`text-2xl sm:text-4xl font-light tracking-tight ${
                    isLight ? "text-zinc-500" : "text-zinc-500"
                  }`}
                >
                  {comparisonSteps[activeStep].versus}
                </p>
              </div>

              {/* Interactive Step Switcher with Animated Highlight */}
              <div className="pt-6 space-y-2">
                {comparisonSteps.map((step, idx) => (
                  <motion.button
                    key={step.index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-xs tracking-wider uppercase flex items-center justify-between cursor-pointer ${
                      activeStep === idx
                        ? isLight
                          ? "border-black/20 bg-black/[0.05] text-zinc-950 font-semibold shadow-sm"
                          : "border-white/30 bg-white/[0.08] text-white font-medium shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                        : isLight
                          ? "border-black/5 bg-transparent text-zinc-500 hover:text-zinc-900 hover:border-black/15"
                          : "border-white/5 bg-transparent text-zinc-500 hover:text-zinc-300 hover:border-white/15"
                    }`}
                  >
                    <span>
                      {step.index} // {step.pill}
                    </span>
                    {activeStep === idx && (
                      <motion.span
                        layoutId="activeStepDot"
                        className="w-1.5 h-1.5 rounded-full bg-[#0066FF]"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Right Side: Animated Transition of Stacked TitanGate Cards */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="space-y-6"
                >
                  {/* Card 1: WANDERLUST (TitanGate TGE Card) */}
                  <SpotlightCard
                    className={`rounded-2xl border p-5 sm:p-8 md:p-10 corner-brackets space-y-6 transition-colors ${
                      isLight
                        ? "bg-white border-blue-500/30 text-zinc-900 shadow-[0_15px_40px_rgba(0,0,0,0.06)]"
                        : "bg-[#09090e]/95 border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-4 ${
                        isLight ? "border-black/10" : "border-white/10"
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold tracking-[0.2em] uppercase ${
                          isLight ? "text-zinc-950" : "text-white"
                        }`}
                      >
                        {comparisonSteps[activeStep].wanderlustTitle}
                      </span>
                      <span className="text-xs text-blue-500 font-semibold tracking-widest uppercase">
                        ESTÁNDAR MODERNO
                      </span>
                    </div>

                    <p
                      className={`text-lg sm:text-xl font-light leading-relaxed ${
                        isLight ? "text-zinc-700" : "text-zinc-200"
                      }`}
                    >
                      {comparisonSteps[activeStep].wanderlustText}
                    </p>

                    <div
                      className={`space-y-3 pt-2 text-sm ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>
                          {comparisonSteps[activeStep].wanderlustBullet1}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>
                          {comparisonSteps[activeStep].wanderlustBullet2}
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Card 2: The Old World (TitanGate Old World Card) */}
                  <div
                    className={`rounded-2xl border p-5 sm:p-8 md:p-10 corner-brackets space-y-6 transition-colors ${
                      isLight
                        ? "bg-zinc-100/70 border-black/10 text-zinc-800"
                        : "bg-[#050508]/80 border-white/10 text-zinc-400"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b pb-4 ${
                        isLight ? "border-black/10" : "border-white/5"
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold tracking-[0.2em] uppercase ${
                          isLight ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {comparisonSteps[activeStep].oldWorldTitle}
                      </span>
                      <span
                        className={`text-xs tracking-widest uppercase font-semibold ${
                          isLight ? "text-zinc-500" : "text-zinc-600"
                        }`}
                      >
                        OBSOLETO
                      </span>
                    </div>

                    <p
                      className={`text-lg sm:text-xl font-light leading-relaxed ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      {comparisonSteps[activeStep].oldWorldText}
                    </p>

                    <div
                      className={`space-y-3 pt-2 text-sm ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <X
                          className={`w-4 h-4 mt-0.5 shrink-0 ${isLight ? "text-zinc-400" : "text-zinc-500"}`}
                        />
                        <span>
                          {comparisonSteps[activeStep].oldWorldBullet1}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <X
                          className={`w-4 h-4 mt-0.5 shrink-0 ${isLight ? "text-zinc-400" : "text-zinc-500"}`}
                        />
                        <span>
                          {comparisonSteps[activeStep].oldWorldBullet2}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 4: CAPACIDADES TÉCNICAS & INTEGRACIONES REALES                  */}
      {/* ========================================================================= */}
      <section
        className={`relative border-t py-24 sm:py-32 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Stacked Clean Typography with Stagger reveal */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-6 space-y-2"
            >
              <h3
                className={`text-3xl sm:text-5xl font-semibold tracking-tight leading-tight ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                Mapas Interactivos.
              </h3>
              <h3
                className={`text-3xl sm:text-5xl font-semibold tracking-tight leading-tight ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                Cronograma en Vivo.
              </h3>
              <h3
                className={`text-3xl sm:text-5xl font-semibold tracking-tight leading-tight ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                Marca Blanca Total.
              </h3>
              <h3 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#0066FF] leading-tight">
                Cobros con Stripe & Bizum.
              </h3>
            </motion.div>

            {/* Right: Architectural Capabilities Grid with Real Integrations */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5"
            >
              {[
                {
                  name: "Stripe Connect",
                  category: "Pasarela Oficial",
                  desc: "Tarjetas, Apple Pay & Google Pay",
                },
                {
                  name: "Redsys & Bizum",
                  category: "Pasarela Bancaria",
                  desc: "Cobro instantáneo por Bizum",
                },
                {
                  name: "Mapas Interactivos",
                  category: "Geolocalización",
                  desc: "Rutas dinámicas día por día",
                },
                {
                  name: "Marca Blanca",
                  category: "Identidad Propia",
                  desc: "Logotipo y colores de tu agencia",
                },
                {
                  name: "Acceso Web Móvil",
                  category: "Cero Fricción",
                  desc: "Sin descargas de apps requeridas",
                },
                {
                  name: "Exportador PDF",
                  category: "Dossier Editorial",
                  desc: "Generación de dossiers impresos",
                },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between min-h-[5.5rem] sm:h-28 cursor-default transition-all ${
                    isLight
                      ? "border-black/10 bg-white shadow-sm hover:border-black/25"
                      : "border-white/10 bg-white/[0.02] hover:border-white/30"
                  }`}
                >
                  <span
                    className={`text-[10px] tracking-[0.18em] uppercase ${
                      isLight ? "text-zinc-500 font-medium" : "text-zinc-400"
                    }`}
                  >
                    {item.category}
                  </span>
                  <div>
                    <span
                      className={`text-sm font-semibold tracking-wide block ${
                        isLight ? "text-zinc-950" : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] leading-tight block mt-0.5 line-clamp-1 ${
                        isLight ? "text-zinc-500" : "text-zinc-500"
                      }`}
                    >
                      {item.desc}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION 5: CURATED EXPEDITIONS (TitanGate Opportunities)               */}
      {/* ========================================================================= */}
      <section
        id="expediciones"
        className={`relative border-t py-24 sm:py-36 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="flex flex-col md:flex-row md:items-end justify-between pb-12 sm:pb-16 gap-6"
          >
            <div className="space-y-3">
              <span
                className={`text-[11px] tracking-[0.25em] uppercase font-medium ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                02 // CATÁLOGO DE EXPEDICIONES
              </span>
              <h3
                className={`text-3xl sm:text-5xl font-semibold tracking-tight ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                Oportunidades Curadas.
              </h3>
            </div>
            <p
              className={`text-sm max-w-md ${isLight ? "text-zinc-600" : "text-zinc-400"}`}
            >
              Plantillas maestras listas para clonar, personalizar y
              comercializar bajo la marca exclusiva de tu agencia.
            </p>
          </motion.div>

          {/* Cards Grid in 4 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.code}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT }}
              >
                <SpotlightCard
                  onClick={() => setSelectedDestination(i)}
                  className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 corner-brackets flex flex-col h-full ${
                    isLight
                      ? "bg-white border-black/10 hover:border-black/25 shadow-md"
                      : "bg-[#09090d] border-white/15 hover:border-white/35"
                  }`}
                >
                  {/* Visual Image */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden shrink-0">
                    <Image
                      src={dest.image}
                      alt={dest.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${
                        isLight
                          ? "from-white via-white/40 to-transparent"
                          : "from-[#09090d] via-[#09090d]/40 to-transparent"
                      }`}
                    />

                    {/* Top Badges: Crisp high contrast badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[9px] tracking-[0.18em] uppercase bg-black/80 backdrop-blur-md border border-white/20 font-medium keep-white"
                        style={{ color: "#ffffff" }}
                      >
                        {dest.code} // {dest.badge}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold tracking-tight shadow-sm ${
                          isLight
                            ? "bg-zinc-950 text-white"
                            : "bg-white text-zinc-950"
                        }`}
                        style={{
                          backgroundColor: isLight ? "#09090b" : "#ffffff",
                          color: isLight ? "#ffffff" : "#09090b",
                        }}
                      >
                        {dest.price}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-blue-500 font-semibold tracking-wider uppercase">
                          {dest.category}
                        </span>
                        <span
                          className={`text-[11px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"}`}
                        >
                          {dest.days}
                        </span>
                      </div>

                      <h4
                        className={`text-base sm:text-lg font-semibold tracking-tight transition-colors line-clamp-2 ${
                          isLight
                            ? "text-zinc-950 group-hover:text-blue-600"
                            : "text-white group-hover:text-blue-300"
                        }`}
                      >
                        {dest.title}
                      </h4>

                      <p
                        className={`text-xs leading-relaxed font-light line-clamp-2 ${
                          isLight ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      >
                        {dest.description}
                      </p>
                    </div>

                    <div
                      className={`pt-3 border-t flex items-center justify-between ${
                        isLight ? "border-black/10" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {dest.stops.slice(0, 3).map((stop, sIndex) => (
                          <span
                            key={sIndex}
                            className={`text-[10px] tracking-wide truncate ${
                              isLight
                                ? "text-zinc-600 font-medium"
                                : "text-zinc-400"
                            }`}
                          >
                            {stop}{" "}
                            {sIndex < Math.min(dest.stops.length, 3) - 1
                              ? "·"
                              : ""}
                          </span>
                        ))}
                      </div>
                      <div
                        className={`text-[11px] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold shrink-0 ${
                          isLight ? "text-zinc-950" : "text-white"
                        }`}
                      >
                        <span>Ver</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION 6: THE PRIVATE NETWORK (TitanGate Pioneers)                   */}
      {/* ========================================================================= */}
      <section
        id="red-privada"
        className={`relative border-t py-24 sm:py-36 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3 pb-16"
          >
            <span
              className={`text-[11px] tracking-[0.25em] uppercase font-medium ${
                isLight ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              03 // PIONEROS DE LA RED
            </span>
            <h3
              className={`text-3xl sm:text-5xl font-semibold tracking-tight ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              La Red de Directores.
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Wanderlust multiplicó nuestra tasa de cierre un 42%. Cuando un cliente de alto valor recibe un enlace interactivo en vez de un PDF pesado, la percepción de precio desaparece.",
                author: "Carlos Menéndez",
                role: "Director General",
                agency: "Aethelgard Private Travel (Madrid)",
              },
              {
                quote:
                  "La liquidación con Stripe en el propio itinerario eliminó semanas de correos sobre transferencias bancarias. Los clientes abonan depósitos de 3.000 € desde su móvil.",
                author: "Beatriz L. de Vega",
                role: "Fundadora & Concierge",
                agency: "Nomad Signature Atelier (Barcelona)",
              },
              {
                quote:
                  "La estética oscura y la pulcritud de cada pantalla transmite el mismo nivel de cuidado que ponemos al diseñar cada hotel y traslado privado. Es impecable.",
                author: "Guillermo F. Rossi",
                role: "Head of Luxury Expeditions",
                agency: "Rossi & Co. Voyagers (Milán / Valencia)",
              },
            ].map((testimonial, tIdx) => (
              <motion.div
                key={tIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: tIdx * 0.12 }}
              >
                <SpotlightCard
                  className={`p-5 sm:p-8 rounded-2xl border space-y-6 corner-brackets flex flex-col justify-between h-full transition-colors ${
                    isLight
                      ? "bg-white border-black/10 text-zinc-900 shadow-md"
                      : "bg-[#09090d] border-white/15 text-white"
                  }`}
                >
                  <p
                    className={`text-sm sm:text-base font-light leading-relaxed ${
                      isLight ? "text-zinc-700" : "text-zinc-300"
                    }`}
                  >
                    "{testimonial.quote}"
                  </p>

                  <div
                    className={`pt-4 border-t ${isLight ? "border-black/10" : "border-white/10"}`}
                  >
                    <div
                      className={`text-sm font-semibold ${isLight ? "text-zinc-950" : "text-white"}`}
                    >
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-blue-500 font-medium">
                      {testimonial.role}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}
                    >
                      {testimonial.agency}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SECTION 7: FAQ (Arquitectura y Dudas Frecuentes)                       */}
      {/* ========================================================================= */}
      <section
        id="faq"
        className={`relative border-t py-20 sm:py-32 transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 pb-12 sm:pb-16">
            <span
              className={`text-[11px] tracking-[0.25em] uppercase font-medium ${
                isLight ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              04 // PROTOCOLO & PREGUNTAS
            </span>
            <h3
              className={`text-3xl sm:text-5xl font-semibold tracking-tight ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              Preguntas Frecuentes.
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, fIndex) => (
              <div
                key={faq.code}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isLight
                    ? "border-black/10 bg-white shadow-sm hover:border-black/20"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === fIndex ? null : fIndex)}
                  className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span
                      className={`text-xs tracking-widest font-semibold shrink-0 ${
                        isLight ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      {faq.code}
                    </span>
                    <span
                      className={`text-sm sm:text-base md:text-lg font-medium leading-snug ${
                        isLight ? "text-zinc-950" : "text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                      openFaq === fIndex
                        ? "rotate-180 text-blue-500"
                        : isLight
                          ? "text-zinc-500"
                          : "text-zinc-400"
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === fIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className={`px-4 sm:px-6 pb-4 sm:pb-6 pt-0 text-xs sm:text-sm leading-relaxed font-light border-t ${
                        isLight
                          ? "border-black/5 text-zinc-600"
                          : "border-white/5 text-zinc-400"
                      }`}
                    >
                      <p className="pt-4">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. SECTION 8: THE MONOLITH CLOSING (TitanGate Section 20 & 22)           */}
      {/* ========================================================================= */}
      <section
        className={`relative border-t pt-20 sm:pt-24 pb-28 sm:pb-40 overflow-hidden transition-colors ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        {/* Giant Monolith Watermark with subtle float */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none"
        >
          <span
            className={`text-[18vw] font-black tracking-tighter ${
              isLight ? "text-zinc-950" : "text-white"
            }`}
          >
            WANDERLUST
          </span>
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
            {/* Left Headline */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-6"
            >
              <h2
                className={`text-4xl xs:text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-[0.95] ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                Un Privilegio.
              </h2>
            </motion.div>

            {/* Right Statement & Access Button */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="lg:col-span-6 space-y-6"
            >
              <h3
                className={`text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                Fuera del Alcance Común.
              </h3>
              <p
                className={`text-sm sm:text-base lg:text-lg font-light leading-relaxed max-w-xl ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                Wanderlust no está abierto a las masas, ni fue concebido para
                serlo. Está construido exclusivamente para agencias que
                consideran cada viaje como una obra de arte y exigen la
                plataforma tecnológica más avanzada del sector.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRegisterModalOpen(true)}
                  className={`px-6 sm:px-8 py-3.5 rounded-full text-xs tracking-[0.18em] sm:tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-3 cursor-pointer transition-all ${
                    isLight
                      ? "bg-zinc-950 text-white shadow-xl hover:bg-black"
                      : "text-zinc-950 bg-white shadow-[0_0_35px_rgba(255,255,255,0.2)] hover:bg-zinc-200"
                  }`}
                >
                  <Globe
                    className={`w-4 h-4 ${isLight ? "text-white" : "text-zinc-950"}`}
                  />
                  <span>Solicitar Acceso Privado</span>
                </motion.button>
                <Link
                  href="/login"
                  className={`text-xs tracking-[0.18em] uppercase transition-colors px-4 py-3 text-center sm:text-left ${
                    isLight
                      ? "text-zinc-600 hover:text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Iniciar Sesión
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. MINIMALIST ARCHITECTURAL FOOTER (TitanGate Section 22 Footer)         */}
      {/* ========================================================================= */}
      <footer
        className={`border-t py-10 sm:py-12 transition-colors duration-300 ${
          isLight
            ? "border-black/10 bg-[#f8f9fc] text-zinc-600"
            : "border-white/10 bg-black text-zinc-400"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] tracking-[0.18em] sm:tracking-[0.2em] uppercase text-center sm:text-left">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="relative h-8 sm:h-11 w-40 sm:w-52">
                <Image
                  src={
                    isLight
                      ? "/wanderlust_horizontal_negro.png"
                      : "/wanderlust_horizontal_blanco.png"
                  }
                  alt="Wanderlust"
                  fill
                  className="object-contain object-center sm:object-left"
                />
              </div>
              <span className={isLight ? "text-zinc-400" : "text-zinc-600"}>
                ·
              </span>
              <span className={isLight ? "text-zinc-500" : "text-zinc-500"}>
                © 2026
              </span>
            </div>

            {/* Center: Mouse glyph */}
            <div
              className={`hidden md:flex items-center gap-2 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
            >
              <div
                className={`w-2.5 h-4 rounded-full border flex items-start justify-center p-0.5 ${
                  isLight ? "border-zinc-300" : "border-zinc-700"
                }`}
              >
                <div
                  className={`w-0.5 h-1 rounded-full ${isLight ? "bg-zinc-400" : "bg-zinc-500"}`}
                />
              </div>
              <span className="text-[10px]">ALL RIGHTS RESERVED</span>
            </div>

            {/* Right: Theme Switcher + Iniciar Sesión + Registro */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
              <ThemeToggle />
              <Link
                href="/login"
                className="hover:text-blue-500 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="hover:text-blue-500 transition-colors"
              >
                Registro
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 12. PRIVATE ACCESS REQUEST MODAL                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {registerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-8 corner-brackets transition-colors ${
                isLight
                  ? "bg-white border-black/15 shadow-2xl text-zinc-900"
                  : "bg-[#0c0c10] border-white/20 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
              }`}
            >
              <button
                onClick={() => {
                  setRegisterModalOpen(false);
                  setRegisterSubmitted(false);
                }}
                className={`absolute top-6 right-6 p-1 transition-colors ${
                  isLight
                    ? "text-zinc-400 hover:text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {!registerSubmitted ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-blue-500 font-semibold">
                      <span>SOLICITUD DE ACCESO // RED PRIVADA</span>
                    </div>
                    <h3
                      className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                        isLight ? "text-zinc-950" : "text-white"
                      }`}
                    >
                      Acceso Exclusivo
                    </h3>
                    <p
                      className={`text-xs leading-relaxed font-light ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      Completa los datos de tu agencia para validar tus
                      credenciales. Revisamos cada solicitud en menos de 24
                      horas.
                    </p>
                  </div>

                  <form
                    onSubmit={handleRegisterSubmit}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label
                        className={`block text-[11px] tracking-wider uppercase mb-1.5 font-medium ${
                          isLight ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        Nombre del Director / Agente
                      </label>
                      <input
                        type="text"
                        required
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ej. Carlos Menéndez"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                          isLight
                            ? "border-black/15 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black/40 focus:bg-white"
                            : "border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-[11px] tracking-wider uppercase mb-1.5 font-medium ${
                            isLight ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        >
                          Nombre de la Agencia
                        </label>
                        <input
                          type="text"
                          required
                          value={registerForm.agencyName}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              agencyName: e.target.value,
                            })
                          }
                          placeholder="Ej. Aethelgard Travel"
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                            isLight
                              ? "border-black/15 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black/40 focus:bg-white"
                              : "border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-[11px] tracking-wider uppercase mb-1.5 font-medium ${
                            isLight ? "text-zinc-700" : "text-zinc-400"
                          }`}
                        >
                          Email Corporativo
                        </label>
                        <input
                          type="email"
                          required
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm({
                              ...registerForm,
                              email: e.target.value,
                            })
                          }
                          placeholder="carlos@aethelgard.com"
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                            isLight
                              ? "border-black/15 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black/40 focus:bg-white"
                              : "border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-[11px] tracking-wider uppercase mb-1.5 font-medium ${
                          isLight ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        Teléfono Directo
                      </label>
                      <input
                        type="tel"
                        required
                        value={registerForm.phone}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+34 600 000 000"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                          isLight
                            ? "border-black/15 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black/40 focus:bg-white"
                            : "border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                        }`}
                      />
                    </div>

                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full py-3.5 rounded-full font-semibold tracking-wider uppercase text-xs cursor-pointer transition-all ${
                          isLight
                            ? "bg-zinc-950 text-white hover:bg-black shadow-md"
                            : "bg-white text-zinc-950 hover:bg-zinc-200"
                        }`}
                      >
                        Enviar Solicitud de Validación
                      </motion.button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 mx-auto flex items-center justify-center"
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                  <h4
                    className={`text-xl font-semibold tracking-tight ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    Solicitud Recibida
                  </h4>
                  <p
                    className={`text-xs max-w-sm mx-auto leading-relaxed ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Hemos registrado los datos de tu agencia. Un concierge de
                    Wanderlust se pondrá en contacto contigo para verificar tus
                    credenciales y activar tu terminal.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setRegisterModalOpen(false)}
                      className={`px-6 py-2.5 rounded-full border text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                        isLight
                          ? "border-black/20 text-zinc-900 hover:bg-black/5"
                          : "border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 13. DESTINATION DETAIL DRAWER / MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedDestination !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border p-5 sm:p-8 corner-brackets space-y-6 transition-colors ${
                isLight
                  ? "bg-white border-black/15 text-zinc-900 shadow-2xl"
                  : "bg-[#09090d] border-white/20 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
              }`}
            >
              <button
                onClick={() => setSelectedDestination(null)}
                className={`absolute top-6 right-6 p-1 transition-colors ${
                  isLight
                    ? "text-zinc-400 hover:text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase bg-blue-500/10 border border-blue-500/20 text-blue-500 font-semibold">
                    {destinations[selectedDestination].code} //{" "}
                    {destinations[selectedDestination].badge}
                  </span>
                  <span
                    className={`text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
                  >
                    {destinations[selectedDestination].days}
                  </span>
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  {destinations[selectedDestination].title}
                </h3>
                <p
                  className={`text-sm leading-relaxed font-light ${
                    isLight ? "text-zinc-600" : "text-zinc-300"
                  }`}
                >
                  {destinations[selectedDestination].description}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isLight
                    ? "border-black/10 bg-zinc-50"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div
                  className={`text-[11px] tracking-wider uppercase font-medium ${
                    isLight ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  Ruta y Escalas Exclusivas
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {destinations[selectedDestination].stops.map((stop, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-lg border text-xs ${
                        isLight
                          ? "border-black/10 bg-white text-zinc-800 shadow-xs"
                          : "border-white/10 bg-white/[0.04] text-zinc-200"
                      }`}
                    >
                      {stop}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={`pt-4 border-t flex items-center justify-between ${
                  isLight ? "border-black/10" : "border-white/10"
                }`}
              >
                <div>
                  <div
                    className={`text-[10px] tracking-widest uppercase ${
                      isLight ? "text-zinc-500 font-medium" : "text-zinc-400"
                    }`}
                  >
                    Tarifa Orientativa
                  </div>
                  <div
                    className={`text-2xl font-bold tracking-tight ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    {destinations[selectedDestination].price}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedDestination(null);
                    setRegisterModalOpen(true);
                  }}
                  className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-950 text-white hover:bg-black shadow-md"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  Clonar Itinerario
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
