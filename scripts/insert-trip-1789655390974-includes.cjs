const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function insertTripIncludes() {
  const details = {
    title: 'Qué incluye y qué no incluye',
    isIncludesBlock: true,
    description: 'Vuelo internacional, traslados privados, hoteles seleccionados, visitas guiadas y seguro completo.',
    includes: [
      'Vuelo Madrid - Hanói / Ho Chi Minh - Madrid con la compañía aérea Etihad Airways',
      'Traslados aeropuerto - hotel - aeropuerto en vehículo privado con aire acondicionado',
      'Alojamiento en hoteles previstos o similares (Soleil Boutique Hanoi, Viettrekking Sapa, Tam Coc Serenity...)',
      'Vuelos internos según programa (Hanói - Da Nang - Ho Chi Minh con Vietnam Airlines)',
      'Tren nocturno Hanói - Sapa y autobús cama confortable a Ninh Binh',
      'Visitas y excursiones mencionadas en el itinerario (Ha Long, Tam Coc, Fansipan, Hội An)',
      'Guía acompañante de habla hispana durante todo el circuito',
      'Seguro de asistencia médica y cobertura de equipaje en viaje'
    ],
    excludes: [
      'Visado de entrada a Vietnam (si aplica para estancias superiores a 45 días)',
      'Propinas para guías y chóferes (a discreción del viajero)',
      'Bebidas y comidas no especificadas expresamente en el itinerario',
      'Gastos personales y compras extraordinarias'
    ],
    departureCities: 'Madrid, Barcelona, Valencia, Bilbao, Málaga, Palma de Mallorca, Alicante, Sevilla, Oporto, Lisboa',
    categories: [
      'Cultural',
      'Naturaleza & Aventura',
      'Confirmación inmediata',
      'Mejor Precio Garantizado'
    ],
    connectedDestinations: [
      'Hanói',
      'Sapa',
      'Bahía de Ha Long',
      'Ninh Binh',
      'Huế',
      'Hội An',
      'Da Nang',
      'Ho Chi Minh (Saigón)'
    ]
  };

  await pool.query(
    `INSERT INTO activities (id, trip_id, type, date, time, price, details)
     VALUES ('act-trip-1789655390974-incluye', 'trip-1789655390974', 'conditions', '2026-09-17', '18:00', 0, $1)
     ON CONFLICT (id) DO UPDATE 
     SET trip_id = 'trip-1789655390974',
         type = 'conditions',
         date = '2026-09-17',
         time = '18:00',
         price = 0,
         details = $1`,
    [JSON.stringify(details)]
  );

  console.log('✅ Successfully inserted act-trip-1789655390974-incluye into activities table');
  await pool.end();
}

insertTripIncludes().catch(err => {
  console.error(err);
  process.exit(1);
});
