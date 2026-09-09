'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Plane,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Users,
  Smartphone,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Star,
  Zap,
  Globe,
  Compass,
  FileCheck,
  Share2,
  DollarSign,
  Percent,
  Lock,
  Headphones,
  Check,
  X,
  Menu,
  Play,
  Briefcase,
  HelpCircle,
  Send,
  Building2,
  Navigation,
  Luggage,
  Coffee,
  Camera,
  Heart,
  Search,
  User,
} from 'lucide-react';

export default function HomePage() {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'map' | 'timeline' | 'crm' | 'payments' | 'mobile'>('map');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [userType, setUserType] = useState<'agency' | 'particular'>('agency');
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    agencyName: '',
    phone: '',
    agencyType: 'Agencia Emisora (Viajes a Medida)',
  });

  const destinations = [
    {
      title: 'Vietnam & Templos de Angkor',
      days: '14 Días · 2 Viajeros',
      price: '4.890 €',
      category: 'Viaje a Medida',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      tag: 'Más Cotizado',
      stops: ['Hanoi', 'Ha Long', 'Hoi An', 'Siem Reap'],
    },
    {
      title: 'Japón Tradicional & Tokio Futurista',
      days: '12 Días · 2 Viajeros',
      price: '6.200 €',
      category: 'Cultura & Gastronomía',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      tag: 'Alta Demanda',
      stops: ['Tokio', 'Kyoto', 'Nara', 'Osaka'],
    },
    {
      title: 'Luna de Miel Bali & Islas Komodo',
      days: '10 Días · Pareja',
      price: '5.450 €',
      category: 'Luna de Miel',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      tag: 'Exclusivo',
      stops: ['Ubud', 'Nusa Penida', 'Komodo', 'Seminyak'],
    },
    {
      title: 'Safari en Kenia & Playas de Zanzíbar',
      days: '11 Días · 4 Viajeros',
      price: '7.800 €',
      category: 'Naturaleza & Lujo',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      tag: 'Aventura VIP',
      stops: ['Masai Mara', 'Lago Nakuru', 'Nairobi', 'Zanzíbar'],
    },
  ];

  const faqs = [
    {
      q: '¿Qué diferencia a Wanderlust de un PDF o Word tradicional?',
      a: 'Wanderlust unifica todo tu viaje en una sola vista con mapa interactivo y cronograma día por día. Tu cliente recibe un enlace web responsive que puede abrir en su teléfono, con fotos de alta resolución, horarios de vuelos, reservas de hoteles y un botón directo para aceptar y pagar el viaje con tarjeta.',
    },
    {
      q: '¿Cómo funciona la integración de cobros con Stripe Connect?',
      a: 'Conectas tu cuenta de Stripe en un solo clic. Puedes solicitar depósitos iniciales (por ejemplo, el 30%) o el pago total de la reserva. El dinero entra directamente a la cuenta bancaria de tu agencia de forma rápida y 100% segura con tarifas oficiales de Stripe.',
    },
    {
      q: '¿Puedo personalizar las propuestas con la marca de mi agencia?',
      a: 'Sí. Todos los itinerarios públicos llevan tu logotipo, tus colores corporativos y los datos de contacto directos de tu agencia o agente comercial.',
    },
    {
      q: '¿Mis clientes necesitan descargarse alguna aplicación para ver su viaje?',
      a: 'No, no necesitan instalar nada. El itinerario se abre directamente desde el navegador de su teléfono móvil o tablet al pulsar en el enlace de WhatsApp o email que les envíes.',
    },
    {
      q: '¿Puedo usar Wanderlust si soy un viajero particular?',
      a: '¡Por supuesto! Wanderlust permite tanto a agencias de viaje profesionales como a viajeros particulares planificar itinerarios increíbles día a día con mapas interactivos y compartirlos con familiares y amigos.',
    },
  ];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitted(true);
    setTimeout(() => {
      setRegisterModalOpen(false);
      setRegisterSubmitted(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#009688]/20 selection:text-[#00796b]">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-36 h-9 transition-transform group-hover:scale-102">
                <Image
                  src="/wanderlust_horizontal_negro.png"
                  alt="Wanderlust"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <a href="#itinerarios" className="hover:text-[#009688] transition-colors">
                Itinerarios & Mapa
              </a>
              <a href="#funciones" className="hover:text-[#009688] transition-colors">
                CRM & Cobros
              </a>
              <a href="#plantillas" className="hover:text-[#009688] transition-colors">
                Plantillas de Viaje
              </a>
              <a href="#opiniones" className="hover:text-[#009688] transition-colors">
                Opiniones
              </a>
              <a href="#faq" className="hover:text-[#009688] transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              Inicia sesión
            </Link>
            <Link
              href="/registro"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#009688] hover:bg-[#00796b] shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <span>Regístrate gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white px-6 py-5 space-y-3 font-medium text-sm text-zinc-700">
            <a href="#itinerarios" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#009688]">
              Itinerarios & Mapa
            </a>
            <a href="#funciones" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#009688]">
              CRM & Cobros
            </a>
            <a href="#plantillas" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#009688]">
              Plantillas de Viaje
            </a>
            <a href="#opiniones" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#009688]">
              Opiniones de Agencias
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#009688]">
              FAQ
            </a>
            <div className="pt-3 border-t border-zinc-200 flex flex-col gap-2">
              <Link href="/login" className="w-full text-center py-2.5 rounded-xl border border-zinc-300 font-semibold">
                Inicia sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#009688] text-white font-bold"
              >
                Regístrate gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-teal-50/40 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 max-w-4xl mx-auto leading-[1.12]">
            Una sola plataforma para todas tus necesidades de{' '}
            <span className="text-[#009688]">planificación de viajes</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-zinc-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Crea itinerarios detallados día a día, visualiza rutas en el mapa, gestiona reservas y cobra a tus clientes sin
            problemas, todo en un solo lugar.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/registro"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold text-white bg-[#009688] hover:bg-[#00796b] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Comienza a planificar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 shadow-xs hover:border-zinc-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-zinc-600 fill-zinc-600" />
              <span>Ver demo guiada</span>
            </button>
          </div>

          {/* Highlights Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#009688]" />
              <span>Itinerario y mapa en una sola vista</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#009688]" />
              <span>Cobros directos con Stripe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#009688]" />
              <span>Acceso móvil para el cliente sin descargas</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* MOCKUP: ITINERARY (LEFT) + MAP (RIGHT) SPLIT VIEW                     */}
          {/* ===================================================================== */}
          <div id="itinerarios" className="mt-14 relative mx-auto max-w-6xl">
            <div className="rounded-3xl border border-zinc-200/90 bg-white shadow-2xl overflow-hidden text-left">
              {/* Top Browser Header */}
              <div className="px-6 py-3.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    wanderlust.com/viaje/vietnam-camboya-vip
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 text-xs font-semibold">
                  <button
                    onClick={() => setActiveFeatureTab('map')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeFeatureTab === 'map' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Itinerario & Mapa
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('crm')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeFeatureTab === 'crm' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    CRM de Ventas
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('payments')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeFeatureTab === 'payments' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Pasarela Stripe
                  </button>
                  <button
                    onClick={() => setActiveFeatureTab('mobile')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeFeatureTab === 'mobile' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Visor del Viajero
                  </button>
                </div>
              </div>

              {/* Showcase Canvas */}
              {activeFeatureTab === 'map' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                  {/* Left Column: Timeline (7 cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-zinc-200 overflow-y-auto">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#00796b]">
                            14 Días · 2 Personas
                          </span>
                          <span className="text-xs text-zinc-500">12 - 26 Octubre</span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mt-1">
                          Vietnam Mágico, Bahía de Ha Long & Angkor Wat
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#00796b]">4.890 €</div>
                        <div className="text-xs text-zinc-500">Total presupuestado</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Day 1 */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                            <span className="w-5 h-5 rounded-full bg-[#009688] text-white flex items-center justify-center text-[10px]">
                              1
                            </span>
                            <span>DÍA 1 · HANOI</span>
                          </div>
                          <span className="text-xs text-zinc-500 font-medium">Llegada & Check-in</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200/80">
                            <Plane className="w-4 h-4 text-[#009688]" />
                            <span className="truncate">Vuelo Qatar QR142 (08:30)</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200/80">
                            <Building2 className="w-4 h-4 text-amber-600" />
                            <span className="truncate">Hotel Sofitel Metropole (5★)</span>
                          </div>
                        </div>
                      </div>

                      {/* Day 2 */}
                      <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-[#00796b]">
                            <span className="w-5 h-5 rounded-full bg-[#009688] text-white flex items-center justify-center text-[10px]">
                              2
                            </span>
                            <span>DÍA 2 · BAHÍA DE HA LONG</span>
                          </div>
                          <span className="text-xs font-semibold text-[#00796b]">Crucero Privado</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-teal-200">
                            <Compass className="w-4 h-4 text-[#009688]" />
                            <span className="truncate">Crucero Paradise Peak Suite</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-teal-200">
                            <Coffee className="w-4 h-4 text-purple-600" />
                            <span className="truncate">Cena degustación y cata</span>
                          </div>
                        </div>
                      </div>

                      {/* Day 3 */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                            <span className="w-5 h-5 rounded-full bg-[#009688] text-white flex items-center justify-center text-[10px]">
                              3
                            </span>
                            <span>DÍA 3 · HOI AN</span>
                          </div>
                          <span className="text-xs text-zinc-500 font-medium">Ciudad de Linternas</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700">
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200/80">
                            <Camera className="w-4 h-4 text-sky-600" />
                            <span className="truncate">Tour en barca por el río</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-zinc-200/80">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="truncate">Guía privado en español</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Clean Map Preview with CORRECT UNDER-PILL PATH (5 cols) */}
                  <div className="lg:col-span-5 bg-zinc-100 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#f1f5f9] opacity-90" />
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xs border border-zinc-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                          <Navigation className="w-4 h-4 text-[#009688]" />
                          <span>Ruta calculada · 3 destinos</span>
                        </div>
                        <span className="text-xs text-zinc-500">1.240 km</span>
                      </div>

                      {/* Map Box with fixed SVG route behind pills */}
                      <div className="relative h-64 w-full bg-white/70 rounded-2xl border border-zinc-200 p-4 overflow-hidden">
                        {/* Connecting Line SVG strictly BEHIND the pills (z-0) */}
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none z-0"
                          viewBox="0 0 400 240"
                          fill="none"
                        >
                          <path
                            d="M 90 55 C 190 55, 270 65, 300 85 C 330 115, 250 165, 145 175"
                            stroke="#009688"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray="6 6"
                          />
                        </svg>

                        {/* Pin 1: Hanoi (z-10 on top with solid white background) */}
                        <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-zinc-200 text-xs font-bold text-zinc-900 select-none">
                          <span className="w-5 h-5 rounded-full bg-[#009688] text-white flex items-center justify-center text-[11px] font-bold">
                            1
                          </span>
                          <span>Hanoi</span>
                        </div>

                        {/* Pin 2: Ha Long (z-10 on top with solid teal background) */}
                        <div className="absolute top-16 right-6 z-10 flex items-center gap-2 bg-[#009688] text-white px-3.5 py-1.5 rounded-full shadow-md text-xs font-bold select-none">
                          <span className="w-5 h-5 rounded-full bg-white text-[#009688] flex items-center justify-center text-[11px] font-bold">
                            2
                          </span>
                          <span>Ha Long</span>
                        </div>

                        {/* Pin 3: Hoi An (z-10 on top with solid white background) */}
                        <div className="absolute bottom-10 left-16 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-zinc-200 text-xs font-bold text-zinc-900 select-none">
                          <span className="w-5 h-5 rounded-full bg-[#009688] text-white flex items-center justify-center text-[11px] font-bold">
                            3
                          </span>
                          <span>Hoi An</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 pt-4 text-xs text-zinc-500 text-center font-medium">
                      ✓ Sincronizado automáticamente con distancias de conducción y vuelos
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: CRM */}
              {activeFeatureTab === 'crm' && (
                <div className="p-6 sm:p-8 bg-zinc-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-zinc-500 border-b pb-2">
                        <span>NUEVAS (3)</span>
                        <span>12.400 €</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                        <div className="font-bold text-zinc-900">Japón Sakura 12d</div>
                        <div className="text-zinc-500 flex justify-between">
                          <span>Familia Gómez</span>
                          <span className="text-amber-600 font-semibold">6.200 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-[#00796b] border-b border-teal-200 pb-2">
                        <span>PROPUESTAS (4)</span>
                        <span>21.850 €</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-teal-200 text-xs space-y-1">
                        <div className="font-bold text-zinc-900">Luna de Miel Bali 10d</div>
                        <div className="text-zinc-500 flex justify-between">
                          <span>Visto x2 en móvil</span>
                          <span className="text-[#00796b] font-semibold">5.450 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-amber-600 border-b pb-2">
                        <span>NEGOCIACIÓN (2)</span>
                        <span>14.200 €</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                        <div className="font-bold text-zinc-900">Ruta Perú VIP</div>
                        <div className="text-zinc-500 flex justify-between">
                          <span>Ajuste vuelos</span>
                          <span className="text-amber-600 font-semibold">9.800 €</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-emerald-700 border-b border-emerald-200 pb-2">
                        <span>PAGADAS (12)</span>
                        <span>58.400 €</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                        <div className="font-bold text-zinc-900">Vietnam Mágico 14d</div>
                        <div className="text-emerald-700 font-semibold flex justify-between">
                          <span>✓ Depósito cobrado</span>
                          <span>4.890 €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Stripe Checkout WITH OFFICIAL STRIPE LOGO */}
              {activeFeatureTab === 'payments' && (
                <div className="p-8 sm:p-12 max-w-lg mx-auto text-center space-y-4">
                  {/* Official Stripe Logo Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#635bff]/10 border border-[#635bff]/20 flex items-center justify-center mx-auto shadow-sm">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#635bff">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.4 12.835.4 6.702.4 2.5 3.647 2.5 8.94c0 6.643 9.157 5.753 9.157 8.706 0 .99-.81 1.482-2.172 1.482-2.346 0-5.183-1.074-6.866-2.029l-.89 5.58c1.84.819 4.793 1.421 7.756 1.421 6.363 0 10.748-3.13 10.748-8.583 0-7.05-6.257-5.89-6.257-8.886z" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Cobro de Depósito con Stripe Connect</h3>
                    <p className="text-xs text-zinc-600 mt-1">
                      El cliente confirma el viaje y paga con tarjeta o Apple Pay en 10 segundos
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Total Presupuesto:</span>
                      <span className="font-bold text-zinc-900">4.890,00 €</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-[#00796b]">
                      <span>Depósito a pagar hoy (30%):</span>
                      <span className="text-base text-emerald-600">1.467,00 €</span>
                    </div>
                  </div>

                  <button className="w-full py-3.5 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white font-bold text-sm shadow-md transition-all">
                    Pagar 1.467,00 € de forma segura
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span>Pagos encriptados con seguridad SSL de 256 bits</span>
                  </div>
                </div>
              )}

              {/* Tab 4: Mobile */}
              {activeFeatureTab === 'mobile' && (
                <div className="p-8 flex justify-center">
                  <div className="w-full max-w-sm rounded-[32px] p-4 bg-zinc-900 text-white shadow-2xl space-y-4">
                    <div className="w-20 h-3 rounded-full bg-zinc-700 mx-auto" />
                    <div className="p-4 rounded-2xl bg-[#009688] text-white space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100">TU VIAJE EN VIVO</div>
                      <div className="text-base font-bold">Vietnam & Camboya Exclusivo</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-800 text-xs flex justify-between items-center">
                      <span>QR142 · Vuelo a Hanoi</span>
                      <span className="text-emerald-400 font-bold">A tiempo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Tagline */}
            <div className="mt-8 text-center max-w-xl mx-auto space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">
                Tu itinerario y tu mapa en una sola vista
              </h3>
              <p className="text-sm text-zinc-600">
                No más cambiar entre diferentes apps, hojas de cálculo y documentos para seguir tus planes de viaje.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4 CORE VALUE PILLARS                                                      */}
      {/* ========================================================================= */}
      <section id="funciones" className="py-20 lg:py-28 border-t border-zinc-200/80 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900">
              Diseñado para simplificar cada paso de tu viaje
            </h2>
            <p className="mt-4 text-base text-zinc-600">
              Todo lo que necesitas para cotizar, vender y operar viajes extraordinarios sin perder tiempo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#009688] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Itinerario Día por Día</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Añade vuelos, traslados, hoteles, excursiones y comidas con horas de inicio, notas y fotos en alta
                definición.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Rutas & Mapa Integrado</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Cada actividad se fija automáticamente en tu mapa de viaje con tiempos y distancias entre cada punto de la
                ruta.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Cobros Directos con Stripe</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Permite a tus clientes pagar el anticipo o el viaje completo con tarjeta o Apple Pay de forma 100% segura.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Enlace Web para el Cliente</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Comparte un link interactivo adaptado al móvil por WhatsApp. Sin descargas de apps ni registros requeridos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DESTINATION TEMPLATES SHOWCASE                                            */}
      {/* ========================================================================= */}
      <section id="plantillas" className="py-20 lg:py-28 border-t border-zinc-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#009688]">Plantillas Populares</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 mt-1">
                Inicia con propuestas listas para personalizar
              </h2>
              <p className="text-sm text-zinc-600 mt-2">
                Adapta estos itinerarios a la medida de tu cliente con un solo clic.
              </p>
            </div>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#009688] hover:text-[#00796b] cursor-pointer"
            >
              <span>Ver todas las plantillas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, i) => (
              <div
                key={i}
                className="rounded-3xl border border-zinc-200 bg-white shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col group cursor-pointer"
                onClick={() => setRegisterModalOpen(true)}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-zinc-900 shadow-xs">
                    {dest.tag}
                  </div>
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md text-xs font-bold text-white">
                    {dest.price}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase">{dest.category}</div>
                    <h4 className="text-base font-bold text-zinc-900 mt-0.5 group-hover:text-[#009688] transition-colors">
                      {dest.title}
                    </h4>
                    <div className="text-xs text-zinc-500 mt-1">{dest.days}</div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600 font-medium">
                    <span>{dest.stops.length} paradas</span>
                    <span className="text-[#009688] font-bold group-hover:translate-x-0.5 transition-transform">
                      Usar plantilla →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* REVIEWS & TESTIMONIALS SECTION                                            */}
      {/* ========================================================================= */}
      <section id="opiniones" className="py-20 lg:py-28 border-t border-zinc-200/80 bg-zinc-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900">
              De qué están hablando las agencias y viajeros
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Más de 650 agencias en todo el mundo utilizan Wanderlust para crear viajes memorables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-[#00796b] font-bold flex items-center justify-center text-sm">
                  AR
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900">Alejandro Ramos</div>
                  <div className="text-xs text-zinc-500">Horizon Luxury Travel</div>
                </div>
              </div>
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                «La mejor herramienta de viajes que he probado. El itinerario conectado con el mapa facilita muchísimo la
                planificación. A los clientes les fascina recibir el enlace web en su teléfono móvil.»
              </p>
            </div>

            {/* Review 2 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                  CS
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900">Carmen Sánchez</div>
                  <div className="text-xs text-zinc-500">Viajes a Medida Bali</div>
                </div>
              </div>
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                «La integración con Stripe Connect nos ha cambiado la vida. El cliente revisa la propuesta y abona el
                depósito del 30% directamente con Apple Pay. Hemos aumentado un 35% el cierre de ventas.»
              </p>
            </div>

            {/* Review 3 */}
            <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                  ML
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900">Marcos López</div>
                  <div className="text-xs text-zinc-500">Indochina DMCs</div>
                </div>
              </div>
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                «Manejamos más de 80 cotizaciones al mes. El CRM y la posibilidad de clonar viajes nos ahorran fácilmente 2
                horas por cada propuesta. Recomendable al 100%.»
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FAQ SECTION                                                               */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 lg:py-28 border-t border-zinc-200/80 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-zinc-900">Preguntas Frecuentes</h2>
            <p className="text-sm text-zinc-600">Resolvemos las dudas más habituales sobre Wanderlust.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left font-semibold text-zinc-900 text-base flex justify-between items-center gap-4 hover:bg-zinc-50/80 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#009688] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION BANNER                                               */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 bg-[#009688] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Comienza a planificar viajes extraordinarios hoy
          </h2>
          <p className="text-base sm:text-lg text-teal-100 max-w-2xl mx-auto">
            Únete a más de 650 agencias de viaje y DMCs que ya ahorran horas y cierran más ventas con Wanderlust.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-zinc-900 bg-white hover:bg-zinc-100 shadow-lg transition-all text-center"
            >
              Comenzar prueba gratuita
            </Link>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-white bg-teal-800/60 hover:bg-teal-800 border border-teal-400/40 transition-all cursor-pointer"
            >
              Solicitar demo con un especialista
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-200 bg-white pt-16 pb-12 text-sm text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="relative w-36 h-9">
                <Image
                  src="/wanderlust_horizontal_negro.png"
                  alt="Wanderlust"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                El planificador de itinerarios y software integral para agencias de viajes, DMCs y touroperadores.
              </p>
              <div className="text-xs text-zinc-400">
                © {new Date().getFullYear()} Wanderlust Platform. Todos los derechos reservados.
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">Producto</div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li><a href="#itinerarios" className="hover:text-[#009688]">Itinerario y Mapa</a></li>
                <li><a href="#funciones" className="hover:text-[#009688]">CRM de Oportunidades</a></li>
                <li><a href="#funciones" className="hover:text-[#009688]">Cobros con Stripe</a></li>
                <li><a href="#plantillas" className="hover:text-[#009688]">Plantillas de Viaje</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">Destinos</div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li>Viajes a Vietnam & Sudeste Asiático</li>
                <li>Viajes a Japón & Cultura</li>
                <li>Lunas de Miel en Bali</li>
                <li>Safaris en África & Zanzíbar</li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">Contacto & Acceso</div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li><Link href="/login" className="text-[#009688] font-bold hover:underline">Acceder a mi cuenta →</Link></li>
                <li><button onClick={() => setRegisterModalOpen(true)} className="hover:text-[#009688] text-left cursor-pointer">Solicitar demo</button></li>
                <li><a href="mailto:hola@wanderlust-app.com" className="hover:text-[#009688]">hola@wanderlust-app.com</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* REGISTRATION / START MODAL (WITH AGENCIA VS PARTICULAR SELECTOR)          */}
      {/* ========================================================================= */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-zinc-200">
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {registerSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-[#009688] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">¡Registro Completado!</h3>
                <p className="text-sm text-zinc-600">
                  {userType === 'agency'
                    ? 'Hemos recibido los datos de tu agencia. Te contactaremos en breve para configurar tu entorno con marca blanca.'
                    : '¡Bienvenido a Wanderlust! Ya puedes acceder a la plataforma y crear tu primer itinerario.'}
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-block px-6 py-2.5 rounded-xl bg-[#009688] text-white font-bold text-sm"
                  >
                    Ir al panel de acceso
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#009688] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Comienza con Wanderlust</h3>
                    <p className="text-xs text-zinc-500">Elige tu perfil para personalizar tu experiencia</p>
                  </div>
                </div>

                {/* --- SELECTOR: ¿ERES AGENCIA O PARTICULAR? --- */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('agency')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      userType === 'agency'
                        ? 'border-[#009688] bg-teal-50/60 ring-2 ring-[#009688]/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Building2
                        className={`w-5 h-5 ${userType === 'agency' ? 'text-[#009688]' : 'text-zinc-500'}`}
                      />
                      {userType === 'agency' && (
                        <span className="w-2 h-2 rounded-full bg-[#009688]" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-900">Soy Agencia / DMC</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Propuestas B2B, CRM & Stripe</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('particular')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      userType === 'particular'
                        ? 'border-[#009688] bg-teal-50/60 ring-2 ring-[#009688]/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <User
                        className={`w-5 h-5 ${userType === 'particular' ? 'text-[#009688]' : 'text-zinc-500'}`}
                      />
                      {userType === 'particular' && (
                        <span className="w-2 h-2 rounded-full bg-[#009688]" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-900">Soy Particular</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Viajes personales & amigos</div>
                  </button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Nombre completo *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Ej. Laura González"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder={userType === 'agency' ? 'laura@viajeshorizonte.com' : 'laura.gonzalez@gmail.com'}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10"
                    />
                  </div>

                  {userType === 'agency' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Nombre de la Agencia *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.agencyName}
                          onChange={(e) => setRegisterForm({ ...registerForm, agencyName: e.target.value })}
                          placeholder="Horizon Travel"
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10"
                        />
                      </div>
                    </div>
                  )}

                  {userType === 'agency' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Tipo de Agencia</label>
                      <select
                        value={registerForm.agencyType}
                        onChange={(e) => setRegisterForm({ ...registerForm, agencyType: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-900 text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10"
                      >
                        <option value="Agencia Emisora (Viajes a Medida)">Agencia Emisora (Viajes a Medida)</option>
                        <option value="DMC Receptivo / Touroperador">DMC Receptivo / Touroperador</option>
                        <option value="Especialista en Lunas de Miel">Especialista en Lunas de Miel</option>
                        <option value="Agente Independiente">Agente Independiente</option>
                        <option value="MICE / Viajes de Empresa">MICE / Viajes de Empresa</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#009688] hover:bg-[#00796b] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{userType === 'agency' ? 'Registrar mi Agencia gratis' : 'Crear mi cuenta gratis'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
