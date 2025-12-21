import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';

const TicketHistoryScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleTickets, setVisibleTickets] = useState(10); // Controlar los tickets visibles
  const [isEndReached, setIsEndReached] = useState(false); // Para manejar si llegamos al final
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTickets = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ticketsRef = ref(database, `tickets/${user.uid}`);
      onValue(ticketsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsedTickets = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setTickets(parsedTickets);
        } else {
          setTickets([]);
        }
        setLoading(false);
      });
    };

    fetchTickets();
  }, []);

  const loadMoreTickets = () => {
    setVisibleTickets((prev) => prev + 10);
  };

  const renderTicket = ({ item }) => (
    <View
      style={[
        styles.ticketCard,
        item.used ? styles.ticketCardUsed : styles.ticketCardAvailable,
      ]}
    >
      <View style={styles.ticketInfo}>
        <Text style={styles.routeName}>
          {item.destinationName || 'Desconocido'}
        </Text>
        <Text style={styles.date}>
          Fecha: {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        {item.used ? (
          <View>
            <Text style={styles.statusUsed}>Usado</Text>
            <Text style={styles.usedDate}>
              {new Date(item.usedDate).toLocaleString()}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() =>
              navigation.navigate('TicketQRCodeScreen', { ticket: item })
            }
          >
            <Text style={styles.qrButtonText}>Ver QR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Tickets</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0288D1" />
      ) : tickets.length === 0 ? (
        <Text style={styles.noTicketsText}>No tienes tickets aún.</Text>
      ) : (
        <FlatList
          data={tickets.slice(0, visibleTickets)} // Mostrar solo los tickets visibles
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContainer}
          onEndReached={() => {
            if (visibleTickets < tickets.length) {
              setIsEndReached(true);
            }
          }}
          onEndReachedThreshold={0.5} // Cuando llegue al 50% del final, se activa
          ListFooterComponent={
            isEndReached && visibleTickets < tickets.length ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => {
                  loadMoreTickets();
                  setIsEndReached(false); // Resetear la bandera
                }}
              >
                <Text style={styles.loadMoreText}>Cargar más</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Fondo blanco
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2a3d66',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  ticketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff', // Fondo blanco para los tickets
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  ticketCardAvailable: {
    borderLeftWidth: 6,
    borderLeftColor: '#66bb6a', // Verde para tickets disponibles
  },
  ticketCardUsed: {
    borderLeftWidth: 6,
    borderLeftColor: '#ef5350', // Rojo para tickets usados
  },
  ticketInfo: {
    flex: 3,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a3d66',
  },
  date: {
    fontSize: 14,
    color: '#4f5b72',
    marginTop: 4,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusUsed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
  },
  usedDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noTicketsText: {
    fontSize: 16,
    color: '#4f5b72',
    textAlign: 'center',
    marginTop: 20,
  },
  loadMoreButton: {
    marginTop: 16,
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TicketHistoryScreen;
