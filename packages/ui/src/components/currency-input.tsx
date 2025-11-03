import * as React from 'react';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { parseCurrencyToCents, formatCurrencyARS } from '@retail/shared';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number; // en centavos
  onChange?: (cents: number) => void;
}

export function CurrencyInput({ value = 0, onChange, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(formatCurrencyARS(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    try {
      const cents = parseCurrencyToCents(input);
      onChange?.(cents);
    } catch {
      // Invalid format, don't call onChange
    }
  };

  const handleBlur = () => {
    // Format on blur
    setDisplayValue(formatCurrencyARS(value));
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn('text-right font-mono', className)}
      {...props}
    />
  );
}
