import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { database } from '../../services/firebase'; // Asegúrate de que apunte a tu configuración de Firebase
import { ref, onValue } from 'firebase/database';

const EventsScreen = ({ navigation }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const routesRef = ref(database, 'routes');
    const unsubscribe = onValue(routesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedRoutes = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setRoutes(parsedRoutes);
      } else {
        setRoutes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpia la suscripción
  }, []);

  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.location}>{item.destinationName}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.sold}>vendido: {item.sold}</Text>
          <Text style={styles.entered}>Disponibles: {item.entered}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
        <Text style={styles.extraInfo}>
          Distancia: {item.distance} | Tiempo: {item.time}
        </Text>
        <Text style={styles.extraInfo}>
          Conductor: {item.driverName} | Rating: {item.rating}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text>Cargando rutas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eventCount}>{routes.length} Rutas</Text>
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
    backgroundColor: '#F3F4F6', // Fondo más claro para resaltar las tarjetas
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Bordes más redondeados
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Sombra para Android
    borderWidth: 1,
    borderColor: '#E0E0E0', // Bordes sutiles para un look moderno
  },
  cardContent: {
    flex: 1,
    paddingRight: 10, // Espaciado para el icono
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18, // Texto más grande
    fontWeight: 'bold',
    color: '#333',
  },
  location: {
    fontSize: 16,
    color: '#0288D1', // Color destacado para la ubicación
    marginLeft: 8,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  sold: {
    fontSize: 14,
    color: '#FF7043', // Color para llamar la atención
    fontWeight: '600',
  },
  entered: {
    fontSize: 14,
    color: 'green',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  extraInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 24,
    color: '#0288D1', // Color acorde con el diseño
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#0288D1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
});


export default EventsScreen;
