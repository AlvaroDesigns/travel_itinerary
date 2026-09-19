'use client';

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/constants';

// Activity Types
export type ActivityType = 'flight' | 'transfer' | 'hotel' | 'excursion' | 'food' | 'booking' | 'conditions';

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

export interface BookingActivity extends BaseActivity {
  type: 'booking';
  title: string;
  description?: string;
  totalAmount?: number;
  depositAmount?: number;
  depositPercentage?: number;
  secondPaymentAmount?: number;
  secondPaymentDate?: string;
  finalPaymentAmount?: number;
  finalPaymentDate?: string;
  paymentProvider?: 'redsys' | 'stripe';
  cancellationPolicy?: string;
  autoPaymentEnabled?: boolean;
}

export interface ConditionsActivity extends BaseActivity {
  type: 'conditions';
  title: string;
  description?: string;
  includes?: string[];
  excludes?: string[];
  departureCities?: string;
  categories?: string[];
  connectedDestinations?: string[];
  isIncludesBlock?: boolean;
}

export type Activity =
  | FlightActivity
  | TransferActivity
  | HotelActivity
  | ExcursionActivity
  | FoodActivity
  | BookingActivity
  | ConditionsActivity;

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
  ownerId?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerAvatar?: string | null;
  activities: Activity[];
}

export type OpportunityStage = 'nuevo' | 'contactado' | 'propuesta' | 'ganada' | 'perdido';

export interface Opportunity {
  id: string;
  clientId?: string | null;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  currency: string;
  agentName: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
  travelersCount?: number;
  initialNotes?: string;
  createdAt: string;
  updatedAt: string;
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
  role: 'superuser' | 'superadmin' | 'admin' | 'user';
  name?: string;
  avatar?: string;
  tenantId?: string;
  agencyName?: string;
  planType?: string;
  agencyLogo?: string;
  agencyUrl?: string;
}

