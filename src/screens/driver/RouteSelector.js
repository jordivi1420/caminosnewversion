import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { ref, push, get } from 'firebase/database';
import { database, auth } from '../../services/firebase';
import moment from 'moment';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4';

const RouteSelector = ({ navigation }) => {
  const [region, setRegion] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false); // Indica si se está calculando la ruta
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      setOrigin({ latitude, longitude });
    })();

    const fetchDriverName = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const snapshot = await get(ref(database, `users/${user.uid}`));
          const data = snapshot.val();
          if (data && data.name) {
            setDriverName(data.name);
          } else {
            setDriverName('Conductor desconocido');
          }
        }
      } catch (error) {
        console.error('Error al obtener el nombre del conductor:', error);
        setDriverName('Conductor desconocido');
      }
    };

    fetchDriverName();
  }, []);

  const saveRouteToFirebase = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
  
    if (!origin || !destination || !distance || !duration) {
      Alert.alert('Faltan datos', 'Por favor, asegúrate de llenar todos los campos.');
      return;
    }
  
    const routeData = {
      origin,
      destination,
      driverName,
      destinationName,
      distance: `${distance.toFixed(2)} km`,
      duration: `${duration.toFixed(2)} minutos`,
      departureTime: departureTime.toISOString(),
      arrivalTime: new Date(departureTime.getTime() + duration * 60000).toISOString(),
      driverRating: 4.5,
      date: departureTime.toISOString().split('T')[0],
      passengers: 25,
      driverId: user.uid, // Asociar la ruta al UID del conductor actual
    };
  
    try {
      const routeRef = ref(database, 'routes');
      await push(routeRef, routeData);
      Alert.alert('Éxito', 'Ruta guardada correctamente en Firebase.');
      navigation.navigate('EventsScreen'); // Redirigir al EventsScreen
    } catch (error) {
      console.error('Error al guardar la ruta:', error);
      Alert.alert('Error', 'No se pudo guardar la ruta. Intenta nuevamente.');
    }
  };
  

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
    mapRef.current.fitToCoordinates(result.coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
    });
  };

  if (!region) {
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
        followsUserLocation
      >
        {origin && <Marker coordinate={origin} title="Origen" />}
        {destination && <Marker coordinate={destination} title="Destino" />}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            onStart={() => setLoadingRoute(true)}
            onReady={handleRouteReady}
          />
        )}
      </MapView>

      <GooglePlacesAutocomplete
        placeholder="Selecciona el origen"
        fetchDetails
        onPress={(data, details = null) => {
          const { lat, lng } = details.geometry.location;
          setOrigin({ latitude: lat, longitude: lng });
        }}
        query={{
          key: GOOGLE_MAPS_APIKEY,
          language: 'es',
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.textInput,
        }}
      />

      <GooglePlacesAutocomplete
        placeholder="Selecciona el destino"
        fetchDetails
        onPress={(data, details = null) => {
          const { lat, lng } = details.geometry.location;
          setDestination({ latitude: lat, longitude: lng });
          setDestinationName(data.description || 'Destino desconocido');
        }}
        query={{
          key: GOOGLE_MAPS_APIKEY,
          language: 'es',
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.textInput,
        }}
      />

      <DateTimePickerModal
        isVisible={showPicker}
        mode="datetime"
        onConfirm={handleDatePickerConfirm}
        onCancel={() => setShowPicker(false)}
      />

      <View style={styles.details}>
        {loadingRoute ? (
          <ActivityIndicator size="large" color="#0288D1" />
        ) : (
          <>
            {distance && duration && (
              <>
                <Text style={styles.detailText}>Distancia: {distance.toFixed(2)} km</Text>
                <Text style={styles.detailText}>Duración: {duration.toFixed(2)} minutos</Text>
              </>
            )}
            <Text style={styles.detailText}>
              Fecha y hora seleccionada: {moment(departureTime).format('DD/MM/YYYY HH:mm')}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.buttonText}>Seleccionar fecha y hora</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSave} onPress={saveRouteToFirebase}>
              <Text style={styles.buttonText}>Guardar Ruta</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 10,
    width: '90%',
    alignSelf: 'center',
  },
  textInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  details: {
    padding: 15,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 10,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonSave: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RouteSelector;
