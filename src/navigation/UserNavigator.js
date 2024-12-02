import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Dashboard from '../screens/user/Dashboard';

const Stack = createStackNavigator();

const UserNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{ headerShown: false }} // Oculta el header si no lo necesitas
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;
