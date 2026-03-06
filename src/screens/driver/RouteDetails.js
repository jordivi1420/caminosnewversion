import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { database } from "../../services/firebase";
import { ref, get, update, onValue, off } from "firebase/database";
import moment from "moment";

const RouteDetails = ({ route, navigation }) => {
  const { routeId } = route.params;

  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const enableTimeoutRef = useRef(null);

  // ✅ Escuchar cambios en tiempo real (si inicia ruta desde otro lado, se actualiza)
  useEffect(() => {
    const routeRef = ref(database, `routes/${routeId}`);

    const unsub = onValue(
      routeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRouteDetails(snapshot.val());
        } else {
          setRouteDetails(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener detalles:", error);
        setLoading(false);
      }
    );

    return () => {
      // off por seguridad
      off(routeRef);
      if (enableTimeoutRef.current) clearTimeout(enableTimeoutRef.current);
      // unsub a veces no existe en versiones, por eso usamos off arriba
      if (typeof unsub === "function") unsub();
    };
  }, [routeId]);

  const status = routeDetails?.status || "scheduled";
  const isRouteStarted = status === "started";

  // ✅ Normalizar campos (compatibilidad con rutas viejas y nuevas)
  const originLabel =
    routeDetails?.originName ||
    routeDetails?.routeName ||
    "Origen (sin nombre)";

  const destinationLabel =
    routeDetails?.destinationName || "Destino (sin nombre)";

  const departureMoment = useMemo(() => {
    const t = routeDetails?.departureTime;
    return t ? moment(t) : null;
  }, [routeDetails?.departureTime]);

  const arrivalMoment = useMemo(() => {
    const t = routeDetails?.arrivalTime;
    return t ? moment(t) : null;
  }, [routeDetails?.arrivalTime]);

  const distanceText = useMemo(() => {
    if (!routeDetails) return "--";
    if (typeof routeDetails.distanceKm === "number")
      return `${routeDetails.distanceKm.toFixed(2)} km`;
    if (routeDetails.distance) return String(routeDetails.distance);
    return "--";
  }, [routeDetails]);

  const durationText = useMemo(() => {
    if (!routeDetails) return "--";
    if (typeof routeDetails.durationMin === "number")
      return `${Math.round(routeDetails.durationMin)} min`;
    if (routeDetails.duration) return String(routeDetails.duration);
    return "--";
  }, [routeDetails]);

  const seats = useMemo(() => {
    if (!routeDetails) return { available: "--", capacity: "--" };

    const capacity =
      routeDetails.capacity ??
      (typeof routeDetails.passengers === "number" ? routeDetails.passengers : 25);

    const available =
      routeDetails.availableSeats ??
      (typeof routeDetails.availableSeats === "number"
        ? routeDetails.availableSeats
        : capacity);

    return { available, capacity };
  }, [routeDetails]);

  // ✅ Habilitar botón solo cuando ya pasó la hora de salida
  useEffect(() => {
    if (!routeDetails?.departureTime) {
      setIsButtonEnabled(true);
      return;
    }

    if (enableTimeoutRef.current) clearTimeout(enableTimeoutRef.current);

    const now = moment();
    const dep = moment(routeDetails.departureTime);

    // Si ya pasó la hora, habilita
    if (now.isSameOrAfter(dep)) {
      setIsButtonEnabled(true);
      return;
    }

    setIsButtonEnabled(false);
    const ms = Math.max(dep.diff(now, "milliseconds"), 0);

    enableTimeoutRef.current = setTimeout(() => {
      setIsButtonEnabled(true);
    }, ms);
  }, [routeDetails?.departureTime]);

  const handleStartRoute = async () => {
    try {
      await update(ref(database, `routes/${routeId}`), {
        status: "started",
        startedAt: new Date().toISOString(),
      });

      Alert.alert("Ruta iniciada", "La ruta ha comenzado correctamente.");

      // Ir al mapa con los datos de la ruta
      navigation.navigate("RouteMap", {
        origin: routeDetails.origin,
        destination: routeDetails.destination,
        routeId,
      });
    } catch (error) {
      console.error("Error al iniciar la ruta:", error);
      Alert.alert("Error", "Hubo un problema al iniciar la ruta.");
    }
  };

  const handleGoToMap = () => {
    navigation.navigate("RouteMap", {
      origin: routeDetails.origin,
      destination: routeDetails.destination,
      routeId,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B74FF" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!routeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Ruta no encontrada</Text>
        <Text style={styles.errorText}>
          No se encontraron detalles para esta ruta.
        </Text>
      </View>
    );
  }

  const statusLabel =
    status === "started" ? "EN CURSO" : status === "scheduled" ? "PROGRAMADA" : status.toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FC" }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{destinationLabel}</Text>

          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {originLabel} → {destinationLabel}
          </Text>

          <View style={styles.chipsRow}>
            <Chip text={statusLabel} variant={status === "started" ? "green" : "blue"} />
            <Chip text={`Cupos: ${seats.available}/${seats.capacity}`} variant="gray" />
            <Chip text={distanceText} variant="gray" />
            <Chip text={durationText} variant="gray" />
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.grid}>
          <InfoCard
            label="Salida"
            value={departureMoment ? departureMoment.format("DD/MM/YYYY HH:mm") : "--"}
          />
          <InfoCard
            label="Llegada estimada"
            value={arrivalMoment ? arrivalMoment.format("DD/MM/YYYY HH:mm") : "--"}
          />
          <InfoCard label="Conductor" value={routeDetails.driverName || "—"} />
          <InfoCard
            label="Calificación"
            value={routeDetails.driverRating != null ? String(routeDetails.driverRating) : "—"}
          />
        </View>

        {/* Extra details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>

          <Row label="Origen" value={originLabel} />
          <Row label="Destino" value={destinationLabel} />
          <Row label="Distancia" value={distanceText} />
          <Row label="Duración" value={durationText} />

          <Row
            label="Asientos disponibles"
            value={`${seats.available} de ${seats.capacity}`}
          />
        </View>

        {/* Helper */}
        {!isRouteStarted && (
          <Text style={styles.helperText}>
            {isButtonEnabled
              ? "Ya puedes iniciar la ruta."
              : "Podrás iniciar la ruta cuando llegue la hora programada."}
          </Text>
        )}

        {/* espacio para el botón fijo */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isRouteStarted ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGoToMap}>
            <Text style={styles.primaryBtnText}>Ver ruta en el mapa</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, !isButtonEnabled && { opacity: 0.5 }]}
            onPress={handleStartRoute}
            disabled={!isButtonEnabled}
          >
            <Text style={styles.primaryBtnText}>Iniciar ruta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ---------- UI components ---------- */

