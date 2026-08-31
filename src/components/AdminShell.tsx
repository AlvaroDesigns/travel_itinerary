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
} from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/auth';
import { useTravel } from '@/context/TravelContext';

const navItems = [
  { href: '/admin', label: 'Escritorio', icon: BarChart3, exact: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/paginas', label: 'Páginas', icon: FileText },
];

export function AdminShell({ currentUser, children }: { currentUser: AuthenticatedUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useTravel();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  const navigation = (
    <nav aria-label="Navegación administrativa" className="space-y-1.5">
      <Link
        href="/"
        onClick={closeMobileNav}
        className="mb-5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Mis viajes
      </Link>
      <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Gestionar</p>
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={closeMobileNav}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${active ? 'bg-violet-100 text-violet-800 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${active ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-violet-600'}`}>
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#29135c] px-4 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir navegación administrativa"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-violet-100 transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" aria-label="Wanderlust Administración" className="flex min-w-0 items-center">
            <Image src="/wanderlust_horizontal_blanco.png" alt="Wanderlust" width={154} height={38} priority className="h-7 w-auto object-contain" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-56 truncate text-xs font-semibold text-white">{currentUser.email}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-violet-200">Administrador</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold text-violet-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200/80 bg-white px-3 py-7 lg:block">
          <div className="mb-8 px-3"><Image src="/wanderlust_horizontal_negro.png" alt="Wanderlust" width={152} height={38} className="h-8 w-auto" /></div>
          {navigation}
          <div className="absolute inset-x-3 bottom-5 rounded-2xl bg-violet-50 p-4 text-xs leading-relaxed text-violet-800">
            <p className="font-bold">Panel de control</p>
            <p className="mt-1 text-violet-700">Gestiona el contenido y la comunidad de tu plataforma.</p>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">{children}</main>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Cerrar navegación" onClick={closeMobileNav} className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]" />
          <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white px-4 py-5 shadow-2xl">
            <div className="mb-7 flex items-center justify-between px-2">
              <Image src="/wanderlust_horizontal_negro.png" alt="Wanderlust" width={152} height={38} className="h-8 w-auto" />
              <button type="button" aria-label="Cerrar navegación" onClick={closeMobileNav} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </div>
  );
}
