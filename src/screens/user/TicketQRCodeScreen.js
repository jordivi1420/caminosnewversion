import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { ref, onValue,get } from 'firebase/database';
import { database } from '../../services/firebase';

const TicketQRCodeScreen = ({ route, navigation }) => {
  const { ticket } = route.params;

  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ticketRef = ref(database, `tickets/${ticket.userId}/${ticket.id}`);
    const routeRef = ref(database, `routes/${ticket.routeId}`);

    // Suscripción para escuchar cambios en el ticket
    const unsubscribeTicket = onValue(ticketRef, async (snapshot) => {
      if (snapshot.exists()) {
        const ticketData = snapshot.val();

        // Si el ticket es validado (used: true), redirigir al usuario
        if (ticketData.used) {
          try {
            const routeSnapshot = await get(routeRef);
            if (routeSnapshot.exists()) {
              setRouteDetails(routeSnapshot.val());
              // Redirigir automáticamente al mapa
              navigation.replace('RouteMapScreen', {
                origin: routeSnapshot.val().origin,
                destination: routeSnapshot.val().destination,
                routeId: ticket.routeId,
              });
            } else {
              Alert.alert('Error', 'No se encontraron detalles para esta ruta.');
            }
          } catch (error) {
            console.error('Error al obtener los detalles de la ruta:', error);
            Alert.alert('Error', 'No se pudo cargar la información de la ruta.');
          }
        }
      }
      setLoading(false);
    });

    // Limpieza de la suscripción
    return () => unsubscribeTicket();
  }, [ticket.userId, ticket.id, ticket.routeId, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Código QR del Ticket</Text>
      <View style={styles.qrContainer}>
        <Image
          source={{
            uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              JSON.stringify({
                userId: ticket.userId,
                ticketId: ticket.id,
              })
            )}`,
          }}
          style={styles.qrImage}
        />
      </View>
      <Text style={styles.infoText}>Esperando la validación del ticket...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  infoText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFA726',
    textAlign: 'center',
  },
});

export default TicketQRCodeScreen;
