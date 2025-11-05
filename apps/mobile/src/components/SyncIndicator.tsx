import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Badge } from 'react-native-paper';
import { useOfflineStore } from '../../store/offline-store';
import { useSync } from '../providers/SyncProvider';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react-native';

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingSyncCount, lastSyncAt } =
    useOfflineStore();
  const { syncNow } = useSync();

  const handlePress = () => {
    if (isOnline && !isSyncing) {
      syncNow();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={!isOnline || isSyncing}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Connection Status Icon */}
        {isOnline ? (
          <Wifi size={20} color="#4caf50" />
        ) : (
          <WifiOff size={20} color="#f44336" />
        )}

        {/* Sync Status */}
        {isSyncing ? (
          <ActivityIndicator size={16} color="#6200ee" />
        ) : pendingSyncCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Badge style={styles.badge}>{pendingSyncCount}</Badge>
            <CloudOff size={16} color="#ff9800" />
          </View>
        ) : (
          <Cloud size={16} color="#4caf50" />
        )}

        {/* Status Text */}
        <View style={styles.textContainer}>
          <Text variant="bodySmall" style={styles.statusText}>
            {isSyncing
              ? 'Sincronizando...'
              : !isOnline
              ? 'Sin conexión'
              : pendingSyncCount > 0
              ? `${pendingSyncCount} pendiente${pendingSyncCount > 1 ? 's' : ''}`
              : 'Sincronizado'}
          </Text>
          {lastSyncAt && !isSyncing && (
            <Text variant="bodySmall" style={styles.lastSyncText}>
              {formatLastSync(lastSyncAt)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatLastSync(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  return 'Hace más de 1 día';
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff9800',
    fontSize: 10,
  },
  textContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 10,
    color: '#666',
  },
});
