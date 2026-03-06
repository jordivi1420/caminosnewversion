import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { ref, push, get } from "firebase/database";
import { database, auth } from "../../services/firebase";

const GOOGLE_MAPS_APIKEY = 'AIzaSyCbGm5vDx8uDuWnD6KH7ZESYQj-qP4-Kb4';

const DEFAULT_CAPACITY = 25;

const isValidCoordinate = (point) =>
  !!point &&
  typeof point.latitude === "number" &&
  typeof point.longitude === "number" &&
  !Number.isNaN(point.latitude) &&
  !Number.isNaN(point.longitude);

export default function CreateRouteScreen({ navigation }) {
  const mapRef = useRef(null);

  const [step, setStep] = useState(1);

  const [initializing, setInitializing] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [region, setRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [origin, setOrigin] = useState(null);
  const [originName, setOriginName] = useState("Mi ubicación actual");

  const [destination, setDestination] = useState(null);
  const [destinationName, setDestinationName] = useState("");

  const [driverName, setDriverName] = useState("Conductor");

  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [departureTime, setDepartureTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [routeCalcKey, setRouteCalcKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!mounted) return;

        if (status !== "granted") {
          setPermissionDenied(true);
          setInitializing(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (!mounted) return;

        const { latitude, longitude } = loc.coords;
        const coords = { latitude, longitude };

        setCurrentLocation(coords);
        setOrigin(coords);
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        try {
          const places = await Location.reverseGeocodeAsync(coords);
          const p = places?.[0];

          if (p && mounted) {
            const label = [p.street, p.city, p.region]
              .filter(Boolean)
              .join(", ");
            setOriginName(label ? `Mi ubicación • ${label}` : "Mi ubicación actual");
          }
        } catch {
          // silencio si falla el reverse geocode
        }
      } catch (error) {
        console.log("Error al inicializar ubicación:", error);
        Alert.alert("Error", "No se pudo obtener tu ubicación actual.");
      } finally {
        if (mounted) setInitializing(false);
      }
    };

    const fetchDriverName = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const snap = await get(ref(database, `users/${user.uid}`));
        const data = snap.val();

        if (mounted) {
          setDriverName(data?.name || "Conductor");
        }
      } catch {
        if (mounted) setDriverName("Conductor");
      }
    };

    initializeLocation();
    fetchDriverName();

    return () => {
      mounted = false;
    };
  }, []);

  const canContinue = useMemo(() => {
    return isValidCoordinate(origin) && isValidCoordinate(destination);
  }, [origin, destination]);

  const previewRegion = useMemo(() => {
    if (isValidCoordinate(origin)) {
      return {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return region;
  }, [origin, region]);

  const refreshCurrentLocationAsOrigin = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude, longitude } = loc.coords;
      const coords = { latitude, longitude };

      setCurrentLocation(coords);
      setOrigin(coords);

      try {
        const places = await Location.reverseGeocodeAsync(coords);
        const p = places?.[0];
        if (p) {
          const label = [p.street, p.city, p.region]
            .filter(Boolean)
            .join(", ");
          setOriginName(label ? `Mi ubicación • ${label}` : "Mi ubicación actual");
        } else {
          setOriginName("Mi ubicación actual");
        }
      } catch {
        setOriginName("Mi ubicación actual");
      }

      Alert.alert("Ubicación actualizada", "Se usó tu ubicación actual como origen.");
    } catch (error) {
      console.log("Error actualizando ubicación:", error);
      Alert.alert("Error", "No se pudo actualizar tu ubicación actual.");
    }
  };

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert("Faltan datos", "Selecciona origen y destino.");
      return;
    }

    if (!GOOGLE_MAPS_APIKEY) {
      Alert.alert(
        "Falta configuración",
        "Debes configurar EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para mostrar la vista previa de la ruta."
      );
      return;
    }

    setDistanceKm(null);
    setDurationMin(null);
    setRouteCalcKey((prev) => prev + 1);
    setStep(2);
  };

  const handleBackToPlanner = () => {
    setStep(1);
  };

  const handleRouteReady = (result) => {
    setLoadingRoute(false);
    setDistanceKm(result.distance);
    setDurationMin(result.duration);

    if (mapRef.current && Array.isArray(result.coordinates) && result.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 90, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }

    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      Alert.alert("Faltan datos", "Selecciona origen y destino.");
      return;
    }

    if (loadingRoute || distanceKm == null || durationMin == null) {
      Alert.alert("Espera", "Todavía estamos calculando la ruta.");
      return;
    }

    if (departureTime.getTime() < Date.now()) {
      Alert.alert("Fecha inválida", "La hora de salida no puede estar en el pasado.");
      return;
    }

    const arrivalISO = new Date(
      departureTime.getTime() + Math.round(durationMin) * 60000
    ).toISOString();

    const routeData = {
      origin,
      originName,
      destination,
      destinationName,

      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Math.round(durationMin),

      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalISO,
      date: departureTime.toISOString().split("T")[0],

      driverId: user.uid,
      driverName,
      driverRating: 4.5,

      capacity: DEFAULT_CAPACITY,
      passengersCount: 0,
      availableSeats: DEFAULT_CAPACITY,

      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      await push(ref(database, "routes"), routeData);

      Alert.alert("Éxito", "Ruta guardada correctamente.");
      navigation.popToTop();
    } catch (error) {
      console.log("Error guardando ruta:", error);
      Alert.alert("Error", "No se pudo guardar la ruta. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B74FF" />
        <Text style={styles.loadingText}>Preparando creador de rutas...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Permiso denegado</Text>
        <Text style={styles.errorText}>
          Debes permitir acceso a la ubicación para crear rutas con tu origen actual.
        </Text>
      </View>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={styles.plannerRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAF4FF" />
        <ScrollView
          contentContainerStyle={styles.plannerScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Planificación de ruta</Text>
            <Text style={styles.heroTitle}>Crea una ruta de forma más cómoda</Text>
            <Text style={styles.heroSubtitle}>
              Primero define origen y destino. Luego verás la vista previa completa con el mapa.
            </Text>
          </View>

          <View style={styles.searchPanel}>
            <View style={styles.searchHeader}>
              <View>
                <Text style={styles.searchTitle}>Nueva ruta</Text>
                <Text style={styles.searchSubtitle}>Completa los datos básicos</Text>
              </View>

              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Paso 1/2</Text>
              </View>
            </View>

            <View style={styles.fieldBlockTop}>
              <Text style={styles.fieldLabel}>Origen</Text>
              <GooglePlacesAutocomplete
                placeholder={originName || "Selecciona el origen"}
                fetchDetails
                enablePoweredByContainer={false}
                keyboardShouldPersistTaps="handled"
                onPress={(data, details = null) => {
                  const loc = details?.geometry?.location;
                  if (!loc) return;

                  setOrigin({ latitude: loc.lat, longitude: loc.lng });
                  setOriginName(data?.description || "Origen");
                }}
                query={{
                  key: GOOGLE_MAPS_APIKEY,
                  language: "es",
                }}
                styles={autocompleteStyles}
                textInputProps={{
                  placeholderTextColor: "#9CA3AF",
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.locationShortcut}
              onPress={refreshCurrentLocationAsOrigin}
            >
              <Text style={styles.locationShortcutText}>Usar mi ubicación actual</Text>
            </TouchableOpacity>

            <View style={styles.fieldBlockBottom}>
              <Text style={styles.fieldLabel}>Destino</Text>
              <GooglePlacesAutocomplete
                placeholder="Selecciona el destino"
                fetchDetails
                enablePoweredByContainer={false}
                keyboardShouldPersistTaps="handled"
                onPress={(data, details = null) => {
                  const loc = details?.geometry?.location;
                  if (!loc) return;

                  setDestination({ latitude: loc.lat, longitude: loc.lng });
                  setDestinationName(data?.description || "Destino");
                }}
                query={{
                  key: GOOGLE_MAPS_APIKEY,
                  language: "es",
                }}
                styles={autocompleteStyles}
                textInputProps={{
                  placeholderTextColor: "#9CA3AF",
                }}
              />
            </View>

            <View style={styles.routeMiniSummary}>
              <View style={styles.routeMiniRow}>
                <Text style={styles.routeMiniLabel}>Origen</Text>
                <Text style={styles.routeMiniValue} numberOfLines={1}>
                  {originName || "No seleccionado"}
                </Text>
              </View>

              <View style={styles.routeMiniDivider} />

              <View style={styles.routeMiniRow}>
                <Text style={styles.routeMiniLabel}>Destino</Text>
                <Text style={styles.routeMiniValue} numberOfLines={1}>
                  {destinationName || "No seleccionado"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBigBtn, !canContinue && styles.disabledBtn]}
              disabled={!canContinue}
              onPress={handleContinue}
            >
              <Text style={styles.primaryBigBtnText}>Ver vista previa de la ruta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.previewRoot}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={previewRegion}
        showsUserLocation
      >
        {isValidCoordinate(origin) && (
          <Marker coordinate={origin} title="Origen" description={originName} />
        )}

        {isValidCoordinate(destination) && (
          <Marker
            coordinate={destination}
            title="Destino"
            description={destinationName}
          />
        )}

        {isValidCoordinate(origin) && isValidCoordinate(destination) && !!GOOGLE_MAPS_APIKEY && (
          <MapViewDirections
            key={routeCalcKey}
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#0B74FF"
            onStart={() => setLoadingRoute(true)}
            onReady={handleRouteReady}
            onError={(err) => {
              setLoadingRoute(false);
              console.log("Directions error:", err);
              Alert.alert("Error", "No se pudo calcular la ruta.");
            }}
          />
        )}
      </MapView>

      <SafeAreaView style={styles.previewOverlay}>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>Confirmar ruta</Text>
              <Text style={styles.previewSubtitle}>Paso 2/2</Text>
            </View>

            <TouchableOpacity onPress={handleBackToPlanner}>
              <Text style={styles.changeLink}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.previewRouteText} numberOfLines={2}>
            {originName} → {destinationName || "Destino"}
          </Text>

          {loadingRoute ? (
            <View style={styles.loadingRouteBox}>
              <ActivityIndicator color="#0B74FF" />
              <Text style={styles.loadingRouteText}>Calculando ruta...</Text>
            </View>
          ) : (
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Distancia</Text>
                <Text style={styles.kpiValue}>
                  {distanceKm != null ? `${distanceKm.toFixed(2)} km` : "--"}
                </Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Duración</Text>
                <Text style={styles.kpiValue}>
                  {durationMin != null ? `${Math.round(durationMin)} min` : "--"}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>Fecha y hora de salida</Text>

          <TouchableOpacity
            style={styles.secondaryPreviewBtn}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.secondaryPreviewBtnText}>
              {moment(departureTime).format("DD/MM/YYYY HH:mm")}
            </Text>
          </TouchableOpacity>

          <View style={styles.driverPill}>
            <Text style={styles.driverPillText}>Conductor: {driverName}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, (saving || loadingRoute) && styles.disabledBtn]}
            disabled={saving || loadingRoute}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Guardando..." : "Guardar ruta"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <DateTimePickerModal
        isVisible={showPicker}
        mode="datetime"
        onConfirm={(d) => {
          setShowPicker(false);
          if (d) setDepartureTime(d);
        }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

const autocompleteStyles = {
  container: {
    flex: 0,
  },
  textInput: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
  },
  listView: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 6,
    zIndex: 9999,
  },
  row: {
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  description: {
    color: "#111827",
    fontSize: 14,
  },
};

const styles = StyleSheet.create({
  plannerRoot: {
    flex: 1,
    backgroundColor: "#EAF4FF",
  },

  plannerScroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 30,
  },

  heroCard: {
    backgroundColor: "#D8ECFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
  },

  searchPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  searchTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  searchSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  stepBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  stepBadgeText: {
    color: "#3730A3",
    fontSize: 12,
    fontWeight: "800",
  },

  fieldBlockTop: {
    zIndex: 30,
  },

  fieldBlockBottom: {
    zIndex: 20,
    marginTop: 10,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
  },

  locationShortcut: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 2,
  },

  locationShortcutText: {
    color: "#0B74FF",
    fontWeight: "800",
    fontSize: 13,
  },

  routeMiniSummary: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },

  routeMiniRow: {
    gap: 4,
  },

  routeMiniLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  routeMiniValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
  },

  routeMiniDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  primaryBigBtn: {
    marginTop: 16,
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  primaryBigBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  previewRoot: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  previewOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  previewCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  previewSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  changeLink: {
    color: "#0B74FF",
    fontWeight: "900",
    fontSize: 14,
  },

  previewRouteText: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: 14,
  },

  loadingRouteBox: {
    paddingVertical: 12,
    alignItems: "center",
  },

  loadingRouteText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: "700",
  },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  kpiCard: {
    flex: 1,
    backgroundColor: "#F4F7FF",
    borderRadius: 16,
    padding: 14,
  },

  kpiLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },

  kpiValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "900",
  },

  secondaryPreviewBtn: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryPreviewBtnText: {
    color: "#0B74FF",
    fontWeight: "900",
    fontSize: 15,
  },

  driverPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  driverPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },

  saveBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },

  errorText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
});