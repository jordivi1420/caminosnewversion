import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from '../screens/user/Dashboard';
import EventsScreen from '../screens/user/EventsScreen';
import SettingsScreen from '../screens/user/SettingsScreen';
import BuyTicketScreen from '../screens/user/BuyTicketScreen';
import TicketHistoryScreen from '../screens/user/TicketHistoryScreen';
import TicketQRCodeScreen from '../screens/user/TicketQRCodeScreen';
import RouteMapScreen from '../screens/user/RouteMapScreen';

const Stack = createStackNavigator();

const UserNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
        },
        headerStyle: {
          backgroundColor: '#F8FAFC',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Eventos',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Stack.Screen
        name="BuyTicketScreen"
        component={BuyTicketScreen}
        options={{
          title: 'Solicitar ticket',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Stack.Screen
        name="TicketHistoryScreen"
        component={TicketHistoryScreen}
        options={{
          title: 'Historial de tickets',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Stack.Screen
        name="RouteMapScreen"
        component={RouteMapScreen}
        options={{
          title: 'Ruta del día',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />

      <Stack.Screen
        name="TicketQRCodeScreen"
        component={TicketQRCodeScreen}
        options={{
          title: 'Código QR',
          headerStyle: {
            backgroundColor: '#F8FAFC',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;