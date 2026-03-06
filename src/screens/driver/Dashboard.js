import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

import EventsScreen from "./EventsScreen";
import SettingsScreen from "./SettingsScreen";
import ScanTicketScreen from "./ScanTicketScreen";
import CreateRouteScreen from "./CreateRouteScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EventsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "800",
        },
        headerStyle: {
          backgroundColor: "#F8FAFC",
        },
      }}
    >
      <Stack.Screen
        name="EventsScreen"
        component={EventsScreen}
        options={({ navigation }) => ({
          title: "Eventos",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateRoute")}
              style={{ marginRight: 15 }}
            >
              <Icon name="add-circle-outline" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          title: "Crear ruta",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#EAF4FF",
          },
          headerTintColor: "#111827",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "800",
          },
        }}
      />
    </Stack.Navigator>
  );
};

const Dashboard = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "800",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "EventsTab") iconName = "calendar-outline";
          else if (route.name === "ScanTicket") iconName = "scan-outline";
          else if (route.name === "Settings") iconName = "settings-outline";

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#0288D1",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{ headerShown: false, title: "Eventos" }}
      />

      <Tab.Screen
        name="ScanTicket"
        component={ScanTicketScreen}
        options={{
          title: "Escanear ticket",
          headerStyle: {
            backgroundColor: "#F4F8FC",
          },
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Ajustes",
          headerStyle: {
            backgroundColor: "#F4F8FC",
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default Dashboard;