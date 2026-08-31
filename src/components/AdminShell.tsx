'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  FileText,
  LogOut,
  Menu,
  Users,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/auth';
import { useTravel } from '@/context/TravelContext';

const navItems = [
  { href: '/admin', label: 'Escritorio', icon: BarChart3, exact: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/paginas', label: 'Páginas', icon: FileText },
];

export function AdminShell({
  currentUser,
  children,
}: {
  currentUser: AuthenticatedUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useTravel();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  const navigation = (
    <nav aria-label="Navegación administrativa" className="space-y-1.5">
      <Link
        href="/"
        onClick={closeMobileNav}
        className="mb-5 flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2 text-xs font-bold text-zinc-700 transition-all hover:border-zinc-900 hover:bg-white hover:text-zinc-950"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Mis viajes</span>
      </Link>
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Gestión
      </p>
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={closeMobileNav}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              active
                ? 'bg-[#009688] text-white shadow-sm shadow-teal-500/20'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Sticky Dark Glass Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 text-white shadow-sm backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir navegación administrativa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" aria-label="Wanderlust Administración" className="flex min-w-0 items-center gap-2">
            <Image
              src="/wanderlust_horizontal_blanco.png"
              alt="Wanderlust"
              width={216}
              height={54}
              priority
              className="h-8 w-auto object-contain"
            />
            <span className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3 text-amber-300" />
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-56 truncate text-xs font-semibold text-white">
              {currentUser.email}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Administrador
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-zinc-200/80 bg-white px-3 py-6 lg:block">
          {navigation}
          <div className="absolute inset-x-3 bottom-5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600">
            <p className="font-bold text-zinc-900">Panel de control</p>
            <p className="mt-1 text-zinc-500">
              Administra usuarios, páginas y configuración general.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={closeMobileNav}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col bg-white px-4 py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <Image
                src="/wanderlust_horizontal_negro.png"
                alt="Wanderlust"
                width={152}
                height={38}
                className="h-8 w-auto object-contain"
              />
              <button
                type="button"
                aria-label="Cerrar navegación"
                onClick={closeMobileNav}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </div>
  );
}
