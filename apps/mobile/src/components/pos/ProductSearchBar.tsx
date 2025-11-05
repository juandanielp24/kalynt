import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, IconButton } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';

interface ProductSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function ProductSearchBar({ value, onChangeText }: ProductSearchBarProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    onChangeText(data);
  };

  if (showScanner && hasPermission) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <IconButton
          icon="close"
          mode="contained"
          onPress={() => setShowScanner(false)}
          style={styles.closeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar productos..."
        value={value}
        onChangeText={onChangeText}
        style={styles.searchbar}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <IconButton
        icon="barcode-scan"
        mode="contained-tonal"
        onPress={requestCameraPermission}
        style={styles.scanButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  searchbar: {
    flex: 1,
  },
  scanButton: {
    margin: 0,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
});
