import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { ref, push,get } from 'firebase/database'; // Importa funciones de Firebase
import { database,auth } from '../../services/firebase';


const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4'; // Reemplaza con tu clave de Google Maps

const RouteSelector = () => {
  const [region, setRegion] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [destinationName, setDestinationName] = useState('');
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

        // Obtén el nombre del conductor desde Firebase
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
    if (!origin || !destination || !distance || !duration) {
      Alert.alert('Faltan datos', 'Por favor, asegúrate de seleccionar origen y destino.');
      return;
    }

    const routeData = {
      origin,
      destination,
      driverName,
      destinationName,
      distance: `${distance.toFixed(2)} km`,
      duration: `${duration.toFixed(2)} minutos`,
      departureTime: new Date().toISOString(), // Hora de salida actual
      arrivalTime: new Date(Date.now() + duration * 60000).toISOString(), // Calcula la hora de llegada
      driverRating: 4.5, // Puedes obtenerlo dinámicamente si tienes un sistema de calificaciones
      date: new Date().toISOString().split('T')[0], // Fecha actual
      passengers: 25, // Número de pasajeros (puedes ajustarlo)
    };

    try {
      const routeRef = ref(database, 'routes');
      await push(routeRef, routeData);
      Alert.alert('Éxito', 'Ruta guardada correctamente en Firebase.');
    } catch (error) {
      console.error('Error al guardar la ruta:', error);
      Alert.alert('Error', 'No se pudo guardar la ruta. Intenta nuevamente.');
    }
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
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
            onReady={(result) => {
              setDistance(result.distance);
              setDuration(result.duration);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              });
            }}
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
          setDestinationName(data.description || 'Destino desconocido'); // Asegura que el nombre no quede vacío
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

      {distance && duration && (
        <View style={styles.details}>
          <Text>Distancia: {distance.toFixed(2)} km</Text>
          <Text>Duración: {duration.toFixed(2)} minutos</Text>
          <Text>Distancia: {distance.toFixed(2)} km</Text>
          <Text>Destino: {destinationName}</Text>
          <Text>Conductor: {driverName}</Text>
          <Button title="Guardar Ruta" onPress={saveRouteToFirebase} />
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
    padding: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 10,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
  },
});

export default RouteSelector;
