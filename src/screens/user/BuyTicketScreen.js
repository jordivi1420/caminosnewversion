import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ref, push, get, runTransaction } from 'firebase/database';
import { database, auth } from '../../services/firebase';
import moment from 'moment';

const COLORS = {
  bg: '#FFF9F0',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',

  yellow: '#F2C230',
  yellowSoft: '#FFF3C4',

  red: '#D94B4B',
  redSoft: '#FFE1E1',

  teal: '#0F9CA8',
  tealSoft: '#DDF5F6',

  line: '#F1E5C8',
};

const isValidDate = (value) => value && moment(value).isValid();

const BuyTicketScreen = ({ route, navigation }) => {
  const { routeId } = route.params;

  const [loading, setLoading] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const routeRef = ref(database, `routes/${routeId}`);
        const snapshot = await get(routeRef);

        if (!snapshot.exists()) {
          Alert.alert('Ruta no disponible', 'La ruta seleccionada no existe.');
          navigation.goBack();
          return;
        }

        setRouteData(snapshot.val());
      } catch (error) {
        console.error('Error cargando la ruta:', error);
        Alert.alert('Error', 'No se pudo cargar la información de la ruta.');
        navigation.goBack();
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [navigation, routeId]);

  const summary = useMemo(() => {
    if (!routeData) return null;

    const capacity =
      typeof routeData.capacity === 'number'
        ? routeData.capacity
        : typeof routeData.passengers === 'number'
        ? routeData.passengers
        : 25;

    const availableSeats =
      typeof routeData.availableSeats === 'number'
        ? routeData.availableSeats
        : capacity;

    return {
      originName: routeData.originName || 'Origen no definido',
      destinationName: routeData.destinationName || 'Destino no definido',
      driverName: routeData.driverName || 'Conductor',
      departureText: isValidDate(routeData.departureTime)
        ? moment(routeData.departureTime).format('DD/MM/YYYY HH:mm')
        : '--',
      arrivalText: isValidDate(routeData.arrivalTime)
        ? moment(routeData.arrivalTime).format('DD/MM/YYYY HH:mm')
        : '--',
      distanceText:
        typeof routeData.distanceKm === 'number'
          ? `${routeData.distanceKm.toFixed(2)} km`
          : routeData.distance || '--',
      durationText:
        typeof routeData.durationMin === 'number'
          ? `${Math.round(routeData.durationMin)} min`
          : routeData.duration || '--',
      capacity,
      availableSeats,
    };
  }, [routeData]);

  const handleBuyTicket = async () => {
    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para solicitar un ticket.');
        setLoading(false);
        return;
      }

      const ticketRef = ref(database, `tickets/${user.uid}`);
      const ticketSnapshot = await get(ticketRef);

      if (ticketSnapshot.exists()) {
        const tickets = ticketSnapshot.val();
        const existingTicket = Object.values(tickets).find(
          (ticket) => ticket.routeId === routeId
        );

        if (existingTicket) {
          Alert.alert('Ya tienes un ticket', 'Ya solicitaste un ticket para esta ruta.');
          setLoading(false);
          return;
        }
      }

      const routeRef = ref(database, `routes/${routeId}`);

      const transactionResult = await runTransaction(routeRef, (currentData) => {
        if (!currentData) return currentData;

        const currentAvailableSeats =
          typeof currentData.availableSeats === 'number'
            ? currentData.availableSeats
            : typeof currentData.capacity === 'number'
            ? currentData.capacity
            : 25;

        if (currentAvailableSeats <= 0) {
          return;
        }

        const currentSold =
          typeof currentData.sold === 'number' ? currentData.sold : 0;

        return {
          ...currentData,
          availableSeats: currentAvailableSeats - 1,
          sold: currentSold + 1,
          updatedAt: new Date().toISOString(),
        };
      });

      if (!transactionResult.committed || !transactionResult.snapshot.exists()) {
        Alert.alert('Sin cupos', 'No hay cupos disponibles para esta ruta.');
        setLoading(false);
        return;
      }

      const updatedRouteData = transactionResult.snapshot.val();

      const newTicket = {
        routeId,
        userId: user.uid,
        destinationName: updatedRouteData.destinationName || 'Destino no definido',
        originName: updatedRouteData.originName || 'Origen no definido',
        driverName: updatedRouteData.driverName || 'Conductor',
        departureTime: updatedRouteData.departureTime || null,
        arrivalTime: updatedRouteData.arrivalTime || null,
        status: 'active',
        used: false,
        createdAt: new Date().toISOString(),
      };

      const newTicketRef = await push(ticketRef, newTicket);

      const qrValue = JSON.stringify({
        ticketId: newTicketRef.key,
        routeId,
        userId: user.uid,
      });

      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        qrValue
      )}`;

      setQrImageUrl(apiUrl);
      setTicketGenerated(true);
      setRouteData(updatedRouteData);
      setTicketInfo({
        ...newTicket,
        ticketId: newTicketRef.key,
      });

      Alert.alert('Éxito', 'Tu ticket fue generado correctamente.');
    } catch (error) {
      console.error('Error al generar el ticket:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Eventos');
  };

  if (loadingRoute) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Cargando información de la ruta...</Text>
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Ruta no disponible</Text>
        <Text style={styles.errorText}>
          No fue posible obtener la información de esta ruta.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Transporte universitario</Text>
          <Text style={styles.heroTitle}>Confirmar solicitud</Text>
          <Text style={styles.heroSubtitle}>
            Revisa la información de la ruta y genera tu código QR de acceso.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.badgesRow}>
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>Ruta activa</Text>
            </View>

            <View style={styles.seatBadge}>
              <Text style={styles.seatBadgeText}>
                {summary.availableSeats}/{summary.capacity} cupos
              </Text>
            </View>
          </View>

          <Text style={styles.routeTitle}>{summary.destinationName}</Text>
          <Text style={styles.routeSubtitle}>
            {summary.originName} → {summary.destinationName}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Salida</Text>
              <Text style={styles.infoValue}>{summary.departureText}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Llegada</Text>
              <Text style={styles.infoValue}>{summary.arrivalText}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Distancia</Text>
              <Text style={styles.infoValue}>{summary.distanceText}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Duración</Text>
              <Text style={styles.infoValue}>{summary.durationText}</Text>
            </View>
          </View>

          <View style={styles.driverPill}>
            <Text style={styles.driverPillText}>Conductor: {summary.driverName}</Text>
          </View>
        </View>

        {ticketGenerated ? (
          <View style={styles.qrCard}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>Ticket generado</Text>
            </View>

            <Text style={styles.qrTitle}>Tu código QR</Text>
            <Text style={styles.qrSubtitle}>
              Muéstralo al momento de abordar para que sea escaneado.
            </Text>

            {qrImageUrl ? (
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
            ) : (
              <ActivityIndicator size="large" color={COLORS.teal} />
            )}

            {ticketInfo ? (
              <View style={styles.ticketMetaCard}>
                <Text style={styles.ticketMetaLabel}>Destino</Text>
                <Text style={styles.ticketMetaValue}>{ticketInfo.destinationName}</Text>

                <Text style={styles.ticketMetaLabel}>Fecha de solicitud</Text>
                <Text style={styles.ticketMetaValue}>
                  {moment(ticketInfo.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
              <Text style={styles.primaryButtonText}>Volver a rutas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsCard}>
            <Text style={styles.confirmText}>
              ¿Deseas solicitar un ticket para esta ruta?
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || summary.availableSeats <= 0) && styles.disabledButton,
              ]}
              onPress={handleBuyTicket}
              disabled={loading || summary.availableSeats <= 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {summary.availableSeats > 0
                    ? 'Confirmar y generar ticket'
                    : 'Ruta sin cupos'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    padding: 16,
    paddingBottom: 28,
  },

  heroCard: {
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5A00',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },

  routeBadge: {
    backgroundColor: COLORS.redSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  routeBadgeText: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 12,
  },

  seatBadge: {
    backgroundColor: COLORS.tealSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  seatBadgeText: {
    color: COLORS.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  routeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },

  routeSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 14,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  infoBox: {
    width: '48.5%',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },

  driverPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  driverPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5A00',
  },

  actionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  confirmText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  primaryButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  secondaryButtonText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.65,
  },

  qrCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
  },

  successBadge: {
    backgroundColor: COLORS.tealSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 12,
  },

  successBadgeText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '900',
  },

  qrTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },

  qrSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },

  qrImage: {
    width: 220,
    height: 220,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  ticketMetaCard: {
    width: '100%',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  ticketMetaLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 3,
    marginTop: 6,
  },

  ticketMetaValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 10,
    textAlign: 'center',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});

export default BuyTicketScreen;