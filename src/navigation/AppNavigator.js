import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserNavigator from './UserNavigator';
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';
import { auth, database } from '../services/firebase';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(undefined); // undefined = cargando rol
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let roleRefInstance = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      roleRefInstance = ref(database, `users/${firebaseUser.uid}/role`);

      onValue(
        roleRefInstance,
        (snapshot) => {
          setRole(snapshot.exists() ? snapshot.val() : null);
          setLoadingAuth(false);
        },
        (error) => {
          console.error('Error fetching role:', error);
          setRole(null);
          setLoadingAuth(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (roleRefInstance) {
        off(roleRefInstance);
      }
    };
  }, []);

  if (loadingAuth || (user && role === undefined)) {
    return null;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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