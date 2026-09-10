'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTravel } from '@/context/TravelContext';
import {
  Search,
  Plus,
  Home as HomeIcon,
  Sparkles,
  Globe,
  Mail,
  ShieldCheck,
  Plane,
  User,
  Users,
  UserCog,
  LogOut,
  Gift,
  ChevronDown,
  FileText,
  TrendingUp,
  Share2,
  BarChart3,
  LayoutDashboard,
  Briefcase,
  Menu,
  X,
  Settings,
  HelpCircle,
  MessageSquare,
  Printer,
  Download,
  Check,
} from 'lucide-react';
import { UserAvatarDisplay } from '@/components/AvatarPickerModal';

interface DashboardShellProps {
  children: React.ReactNode;
  activeMenu?:
    | 'dashboard'
    | 'inicio'
    | 'agente'
    | 'viajes'
    | 'clientes'
    | 'oportunidades'
    | 'destinos'
    | 'notificaciones'
    | 'compartir'
    | 'exportar_pdf'
    | 'servicios'
    | 'configuracion'
    | 'admin'
    | 'admin_usuarios'
    | 'usuarios'
    | 'cuenta';
  onOpenCreateTrip?: () => void;
  hideSidebar?: boolean;
}

export function DashboardShell({
  children,
  activeMenu = 'viajes',
  onOpenCreateTrip,
  hideSidebar = false,
}: DashboardShellProps) {
  const { trips, clients, opportunities, logout, user } = useTravel();
  const router = useRouter();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.email) return user.email.split('@')[0];
    return 'Mi Cuenta';
  };

  const handleCreateTripClick = () => {
    if (onOpenCreateTrip) {
      onOpenCreateTrip();
    } else {
      router.push('/viajes?crear=true');
    }
  };

  const renderNavLinks = (onItemClick?: () => void) => (
    <>
      {/* Primary Travel Navigation Group */}
      <div className="space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'dashboard' || activeMenu === 'inicio'
              ? 'bg-white text-[#101828] shadow-xs font-bold'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 text-[#009688]" />
          <span>Dashboard</span>
        </Link>

        {/* Mis Viajes */}
        <Link
          href="/viajes"
          onClick={onItemClick}
          className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'viajes'
              ? 'bg-white text-[#101828] shadow-xs font-bold'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Plane className="h-4 w-4 text-[#009688]" />
            <span>Mis viajes</span>
          </div>
          <span className="rounded-full bg-[#e0f2f1] px-2 py-0.5 text-[10px] font-bold text-[#00796b]">
            {trips.length}
          </span>
        </Link>

        {/* Clientes */}
        <Link
          href="/clientes"
          onClick={onItemClick}
          className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'clientes'
              ? 'bg-white text-[#101828] shadow-xs'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[#009688]" />
            <span>Clientes</span>
          </div>
          <span className="rounded-full bg-[#e0f2f1] px-2 py-0.5 text-[10px] font-bold text-[#00796b]">
            {clients.length}
          </span>
        </Link>

        {/* Oportunidades (CRM) */}
        <Link
          href="/oportunidades"
          onClick={onItemClick}
          className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'oportunidades'
              ? 'bg-white text-[#101828] shadow-xs'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-[#009688]" />
            <span>Oportunidades</span>
          </div>
          {opportunities.length > 0 && (
            <span className="rounded-full bg-[#e0f2f1] px-2 py-0.5 text-[10px] font-bold text-[#00796b]">
              {opportunities.length}
            </span>
          )}
        </Link>

        {/* Usuarios */}
        {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'superuser' || (user?.tenantId && user?.tenantId !== 'particular')) && (
          <Link
            href="/usuarios"
            onClick={onItemClick}
            className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
              activeMenu === 'usuarios' || activeMenu === 'admin_usuarios'
                ? 'bg-white text-[#101828] shadow-xs font-bold'
                : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
            }`}
          >
            <UserCog className="h-4 w-4 text-[#009688]" />
            <span>Usuarios</span>
          </Link>
        )}

        {/* Compartir / Enlaces públicos */}
        <Link
          href="/enlaces-publicos"
          onClick={onItemClick}
          className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'compartir'
              ? 'bg-white text-[#101828] shadow-xs font-bold'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <Share2 className="h-4 w-4 text-[#009688]" />
          <span>Enlaces públicos</span>
        </Link>

        {/* Exportador PDF */}
        <Link
          href="/exportador-pdf"
          onClick={onItemClick}
          className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
            activeMenu === 'exportar_pdf'
              ? 'bg-white text-[#101828] shadow-xs font-bold'
              : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-[#009688]" />
            <span>Exportador PDF</span>
          </div>
          <span className="rounded-full bg-[#e0f2f1] px-1.5 py-0.5 text-[10px] font-bold text-[#00796b]">
            PDF
          </span>
        </Link>
      </div>

      {/* Section: Esta cuenta */}
      <div className="mt-6 pt-4 border-t border-[#e4e7ec]">
        <p className="px-2 pb-2 text-[11px] font-bold text-[#667085] uppercase tracking-wider">
          Esta cuenta
        </p>
        <div className="space-y-0.5">
          {/* Configuración */}
          <Link
            href="/cuenta"
            onClick={onItemClick}
            className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
              activeMenu === 'cuenta' || activeMenu === 'configuracion'
                ? 'bg-white text-[#101828] shadow-xs'
                : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-[#009688]" />
              <span>Configuración</span>
            </div>
          </Link>

          {/* Centro de ayuda */}
          <button
            type="button"
            onClick={() => {
              onItemClick?.();
              setIsHelpModalOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-[#475467] hover:bg-white/60 hover:text-[#101828] transition cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-[#009688]" />
            <span>Centro de ayuda</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      onClick={() => {
        setIsUserMenuOpen(false);
      }}
      className="flex h-screen h-[100dvh] w-full flex-col bg-[#140b2a] font-sans text-[#18181b] selection:bg-[#009688] selection:text-white overflow-hidden"
    >
      {/* ============================================================= */}
      {/* 1. TOP HEADER (Deep Purple hPanel Header with White Logo)     */}
      {/* ============================================================= */}
      <header className="shrink-0 z-40 flex h-16 w-full items-center justify-between bg-[#140b2a] px-3 sm:px-6 text-white border-b border-transparent">
        {/* Left: Mobile Menu Toggle + White Brand Logo + Loyalty Pill */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!hideSidebar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileSidebarOpen(!isMobileSidebarOpen);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white hover:bg-white/10 lg:hidden cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Link href="/viajes" className="flex items-center group" aria-label="Inicio">
            <Image
              src="/wanderlust_horizontal_blanco.png"
              alt="Wanderlust"
              width={115}
              height={28}
              style={{ width: 'auto', height: 'auto' }}
              className="h-5 sm:h-6 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Promotional Pill */}
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[#80cbc4] shadow-xs md:flex">
            <Gift className="h-3.5 w-3.5 text-[#26a69a]" />
            <span>Planifica viajes en minutos y comparte con clientes</span>
          </div>
        </div>

        {/* Right Actions: Role Badge, Search & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <Link
              href={
                user.role === 'admin' || user.role === 'superadmin' || user.role === 'superuser' || (user.tenantId && user.tenantId !== 'particular')
                  ? '/usuarios'
                  : '/cuenta'
              }
              className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                activeMenu === 'usuarios' || activeMenu?.startsWith('admin')
                  ? 'border-[#80cbc4] bg-white/20 text-white shadow-xs'
                  : 'border-white/15 bg-white/10 text-[#80cbc4] hover:bg-white/20'
              }`}
            >
              {user.role === 'superuser' || user.role === 'superadmin' || user.role === 'admin' ? (
                <ShieldCheck className="h-3.5 w-3.5 text-[#26a69a]" />
              ) : (
                <User className="h-3.5 w-3.5 text-[#26a69a]" />
              )}
              <span>
                {user.role === 'superuser' || user.role === 'superadmin'
                  ? 'SUPERUSER'
                  : user.role === 'admin'
                  ? 'Admin'
                  : 'User'}
              </span>
            </Link>
          )}

          {/* Search Icon */}
          <button
            type="button"
            onClick={() => router.push('/viajes')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* User Profile Dropdown Button & Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsUserMenuOpen(!isUserMenuOpen);
              }}
              title="Perfil de usuario"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer overflow-hidden ${
                isUserMenuOpen || activeMenu === 'cuenta'
                  ? 'ring-2 ring-[#009688] shadow-md'
                  : 'hover:ring-2 hover:ring-white/40'
              }`}
            >
              <UserAvatarDisplay
                avatar={user?.avatar || 'traveler-girl-teal'}
                name={getUserDisplayName()}
                size="sm"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-[#eaecf0] bg-white p-2 shadow-2xl text-left animate-scale-in"
              >
                {/* Header: User Avatar + Name + Role + Agency */}
                <div className="px-3 py-3 border-b border-[#eaecf0] flex items-center gap-3">
                  <UserAvatarDisplay
                    avatar={user?.avatar || 'traveler-girl-teal'}
                    name={getUserDisplayName()}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#101828] truncate">
                      {user?.name || getUserDisplayName()}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-[#00796b]">
                        {user?.role === 'superuser' || user?.role === 'superadmin'
                          ? 'SUPERUSER'
                          : user?.role === 'admin'
                          ? 'Administrador'
                          : 'Usuario'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="pt-2 pb-1 space-y-0.5">
                  <Link
                    href="/cuenta"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                  >
                    <User className="h-4 w-4 text-[#667085]" />
                    <span>Mi cuenta</span>
                  </Link>

                  {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'superuser' || (user?.tenantId && user?.tenantId !== 'particular')) && (
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
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. BODY LAYOUT: CURVED TOP BORDER                             */}
      {/* ============================================================= */}
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#f4f5f8] shadow-2xl relative">
        {/* ----------------------------------------------------------- */}
        {/* DESKTOP SIDEBAR (Visible on lg+)                            */}
        {/* ----------------------------------------------------------- */}
        {!hideSidebar && (
          <aside className="hidden lg:flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-[#eaecf0] bg-[#f4f5f8] px-3 py-5 text-[#344054]">
            {renderNavLinks()}
          </aside>
        )}

        {/* ----------------------------------------------------------- */}
        {/* MOBILE OFF-CANVAS DRAWER (Visible when open on <lg)        */}
        {/* ----------------------------------------------------------- */}
        {!hideSidebar && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Slide-out Menu Panel */}
            <aside
              className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-[#f4f5f8] p-4 shadow-2xl overflow-y-auto border-r border-[#eaecf0] animate-slide-right"
            >
              <div className="flex items-center justify-between pb-4 mb-2 border-b border-[#eaecf0]">
                <div className="flex items-center gap-2">
                  <Image
                    src="/wanderlust_horizontal_negro.png"
                    alt="Wanderlust"
                    width={120}
                    height={28}
                    style={{ width: 'auto', height: 'auto' }}
                    className="h-6 w-auto object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 pb-6">
                {renderNavLinks(() => setIsMobileSidebarOpen(false))}
              </div>
            </aside>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* MAIN CONTENT CANVAS (Full width on mobile, fills space)     */}
        {/* ----------------------------------------------------------- */}
        <main className="w-full flex-1 min-h-0 overflow-y-auto px-3 py-5 sm:px-6 lg:px-8 sm:py-6">
          {children}
        </main>
      </div>

      {/* ============================================================= */}
      {/* 3. HELP & SUPPORT MODAL                                       */}
      {/* ============================================================= */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsHelpModalOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-scale-in z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-[#009688]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Centro de Ayuda</h3>
                  <p className="text-xs text-zinc-500">Asistencia técnica y recursos de Wanderlust</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              {/* Contact Support Card */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                <p className="font-bold text-teal-950">¿Necesitas soporte técnico?</p>
                <p className="mt-1 text-teal-800">
                  Nuestro equipo está disponible para ayudarte con configuraciones de dominio, pagos o itinerarios.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="mailto:viajes@travel.alvarodesigns.com"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#009688] px-3 py-2 font-bold text-white shadow-xs hover:bg-[#00796b] transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>viajes@travel.alvarodesigns.com</span>
                  </a>
                </div>
              </div>

              {/* Quick FAQs */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Preguntas Frecuentes</h4>
                
                <div className="rounded-xl border border-zinc-200/80 p-3 bg-zinc-50/50">
                  <p className="font-bold text-zinc-900">¿Cómo compartir un itinerario?</p>
                  <p className="mt-1 text-zinc-600 leading-relaxed">
                    Entra en tu viaje o en la sección <strong>Enlaces públicos</strong> y copia el enlace seguro con token para tu cliente.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200/80 p-3 bg-zinc-50/50">
                  <p className="font-bold text-zinc-900">¿Cómo configurar pagos?</p>
                  <p className="mt-1 text-zinc-600 leading-relaxed">
                    Accede a <strong>Configuración &gt; Métodos de Pago</strong> para conectar Stripe Connect o tu pasarela Redsys.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200/80 p-3 bg-zinc-50/50">
                  <p className="font-bold text-zinc-900">¿Cómo programar avisos automáticos?</p>
                  <p className="mt-1 text-zinc-600 leading-relaxed">
                    Dentro de cada viaje, accede a <strong>Configuración del Viaje</strong> para activar recordatorios y cuenta atrás con hora exacta.
                  </p>
                </div>
              </div>

              {/* Legal & Terms Link */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-zinc-500">¿Consultar términos legales?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpModalOpen(false);
                    router.push('/cuenta?tab=legal');
                  }}
                  className="font-bold text-[#009688] hover:underline cursor-pointer"
                >
                  Ver Términos & Legal &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

