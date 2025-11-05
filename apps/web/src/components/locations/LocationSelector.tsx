'use client';

import { useLocation } from '@/contexts/LocationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@retail/ui';
import { MapPin, Warehouse } from 'lucide-react';

export function LocationSelector() {
  const { locations, currentLocation, setCurrentLocation, isLoading } = useLocation();

  if (isLoading || locations.length === 0) {
    return null;
  }

  // If only one location, show it as badge without selector
  if (locations.length === 1) {
    const location = locations[0];
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        {location.isWarehouse ? (
          <Warehouse className="h-4 w-4 text-gray-600" />
        ) : (
          <MapPin className="h-4 w-4 text-gray-600" />
        )}
        <span className="text-sm font-medium">{location.name}</span>
      </div>
    );
  }

  return (
    <Select
      value={currentLocation?.id}
      onValueChange={(value) => {
        const location = locations.find((l) => l.id === value);
        if (location) {
          setCurrentLocation(location);
        }
      }}
    >
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          {currentLocation?.isWarehouse ? (
            <Warehouse className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <SelectValue placeholder="Seleccionar sucursal" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            <div className="flex items-center gap-2">
              {location.isWarehouse ? (
                <Warehouse className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              <span>{location.name}</span>
              {location.code && (
                <Badge variant="secondary" className="text-xs">
                  {location.code}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
