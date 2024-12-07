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
    const navigation = useNavigation(); // Mueve el hook aquí
  
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
  
    const renderTicket = ({ item }) => (
      <View style={styles.ticketCard}>
        <View style={styles.ticketInfo}>
          <Text style={styles.routeName}>Destino: {item.destinationName || 'Desconocido'}</Text>
          <Text style={styles.date}>
            Fecha: {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => navigation.navigate('TicketQRCodeScreen', { ticket: item })}
        >
          <Text style={styles.qrButtonText}>Ver QR</Text>
        </TouchableOpacity>
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
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={renderTicket} // Navigation ya está accesible
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    );
  };
  

const styles = StyleSheet.create({
    qrButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
      },
      qrButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
      },
      
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketInfo: {
    flex: 3,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    textAlign: 'center',
  },
  available: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  unavailable: {
    color: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  noTicketsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TicketHistoryScreen;
