'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationsApi, Location } from '@/lib/api/locations';
import { useAuth } from './AuthContext';

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  setCurrentLocation: (location: Location) => void;
  refetch: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocationState] = useState<Location | null>(null);

  const { data: locationsData, isLoading, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getLocations,
    enabled: !!user,
  });

  const locations = locationsData?.data || [];

  // Set default location on mount
  useEffect(() => {
    if (locations.length > 0 && !currentLocation) {
      const savedLocationId = localStorage.getItem('currentLocationId');
      const defaultLocation = savedLocationId
        ? locations.find((l: Location) => l.id === savedLocationId)
        : locations[0];

      if (defaultLocation) {
        setCurrentLocationState(defaultLocation);
      }
    }
  }, [locations, currentLocation]);

  const setCurrentLocation = (location: Location) => {
    setCurrentLocationState(location);
    localStorage.setItem('currentLocationId', location.id);
  };

  return (
    <LocationContext.Provider
      value={{
        locations,
        currentLocation,
        isLoading,
        setCurrentLocation,
        refetch,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
