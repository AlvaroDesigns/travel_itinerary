'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronLeft, FileText, LogOut, ShieldCheck, Users } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">
      <header className="flex h-9 items-center justify-between bg-[#1d2327] px-4 text-xs text-white">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-3.5 w-3.5" /> Wanderlust · Administración</div>
        <div className="flex items-center gap-3"><span className="hidden text-zinc-300 sm:inline">{currentUser.email}</span><button type="button" onClick={() => void logout()} className="flex items-center gap-1.5 text-zinc-200 transition-colors hover:text-white"><LogOut className="h-3.5 w-3.5" /> Salir</button></div>
      </header>
      <div className="flex min-h-[calc(100vh-2.25rem)]">
        <aside className="hidden w-56 shrink-0 bg-[#1d2327] py-5 text-sm text-zinc-300 lg:block">
          <div className="border-b border-white/10 px-5 pb-5"><Image src="/wanderlust_horizontal_blanco.png" alt="Wanderlust" width={144} height={36} className="h-8 w-auto" /></div>
          <nav className="mt-4 space-y-1 px-2">
            <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/10"><ChevronLeft className="h-4 w-4" /> Mis viajes</Link>
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${isActive ? 'bg-[#2271b1] font-semibold text-white' : 'hover:bg-white/10'}`}><Icon className="h-4 w-4" /> {label}</Link>;
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
