import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

import { Platform } from "react-native";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDgDPx9SE8RPJfLSZIucqifDLFc4qKkcYU",
  authDomain: "caminouniguajira-325d8.firebaseapp.com",
  databaseURL: "https://caminouniguajira-325d8-default-rtdb.firebaseio.com",
  projectId: "caminouniguajira-325d8",
  storageBucket: "caminouniguajira-325d8.firebasestorage.app",
  messagingSenderId: "328271219855",
  appId: "1:328271219855:web:f14202b80f59a4332fb4fa",
  measurementId: "G-93934QGPX7",
};

// Inicializa Firebase solo si no ha sido inicializado previamente
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth con persistencia en React Native (evita el warning y mantiene sesión)
let auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e) {
    // Si ya se inicializó en otra parte, reutiliza la instancia existente
    auth = getAuth(app);
  }
}

export { app, auth };

// Realtime Database
export const database = getDatabase(app);