interface TravelContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  clients: Client[];
  opportunities: Opportunity[];
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setActiveTripById: (id: string) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'activities'>, initialActivities?: Omit<Activity, 'id'>[]) => Promise<Trip | undefined>;
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
  fetchOpportunities: () => Promise<void>;
  addOpportunity: (
    data: {
      title: string;
      stage?: OpportunityStage;
      amount?: number;
      currency?: string;
      agentName?: string;
      clientId?: string | null;
      newClient?: { name: string; email?: string; phone?: string };
      startDate?: string;
      endDate?: string;
      destination?: string;
      travelersCount?: number;
      initialNotes?: string;
    }
  ) => Promise<Opportunity | null>;
  updateOpportunity: (id: string, changes: Partial<Opportunity>) => Promise<Opportunity | null>;
  deleteOpportunity: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partialUser: Partial<AuthUser>) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Client[]>(API_ROUTES.CLIENTS.BASE);
      setClients(data);
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Opportunity[]>(API_ROUTES.OPPORTUNITIES.BASE);
      setOpportunities(data);
    } catch (e) {
      console.error('Failed to load opportunities:', e);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const { data: tripsData } = await apiClient.get<Trip[]>(API_ROUTES.TRIPS.BASE);
      setTrips(tripsData);
      if (tripsData.length > 0) {
        const lastActiveId = localStorage.getItem('last_active_trip_id');
        const matched = tripsData.find((t: Trip) => t.id === lastActiveId);
        setActiveTrip(matched || tripsData[0]);
      }
      return tripsData;
    } catch (e) {
      console.error('Failed to load trips:', e);
    }
    return [];
  }, []);

  // Check auth and fetch initial trips & clients & opportunities
  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndLoadData() {
      try {
        const { data: authData } = await apiClient.get<{
          isAuthenticated: boolean;
          user: AuthUser | null;
        }>(API_ROUTES.AUTH.ME);

        if (authData.isAuthenticated && authData.user) {
          if (isMounted) {
            setUser(authData.user);
            setIsAuthenticated(true);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('wanderlust_agency_logo');
            }
          }
          try {
            await Promise.allSettled([fetchTrips(), fetchClients(), fetchOpportunities()]);
          } catch (e) {
            console.error('Failed loading travel sub-resources:', e);
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load user and trips data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Safety timeout to ensure isLoading never hangs forever under any circumstance
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 6000);

    checkAuthAndLoadData();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchTrips, fetchClients, fetchOpportunities]);

  const setActiveTripById = useCallback((id: string) => {
    const trip = trips.find((t) => t.id === id) || null;
    setActiveTrip(trip);
    if (id) {
      localStorage.setItem('last_active_trip_id', id);
    }
  }, [trips]);

  const addTrip = async (
    newTripData: Omit<Trip, 'id' | 'activities'>,
    initialActivities?: Omit<Activity, 'id'>[]
  ): Promise<Trip | undefined> => {
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTripData),
      });

      if (!res.ok) throw new Error('Error al añadir viaje en base de datos');

      const addedTrip = await res.json();

      // If initial activities were provided (e.g. from template)
      if (Array.isArray(initialActivities) && initialActivities.length > 0) {
        for (const act of initialActivities) {
          try {
            await fetch(`/api/trips/${addedTrip.id}/activities`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(act),
            });
          } catch (e) {
            console.error('Error adding template activity:', e);
          }
        }
        await fetchTrips();
      } else {
        const updatedTrips = [...trips, addedTrip];
        setTrips(updatedTrips);
      }

      setActiveTrip(addedTrip);
      localStorage.setItem('last_active_trip_id', addedTrip.id);
      return addedTrip;
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar el viaje en la base de datos.');
      return undefined;
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

  const addOpportunity = async (data: {
    title: string;
    stage?: OpportunityStage;
    amount?: number;
    currency?: string;
    agentName?: string;
    clientId?: string | null;
    newClient?: { name: string; email?: string; phone?: string };
    startDate?: string;
    endDate?: string;
    destination?: string;
    travelersCount?: number;
    initialNotes?: string;
  }): Promise<Opportunity | null> => {
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear la oportunidad');
      }

      const created = await res.json();
      setOpportunities((prev) => [created, ...prev]);
      if (data.newClient) {
        await fetchClients();
      }
      return created;
    } catch (error) {
      console.error('addOpportunity error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la oportunidad');
      return null;
    }
  };

  const updateOpportunity = async (
    id: string,
    changes: Partial<Opportunity>
  ): Promise<Opportunity | null> => {
    try {
      // Optimistic update
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...changes, updatedAt: new Date().toISOString() } : o))
      );

      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar la oportunidad');
      }

      const updated = await res.json();
      setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)));
      return updated;
    } catch (error) {
      console.error('updateOpportunity error:', error);
      await fetchOpportunities();
      alert(error instanceof Error ? error.message : 'Error al actualizar la oportunidad');
      return null;
    }
  };

  const deleteOpportunity = async (id: string) => {
    try {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar la oportunidad');
      }
    } catch (error) {
      console.error('deleteOpportunity error:', error);
      await fetchOpportunities();
      alert(error instanceof Error ? error.message : 'Error al eliminar la oportunidad');
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
      setOpportunities([]);
      setActiveTrip(null);
      localStorage.removeItem('last_active_trip_id');
      localStorage.removeItem('wanderlust_agency_logo');
      window.location.href = '/login';
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data: authData } = await apiClient.get<{
        isAuthenticated: boolean;
        user: AuthUser | null;
      }>(API_ROUTES.AUTH.ME);

      if (authData.isAuthenticated && authData.user) {
        setUser(authData.user);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wanderlust_agency_logo');
        }
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, []);

  const updateUser = useCallback((partialUser: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partialUser };
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wanderlust_agency_logo');
      }
      return updated;
    });
  }, []);

  return (
    <TravelContext.Provider
      value={{
        trips,
        activeTrip,
        clients,
        opportunities,
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
        fetchOpportunities,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
        logout,
        refreshUser,
        updateUser,
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
