'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTravel } from '@/context/TravelContext';
import {
  Plus,
  Search,
  Calendar,
  Euro,
  Trash2,
  Compass,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  LogOut,
} from 'lucide-react';

const PRESET_IMAGES = [
  {
    name: 'Vietnam',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'París',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Tokio',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Roma',
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Nueva York',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  const { trips, addTrip, deleteTrip, logout, user, isLoading } = useTravel();
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [customImage, setCustomImage] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-2 animate-bounce">
          <Compass className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-extrabold text-slate-400 tracking-widest uppercase">Cargando tus aventuras...</span>
        </div>
      </div>
    );
  }

  // Filtered trips
  const filteredTrips = trips.filter((trip) =>
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDays = (start: string, end: string) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
  };

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const s = new Date(start);
    const e = new Date(end);

    const sDay = s.getDate();
    const sMonth = months[s.getMonth()];
    const eDay = e.getDate();
    const eMonth = months[e.getMonth()];
    const eYear = e.getFullYear();

    if (s.getMonth() === e.getMonth()) {
      return `${sDay} -> ${eDay} ${sMonth} ${eYear}`;
    }
    return `${sDay} ${sMonth} -> ${eDay} ${eMonth} ${eYear}`;
  };

  const handleSubmit = () => {
    if (!name || !startDate || !endDate || !budget) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    const finalImage = customImage.trim() !== '' ? customImage : imageUrl;

    addTrip({
      name,
      startDate,
      endDate,
      budget: parseFloat(budget),
      imageUrl: finalImage,
      description,
      notes,
    });

    // Reset Form
    setName('');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setImageUrl(PRESET_IMAGES[0].url);
    setCustomImage('');
    setDescription('');
    setNotes('');
    
    setIsOpen(false);
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              Wanderlust
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Conectado como</span>
                <span className="text-xs font-bold text-indigo-300">{user.email}</span>
              </div>
              <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 hover:text-red-400 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Banner Superior / Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-12 md:py-24 text-white">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-cyan-600/30 blur-3xl"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-sm border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
              <span>Tu compañero de aventuras</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-6xl bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent font-sans">
              Wanderlust
            </h1>
            <p className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-slate-300">
              Planifica tus itinerarios paso a paso. Organiza tus vuelos, traslados, alojamiento y actividades diarias de forma visual e intuitiva.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        {/* Control Bar: Search & Add */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm h-10 text-slate-700 font-medium transition-all"
              placeholder="Buscar un viaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
          </div>
          
          <button
            id="btn-add-trip"
            className="w-full sm:w-auto font-semibold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Añadir Viaje
          </button>
        </div>

        {/* Trips Grid */}
        <div className="mt-8">
          {filteredTrips.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl py-16 flex flex-col items-center justify-center text-center p-6 shadow-none">
              <Compass className="w-16 h-16 text-slate-400 stroke-[1.5] mb-4 animate-spin-slow" />
              <h3 className="text-xl font-bold text-slate-700 font-sans">No hay viajes planificados</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                {searchQuery 
                  ? 'No se encontraron viajes con ese nombre. Prueba con otra búsqueda.'
                  : 'Aún no has agregado ningún viaje. ¡Haz clic en "Añadir Viaje" para comenzar tu aventura!'}
              </p>
              {!searchQuery && (
                <button 
                  className="mt-6 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-md"
                  onClick={() => setIsOpen(true)}
                >
                  Crear mi primer viaje
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => {
                const totalDays = calculateDays(trip.startDate, trip.endDate);
                return (
                  <div 
                    key={trip.id} 
                    className="group border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between rounded-2xl bg-white shadow-sm"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={trip.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                        alt={trip.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent"></div>
                      
                      {/* Delete button top right */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="bg-white/95 border border-red-100 hover:bg-red-500 hover:text-white min-w-8 w-8 h-8 rounded-lg flex items-center justify-center text-red-500 transition-colors cursor-pointer"
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que quieres eliminar el viaje a "${trip.name}"? Se perderán todos sus itinerarios.`)) {
                              deleteTrip(trip.id);
                            }
                          }}
                          title="Eliminar Viaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Header content overlay */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/60 backdrop-blur-sm border border-cyan-500/20">
                            {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
                          </span>
                          <h2 className="text-xl font-bold text-white mt-1.5 drop-shadow-sm line-clamp-1 font-sans">
                            {trip.name}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                              Presupuesto: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(trip.budget)}
                            </span>
                          </div>
                        </div>

                        {trip.description && (
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-sans">
                            {trip.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                        <Link href={`/viaje/${trip.id}`} className="w-full">
                          <button
                            className="w-full font-semibold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 rounded-xl bg-indigo-50 text-indigo-700 py-2 h-10 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-sm font-sans"
                          >
                            Ver Itinerario
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Custom Modal: Añadir Viaje */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-sans">
                <Compass className="text-indigo-500 w-6 h-6" />
                Crear Nuevo Viaje
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Destino *</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm h-10 text-slate-700 font-medium transition-all"
                  placeholder="Ej. París, Vietnam Mágico, Safari en Kenia..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Inicio *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Fin *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuesto (en Euros, ej: 2500 para 2.500 €) *</label>
                <div className="relative w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">€</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-sm h-10 text-slate-700 font-medium transition-all"
                    placeholder="Ej. 2500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Imagen de Portada (Preestablecida)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => {
                        setImageUrl(img.url);
                        setCustomImage('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        imageUrl === img.url && customImage === ''
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  O introduce una URL de imagen personalizada
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 text-slate-700 font-medium transition-all"
                  placeholder="https://images.unsplash.com/..."
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción Breve</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 text-sm h-10 text-slate-700 font-medium transition-all"
                  placeholder="Ej. Ruta de 12 días recorriendo el Sudeste Asiático..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas Generales</label>
                <textarea
                  placeholder="Vacunas necesarias, visado, contactos de emergencia..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-slate-50 h-20 resize-none text-sm font-sans"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button 
                type="button"
                className="font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl h-10 px-4 text-sm transition-colors cursor-pointer" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="font-semibold shadow-md shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 text-sm transition-all active:scale-95 cursor-pointer" 
                onClick={handleSubmit}
              >
                Crear Viaje
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