function Chip({ text, variant = "gray" }) {
  const bg =
    variant === "green"
      ? "#DCFCE7"
      : variant === "blue"
      ? "#DBEAFE"
      : "#EEF2FF";
  const color =
    variant === "green"
      ? "#166534"
      : variant === "blue"
      ? "#1D4ED8"
      : "#334155";

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{text}</Text>
    </View>
  );
}

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingTop: 12,
  },

  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "#F6F8FC",
  },
  loadingText: { marginTop: 10, color: "#555", fontSize: 15 },

  errorContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 20, backgroundColor: "#F6F8FC",
  },
  errorTitle: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 6 },
  errorText: { fontSize: 14, color: "#666", textAlign: "center" },

  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111" },
  headerSubtitle: { marginTop: 6, color: "#475569", fontWeight: "700" },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipText: { fontWeight: "900", fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  infoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  infoLabel: { color: "#64748B", fontWeight: "800", fontSize: 12, marginBottom: 6 },
  infoValue: { color: "#0F172A", fontWeight: "900", fontSize: 14 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#111", marginBottom: 10 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  rowLabel: { color: "#64748B", fontWeight: "800", fontSize: 13, width: "42%" },
  rowValue: { color: "#0F172A", fontWeight: "800", fontSize: 13, flex: 1, textAlign: "right" },

  helperText: {
    marginTop: 10,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  },
  primaryBtn: {
    backgroundColor: "#0B74FF",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
});

export default RouteDetails;