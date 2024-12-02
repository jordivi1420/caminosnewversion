import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import EventsScreen from './EventsScreen';
import ScanTicketScreen from './ScanTicketScreen';
import SettingsScreen from './SettingsScreen';
import RouteSelector from './RouteSelector'; // Importa el componente de selección de rutas

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EventsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('RouteSelector')} // Navega al selector de rutas
              style={{ marginRight: 15 }}
            >
              <Icon name="add-circle-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
          title: 'Eventos',
        })}
      />
      <Stack.Screen
        name="RouteSelector"
        component={RouteSelector}
        options={{
          title: 'Seleccionar Ruta', // Título del header para el selector de rutas
        }}
      />
    </Stack.Navigator>
  );
};

const Dashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Events') {
            iconName = 'calendar-outline';
          } else if (route.name === 'Scan Ticket') {
            iconName = 'scan-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0288D1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Events"
        component={EventsStack} // Usa el stack que incluye RouteSelector
        options={{ headerShown: false }} // Oculta el header duplicado
      />
      <Tab.Screen name="Scan Ticket" component={ScanTicketScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default Dashboard;
