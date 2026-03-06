import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ImageBackground,
  Image,
} from 'react-native';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
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

const EventsScreen = ({ navigation }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const routesRef = ref(database, 'routes');

    const unsubscribe = onValue(
      routesRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setRoutes([]);
          setLoading(false);
          return;
        }

        const now = moment();

        const parsedRoutes = Object.keys(data)
          .map((key) => {
            const item = data[key] || {};

            const capacity =
              typeof item.capacity === 'number'
                ? item.capacity
                : typeof item.passengers === 'number'
                ? item.passengers
                : 25;

            const availableSeats =
              typeof item.availableSeats === 'number'
                ? item.availableSeats
                : capacity;

            const occupiedSeats = Math.max(capacity - availableSeats, 0);

            return {
              id: key,
              ...item,
              capacity,
              availableSeats,
              occupiedSeats,
            };
          })
          .filter((route) => {
            const status = route.status || 'scheduled';
            const isAllowedStatus = status === 'scheduled' || status === 'started';

            if (!isValidDate(route.arrivalTime)) return false;

            return isAllowedStatus && now.isBefore(moment(route.arrivalTime));
          })
          .sort((a, b) => {
            const aTime = isValidDate(a.departureTime)
              ? moment(a.departureTime).valueOf()
              : Number.MAX_SAFE_INTEGER;

            const bTime = isValidDate(b.departureTime)
              ? moment(b.departureTime).valueOf()
              : Number.MAX_SAFE_INTEGER;

            return aTime - bTime;
          });

        setRoutes(parsedRoutes);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando rutas:', error);
        setRoutes([]);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const routesCountText = useMemo(() => {
    return `${routes.length} ${routes.length === 1 ? 'ruta disponible' : 'rutas disponibles'}`;
  }, [routes]);

  const renderRouteCard = ({ item }) => {
    const originLabel = item.originName || 'Origen no definido';
    const destinationLabel = item.destinationName || 'Destino no definido';

    const departureText = isValidDate(item.departureTime)
      ? moment(item.departureTime).format('DD/MM/YYYY HH:mm')
      : '--';

    const arrivalText = isValidDate(item.arrivalTime)
      ? moment(item.arrivalTime).format('DD/MM/YYYY HH:mm')
      : '--';

    const distanceText =
      typeof item.distanceKm === 'number'
        ? `${item.distanceKm.toFixed(2)} km`
        : item.distance || '--';

    const durationText =
      typeof item.durationMin === 'number'
        ? `${Math.round(item.durationMin)} min`
        : item.duration || '--';

    const statusLabel =
      item.status === 'started'
        ? 'En curso'
        : item.status === 'scheduled'
        ? 'Programada'
        : 'Disponible';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>

          <View style={styles.seatBadge}>
            <Text style={styles.seatBadgeText}>
              {item.availableSeats}/{item.capacity} cupos
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{destinationLabel}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {originLabel} → {destinationLabel}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Salida</Text>
            <Text style={styles.infoValue}>{departureText}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Llegada</Text>
            <Text style={styles.infoValue}>{arrivalText}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distancia</Text>
            <Text style={styles.infoValue}>{distanceText}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Duración</Text>
            <Text style={styles.infoValue}>{durationText}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.metaText}>Ocupados: {item.occupiedSeats}</Text>
            <Text style={styles.metaText}>Disponibles: {item.availableSeats}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              item.availableSeats <= 0 && styles.buttonDisabled,
            ]}
            disabled={item.availableSeats <= 0}
            onPress={() =>
              navigation.navigate('BuyTicketScreen', { routeId: item.id })
            }
          >
            <Text style={styles.buttonText}>
              {item.availableSeats > 0 ? 'Solicitar QR' : 'Sin cupos'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <ImageBackground
        source={require('../../../assets/university-bg.jpg')}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.logoPill}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heroEyebrow}>Transporte universitario</Text>
          <Text style={styles.heroTitle}>Rutas disponibles</Text>
          <Text style={styles.heroSubtitle}>
            Consulta los recorridos activos y solicita tu código QR para abordar.
          </Text>

          <View style={styles.heroCountPill}>
            <Text style={styles.heroCountText}>{routesCountText}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explorar rutas</Text>
        <Text style={styles.sectionSubtitle}>
          Elige una ruta y genera tu acceso
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Cargando rutas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay rutas activas</Text>
            <Text style={styles.emptyText}>
              En este momento no se encontraron rutas vigentes para solicitar QR.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  list: {
    paddingBottom: 24,
  },

  hero: {
    height: 300,
    justifyContent: 'flex-end',
    marginBottom: 18,
  },

  heroImage: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 156, 168, 0.42)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  heroContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  logoPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  logo: {
    width: 110,
    height: 44,
  },

  heroEyebrow: {
    color: '#FFF7E0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },

  heroSubtitle: {
    color: '#FFFDF8',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '92%',
  },

  heroCountPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: 'rgba(242, 194, 48, 0.95)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  heroCountText: {
    color: '#5A3B00',
    fontWeight: '900',
    fontSize: 13,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.muted,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },

  statusBadge: {
    backgroundColor: COLORS.redSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  statusBadgeText: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 12,
  },

  seatBadge: {
    backgroundColor: COLORS.yellowSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  seatBadgeText: {
    color: '#8A5A00',
    fontWeight: '800',
    fontSize: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 14,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  infoBox: {
    width: '48.5%',
    backgroundColor: '#FFFDF8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
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

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },

  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '700',
    marginBottom: 2,
  },

  button: {
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  buttonDisabled: {
    backgroundColor: '#B8C0C8',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 21,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 10,
  },
});

export default EventsScreen;