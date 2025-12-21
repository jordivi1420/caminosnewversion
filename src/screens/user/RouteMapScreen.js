import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, BackHandler } from 'react-native';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { database } from '../../services/firebase';
import { ref, remove } from 'firebase/database';
import haversine from 'haversine';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4';

const RouteMapScreen = ({ route, navigation }) => {
  const { origin, destination, routeId } = route.params;

  const [currentLocation, setCurrentLocation] = useState(origin);
  const [mapReady, setMapReady] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const mapRef = useRef(null);
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude: origin.latitude,
      longitude: origin.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  useEffect(() => {
    let locationSubscription;

    const startTrackingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación en tiempo real.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const newLocation = { latitude, longitude };
          animatedRegion.timing({
            latitude,
            longitude,
            duration: 500,
          }).start();
          setCurrentLocation(newLocation);

          const distanceToDestination = haversine(newLocation, destination, { unit: 'meter' });
          if (distanceToDestination < 50) {
            Alert.alert('Ruta finalizada', 'Has llegado al destino con éxito.');
            try {
              const routeRef = ref(database, `routes/${routeId}`);
              await remove(routeRef);
              console.log('Ruta eliminada exitosamente de Firebase');
            } catch (error) {
              console.error('Error al eliminar la ruta de Firebase:', error);
              Alert.alert('Error', 'No se pudo eliminar la ruta de Firebase.');
            }
            if (locationSubscription) locationSubscription.remove();
            setRouteCompleted(true);
            navigation.replace('Dashboard');
          }
        }
      );
    };

    if (origin && destination) {
      setMapReady(true);
      startTrackingLocation();
    } else {
      Alert.alert('Error', 'No se encontraron datos válidos para la ruta.');
    }

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [origin, destination]);

  useEffect(() => {
    const handleBackPress = () => {
      if (!routeCompleted) {
        Alert.alert('Ruta en curso', 'No puedes salir de la pantalla hasta que finalices la ruta.', [
          { text: 'Entendido' },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [routeCompleted]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  if (!mapReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando datos del mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker.Animated
          coordinate={animatedRegion}
          title="Vehículo"
          description="Ubicación actual"
        />

        <Marker coordinate={destination} title="Destino" description="Punto final" />

        <MapViewDirections
          origin={currentLocation}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={4}
          strokeColor="blue"
          onReady={(result) => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
          onError={(errorMessage) => {
            console.error('Error al trazar la ruta:', errorMessage);
            Alert.alert('Error al trazar la ruta', errorMessage);
          }}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
});

export default RouteMapScreen;
