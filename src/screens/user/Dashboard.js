import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const EventsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>0 Eventos Users</Text>
  </View>
);

const TicketsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Mis tickets</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Configuracion</Text>
  </View>
);

const Dashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarActiveTintColor: '#0288D1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Eventos" component={EventsScreen} />
      <Tab.Screen name="Mis tickets" component={TicketsScreen} />
      <Tab.Screen name="Configuracion" component={SettingsScreen} />
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
