import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
 Alert,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { database } from '../../services/firebase';
import { ref, update, serverTimestamp } from 'firebase/database';
import haversine from 'haversine';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4';

const ARRIVAL_THRESHOLD_METERS = 50;
const DIRECTIONS_REFRESH_DISTANCE_METERS = 80;
const DIRECTIONS_REFRESH_INTERVAL_MS = 15000;

const isValidCoordinate = (point) => {
  return (
    point &&
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number' &&
    !Number.isNaN(point.latitude) &&
    !Number.isNaN(point.longitude)
  );
};

const RouteMapScreen = ({ route, navigation }) => {
  const { origin, destination, routeId } = route.params || {};

  const [currentLocation, setCurrentLocation] = useState(null);
  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [isFinishingRoute, setIsFinishingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  const mapRef = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const completionGuardRef = useRef(false);
  const hasFittedMapRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastDirectionsUpdateAtRef = useRef(0);
  const lastDirectionsLocationRef = useRef(null);

  const hasValidRoutePoints =
    isValidCoordinate(origin) && isValidCoordinate(destination);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    const handleBackPress = () => {
      if (routeCompleted || isFinishingRoute) {
        return false;
      }

      Alert.alert(
        'Ruta en curso',
        'No puedes salir de la pantalla hasta que finalices la ruta.',
        [{ text: 'Entendido' }]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      if (routeCompleted || isFinishingRoute) {
        return;
      }

      e.preventDefault();
      Alert.alert(
        'Ruta en curso',
        'No puedes salir de la pantalla hasta que finalices la ruta.',
        [{ text: 'Entendido' }]
      );
    });

    return () => {
      backHandler.remove();
      unsubscribeBeforeRemove();
    };
  }, [navigation, routeCompleted, isFinishingRoute]);

  useEffect(() => {
    isMountedRef.current = true;

    const startTrackingLocation = async () => {
      if (!hasValidRoutePoints) {
        setRouteError('No se encontraron datos válidos para la ruta.');
        setLoading(false);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMountedRef.current) return;

        if (status !== 'granted') {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!isMountedRef.current) return;

        const initialLocation = {
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
        };

        setCurrentLocation(initialLocation);
        setDirectionsOrigin(initialLocation);
        lastDirectionsLocationRef.current = initialLocation;
        lastDirectionsUpdateAtRef.current = Date.now();
        setLoading(false);

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          async (location) => {
            if (!isMountedRef.current || completionGuardRef.current) return;

            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            setCurrentLocation(newLocation);

            const now = Date.now();
            const lastDirectionsLocation = lastDirectionsLocationRef.current;

            const movedEnough =
              !lastDirectionsLocation ||
              haversine(lastDirectionsLocation, newLocation, {
                unit: 'meter',
              }) >= DIRECTIONS_REFRESH_DISTANCE_METERS;

            const waitedEnough =
              now - lastDirectionsUpdateAtRef.current >=
              DIRECTIONS_REFRESH_INTERVAL_MS;

            if (movedEnough || waitedEnough) {
              setDirectionsOrigin(newLocation);
              lastDirectionsLocationRef.current = newLocation;
              lastDirectionsUpdateAtRef.current = now;
            }

            const distanceToDestination = haversine(newLocation, destination, {
              unit: 'meter',
            });

            if (
              distanceToDestination <= ARRIVAL_THRESHOLD_METERS &&
              !completionGuardRef.current
            ) {
              completionGuardRef.current = true;
              setIsFinishingRoute(true);

              try {
                await update(ref(database, `routes/${routeId}`), {
                  status: 'completed',
                  completedAt: serverTimestamp(),
                  currentLocation: newLocation,
                });

                if (locationSubscriptionRef.current) {
                  locationSubscriptionRef.current.remove();
                  locationSubscriptionRef.current = null;
                }

                if (!isMountedRef.current) return;

                setRouteCompleted(true);
                setIsFinishingRoute(false);

                Alert.alert(
                  'Ruta finalizada',
                  'Has llegado al destino con éxito.',
                  [
                    {
                      text: 'Aceptar',
                      onPress: () => navigation.replace('Dashboard'),
                    },
                  ],
                  { cancelable: false }
                );
              } catch (error) {
                console.error('Error al finalizar la ruta:', error);
                completionGuardRef.current = false;
                setIsFinishingRoute(false);

                Alert.alert(
                  'Error',
                  'No se pudo marcar la ruta como finalizada.'
                );
              }
            }
          }
        );
      } catch (error) {
        console.error('Error al iniciar seguimiento de ubicación:', error);

        if (!isMountedRef.current) return;

        setRouteError('Hubo un problema al cargar el mapa o la ubicación.');
        setLoading(false);
      }
    };

    startTrackingLocation();

    return () => {
      isMountedRef.current = false;

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [hasValidRoutePoints, destination, routeId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Obteniendo ubicación y cargando mapa...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Permiso denegado</Text>
        <Text style={styles.messageText}>
          No se puede acceder a la ubicación en tiempo real sin permiso.
        </Text>
      </View>
    );
  }

  if (routeError || !hasValidRoutePoints || !currentLocation) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Error en la ruta</Text>
        <Text style={styles.messageText}>
          {routeError || 'No se encontraron coordenadas válidas para mostrar el mapa.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => {
          console.log('Mapa listo');
        }}
      >
        <Marker
          coordinate={currentLocation}
          title="Vehículo"
          description="Ubicación actual"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Image
            source={require('../../../assets/coche.png')}
            style={styles.vehicleIcon}
            resizeMode="contain"
          />
        </Marker>

        <Marker coordinate={destination} title="Destino" description="Punto final" />

        {GOOGLE_MAPS_APIKEY ? (
          <MapViewDirections
            origin={directionsOrigin || currentLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            onStart={(params) => {
              console.log(
                `Trazando ruta desde ${params.origin} hasta ${params.destination}`
              );
            }}
            onReady={(result) => {
              console.log('Ruta trazada exitosamente:', result);

              if (mapRef.current && !hasFittedMapRef.current) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: 80,
                    right: 50,
                    bottom: 120,
                    left: 50,
                  },
                  animated: true,
                });

                hasFittedMapRef.current = true;
              }
            }}
            onError={(errorMessage) => {
              console.error('Error al trazar la ruta:', errorMessage);
            }}
          />
        ) : null}
      </MapView>

      {!GOOGLE_MAPS_APIKEY && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Falta configurar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para mostrar la ruta guiada.
          </Text>
        </View>
      )}

      {isFinishingRoute && (
        <View style={styles.finishingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.finishingText}>Finalizando ruta...</Text>
        </View>
      )}
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
    paddingHorizontal: 24,
  },

  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },

  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },

  messageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },

  messageText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  vehicleIcon: {
    width: 34,
    height: 34,
  },

  warningBanner: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.70)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  warningText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },

  finishingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  finishingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
});

export default RouteMapScreen;