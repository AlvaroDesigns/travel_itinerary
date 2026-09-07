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
  Luggage,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  activeMenu?:
    | 'dashboard'
    | 'inicio'
    | 'agente'
    | 'viajes'
    | 'clientes'
    | 'destinos'
    | 'notificaciones'
    | 'compartir'
    | 'servicios'
    | 'configuracion'
    | 'admin'
    | 'admin_usuarios'
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
  const { trips, clients, logout, user } = useTravel();
  const router = useRouter();

  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.email) return user.email.split('@')[0];
    return 'Mi Cuenta';
  };

  const handleCreateTripClick = () => {
    if (onOpenCreateTrip) {
      onOpenCreateTrip();
    } else {
      router.push('/?crear=true');
    }
  };

  return (
    <div
      onClick={() => setIsUserMenuOpen(false)}
      className="flex min-h-screen w-full flex-col bg-[#140b2a] font-sans text-[#18181b] selection:bg-[#009688] selection:text-white"
    >
      {/* ============================================================= */}
      {/* 1. TOP HEADER (Deep Purple hPanel Header with White Logo)     */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-[#140b2a] px-6 text-white border-b border-transparent">
        {/* Left: White Brand Logo + Loyalty/Badge Pill */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center group" aria-label="Inicio">
            <Image
              src="/wanderlust_horizontal_blanco.png"
              alt="Wanderlust"
              width={115}
              height={28}
              style={{ width: 'auto', height: 'auto' }}
              className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Promotional Pill */}
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[#80cbc4] shadow-xs md:flex">
            <Gift className="h-3.5 w-3.5 text-[#26a69a]" />
            <span>Planifica viajes en minutos y comparte con clientes</span>
          </div>
        </div>

        {/* Right Actions: AI Agent Button, Admin, Search & User */}
        <div className="flex items-center gap-3">
          {/* AI Agent Button */}
          <button
            type="button"
            onClick={handleCreateTripClick}
            className="flex items-center gap-1.5 rounded-full border border-[#009688]/60 bg-gradient-to-r from-[#004d40] to-[#00796b] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:border-[#80cbc4] hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#80cbc4]" />
            <span>Agente IA</span>
          </button>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                activeMenu?.startsWith('admin')
                  ? 'border-[#80cbc4] bg-white/20 text-white shadow-xs'
                  : 'border-white/15 bg-white/10 text-[#80cbc4] hover:bg-white/20'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#26a69a]" />
              <span>Admin</span>
            </Link>
          )}

          {/* Search Icon */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
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
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                isUserMenuOpen || activeMenu === 'cuenta'
                  ? 'bg-white text-[#140b2a] ring-2 ring-[#009688] shadow-md'
                  : 'bg-white/10 text-zinc-200 hover:bg-white/20 hover:text-white border border-white/15'
              }`}
            >
              <User className="h-4 w-4" />
            </button>

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-[#eaecf0] bg-white p-2 shadow-2xl text-left animate-scale-in"
              >
                {/* Header: User Name + Role */}
                <div className="px-3 py-3 border-b border-[#eaecf0]">
                  <p className="text-sm font-bold text-[#101828]">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-[#667085] mt-0.5">
                    {user?.role === 'admin' ? 'Administrador' : 'Propietario'}
                  </p>
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

                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#009688]" />
                      <span>Panel Admin</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (trips.length > 0) {
                        router.push(`/publico/${encodeURIComponent(trips[0].id)}`);
                      } else {
                        alert('Crea un viaje para previsualizar el portal del viajero.');
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f4f5f8] hover:text-[#101828] transition-colors"
                  >
                    <Luggage className="h-4 w-4 text-[#667085]" />
                    <span>Portal del viajero</span>
                  </button>
                </div>

                {/* Logout Item */}
                <div className="pt-1 border-t border-[#eaecf0]">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#d92d20] hover:bg-[#fef3f2] transition-colors"
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
      <div className="flex flex-1 overflow-hidden rounded-t-[28px] border-t border-white/10 bg-[#f4f5f8] shadow-2xl">
        {/* ----------------------------------------------------------- */}
        {/* LEFT SIDEBAR                                                */}
        {/* ----------------------------------------------------------- */}
        {!hideSidebar && (
          <aside className="flex h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-[#eaecf0] bg-[#f4f5f8] px-3 py-5 text-[#344054]">
            {/* Primary Travel Navigation Group */}
            <div className="space-y-1">
              {/* Dashboard */}
              <Link
                href="/"
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  activeMenu === 'dashboard' || activeMenu === 'inicio'
                    ? 'bg-white text-[#101828] shadow-xs'
                    : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 text-[#009688]" />
                <span>Dashboard</span>
              </Link>

              {/* Agente IA (Gratis) */}
              <button
                type="button"
                onClick={handleCreateTripClick}
                className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeMenu === 'agente'
                    ? 'bg-white text-[#101828] shadow-xs'
                    : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-[#009688]" />
                  <span>Agente IA</span>
                </div>
                <span className="rounded-full bg-[#e0f2f1] px-1.5 py-0.5 text-[10px] font-bold text-[#00796b]">
                  Gratis
                </span>
              </button>

              {/* Mis Viajes */}
              <Link
                href="/viajes"
                className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  activeMenu === 'viajes' || activeMenu === 'configuracion'
                    ? 'bg-white text-[#101828] shadow-xs'
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

              {/* Usuarios */}
              {user?.role === 'admin' && (
                <Link
                  href="/admin/usuarios"
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    activeMenu === 'admin_usuarios'
                      ? 'bg-white text-[#101828] shadow-xs font-bold'
                      : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                  }`}
                >
                  <UserCog className="h-4 w-4 text-[#009688]" />
                  <span>Usuarios</span>
                </Link>
              )}

              {/* Destinos */}
              <Link
                href="/"
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  activeMenu === 'destinos'
                    ? 'bg-white text-[#101828] shadow-xs'
                    : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                }`}
              >
                <Globe className="h-4 w-4 text-[#667085]" />
                <span>Destinos & Rutas</span>
              </Link>

              {/* Notificaciones & Emails */}
              <Link
                href="/"
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  activeMenu === 'notificaciones'
                    ? 'bg-white text-[#101828] shadow-xs'
                    : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                }`}
              >
                <Mail className="h-4 w-4 text-[#667085]" />
                <span>Notificaciones de viaje</span>
              </Link>

              {/* Compartir / Para clientes */}
              <Link
                href="/"
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  activeMenu === 'compartir'
                    ? 'bg-white text-[#101828] shadow-xs'
                    : 'text-[#475467] hover:bg-white/60 hover:text-[#101828]'
                }`}
              >
                <Share2 className="h-4 w-4 text-[#667085]" />
                <span>Enlaces públicos</span>
              </Link>
            </div>

            {/* Section: Aplicaciones de Itinerarios */}
            <div className="mt-6 pt-4 border-t border-[#e4e7ec]">
              <button
                type="button"
                onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                className="flex w-full items-center justify-between px-2 pb-2 text-[11px] font-semibold text-[#667085] hover:text-[#101828] cursor-pointer"
              >
                <span>Herramientas Wanderlust</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    isToolsExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {isToolsExpanded && (
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={handleCreateTripClick}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-xs text-[#475467] hover:bg-white/60 hover:text-[#009688] cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-[#009688]" />
                    <span>Generador de Itinerarios IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-xs text-[#475467] hover:bg-white/60 hover:text-[#009688] cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[#667085]" />
                    <span>Exportador PDF & Vouchers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-xs text-[#475467] hover:bg-white/60 hover:text-[#009688] cursor-pointer"
                  >
                    <TrendingUp className="h-4 w-4 text-[#667085]" />
                    <span>Control de Presupuestos</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ----------------------------------------------------------- */}
        {/* MAIN CONTENT CANVAS                                         */}
        {/* ----------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
