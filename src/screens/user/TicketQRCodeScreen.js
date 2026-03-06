import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../services/firebase';

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  teal: '#00A8B5',
  tealSoft: '#DDF7F9',
  red: '#E95454',
  yellow: '#F4B41A',
  border: '#E5E7EB',
};

const TicketQRCodeScreen = ({ route, navigation }) => {
  const { ticket } = route.params;

  const [loading, setLoading] = useState(true);

  const qrUri = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      JSON.stringify({
        userId: ticket.userId,
        ticketId: ticket.id,
      })
    )}`;
  }, [ticket.userId, ticket.id]);

  useEffect(() => {
    const ticketRef = ref(database, `tickets/${ticket.userId}/${ticket.id}`);
    const routeRef = ref(database, `routes/${ticket.routeId}`);

    const unsubscribeTicket = onValue(
      ticketRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const ticketData = snapshot.val();

          if (ticketData.used) {
            try {
              const routeSnapshot = await get(routeRef);

              if (routeSnapshot.exists()) {
                const routeData = routeSnapshot.val();

                navigation.replace('RouteMapScreen', {
                  origin: routeData.origin,
                  destination: routeData.destination,
                  routeId: ticket.routeId,
                });
                return;
              }

              Alert.alert('Error', 'No se encontraron detalles para esta ruta.');
            } catch (error) {
              console.error('Error al obtener los detalles de la ruta:', error);
              Alert.alert('Error', 'No se pudo cargar la información de la ruta.');
            }
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error escuchando ticket:', error);
        setLoading(false);
        Alert.alert('Error', 'No se pudo verificar el estado del ticket.');
      }
    );

    return () => {
      if (typeof unsubscribeTicket === 'function') unsubscribeTicket();
    };
  }, [ticket.userId, ticket.id, ticket.routeId, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.watermarkLoading}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo de fondo tipo marca de agua */}
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.watermark}
        resizeMode="contain"
      />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Transporte universitario</Text>
        <Text style={styles.title}>Código QR del ticket</Text>
        <Text style={styles.subtitle}>
          Muestra este código al momento de abordar para validar tu acceso.
        </Text>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>Esperando validación</Text>
        </View>

        <View style={styles.qrContainer}>
          <Image source={{ uri: qrUri }} style={styles.qrImage} />
        </View>

        <Text style={styles.infoText}>
          Cuando el conductor escanee este ticket, la validación se completará automáticamente.
        </Text>

        <View style={styles.ticketMeta}>
          <Text style={styles.metaLabel}>Ticket</Text>
          <Text style={styles.metaValue}>#{ticket.id?.slice(-6) || '---'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  watermark: {
    position: 'absolute',
    width: 320,
    height: 320,
    opacity: 0.08,
  },

  watermarkLoading: {
    position: 'absolute',
    width: 260,
    height: 260,
    opacity: 0.06,
  },

  heroCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.tealSoft,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFECEF',
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.teal,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
  },

  qrCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  statusPill: {
    backgroundColor: '#FFF4CC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 14,
  },

  statusPillText: {
    color: '#8A5A00',
    fontSize: 12,
    fontWeight: '900',
  },

  qrContainer: {
    width: 250,
    height: 250,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  qrImage: {
    width: 220,
    height: 220,
  },

  infoText: {
    fontSize: 14,
    color: COLORS.red,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 14,
  },

  ticketMeta: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  metaLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 4,
  },

  metaValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export default TicketQRCodeScreen;