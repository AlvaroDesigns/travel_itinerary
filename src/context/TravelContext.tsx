'use client';

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

// Activity Types
export type ActivityType = 'flight' | 'transfer' | 'hotel' | 'excursion' | 'food';

export interface BaseActivity {
  id: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  description?: string;
  customIconUrl?: string;
  isCheckout?: boolean;
  originalId?: string;
}

export interface FlightLeg {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string; // HH:MM
  departureDate?: string; // YYYY-MM-DD (defaults to activity date)
  arrivalTime: string; // HH:MM
  arrivalDate?: string; // YYYY-MM-DD
}

export interface FlightActivity extends BaseActivity {
  type: 'flight';
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  arrivalTime: string;
  legs?: FlightLeg[];
  description?: string;
}

export interface TransferActivity extends BaseActivity {
  type: 'transfer';
  transportType: 'taxi' | 'bus' | 'train' | 'metro' | 'walking' | 'other';
  origin: string;
  destination: string;
  duration: string; // e.g. "30 - 45 min"
  description?: string;
}

export interface HotelActivity extends BaseActivity {
  type: 'hotel';
  hotelName: string;
  address: string;
  checkIn: string;
  checkOut: string;
  checkoutDate?: string; // YYYY-MM-DD
  description?: string;
}

export interface ExcursionActivity extends BaseActivity {
  type: 'excursion';
  title: string;
  description?: string;
  duration: string; // e.g. "4 horas"
}

export interface FoodActivity extends BaseActivity {
  type: 'food';
  restaurantName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string;
}

export type Activity =
  | FlightActivity
  | TransferActivity
  | HotelActivity
  | ExcursionActivity
  | FoodActivity;

export interface Trip {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budget: number;
  imageUrl: string;
  description: string;
  notes: string;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  activities: Activity[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentId: string;
  nationality: string;
  notes: string;
  status: 'activo' | 'prospecto' | 'inactivo';
  createdAt: string;
  assignedTripsCount?: number;
  assignedTrips?: { id: string; name: string; startDate: string; endDate: string }[];
}

export interface AuthUser {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

interface TravelContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  clients: Client[];
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setActiveTripById: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'activities'>) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addActivity: (tripId: string, activity: Omit<Activity, 'id'>) => Promise<Activity | undefined>;
  updateActivity: (tripId: string, activity: Activity) => Promise<void>;
  deleteActivity: (tripId: string, activityId: string) => Promise<void>;
  fetchClients: () => Promise<void>;
  addClient: (
    client: Omit<Client, 'id' | 'createdAt' | 'assignedTripsCount' | 'assignedTrips'>,
    assignedTripIds?: string[]
  ) => Promise<Client | null>;
  updateClient: (client: Client, assignedTripIds?: string[]) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  assignTripClient: (tripId: string, clientId: string | null) => Promise<void>;
  logout: () => Promise<void>;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const tripsRes = await fetch('/api/trips');
      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        setTrips(tripsData);
        if (tripsData.length > 0) {
          const lastActiveId = localStorage.getItem('last_active_trip_id');
          const matched = tripsData.find((t: Trip) => t.id === lastActiveId);
          setActiveTrip(matched || tripsData[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load trips:', e);
    }
  }, []);

