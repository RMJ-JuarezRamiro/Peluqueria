// Importar funciones necesarias desde Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyApV4zjTxUptX1KgFCsehNU400egiqNRiM",
  authDomain: "peluqueria-turnos-bdcf8.firebaseapp.com",
  projectId: "peluqueria-turnos-bdcf8",
  storageBucket: "peluqueria-turnos-bdcf8.firebasestorage.app",
  messagingSenderId: "38349116856",
  appId: "1:38349116856:web:32ea06c97e068ff9a3ab4d",
  measurementId: "G-TFDH8VTHZP"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);