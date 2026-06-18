'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Activity Types
export type ActivityType = 'flight' | 'transfer' | 'hotel' | 'excursion' | 'food';

export interface BaseActivity {
  id: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
}

export interface FlightActivity extends BaseActivity {
  type: 'flight';
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  arrivalTime: string;
}

export interface TransferActivity extends BaseActivity {
  type: 'transfer';
  transportType: 'taxi' | 'bus' | 'train' | 'metro' | 'walking' | 'other';
  origin: string;
  destination: string;
  duration: string; // e.g. "30 - 45 min"
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
  description: string;
  duration: string; // e.g. "4 horas"
}

export interface FoodActivity extends BaseActivity {
  type: 'food';
  restaurantName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
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
  activities: Activity[];
}

export interface AuthUser {
  userId: number;
  email: string;
}

interface TravelContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setActiveTripById: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'activities'>) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addActivity: (tripId: string, activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (tripId: string, activity: Activity) => Promise<void>;
  deleteActivity: (tripId: string, activityId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth and fetch initial trips
  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (authData.isAuthenticated && authData.user) {
          setUser(authData.user);
          setIsAuthenticated(true);

          // Fetch user's trips from Postgres
          const tripsRes = await fetch('/api/trips');
          if (tripsRes.ok) {
            const tripsData = await tripsRes.json();
            setTrips(tripsData);
            if (tripsData.length > 0) {
              // Select active trip from localStorage if exists, else first trip
              const lastActiveId = localStorage.getItem('last_active_trip_id');
              const matched = tripsData.find((t: Trip) => t.id === lastActiveId);
              setActiveTrip(matched || tripsData[0]);
            }
          }
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
  }, []);

  const setActiveTripById = (id: string) => {
    const trip = trips.find((t) => t.id === id) || null;
    setActiveTrip(trip);
    if (id) {
      localStorage.setItem('last_active_trip_id', id);
    }
  };

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

      if (!res.ok) throw new Error('Error al eliminar actividad de base de datos');

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
      console.error(error);
      alert('Hubo un error al eliminar la actividad.');
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
