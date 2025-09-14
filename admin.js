import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  query,
  where
} from "firebase/firestore";

// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "peluqueria-turnos-bdcf8",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📋 Mostrar reservas
async function cargarReservas() {
  const reservasRef = collection(db, "reservas");
  const snapshot = await getDocs(reservasRef);
  const tabla = document.getElementById("tabla-reservas");
  tabla.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${data.nombre}</td>
      <td>${data.telefono}</td>
      <td>${data.fecha}</td>
      <td>${data.hora}</td>
      <td>
        <button onclick="aceptarTurno('${docSnap.id}')">Aceptar</button>
        <button onclick="rechazarTurno('${docSnap.id}')">Rechazar</button>
      </td>
    `;

    tabla.appendChild(fila);
  });
}

// ✅ Aceptar turno
window.aceptarTurno = async function(id) {
  const reservaRef = doc(db, "reservas", id);
  await updateDoc(reservaRef, { estado: "aceptado" });
  cargarReservas();
};

// ❌ Rechazar turno
window.rechazarTurno = async function(id) {
  const reservaRef = doc(db, "reservas", id);
  await updateDoc(reservaRef, { estado: "rechazado" });
  cargarReservas();
};

// 🚫 Bloquear día completo
document.getElementById("bloquear-dia").addEventListener("click", async () => {
  const fecha = document.getElementById("fecha-horario").value;
  if (!fecha) return alert("Seleccioná una fecha");

  await addDoc(collection(db, "bloqueos"), { fecha });
  alert("Día bloqueado");
});

// 🕒 Bloquear horario específico
document.getElementById("agregar-horario").addEventListener("click", async () => {
  const fecha = document.getElementById("fecha-horario").value;
  const hora = document.getElementById("nuevo-horario").value;
  if (!fecha || !hora) return alert("Completá fecha y horario");

  await addDoc(collection(db, "bloqueos"), { fecha, hora });
  alert("Horario bloqueado");
});

function generarHorarios() {
  const horarios = [];
  let hora = 8;
  let minuto = 0;

  while (hora < 21 || (hora === 21 && minuto === 0)) {
    const h = hora.toString().padStart(2, '0');
    const m = minuto.toString().padStart(2, '0');
    horarios.push(`${h}:${m}`);

    minuto += 30;
    if (minuto === 60) {
      minuto = 0;
      hora++;
    }
  }

  return horarios;
}

document.addEventListener("DOMContentLoaded", () => {
  // 🕒 Poblar el <select> con horarios disponibles
  const selectHorario = document.getElementById("nuevo-horario");
  const horarios = generarHorarios();

  horarios.forEach(hora => {
    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;
    selectHorario.appendChild(option);
  });
});

// 🔄 Inicializar
cargarReservas();
