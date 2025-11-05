'use client';

import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@retail/ui';

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState('last30');

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const today = new Date();
    let from: Date;
    let to: Date = endOfDay(today);

    switch (preset) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'yesterday':
        from = startOfDay(subDays(today, 1));
        to = endOfDay(subDays(today, 1));
        break;
      case 'last7':
        from = startOfDay(subDays(today, 7));
        break;
      case 'last30':
        from = startOfDay(subDays(today, 30));
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        from = startOfMonth(subDays(today, 30));
        to = endOfMonth(subDays(today, 30));
        break;
      default:
        from = startOfDay(subDays(today, 30));
    }

    onChange({ from, to });
  };

  const getDisplayText = () => {
    if (value?.from && value?.to) {
      return `${format(value.from, 'dd MMM', { locale: es })} - ${format(value.to, 'dd MMM yyyy', { locale: es })}`;
    }
    return 'Seleccionar período';
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="h-4 w-4 text-gray-500" />
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {getDisplayText()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="yesterday">Ayer</SelectItem>
          <SelectItem value="last7">Últimos 7 días</SelectItem>
          <SelectItem value="last30">Últimos 30 días</SelectItem>
          <SelectItem value="thisMonth">Este mes</SelectItem>
          <SelectItem value="lastMonth">Mes pasado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
