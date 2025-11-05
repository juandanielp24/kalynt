import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { usePOSMobileStore } from '../../../store/pos-mobile-store';
import { useOfflineStore } from '../../../store/offline-store';
import { useSync } from '../../providers/SyncProvider';
import { useToast } from '../../hooks/use-toast';

interface CheckoutModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function CheckoutModal({ visible, onDismiss }: CheckoutModalProps) {
  const {
    items,
    totalCents,
    subtotalCents,
    taxCents,
    saveSaleLocally,
  } = usePOSMobileStore();
  const { isOnline } = useOfflineStore();
  const { syncNow } = useSync();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmSale = async () => {
    setIsProcessing(true);

    try {
      // Save sale locally
      const saleId = await saveSaleLocally(paymentMethod);

      showToast({
        message: 'Venta registrada localmente',
        type: 'success',
      });

      // If online, try to sync immediately
      if (isOnline) {
        try {
          await syncNow();
          showToast({
            message: 'Venta sincronizada con el servidor',
            type: 'success',
          });
        } catch (error) {
          // Sync will retry later
          showToast({
            message: 'Se sincronizará cuando haya conexión',
            type: 'info',
          });
        }
      } else {
        showToast({
          message: 'Se sincronizará cuando haya conexión',
          type: 'info',
        });
      }

      onDismiss();
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al procesar venta',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.title}>
            Procesar Venta
          </Text>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Método de Pago
            </Text>
            <SegmentedButtons
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              buttons={[
                {
                  value: 'cash',
                  label: 'Efectivo',
                  icon: 'cash',
                },
                {
                  value: 'debit_card',
                  label: 'Débito',
                  icon: 'credit-card',
                },
                {
                  value: 'credit_card',
                  label: 'Crédito',
                  icon: 'credit-card-outline',
                },
              ]}
            />
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen
            </Text>

            <View style={styles.summaryRow}>
              <Text>Subtotal:</Text>
              <Text>${(subtotalCents / 100).toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text>IVA:</Text>
              <Text>${(taxCents / 100).toFixed(2)}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text variant="titleLarge" style={styles.totalLabel}>
                Total:
              </Text>
              <Text variant="headlineMedium" style={styles.totalAmount}>
                ${(totalCents / 100).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Offline Warning */}
          {!isOnline && (
            <View style={styles.offlineWarning}>
              <Text variant="bodySmall" style={styles.offlineText}>
                ⚠️ Sin conexión. La venta se guardará localmente y se
                sincronizará cuando haya internet.
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={isProcessing}
              style={styles.button}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmSale}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.button}
            >
              Confirmar Venta
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  offlineWarning: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: {
    color: '#856404',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
