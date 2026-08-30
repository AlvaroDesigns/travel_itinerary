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
  description: 'Planifica tus viajes ideales. Gestiona tus vuelos, traslados, hoteles, comidas y excursiones día a día con una interfaz elegante y minimalista.',
  keywords: ['viajes', 'itinerario', 'planificador de viajes', 'vuelos', 'hoteles', 'vietnam', 'transporte', 'excursiones'],
  authors: [{ name: 'Wanderlust' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/wanderlust_icono_negro.png', type: 'image/png' },
    ],
    apple: '/wanderlust_icono_negro.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-ink-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