  // Check auth and fetch initial trips & clients
  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (authData.isAuthenticated && authData.user) {
          setUser(authData.user);
          setIsAuthenticated(true);

          await Promise.all([fetchTrips(), fetchClients()]);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to load user and trips data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndLoadData();
  }, [fetchTrips, fetchClients]);

  const setActiveTripById = useCallback((id: string) => {
    const trip = trips.find((t) => t.id === id) || null;
    setActiveTrip(trip);
    if (id) {
      localStorage.setItem('last_active_trip_id', id);
    }
  }, [trips]);

  const addTrip = async (newTripData: Omit<Trip, 'id' | 'activities'>) => {
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTripData),
      });

      if (!res.ok) throw new Error('Error al añadir viaje en base de datos');

      const addedTrip = await res.json();
      const updatedTrips = [...trips, addedTrip];
      setTrips(updatedTrips);
      setActiveTrip(addedTrip);
      localStorage.setItem('last_active_trip_id', addedTrip.id);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar el viaje en la base de datos.');
    }
  };

  const updateTrip = async (updatedTrip: Trip) => {
    try {
      const res = await fetch(`/api/trips/${updatedTrip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTrip),
      });

      if (!res.ok) throw new Error('Error al actualizar viaje en base de datos');

      const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
      setTrips(updatedTrips);
      if (activeTrip?.id === updatedTrip.id) {
        setActiveTrip(updatedTrip);
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar el viaje en la base de datos.');
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar viaje en base de datos');

      const updatedTrips = trips.filter((t) => t.id !== id);
      setTrips(updatedTrips);
      if (activeTrip?.id === id) {
        const nextTrip = updatedTrips.length > 0 ? updatedTrips[0] : null;
        setActiveTrip(nextTrip);
        if (nextTrip) {
          localStorage.setItem('last_active_trip_id', nextTrip.id);
        } else {
          localStorage.removeItem('last_active_trip_id');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error al eliminar el viaje en la base de datos.');
    }
  };

  const addActivity = async (tripId: string, newActivityData: Omit<Activity, 'id'>) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivityData),
      });

      if (!res.ok) throw new Error('Error al añadir actividad en base de datos');

      const addedActivity = await res.json();

      const updatedTrips = trips.map((trip) => {
        if (trip.id === tripId) {
          const sortedActivities = [...trip.activities, addedActivity].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
          });
          return {
            ...trip,
            activities: sortedActivities,
          };
        }
        return trip;
      });

      setTrips(updatedTrips);
      
      const matchedTrip = updatedTrips.find(t => t.id === tripId);
      if (matchedTrip) {
        setActiveTrip(matchedTrip);
      }

      return addedActivity as Activity;
    } catch (error) {
      console.error(error);
      alert('Hubo un error al agregar la actividad.');
    }
  };

  const updateActivity = async (tripId: string, updatedActivity: Activity) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/${updatedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedActivity),
      });

      if (!res.ok) throw new Error('Error al actualizar la actividad en base de datos');

      const savedActivity = await res.json();

      const updatedTrips = trips.map((trip) => {
        if (trip.id === tripId) {
          const updatedActivities = trip.activities
            .map((act) => (act.id === savedActivity.id ? savedActivity : act))
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.time.localeCompare(b.time);
            });
          return {
            ...trip,
            activities: updatedActivities,
          };
        }
        return trip;
      });

      setTrips(updatedTrips);

      const matchedTrip = updatedTrips.find(t => t.id === tripId);
      if (matchedTrip) {
        setActiveTrip(matchedTrip);
      }
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar la actividad.');
    }
  };

  const deleteActivity = async (tripId: string, activityId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Server error on delete activity:', errorData);
      }

      const updatedTrips = trips.map((trip) => {
        if (trip.id === tripId) {
          return {
            ...trip,
            activities: trip.activities.filter((act) => act.id !== activityId),
          };
        }
        return trip;
      });

      setTrips(updatedTrips);

      const matchedTrip = updatedTrips.find(t => t.id === tripId);
      if (matchedTrip) {
        setActiveTrip(matchedTrip);
      }
    } catch (error) {
      console.error('deleteActivity error:', error);
    }
  };

  const addClient = async (
    newClientData: Omit<Client, 'id' | 'createdAt' | 'assignedTripsCount' | 'assignedTrips'>,
    assignedTripIds?: string[]
  ): Promise<Client | null> => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newClientData, assignedTripIds }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      const created = await res.json();
      await Promise.all([fetchClients(), fetchTrips()]);
      return created;
    } catch (error) {
      console.error('addClient error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear el cliente');
      return null;
    }
  };

  const updateClient = async (client: Client, assignedTripIds?: string[]) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, assignedTripIds }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar cliente');
      }

      await Promise.all([fetchClients(), fetchTrips()]);
    } catch (error) {
      console.error('updateClient error:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar el cliente');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar cliente');
      }

      setClients((prev) => prev.filter((c) => c.id !== id));
      await fetchTrips();
    } catch (error) {
      console.error('deleteClient error:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el cliente');
    }
  };

  const assignTripClient = async (tripId: string, clientId: string | null) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId || null }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al asignar cliente al viaje');
      }

      await Promise.all([fetchTrips(), fetchClients()]);
    } catch (error) {
      console.error('assignTripClient error:', error);
      alert(error instanceof Error ? error.message : 'Error al asignar el cliente al viaje');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setTrips([]);
      setClients([]);
      setActiveTrip(null);
      localStorage.removeItem('last_active_trip_id');
      window.location.href = '/login';
    }
  };

  return (
    <TravelContext.Provider
      value={{
        trips,
        activeTrip,
        clients,
        user,
        isAuthenticated,
        isLoading,
        setActiveTripById,
        addTrip,
        updateTrip,
        deleteTrip,
        addActivity,
        updateActivity,
        deleteActivity,
        fetchClients,
        addClient,
        updateClient,
        deleteClient,
        assignTripClient,
        logout,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravel = () => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
};
