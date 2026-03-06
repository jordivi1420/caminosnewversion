import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import QRCodeScanner from './QRCodeScanner';
import { ref, get, update } from 'firebase/database';
import { database } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const formatDate = (value) => {
  if (!value) return 'No disponible';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';

  return date.toLocaleString();
};

const ScanTicketScreen = () => {
  const [qrScanned, setQrScanned] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [validating, setValidating] = useState(false);

  const [lastResult, setLastResult] = useState(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const resetScannerState = (delay = 600) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      setQrScanned(false);
    }, delay);
  };

  const openScanner = () => {
    setLastResult(null);
    setQrScanned(false);
    setShowQRScanner(true);
  };

  const closeScanner = () => {
    setShowQRScanner(false);
    resetScannerState(0);
  };

  const handleQRScanSuccess = async (e) => {
    if (qrScanned || validating) return;

    setQrScanned(true);
    setValidating(true);

    try {
      let qrData;

      try {
        qrData = JSON.parse(e.data);
      } catch {
        throw new Error('QR malformado');
      }

      const { userId, ticketId } = qrData || {};

      if (!userId || !ticketId) {
        throw new Error('Datos del QR incompletos');
      }

      const ticketRef = ref(database, `tickets/${userId}/${ticketId}`);
      const snapshot = await get(ticketRef);

      if (!snapshot.exists()) {
        setLastResult({
          type: 'error',
          title: 'Ticket inválido',
          message: 'El ticket no existe o ya fue procesado.',
        });

        setShowQRScanner(false);
        Alert.alert('Ticket inválido', 'El ticket no existe o ya fue procesado.');
        return;
      }

      const ticketData = snapshot.val();

      if (ticketData.used) {
        setLastResult({
          type: 'warning',
          title: 'Ticket ya usado',
          message: 'Este ticket ya fue utilizado anteriormente.',
          destinationName: ticketData.destinationName || 'Desconocido',
          createdAt: ticketData.createdAt,
          usedDate: ticketData.usedDate,
        });

        setShowQRScanner(false);

        Alert.alert(
          'Ticket inválido',
          'Este ticket ya fue usado. No puede volver a ser utilizado.'
        );
        return;
      }

      const usedDate = new Date().toISOString();

      await update(ticketRef, {
        used: true,
        usedDate,
      });

      setLastResult({
        type: 'success',
        title: 'Ticket válido',
        message: 'El ticket fue validado y marcado como usado correctamente.',
        destinationName: ticketData.destinationName || 'Desconocido',
        createdAt: ticketData.createdAt,
        usedDate,
      });

      setShowQRScanner(false);

      Alert.alert(
        'Ticket válido',
        `Destino: ${ticketData.destinationName || 'Desconocido'}\nFecha de creación: ${formatDate(
          ticketData.createdAt
        )}\nFecha de validación: ${formatDate(usedDate)}\n\nTicket marcado como usado.`
      );
    } catch (error) {
      console.error('Error al verificar el ticket:', error);

      setLastResult({
        type: 'error',
        title: 'Error de validación',
        message: 'El ticket no es válido o está malformado.',
      });

      setShowQRScanner(false);
      Alert.alert('Error', 'El ticket no es válido o está malformado.');
    } finally {
      setValidating(false);
      resetScannerState();
    }
  };

  const resultAccent =
    lastResult?.type === 'success'
      ? '#16A34A'
      : lastResult?.type === 'warning'
      ? '#D97706'
      : '#DC2626';

  const resultIcon =
    lastResult?.type === 'success'
      ? 'checkmark-circle'
      : lastResult?.type === 'warning'
      ? 'alert-circle'
      : 'close-circle';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Validación</Text>
        <Text style={styles.heroTitle}>Escanea y valida tickets</Text>
        <Text style={styles.heroSubtitle}>
          Usa la cámara para leer códigos QR o PDF417 y verificar su estado en tiempo real.
        </Text>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="qr-code-outline" size={34} color="#0B74FF" />
        </View>

        <Text style={styles.actionTitle}>Escáner de tickets</Text>
        <Text style={styles.actionText}>
          Abre el lector y apunta al código del pasajero para validar su ticket.
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, validating && styles.disabledButton]}
          onPress={openScanner}
          disabled={validating}
        >
          {validating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>
                {qrScanned ? 'Procesando...' : 'Escanear ticket'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {lastResult && (
        <View style={styles.resultCard}>
          <View style={[styles.resultBadge, { backgroundColor: `${resultAccent}18` }]}>
            <Ionicons name={resultIcon} size={18} color={resultAccent} />
            <Text style={[styles.resultBadgeText, { color: resultAccent }]}>
              {lastResult.title}
            </Text>
          </View>

          <Text style={styles.resultMessage}>{lastResult.message}</Text>

          {lastResult.destinationName ? (
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Destino</Text>
              <Text style={styles.metaValue}>{lastResult.destinationName}</Text>
            </View>
          ) : null}

          {lastResult.createdAt ? (
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Fecha de creación</Text>
              <Text style={styles.metaValue}>{formatDate(lastResult.createdAt)}</Text>
            </View>
          ) : null}

          {lastResult.usedDate ? (
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Fecha de validación</Text>
              <Text style={styles.metaValue}>{formatDate(lastResult.usedDate)}</Text>
            </View>
          ) : null}
        </View>
      )}

      <QRCodeScanner
        handleQRScanSuccess={handleQRScanSuccess}
        qrScanned={qrScanned}
        setQrScanned={setQrScanned}
        setShowQRScanner={setShowQRScanner}
        showQRScanner={showQRScanner}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  heroCard: {
    backgroundColor: '#DDF0FF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },

  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },

  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  actionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },

  actionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },

  scanButton: {
    minWidth: 210,
    backgroundColor: '#0B74FF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.65,
  },

  resultCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  resultBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  resultBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },

  resultMessage: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    marginBottom: 12,
  },

  metaBlock: {
    marginTop: 8,
  },

  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 3,
  },

  metaValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },
});

export default ScanTicketScreen;