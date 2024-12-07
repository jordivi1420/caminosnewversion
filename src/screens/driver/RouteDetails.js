import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Alert } from 'react-native';
import { database } from '../../services/firebase';
import { ref, get, update } from 'firebase/database';
import moment from 'moment';

const RouteDetails = ({ route, navigation }) => {
  const { routeId } = route.params;
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        const snapshot = await get(ref(database, `routes/${routeId}`));
        if (snapshot.exists()) {
          const routeData = snapshot.val();
          setRouteDetails(routeData);
          setIsRouteStarted(routeData.status === 'started');

          // Verificar si la hora actual permite habilitar el botón
          const departureTime = moment(routeData.departureTime);
          const now = moment();

          if (now.isAfter(departureTime.add(1, 'second'))) {
            setIsButtonEnabled(true);
          } else {
            const timeDifference = departureTime.diff(now, 'milliseconds') + 1000;
            setTimeout(() => {
              setIsButtonEnabled(true);
            }, timeDifference);
          }
        } else {
          console.error('Ruta no encontrada.');
        }
      } catch (error) {
        console.error('Error al obtener los detalles de la ruta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteDetails();
  }, [routeId]);

  const handleStartRoute = async () => {
    try {
      await update(ref(database, `routes/${routeId}`), {
        status: 'started',
        startedAt: new Date().toISOString(),
      });
      setIsRouteStarted(true);
      Alert.alert('Ruta Iniciada', 'La ruta ha comenzado correctamente.');

      // Redirigir al mapa con los datos de la ruta
      navigation.navigate('RouteMap', {
        origin: routeDetails.origin,
        destination: routeDetails.destination,
      });
    } catch (error) {
      console.error('Error al iniciar la ruta:', error);
      Alert.alert('Error', 'Hubo un problema al iniciar la ruta. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando detalles de la ruta...</Text>
      </View>
    );
  }

  if (!routeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontraron detalles para esta ruta.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{routeDetails.destinationName}</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Origen:</Text>
        <Text style={styles.value}>{routeDetails.routeName}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Destino:</Text>
        <Text style={styles.value}>{routeDetails.destinationName}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Distancia:</Text>
        <Text style={styles.value}>{routeDetails.distance}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Duración:</Text>
        <Text style={styles.value}>{routeDetails.duration}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Hora de salida:</Text>
        <Text style={styles.value}>
          {moment(routeDetails.departureTime).format('DD/MM/YYYY HH:mm')}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Hora estimada de llegada:</Text>
        <Text style={styles.value}>
          {moment(routeDetails.arrivalTime).format('DD/MM/YYYY HH:mm')}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Conductor:</Text>
        <Text style={styles.value}>{routeDetails.driverName}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Calificación del conductor:</Text>
        <Text style={styles.value}>{routeDetails.driverRating}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Pasajeros disponibles:</Text>
        <Text style={styles.value}>{routeDetails.passengers}</Text>
      </View>
      {!isRouteStarted ? (
        <View style={styles.buttonContainer}>
          <Button
            title="Iniciar Ruta"
            onPress={handleStartRoute}
            color="#0288D1"
            disabled={!isButtonEnabled}
          />
        </View>
      ) : (
        <View style={styles.statusContainer}>
          <Text style={styles.startedText}>Ruta en curso</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E53935',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0288D1',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 18,
    color: '#333',
    marginTop: 4,
    fontWeight: '400',
  },
  buttonContainer: {
    marginTop: 20,
  },
  statusContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  startedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0288D1',
  },
});

export default RouteDetails;
