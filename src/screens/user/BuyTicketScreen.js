import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { ref, push, update, get, increment } from 'firebase/database';
import { database, auth } from '../../services/firebase';

const BuyTicketScreen = ({ route, navigation }) => {
  const { routeId } = route.params;
  const [loading, setLoading] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');

  const handleBuyTicket = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para comprar un ticket.');
        setLoading(false);
        return;
      }
  
      // Verificar si ya tiene un ticket para la misma ruta
      const ticketRef = ref(database, `tickets/${user.uid}`);
      const ticketSnapshot = await get(ticketRef);
  
      if (ticketSnapshot.exists()) {
        const tickets = ticketSnapshot.val();
        const existingTicket = Object.values(tickets).find((ticket) => ticket.routeId === routeId);
  
        if (existingTicket) {
          Alert.alert(
            'Error',
            'Ya tienes un ticket para esta ruta. No puedes comprar otro.'
          );
          setLoading(false);
          return;
        }
      }
  
      // Obtener el nombre del destino desde la ruta
      const routeRef = ref(database, `routes/${routeId}`);
      const routeSnapshot = await get(routeRef);
  
      if (!routeSnapshot.exists()) {
        throw new Error('La ruta seleccionada no existe en la base de datos.');
      }
  
      const routeData = routeSnapshot.val();
      if (!routeData.destinationName || !routeData.driverName) {
        throw new Error('La ruta no tiene un nombre de destino o conductor asignado.');
      }
  
      // Crear un ticket en Firebase
      const newTicket = {
        routeId,
        userId: user.uid,
        destinationName: routeData.destinationName,
        driverName: routeData.driverName,
        createdAt: new Date().toISOString(),
      };
      const newTicketRef = await push(ticketRef, newTicket);
  
      // Generar el valor para el QR
      const qrValue = JSON.stringify({
        ticketId: newTicketRef.key,
        routeId,
        userId: user.uid,
      });
  
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        qrValue
      )}`;
      setQrImageUrl(apiUrl);
  
      // Incrementar el campo 'sold' en la ruta correspondiente
      await update(routeRef, {
        sold: increment(1),
      });
  
      setTicketGenerated(true);
      Alert.alert('Éxito', '¡Ticket generado correctamente!');
    } catch (error) {
      console.error('Error al generar el ticket:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el ticket. Intenta de nuevo.');
    }
    setLoading(false);
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Compra</Text>
      <Text style={styles.subtitle}>¿Deseas solicitar un ticket para esta ruta?</Text>

      {ticketGenerated ? (
        <View style={styles.qrContainer}>
          <Text style={styles.qrText}>Tu ticket:</Text>
          {qrImageUrl ? (
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backButtonText}>Regresar a Rutas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleBuyTicket} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirmar y Generar Ticket</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0288D1',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#0288D1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  qrImage: {
    marginTop: 20,
    width: 150,
    height: 150,
  },
});

export default BuyTicketScreen;
