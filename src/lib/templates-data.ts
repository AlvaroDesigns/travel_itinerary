export interface TripTemplate {
  id: string;
  code: string;
  title: string;
  category: string;
  durationDays: number;
  estimatedBudget: number;
  imageUrl: string;
  description: string;
  activities: {
    type: 'flight' | 'hotel' | 'transfer' | 'excursion' | 'food';
    dayOffset: number; // 0 for day 1, 1 for day 2, etc.
    time: string;
    title: string;
    price: number;
    details: Record<string, any>;
  }[];
}

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'template-villa-punta-mita',
    code: 'B8YI0FHYVD',
    title: 'Alquiler vacacional · Villa Punta Mita',
    category: 'Villas & Lujo',
    durationDays: 7,
    estimatedBudget: 4800,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    description: 'Estancia exclusiva en villa privada con chef, acceso directo a la playa y excursión en catamarán privado.',
    activities: [
      {
        type: 'hotel',
        dayOffset: 0,
        time: '15:00',
        title: 'Check-in Villa Punta Mita',
        price: 3200,
        details: { hotelName: 'Villa Escondida Punta Mita', address: 'Bahía de Banderas, Nayarit', roomType: 'Villa 4 suites con piscina infinita' },
      },
      {
        type: 'food',
        dayOffset: 0,
        time: '20:30',
        title: 'Cena de bienvenida con Chef Privado',
        price: 280,
        details: { restaurantName: 'Cena Privada en Terraza', location: 'Villa Punta Mita', notes: 'Menú degustación de mariscos frescos y cata de tequila' },
      },
      {
        type: 'excursion',
        dayOffset: 2,
        time: '10:00',
        title: 'Navegación privada a Islas Marietas',
        price: 650,
        details: { location: 'Islas Marietas', title: 'Tour en catamarán con snorkel en Playa del Amor' },
      },
    ],
  },
  {
    id: 'template-camino-santiago',
    code: '9DVFY82FC2',
    title: 'Camino de Santiago Francés',
    category: 'Senderismo & Cultura',
    durationDays: 6,
    estimatedBudget: 950,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Los últimos 100 km desde Sarria a Santiago de Compostela con traslados de equipaje y hoteles con encanto.',
    activities: [
      {
        type: 'transfer',
        dayOffset: 0,
        time: '09:00',
        title: 'Traslado Santiago - Sarria y entrega de credenciales',
        price: 60,
        details: { from: 'Aeropuerto de Santiago', to: 'Sarria (Inicio)', vehicleType: 'Minivan privada' },
      },
      {
        type: 'hotel',
        dayOffset: 0,
        time: '16:00',
        title: 'Noche en Sarria · Hotel Alfonso IX',
        price: 110,
        details: { hotelName: 'Hotel Alfonso IX', address: 'Sarria, Lugo', roomType: 'Habitación Doble Superior' },
      },
      {
        type: 'excursion',
        dayOffset: 1,
        time: '08:00',
        title: 'Etapa 1: Sarria - Portomarín (22 km)',
        price: 0,
        details: { location: 'Portomarín', title: 'Caminata entre robledales y aldeas románicas' },
      },
      {
        type: 'hotel',
        dayOffset: 5,
        time: '14:00',
        title: 'Llegada a Santiago y Noche en Parador de los Reyes Católicos',
        price: 240,
        details: { hotelName: 'Parador Hostal Dos Reis Católicos', address: 'Praza do Obradoiro, Santiago', roomType: 'Habitación Histórica' },
      },
    ],
  },
  {
    id: 'template-europa-verano',
    code: 'EOGNJV4993',
    title: 'Circuito Europa en Verano',
    category: 'Circuito Clásico',
    durationDays: 10,
    estimatedBudget: 3400,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    description: 'Lo mejor de París, Suiza y Roma en un viaje inolvidable con trenes de alta velocidad y visitas guiadas.',
    activities: [
      {
        type: 'flight',
        dayOffset: 0,
        time: '09:30',
        title: 'Vuelo directo a París Charles de Gaulle',
        price: 320,
        details: { airline: 'Air France', flightNumber: 'AF1400', origin: 'Madrid (MAD)', destination: 'París (CDG)' },
      },
      {
        type: 'hotel',
        dayOffset: 0,
        time: '15:00',
        title: 'Hotel Le Marais París',
        price: 780,
        details: { hotelName: 'Hôtel Le Marais Boutique', address: '3eme Arrondissement, París', roomType: 'Deluxe Queen' },
      },
      {
        type: 'excursion',
        dayOffset: 1,
        time: '19:30',
        title: 'Crucero por el Sena & Torre Eiffel iluminación',
        price: 130,
        details: { location: 'Río Sena, París', title: 'Paseo en barco con copa de champán' },
      },
    ],
  },
  {
    id: 'template-paris-corporativo',
    code: 'PS1P3CG533',
    title: 'Convención de París · Viajes MICE',
    category: 'Corporativo & MICE',
    durationDays: 4,
    estimatedBudget: 2200,
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
    description: 'Organización corporativa integral: vuelos business, traslados ejecutivos, hotel céntrico y cena de gala.',
    activities: [
      {
        type: 'hotel',
        dayOffset: 0,
        time: '14:00',
        title: 'Pullman Paris Tour Eiffel',
        price: 900,
        details: { hotelName: 'Pullman Paris Tour Eiffel', address: '18 Avenue de Suffren, París', roomType: 'Executive Room con sala de conferencias' },
      },
      {
        type: 'food',
        dayOffset: 1,
        time: '21:00',
        title: 'Cena de Gala & Entrega de Premios en Museo',
        price: 450,
        details: { restaurantName: 'Le Grand Colbert Privé', location: 'Galerie Colbert, París', notes: 'Catering exclusivo para 50 asistentes' },
      },
    ],
  },
  {
    id: 'template-servicios-sueltos',
    code: 'R8XFO46M5J',
    title: 'Cotización servicios sueltos',
    category: 'A Medida',
    durationDays: 5,
    estimatedBudget: 1250,
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    description: 'Estructura flexible para cotizar vuelos, noches de hotel y seguro de viaje de forma modular.',
    activities: [
      {
        type: 'flight',
        dayOffset: 0,
        time: '11:15',
        title: 'Vuelo Ida y Vuelta',
        price: 420,
        details: { airline: 'Iberia', flightNumber: 'IB3100', origin: 'Madrid (MAD)', destination: 'Roma (FCO)' },
      },
      {
        type: 'transfer',
        dayOffset: 0,
        time: '14:30',
        title: 'Alquiler de coche categoría SUV',
        price: 290,
        details: { vehicleType: 'SUV Automático', provider: 'Hertz / Sixt', pickupLocation: 'Aeropuerto Fiumicino' },
      },
    ],
  },
  {
    id: 'template-disneyland-paris',
    code: 'TLPS6I17S3',
    title: 'Disneyland Paris Mágico',
    category: 'Familiar & Parques',
    durationDays: 4,
    estimatedBudget: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80',
    description: 'Estancia mágica con pases multidía para Disneyland Park y Walt Disney Studios, encuentros con personajes.',
    activities: [
      {
        type: 'hotel',
        dayOffset: 0,
        time: '15:00',
        title: 'Disney Hotel New York - The Art of Marvel',
        price: 1300,
        details: { hotelName: 'Disney Hotel New York', address: 'Marne-la-Vallée, París', roomType: 'Superior Room temático Marvel' },
      },
      {
        type: 'excursion',
        dayOffset: 1,
        time: '08:30',
        title: 'Pase 3 Días 2 Parques + Disney Premier Access',
        price: 680,
        details: { location: 'Disneyland Paris', title: 'Acceso prioritario a atracciones principales y espectáculos nocturnos' },
      },
    ],
  },
];
