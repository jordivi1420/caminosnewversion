import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { database, auth } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import moment from 'moment';

const EventsScreen = ({ navigation }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = () => {
      const user = auth.currentUser; // Obtén el usuario actual
      if (!user) {
        console.error("No hay un usuario autenticado");
        setLoading(false);
        return;
      }
  
      const driverId = user.uid; // Asume que el UID del usuario coincide con el `driverId`
      const routesRef = ref(database, 'routes');
      onValue(routesRef, (snapshot) => {
        const data = snapshot.val();
  
        if (data) {
          const currentTime = moment(); // Hora actual
          const parsedRoutes = Object.keys(data)
            .map((key) => {
              const route = {
                id: key,
                ...data[key],
              };
  
              // Filtrar solo rutas del conductor actual
              if (route.driverId !== driverId) {
                return null;
              }
  
              // Procesar el campo 'sold' si es un objeto
              if (route.sold && typeof route.sold === 'object' && route.sold.increment) {
                route.sold = route.sold.increment;
              } else {
                route.sold = route.sold || 0;
              }
  
              return route;
            })
            .filter((route) => route !== null) // Elimina las rutas de otros conductores
            .filter((route) => {
              const arrivalTime = moment(route.arrivalTime);
              return currentTime.isBefore(arrivalTime); // Solo rutas vigentes
            });
  
          setRoutes(parsedRoutes);
        } else {
          setRoutes([]);
        }
  
        setLoading(false);
      });
    };
  
    fetchRoutes();
  }, []);
  
  

  // Intervalo para deshabilitar rutas expiradas
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTime = moment(); // Hora actual

      // Filtra rutas vigentes y actualiza el estado
      setRoutes((prevRoutes) =>
        prevRoutes.filter((route) => {
          const arrivalTime = moment(route.arrivalTime);
          return currentTime.isBefore(arrivalTime); // Solo muestra rutas antes de la hora de llegada
        })
      );
    }, 60000); // Verifica cada minuto (ajustable según la precisión que necesites)

    return () => clearInterval(intervalId); // Limpia el intervalo al desmontar
  }, []);

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.destinationName}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.sold}>Usados: {item.sold || 0}</Text>
          <Text style={styles.entered}>Disponibles: {item.availableSeats || 0}</Text>
        </View>
        <Text style={styles.date}>
          Salida: {moment(item.departureTime).format('DD/MM/YYYY HH:mm')}
        </Text>
        <Text style={styles.extraInfo}>Distancia: {item.distance}</Text>
        <Text style={styles.extraInfo}>Duración: {item.duration}</Text>
        <Text style={styles.extraInfo}>
          Conductor: {item.driverName} | Rating: {item.driverRating}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando rutas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eventCount}>{routes.length} Rutas Disponibles</Text>
      <FlatList
        data={routes}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    paddingRight: 10,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  sold: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  entered: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  extraInfo: {
    fontSize: 14,
    color: '#636366',
    marginTop: 4,
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
});

export default EventsScreen;
