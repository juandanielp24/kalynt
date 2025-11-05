import { Card, CardContent } from '@retail/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  trend
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const showChange = change !== undefined && change !== 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>

            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}

            {showChange && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs período anterior</span>
              </div>
            )}
          </div>

          {icon && (
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
