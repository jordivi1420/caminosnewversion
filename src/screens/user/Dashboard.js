import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EventsScreen from './EventsScreen';
import SettingsScreen from './SettingsScreen';
import TicketHistoryScreen from './TicketHistoryScreen';

const Tab = createBottomTabNavigator();

const TicketsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Mis tickets</Text>
  </View>
);

const Dashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Eventos') {
            iconName = 'calendar-outline';
          } else if (route.name === 'Mis tickets') {
            iconName = 'ticket-outline';
          } else if (route.name === 'Configuracion') {
            iconName = 'settings-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#0F9CA8',
        tabBarInactiveTintColor: '#8A8F98',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1E5C8',
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen
        name="Eventos"
        component={EventsScreen}
        options={{
          title: 'Rutas',
          headerStyle: {
            backgroundColor: '#FFF9F0',
          },
        }}
      />

      <Tab.Screen
        name="Mis tickets"
        component={TicketHistoryScreen}
        options={{
          title: 'Mis tickets',
          headerStyle: {
            backgroundColor: '#FFF9F0',
          },
        }}
      />

      <Tab.Screen
        name="Configuracion"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          headerStyle: {
            backgroundColor: '#F4F8FC',
          },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Dashboard;