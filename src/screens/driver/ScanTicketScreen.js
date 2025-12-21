import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import QRCodeScanner from './QRCodeScanner'; // Componente para escanear QR
import { ref, get, update } from 'firebase/database'; // Firebase Realtime Database
import { database } from '../../services/firebase'; // Configuración de Firebase
import { Ionicons } from '@expo/vector-icons';

const ScanTicketScreen = () => {
  const [qrScanned, setQrScanned] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRScanSuccess = async (e) => {
    if (qrScanned) return; // Evita múltiples escaneos
    setQrScanned(true); // Bloquear nuevos escaneos

    try {
      // Decodificar el QR
      const qrData = JSON.parse(e.data); // QR debe contener un JSON con `userId` y `ticketId`
      const { userId, ticketId } = qrData;

      if (!userId || !ticketId) {
        throw new Error('Datos del QR incompletos.');
      }

      // Construir la referencia en Firebase
      const ticketRef = ref(database, `tickets/${userId}/${ticketId}`);
      console.log(`Consultando URL: ${ticketRef.toString()}`);

      const snapshot = await get(ticketRef);
      if (snapshot.exists()) {
        const ticketData = snapshot.val();

        if (ticketData.used) {
          // Si el ticket ya fue usado, mostrar mensaje
          Alert.alert(
            'Ticket Inválido',
            'Este ticket ya fue usado. No puede volver a ser utilizado.'
          );
        } else {
          // Si el ticket es válido, actualizar su estado a "usado" y añadir la fecha de validación
          const usedDate = new Date().toISOString();
          await update(ticketRef, { used: true, usedDate });
          Alert.alert(
            'Ticket Válido',
            `Destino: ${ticketData.destinationName || 'Desconocido'}\nFecha de Creación: ${new Date(
              ticketData.createdAt
            ).toLocaleString()}\nFecha de Validación: ${new Date(usedDate).toLocaleString()}
            Ticket marcado como usado`
          );
        }
      } else {
        Alert.alert('Ticket Inválido', 'El ticket no existe o ya fue procesado.');
      }
    } catch (error) {
      console.error('Error al verificar el ticket:', error);
      Alert.alert('Error', 'El ticket no es válido o está malformado.');
    }

    // Permitir un nuevo escaneo después de un breve tiempo
    setTimeout(() => setQrScanned(false), 3000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.qrButton} onPress={() => setShowQRScanner(true)}>
        <Ionicons name="qr-code" size={32} color="#002F2F" />
        <Text style={styles.qrButtonText}>
          {qrScanned ? 'Ticket Verificado' : 'Escanear Ticket'}
        </Text>
      </TouchableOpacity>
      <QRCodeScanner
        handleQRScanSuccess={handleQRScanSuccess}
        qrScanned={qrScanned}
        setQrScanned={setQrScanned}
        setShowQRScanner={setShowQRScanner}
        showQRScanner={showQRScanner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    alignItems: 'center',
    padding: 10,
  },
  qrButtonText: {
    fontSize: 16,
    paddingTop: 5,
    textAlign: 'center',
  },
});

export default ScanTicketScreen;
