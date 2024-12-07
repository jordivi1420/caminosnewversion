import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import moment from 'moment'; // Para manejar fechas y horas

const EventsScreen = ({ navigation }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = () => {
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
  
              // Procesar el campo 'sold' si es un objeto
              if (route.sold && typeof route.sold === 'object' && route.sold.increment) {
                route.sold = route.sold.increment;
              } else {
                route.sold = route.sold || 0;
              }
  
              return route;
            })
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
  
  

  const renderEventCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.destinationName}</Text>
          <Text style={styles.subtitle}>{item.routeName}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.sold}>Sold: {item.sold || 0}</Text>
          <Text style={styles.entered}>Entered: {item.entered || 0}</Text>
        </View>
        <Text style={styles.date}>
          Salida: {moment(item.departureTime).format('YYYY-MM-DD HH:mm')}
        </Text>
        <Text style={styles.date}>
          Llegada: {moment(item.arrivalTime).format('YYYY-MM-DD HH:mm')}
        </Text>
      </View>
      <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('BuyTicketScreen', { routeId: item.id })}
>
  <Text style={styles.buttonText}>Buy Ticket</Text>
</TouchableOpacity>

    </View>
  );
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eventCount}>{routes.length} Rutas disponibles</Text>
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
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
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
  },
  button: {
    backgroundColor: '#0288D1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  },
});

export default EventsScreen;
