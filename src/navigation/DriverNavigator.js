import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from '../screens/driver/Dashboard';
import RouteSelector from '../screens/driver/RouteSelector'; // Importa el componente de mapas
import RouteDetails from '../screens/driver/RouteDetails';
import RouteMapScreen from '../screens/driver/RouteMapScreen';

const Stack = createStackNavigator();

const DriverNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{ headerShown: false }} // Oculta el header si no es necesario
      />
      <Stack.Screen 
        name="RouteSelector" 
        component={RouteSelector} 
        options={{ title: 'Seleccionar Ruta' }} // Puedes personalizar el título del header
      />
          <Stack.Screen
      name="RouteDetails"
      component={RouteDetails}
      options={{
        title: 'Detalles de la Ruta',
    }}
  />

      <Stack.Screen
        name="RouteMap"
        component={RouteMapScreen}
        options={{
          title: 'Ruta en Curso',
        }}
      />



    </Stack.Navigator>
  );
};

export default DriverNavigator;

