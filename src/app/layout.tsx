import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Wanderlust | Planificador de Itinerarios de Viaje',
  description: 'Planifica tus viajes ideales. Gestiona tus vuelos, traslados, hoteles, comidas y excursiones día a día con una interfaz premium y moderna.',
  keywords: ['viajes', 'itinerario', 'planificador de viajes', 'vuelos', 'hoteles', 'vietnam', 'transporte', 'excursiones'],
  authors: [{ name: 'Antigravity AI' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 transition-colors duration-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
