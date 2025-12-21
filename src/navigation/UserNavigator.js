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
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{ headerShown: false }} // Oculta el header si no lo necesitas
      />

      <Stack.Screen 
              name="Events" 
              component={EventsScreen} 
              options={{ title: 'Eventos' }} 
            />

      <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen} 
                    options={{ title: 'Configuracion' }} 
                  />

      <Stack.Screen 
                          name="BuyTicketScreen" 
                          component={BuyTicketScreen} 
                          options={{ title: 'comprar tickets' }} 
                        />

        <Stack.Screen 
                                  name="TicketHistoryScreen" 
                                  component={TicketHistoryScreen} 
                                  options={{ title: 'Historial de tickets' }} 
                                />

          <Stack.Screen 
                                  name="RouteMapScreen" 
                                  component={RouteMapScreen} 
                                  options={{ title: 'Ruta del dia' }} 
                                />
          
          <Stack.Screen
  name="TicketQRCodeScreen"
  component={TicketQRCodeScreen}
  options={{ title: 'Código QR del Ticket' }}
/>

    </Stack.Navigator>
  );
};

export default UserNavigator;
