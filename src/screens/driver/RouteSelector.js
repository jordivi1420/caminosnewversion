import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { ref, push, get, serverTimestamp } from 'firebase/database';
import { database, auth } from '../../services/firebase';
import moment from 'moment';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4';

const DEFAULT_CAPACITY = 25;

const isValidCoordinate = (point) => {
  return (
    point &&
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number' &&
    !Number.isNaN(point.latitude) &&
    !Number.isNaN(point.longitude)
  );
};

const RouteSelector = ({ navigation }) => {
  const mapRef = useRef(null);

  const [region, setRegion] = useState(null);

  // GPS real del conductor al momento de crear la ruta
  const [currentLocation, setCurrentLocation] = useState(null);

  // Origen planificado de la ruta
  const [origin, setOrigin] = useState(null);
  const [originName, setOriginName] = useState('');

  // Destino planificado
  const [destination, setDestination] = useState(null);
  const [destinationName, setDestinationName] = useState('');

  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  const [driverName, setDriverName] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [savingRoute, setSavingRoute] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeScreen = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) return;

        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación.');
          setInitializing(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (!isMounted) return;

        const { latitude, longitude, accuracy } = location.coords;
        const current = { latitude, longitude };

        setCurrentLocation(current);
        setOrigin(current);
        setOriginName('Ubicación actual');
        setLocationAccuracy(typeof accuracy === 'number' ? accuracy : null);

        const initialRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setRegion(initialRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(initialRegion, 700);
        }
      } catch (error) {
        console.error('Error al obtener la ubicación inicial:', error);
        Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    const fetchDriverName = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setDriverName('Conductor desconocido');
          return;
        }

        const snapshot = await get(ref(database, `users/${user.uid}`));
        const data = snapshot.val();

        if (!isMounted) return;

        if (data?.name) {
          setDriverName(data.name);
        } else {
          setDriverName('Conductor desconocido');
        }
      } catch (error) {
        console.error('Error al obtener el nombre del conductor:', error);
        if (isMounted) {
          setDriverName('Conductor desconocido');
        }
      }
    };

    initializeScreen();
    fetchDriverName();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDatePickerConfirm = (selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDepartureTime(selectedDate);
    }
  };

  const handleRouteReady = (result) => {
    setLoadingRoute(false);
    setDistance(result.distance);
    setDuration(result.duration);

    if (mapRef.current && Array.isArray(result.coordinates) && result.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 90, right: 50, bottom: 240, left: 50 },
        animated: true,
      });
    }
  };

  const handleRouteError = (errorMessage) => {
    console.error('Error al calcular la ruta:', errorMessage);
    setLoadingRoute(false);
    Alert.alert('Error', 'No se pudo calcular la ruta.');
  };

  const saveRouteToFirebase = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }

    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      Alert.alert('Faltan datos', 'Debes seleccionar un origen y un destino válidos.');
      return;
    }

    if (distance == null || duration == null) {
      Alert.alert('Faltan datos', 'Primero calcula una ruta válida.');
      return;
    }

    if (!destinationName.trim()) {
      Alert.alert('Faltan datos', 'Debes seleccionar el destino.');
      return;
    }

    if (departureTime.getTime() < Date.now()) {
      Alert.alert('Fecha inválida', 'La hora de salida no puede estar en el pasado.');
      return;
    }

    try {
      setSavingRoute(true);

      const durationMin = Math.round(duration);
      const distanceKm = Number(distance.toFixed(2));

      const routeData = {
        origin,
        originName: originName || 'Ubicación actual',
        destination,
        destinationName,
        driverName: driverName || 'Conductor desconocido',
        driverId: user.uid,

        currentLocationAtCreation: currentLocation || origin,
        currentLocationAccuracy:
          typeof locationAccuracy === 'number' ? Number(locationAccuracy.toFixed(2)) : null,

        distanceKm,
        durationMin,
        distance: `${distanceKm.toFixed(2)} km`,
        duration: `${durationMin} min`,

        departureTime: departureTime.toISOString(),
        arrivalTime: new Date(
          departureTime.getTime() + durationMin * 60 * 1000
        ).toISOString(),

        date: departureTime.toISOString().split('T')[0],
        status: 'scheduled',

        capacity: DEFAULT_CAPACITY,
        passengers: DEFAULT_CAPACITY,
        availableSeats: DEFAULT_CAPACITY,

        driverRating: 4.5,

        startedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await push(ref(database, 'routes'), routeData);

      Alert.alert('Éxito', 'Ruta guardada correctamente.');
      navigation.navigate('EventsScreen');
    } catch (error) {
      console.error('Error al guardar la ruta:', error);
      Alert.alert('Error', 'No se pudo guardar la ruta. Intenta nuevamente.');
    } finally {
      setSavingRoute(false);
    }
  };

  const useMyCurrentLocationAsOrigin = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude, longitude, accuracy } = location.coords;
      const current = { latitude, longitude };

      setCurrentLocation(current);
      setOrigin(current);
      setOriginName('Ubicación actual');
      setLocationAccuracy(typeof accuracy === 'number' ? accuracy : null);

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          700
        );
      }
    } catch (error) {
      console.error('Error al actualizar ubicación actual:', error);
      Alert.alert('Error', 'No se pudo actualizar tu ubicación actual.');
    }
  };

  if (initializing || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
      >
        {isValidCoordinate(origin) && (
          <Marker coordinate={origin} title="Origen planificado" pinColor="green" />
        )}

        {isValidCoordinate(destination) && (
          <Marker coordinate={destination} title="Destino" pinColor="red" />
        )}

        {isValidCoordinate(currentLocation) && (
          <Marker coordinate={currentLocation} title="Tu ubicación actual" pinColor="blue" />
        )}

        {isValidCoordinate(origin) && isValidCoordinate(destination) && GOOGLE_MAPS_APIKEY ? (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            onStart={() => setLoadingRoute(true)}
            onReady={handleRouteReady}
            onError={handleRouteError}
          />
        ) : null}
      </MapView>

      <View style={styles.searchWrapperTop}>
        <GooglePlacesAutocomplete
          placeholder="Selecciona el origen"
          fetchDetails
          enablePoweredByContainer={false}
          keyboardShouldPersistTaps="handled"
          onPress={(data, details = null) => {
            const lat = details?.geometry?.location?.lat;
            const lng = details?.geometry?.location?.lng;

            if (typeof lat !== 'number' || typeof lng !== 'number') {
              Alert.alert('Error', 'No se pudo obtener la ubicación del origen.');
              return;
            }

            const selectedOrigin = { latitude: lat, longitude: lng };
            setOrigin(selectedOrigin);
            setOriginName(data?.description || 'Origen seleccionado');

            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                700
              );
            }
          }}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'es',
          }}
          styles={autocompleteStyles}
        />
      </View>

      <View style={styles.searchWrapperMiddle}>
        <GooglePlacesAutocomplete
          placeholder="Selecciona el destino"
          fetchDetails
          enablePoweredByContainer={false}
          keyboardShouldPersistTaps="handled"
          onPress={(data, details = null) => {
            const lat = details?.geometry?.location?.lat;
            const lng = details?.geometry?.location?.lng;

            if (typeof lat !== 'number' || typeof lng !== 'number') {
              Alert.alert('Error', 'No se pudo obtener la ubicación del destino.');
              return;
            }

            setDestination({ latitude: lat, longitude: lng });
            setDestinationName(data?.description || 'Destino desconocido');
          }}
          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: 'es',
          }}
          styles={autocompleteStyles}
        />
      </View>

      <DateTimePickerModal
        isVisible={showPicker}
        mode="datetime"
        onConfirm={handleDatePickerConfirm}
        onCancel={() => setShowPicker(false)}
      />

      <View style={styles.details}>
        {!GOOGLE_MAPS_APIKEY && (
          <Text style={[styles.detailText, styles.warningText]}>
            Falta configurar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
          </Text>
        )}

        {loadingRoute ? (
          <ActivityIndicator size="large" color="#0288D1" />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Resumen de la ruta</Text>

            <Text style={styles.detailText}>
              Origen: {originName || 'No definido'}
            </Text>

            <Text style={styles.detailText}>
              Destino: {destinationName || 'No definido'}
            </Text>

            {distance != null && duration != null && (
              <>
                <Text style={styles.detailText}>
                  Distancia: {distance.toFixed(2)} km
                </Text>
                <Text style={styles.detailText}>
                  Duración: {Math.round(duration)} min
                </Text>
              </>
            )}

            {locationAccuracy != null && (
              <Text style={styles.detailText}>
                Precisión GPS inicial: {Math.round(locationAccuracy)} m
              </Text>
            )}

            <Text style={styles.detailText}>
              Fecha y hora seleccionada: {moment(departureTime).format('DD/MM/YYYY HH:mm')}
            </Text>

            <TouchableOpacity style={styles.secondaryButton} onPress={useMyCurrentLocationAsOrigin}>
              <Text style={styles.buttonText}>Usar mi ubicación actual como origen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.buttonText}>Seleccionar fecha y hora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, savingRoute && { opacity: 0.7 }]}
              onPress={saveRouteToFirebase}
              disabled={savingRoute}
            >
              {savingRoute ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Guardar ruta</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const autocompleteStyles = {
  container: {
    flex: 0,
  },
  textInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  listView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 6,
    elevation: 5,
    zIndex: 9999,
  },
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },

  searchWrapperTop: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 30,
  },

  searchWrapperMiddle: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    zIndex: 20,
  },

  details: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  detailText: {
    fontSize: 14,
    marginVertical: 4,
    color: '#374151',
  },

  warningText: {
    color: '#B45309',
    fontWeight: '700',
    marginBottom: 6,
  },

  secondaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 10,
  },

  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default RouteSelector;