import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import Dashboard from "../screens/driver/Dashboard";
import CreateRouteScreen from "../screens/driver/CreateRouteScreen";
import RouteDetails from "../screens/driver/RouteDetails";
import RouteMapScreen from "../screens/driver/RouteMapScreen";

const Stack = createStackNavigator();

const DriverNavigator = () => {
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
        name="Dashboard"
        component={Dashboard}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          title: "Crear ruta",
          headerStyle: {
            backgroundColor: "#EAF4FF",
          },
        }}
      />

      <Stack.Screen
        name="RouteDetails"
        component={RouteDetails}
        options={{
          title: "Detalles de la ruta",
          headerStyle: {
            backgroundColor: "#F6F8FC",
          },
        }}
      />

      <Stack.Screen
        name="RouteMap"
        component={RouteMapScreen}
        options={{
          title: "Ruta en curso",
          headerStyle: {
            backgroundColor: "#F8FAFC",
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;