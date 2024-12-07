import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import EventsScreen from './EventsScreen';
import SettingsScreen from './SettingsScreen';
import RouteSelector from './RouteSelector'; // Importa el componente de selección de rutas
import QRScannerScreen from './QRScannerScreen';
import QRCodeScanner from './QRCodeScanner';
import ScanTicketScreen from './ScanTicketScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EventsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EventsScreen" // Nombre único para el Stack
        component={EventsScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('RouteSelector')}
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
          title: 'Seleccionar Ruta',
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
          if (route.name === 'EventsTab') {
            iconName = 'calendar-outline';
          } else if (route.name === 'ScanTicket') {
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
        name="EventsTab" // Nombre único para el Tab
        component={EventsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="ScanTicket" component={ScanTicketScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};


export default Dashboard;
