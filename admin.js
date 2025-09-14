// 🔧 Configuración Firebase
const firebaseConfig = 
{
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
async function cargarReservas() 
{
  const reservasRef = db.collection("reservas");
  const snapshot = await reservasRef.get();
  const tabla = document.getElementById("tabla-reservas");
  tabla.innerHTML = "";

  snapshot.forEach(docSnap => {
    const { nombre, telefono, fechaHora } = docSnap.data();


    console.log("Documento:", docSnap.id, docSnap.data());

    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${nombre}</td>
      <td>${telefono}</td>
      <td>${formatearFecha(fechaHora)}</td>
      <td>${formatearHora(fechaHora)}</td>

      <td>
        <button onclick="aceptarTurno('${docSnap.id}')">Aceptar</button>
        <button onclick="rechazarTurno('${docSnap.id}')">Rechazar</button>
      </td>
    `;

    tabla.appendChild(fila);
  });
}

// ✅ Aceptar turno
window.aceptarTurno = async function(id)
{
  const reservaRef = db.collection("reservas").doc(id);
  const reservaSnap = await reservaRef.get();
  const { fechaHora } = reservaSnap.data();

  await reservaRef.update({ estado: "aceptado" });

  // Bloquear automáticamente el horario
  const [fecha, hora] = fechaHora.split("T");
  await db.collection("bloqueos").add({ fecha, hora });

  cargarReservas();
  mostrarBloqueos();
};

// ❌ Rechazar turno
window.rechazarTurno = async function(id) 
{
  const reservaRef = db.collection("reservas").doc(id);
  await reservaRef.update({ estado: "rechazado" });
  cargarReservas();
};

// 🚫 Bloquear día completo
document.getElementById("bloquear-dia").addEventListener("click", async () => 
{
  const fecha = document.getElementById("fecha-horario").value;
  if (!fecha) return alert("Seleccioná una fecha");

  await db.collection("bloqueos").add({ fecha });
  alert("Día bloqueado");
});

// 🕒 Bloquear horario específico
document.getElementById("agregar-horario").addEventListener("click", async () => 
{
  const fecha = document.getElementById("fecha-horario").value;
  const checkboxes = document.querySelectorAll("#horarios-disponibles input:checked");

  if (!fecha || checkboxes.length === 0) return alert("Seleccioná fecha y al menos un horario");

  const batch = db.batch();
  checkboxes.forEach(cb =>
  {
    const ref = db.collection("bloqueos").doc();
    batch.set(ref, { fecha, hora: cb.value });
  });

  await batch.commit();
  alert("Horarios bloqueados");
  mostrarBloqueos();
});


// 🕒 Generar horarios
function generarHorarios()
{
  const horarios = [];
  let hora = 8;
  let minuto = 0;

  while (hora < 21 || (hora === 21 && minuto === 0)) 
  {
    const h = hora.toString().padStart(2, '0');
    const m = minuto.toString().padStart(2, '0');
    horarios.push(`${h}:${m}`);

    minuto += 30;
    if (minuto === 60) 
    {
      minuto = 0;
      hora++;
    }
  }

  return horarios;
}

// 🕒 Poblar select con horarios
function poblarCheckboxHorarios()
{
  const contenedor = document.getElementById("horarios-disponibles");
  contenedor.innerHTML = "";

  const horarios = generarHorarios();
  horarios.forEach(hora => {
    const label = document.createElement("label");
    label.style.marginRight = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = hora;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${hora}`));
    contenedor.appendChild(label);
  });
}


async function mostrarBloqueos()
{
  const lista = document.getElementById("lista-bloqueos");
  lista.innerHTML = "";

  const snapshot = await db.collection("bloqueos").get();
  snapshot.forEach(doc => {
    const { fecha, hora } = doc.data();
    const item = document.createElement("li");

    item.textContent = hora ? `${fecha} - ${hora}` : `${fecha} (día completo)`;

    const btnDesbloquear = document.createElement("button");
    btnDesbloquear.textContent = "Desbloquear";
    btnDesbloquear.onclick = async () => {
      await db.collection("bloqueos").doc(doc.id).delete();
      mostrarBloqueos();
    };

    item.appendChild(btnDesbloquear);
    lista.appendChild(item);
  });
}


// 🔄 Inicializar
window.addEventListener("load", () => {
  poblarCheckboxHorarios();
  cargarReservas();
  mostrarBloqueos();
});

function formatearFecha(fechaHoraStr) {
  if (!fechaHoraStr) return "Fecha no disponible";

  // Asegurarse de que tenga formato ISO completo
  const fecha = new Date(fechaHoraStr.includes("Z") ? fechaHoraStr : fechaHoraStr + ":00Z");

  if (isNaN(fecha)) return "Formato inválido";
  return fecha.toLocaleDateString("es-AR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatearHora(fechaHoraStr) {
  if (!fechaHoraStr) return "Hora no disponible";

  const fecha = new Date(fechaHoraStr.includes("Z") ? fechaHoraStr : fechaHoraStr + ":00Z");

  if (isNaN(fecha)) return "Formato inválido";
  return fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}



