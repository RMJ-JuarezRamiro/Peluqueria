// 🔧 Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "peluqueria-turnos-bdcf8",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 📋 Mostrar reservas
async function cargarReservas() {
  const reservasRef = db.collection("reservas");
  const snapshot = await reservasRef.get();
  const tabla = document.getElementById("tabla-reservas");
  tabla.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${data.nombre}</td>
      <td>${data.telefono}</td>
      <td>${formatearFecha(data.fechaHora)}</td>
      <td>${formatearHora(data.fechaHora)}</td>

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
  const reservaRef = db.collection("reservas").doc(id);
  await reservaRef.update({ estado: "aceptado" });
  cargarReservas();
};

// ❌ Rechazar turno
window.rechazarTurno = async function(id) {
  const reservaRef = db.collection("reservas").doc(id);
  await reservaRef.update({ estado: "rechazado" });
  cargarReservas();
};

// 🚫 Bloquear día completo
document.getElementById("bloquear-dia").addEventListener("click", async () => {
  const fecha = document.getElementById("fecha-horario").value;
  if (!fecha) return alert("Seleccioná una fecha");

  await db.collection("bloqueos").add({ fecha });
  alert("Día bloqueado");
});

// 🕒 Bloquear horario específico
document.getElementById("agregar-horario").addEventListener("click", async () => {
  const fecha = document.getElementById("fecha-horario").value;
  const hora = document.getElementById("nuevo-horario").value;
  if (!fecha || !hora) return alert("Completá fecha y horario");

  await db.collection("bloqueos").add({ fecha, hora });
  alert("Horario bloqueado");
});

// 🕒 Generar horarios
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

// 🕒 Poblar el <select> con horarios disponibles
function poblarHorarios() {
  const selectHorario = document.getElementById("nuevo-horario");
  const horarios = generarHorarios();

  horarios.forEach(hora => {
    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;
    selectHorario.appendChild(option);
  });
}

// 🔄 Inicializar
window.addEventListener("load", () => {
  poblarHorarios();
  cargarReservas();
});

function formatearFecha(fechaHoraStr) {
  const fecha = new Date(fechaHoraStr);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatearHora(fechaHoraStr) {
  const fecha = new Date(fechaHoraStr);
  return fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

