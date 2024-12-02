import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserNavigator from './UserNavigator';
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';
import { auth, database } from '../services/firebase';
import { ref, get } from 'firebase/database';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRole = await fetchUserRole(user.uid);
        setRole(userRole);
        console.log('Rol del usuario:', userRole); // Verifica aquí
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchUserRole = async (uid) => {
    try {
      const snapshot = await get(ref(database, `users/${uid}/role`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  };

  if (loading) {
    return null; // Puedes mostrar un splash screen aquí
  }

  return (
    <NavigationContainer>
      {role === null ? (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : role === 'user' ? (
        <UserNavigator />
      ) : role === 'driver' ? (
        <DriverNavigator />
      ) : role === 'admin' ? (
        <AdminNavigator />
      ) : null}
    </NavigationContainer>
  );
};

export default AppNavigator;
