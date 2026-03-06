import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',

  yellow: '#F4B41A',
  yellowSoft: '#FFF4CC',

  red: '#E95454',
  redSoft: '#FFE4E4',

  teal: '#00A8B5',
  tealSoft: '#DDF7F9',

  border: '#E5E7EB',
  tealBorder: '#BFECEF',
};

const formatDate = (value) => {
  if (!value) return 'No disponible';
  const m = moment(value);
  return m.isValid() ? m.format('DD/MM/YYYY HH:mm') : 'No disponible';
};

const TicketHistoryScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTickets, setVisibleTickets] = useState(10);

  const navigation = useNavigation();

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const ticketsRef = ref(database, `tickets/${user.uid}`);

    const unsubscribe = onValue(
      ticketsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setTickets([]);
          setLoading(false);
          return;
        }

        const parsedTickets = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });

        setTickets(parsedTickets);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando tickets:', error);
        setTickets([]);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const visibleData = useMemo(() => {
    return tickets.slice(0, visibleTickets);
  }, [tickets, visibleTickets]);

  const hasMore = visibleTickets < tickets.length;

  const renderTicket = ({ item }) => {
    const isUsed = !!item.used;
    const destinationName = item.destinationName || 'Destino no definido';
    const originName = item.originName || 'Origen no definido';

    return (
      <View
        style={[
          styles.ticketCard,
          isUsed ? styles.ticketCardUsed : styles.ticketCardAvailable,
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={isUsed ? styles.usedBadge : styles.activeBadge}>
            <Text style={isUsed ? styles.usedBadgeText : styles.activeBadgeText}>
              {isUsed ? 'Usado' : 'Activo'}
            </Text>
          </View>
        </View>

        <Text style={styles.routeName}>{destinationName}</Text>
        <Text style={styles.routeSubtitle} numberOfLines={2}>
          {originName} → {destinationName}
        </Text>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Solicitado</Text>
          <Text style={styles.metaValue}>{formatDate(item.createdAt)}</Text>
        </View>

        {isUsed ? (
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Validado</Text>
            <Text style={styles.metaValue}>{formatDate(item.usedDate)}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.ticketIdText}>Ticket #{item.id?.slice(-6) || '---'}</Text>

          {!isUsed ? (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() =>
                navigation.navigate('TicketQRCodeScreen', { ticket: item })
              }
            >
              <Text style={styles.qrButtonText}>Ver QR</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.usedInfoPill}>
              <Text style={styles.usedInfoText}>Ya utilizado</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <View style={styles.heroCard}>
        <View style={styles.heroAccentLine} />
        <Text style={styles.heroEyebrow}>Transporte universitario</Text>
        <Text style={styles.heroTitle}>Mis tickets</Text>
        <Text style={styles.heroSubtitle}>
          Consulta tus tickets activos y revisa el historial de accesos ya utilizados.
        </Text>

        <View style={styles.countPill}>
          <Text style={styles.countPillText}>
            {tickets.length} {tickets.length === 1 ? 'ticket registrado' : 'tickets registrados'}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Historial</Text>
        <Text style={styles.sectionSubtitle}>Gestiona tus accesos recientes</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Cargando tickets...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={visibleData}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tienes tickets aún</Text>
            <Text style={styles.emptyText}>
              Cuando solicites una ruta, tus tickets aparecerán aquí.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleTickets((prev) => prev + 10)}
            >
              <Text style={styles.loadMoreText}>Cargar más</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 12 }} />
          )
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

  listContainer: {
    paddingBottom: 24,
  },

  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 4,
  },

  heroCard: {
    backgroundColor: COLORS.tealSoft,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    overflow: 'hidden',
  },

  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.red,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.teal,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 2,
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
    color: '#475569',
  },

  countPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: COLORS.yellowSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  countPillText: {
    color: '#8A5A00',
    fontWeight: '900',
    fontSize: 13,
  },

  sectionHeader: {
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

  ticketCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  ticketCardAvailable: {
    borderLeftWidth: 6,
    borderLeftColor: COLORS.teal,
  },

  ticketCardUsed: {
    borderLeftWidth: 6,
    borderLeftColor: COLORS.red,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },

  activeBadge: {
    backgroundColor: COLORS.tealSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  activeBadgeText: {
    color: COLORS.teal,
    fontWeight: '800',
    fontSize: 12,
  },

  usedBadge: {
    backgroundColor: COLORS.redSoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  usedBadgeText: {
    color: COLORS.red,
    fontWeight: '800',
    fontSize: 12,
  },

  routeName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  routeSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 14,
  },

  metaGroup: {
    marginBottom: 10,
  },

  metaLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 3,
  },

  metaValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
  },

  cardFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ticketIdText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },

  qrButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  usedInfoPill: {
    backgroundColor: COLORS.redSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  usedInfoText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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

  loadMoreButton: {
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },

  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default TicketHistoryScreen;