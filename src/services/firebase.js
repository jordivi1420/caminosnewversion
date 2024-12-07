import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDgDPx9SE8RPJfLSZIucqifDLFc4qKkcYU",
    authDomain: "caminouniguajira-325d8.firebaseapp.com",
    databaseURL: "https://caminouniguajira-325d8-default-rtdb.firebaseio.com",
    projectId: "caminouniguajira-325d8",
    storageBucket: "caminouniguajira-325d8.firebasestorage.app",
    messagingSenderId: "328271219855",
    appId: "1:328271219855:web:f14202b80f59a4332fb4fa",
    measurementId: "G-93934QGPX7"
  };

// Inicializa Firebase solo si no ha sido inicializado previamente
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Usa la instancia existente
}

// Exporta los servicios necesarios
export const auth = getAuth(app);
export const database = getDatabase(app);
