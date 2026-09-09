import type { Metadata } from 'next';
import { Outfit, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Wanderlust | Planificador de Itinerarios de Viaje',
  description: 'Planifica tus viajes ideales. Gestiona tus vuelos, traslados, hoteles, comidas y excursiones día a día con una interfaz elegante y minimalista.',
  keywords: ['viajes', 'itinerario', 'planificador de viajes', 'vuelos', 'hoteles', 'vietnam', 'transporte', 'excursiones'],
  authors: [{ name: 'Wanderlust' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/wanderlust_icono_negro.png', type: 'image/png' },
    ],
    apple: '/wanderlust_icono_negro.png',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-ink-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
