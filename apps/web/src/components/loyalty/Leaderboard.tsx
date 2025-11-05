'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loyaltyApi } from '@/lib/api/loyalty';
import { Card, CardContent, CardHeader, CardTitle, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@retail/ui';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';

interface Props {
  programId: string;
}

export function Leaderboard({ programId }: Props) {
  const [period, setPeriod] = useState<'all_time' | 'year' | 'month' | 'week'>('all_time');
  const [limit, setLimit] = useState('50');

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['loyalty-leaderboard', programId, period, limit],
    queryFn: () => loyaltyApi.getLeaderboard(programId, period, parseInt(limit)),
  });

  const leaderboard = leaderboardData?.data || [];

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="font-bold text-gray-600">#{rank}</span>;
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando tabla de posiciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Tabla de Posiciones
          </h2>
          <p className="text-gray-600 text-sm">Top clientes por puntos acumulados</p>
        </div>

        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">Histórico</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="25">Top 25</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
              <SelectItem value="100">Top 100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay miembros aún</h3>
            <p className="text-gray-600">
              La tabla de posiciones aparecerá cuando haya miembros activos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((member: any, index: number) => (
            <Card
              key={member.memberId}
              className={`transition-all hover:shadow-md ${
                index < 3 ? 'border-2' : ''
              } ${
                index === 0
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white'
                  : index === 1
                  ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-white'
                  : index === 2
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-white'
                  : ''
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getMedalIcon(member.rank)}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {member.customerName}
                    </h3>
                    {member.tier && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          {member.tier}
                        </Badge>
                      </div>
                    )}
                    {member.memberSince && (
                      <div className="text-xs text-gray-500 mt-1">
                        Miembro desde {new Date(member.memberSince).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Star className="h-5 w-5 text-purple-600 fill-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">
                        {member.points.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.currentPoints.toLocaleString()} disponibles
                    </div>
                  </div>
                </div>

                {/* Progress bar for top 3 */}
                {index < 3 && leaderboard[0] && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : 'bg-amber-600'
                        }`}
                        style={{
                          width: `${
                            (member.points / leaderboard[0].points) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {leaderboard[0]?.points?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Máximo Puntos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {Math.round(
                    leaderboard.reduce(
                      (sum: number, m: any) => sum + m.points,
                      0
                    ) / leaderboard.length
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Promedio Puntos</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{leaderboard.length}</div>
                <div className="text-sm text-gray-600">Total Miembros</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
