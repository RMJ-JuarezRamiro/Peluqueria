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
  const filtroFecha = document.getElementById("filtro-gestionadas")?.value;
  const snapshot = await reservasRef.get();

  const tablaPendientes = document.getElementById("tabla-reservas");
  const tablaGestionadas = document.getElementById("tabla-gestionadas");
  tablaPendientes.innerHTML = "";
  tablaGestionadas.innerHTML = "";

  snapshot.forEach(docSnap => {
    const { nombre, telefono, fechaHora, estado } = docSnap.data();

    // Aplicar filtro si está activo
    if (filtroFecha) 
    {
      const fechaReserva = fechaHora.split("T")[0];
      if (fechaReserva !== filtroFecha) return;
    }

    const fila = document.createElement("tr");
    const fecha = formatearFecha(fechaHora);
    const hora = formatearHora(fechaHora);


    if (estado.trim() === "pendiente")
    {
      fila.innerHTML = `
        <td>${nombre}</td>
        <td>${telefono}</td>
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>
          <button onclick="aceptarTurno('${docSnap.id}')">Aceptar</button>
          <button onclick="rechazarTurno('${docSnap.id}')">Rechazar</button>
        </td>
      `;
      tablaPendientes.appendChild(fila);
    } 
      else if (!["cancelado", "rechazado"].includes(estado.trim().toLowerCase()))
    {
      fila.innerHTML = `
        <td><input type="checkbox" /></td>
        <td>${nombre}</td>
        <td>${telefono}</td>
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${estado}</td>
        <td><button onclick="cancelarReserva('${docSnap.id}')">Cancelar</button></td>
      `;
      tablaGestionadas.appendChild(fila);
    }
  });
}

// ❌ Cancelar reserva
window.cancelarReserva = async function(id) 
{
  const confirmacion = confirm("¿Estás seguro de cancelar esta reserva?");
  if (!confirmacion) return;

  const reservaRef = db.collection("reservas").doc(id);
  const reservaSnap = await reservaRef.get();
  const { fechaHora } = reservaSnap.data();
  const [fecha, hora] = fechaHora.split("T");

  // Eliminar el bloqueo si existe
  const bloqueosRef = db.collection("bloqueos");
  const snapshot = await bloqueosRef
    .where("fecha", "==", fecha)
    .where("hora", "==", hora)
    .get();

  snapshot.forEach(doc => {
    bloqueosRef.doc(doc.id).delete();
  });

  // Actualizar estado
  await reservaRef.update({ estado: "cancelado" });

  cargarReservas();
  mostrarBloqueos();
};


// 🕒 Cargar horarios ocupados
const fechaInput = document.getElementById("fecha-horario");
const hoy = new Date().toISOString().split("T")[0];
fechaInput.min = hoy;


// ✅ Aceptar turno
window.aceptarTurno = async function(id)
{
  // 🔒 Aceptar y bloquear horario
  const reservaRef = db.collection("reservas").doc(id);
  const reservaSnap = await reservaRef.get();
  const { fechaHora, nombre, telefono } = reservaSnap.data();
  const [fecha, hora] = fechaHora.split("T");

  // 🔍 Verificar si ya está bloqueado
  const bloqueosRef = db.collection("bloqueos");
  const q = bloqueosRef.where("fecha", "==", fecha).where("hora", "==", hora);
  const snapshot = await q.get();

  if (!snapshot.empty) {
    alert("Este horario ya está bloqueado. No se puede aceptar la reserva.");
    return;
  }

  // ✅ Aceptar y bloquear
  await reservaRef.update({ estado: "aceptado" });
  await db.collection("bloqueos").add({ fecha, hora, nombre, telefono });


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

  const snapshot = await db.collection("bloqueos")
    .where("fecha", "==", fecha)
    .where("hora", "==", null)
    .get();

  if (!snapshot.empty) 
  {
    alert("Este día ya está bloqueado");
    return;
  }

  await db.collection("bloqueos").add({ fecha, hora: null }); // clave
  alert("Día bloqueado");
  mostrarBloqueos();

  // refrescar la UI de horarios si el admin está mirando esa fecha
  const fechaInput = document.getElementById("fecha-horario");
  if (fechaInput.value === fecha) {
    // Re-disparar la lógica de poblar checkboxes
    fechaInput.dispatchEvent(new Event("input"));
  }
});

// 🕒 Bloquear horario específico
document.getElementById("agregar-horario").addEventListener("click", async () => 
{
  const fecha = document.getElementById("fecha-horario").value;
  const checkboxes = document.querySelectorAll("#horarios-disponibles input:checked");

  if (!fecha || checkboxes.length === 0) return alert("Seleccioná fecha y al menos un horario");

  const bloqueosRef = db.collection("bloqueos");
  const batch = db.batch();

  for (const cb of checkboxes) 
  {
    const hora = cb.value;

    // Verificar si ya está bloqueado
    const snapshot = await db.collection("bloqueos")
    .where("fecha", "==", fecha)
    .where("hora", "==", hora)
    .get();

    if (snapshot.empty) {
      const ref = bloqueosRef.doc();
      batch.set(ref, { fecha, hora });
    } else {
      console.warn(`Ya está bloqueado: ${fecha} - ${hora}`);
    }
  }

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

// 🕒 Poblar checkboxes de horarios
async function poblarCheckboxHorarios() 
{
  const contenedor = document.getElementById("horarios-disponibles");
  const fechaInput = document.getElementById("fecha-horario");
  const hoy = new Date().toISOString().split("T")[0];
  fechaInput.min = hoy;

  const diasBloqueados = await obtenerDiasBloqueados();

  // 🔄 Limpiar listeners previos si los hubiera
  if (fechaInput._listener)
  {
    fechaInput.removeEventListener("input", fechaInput._listener);
  }

  // 🔁 Definir y guardar el nuevo listener
  const listener = async () => 
  {
    const fechaSeleccionada = fechaInput.value;
    contenedor.innerHTML = "";

    // 🔍 Verificar si el día completo está bloqueado
    const bloqueoDia = await db.collection("bloqueos")
      .where("fecha", "==", fechaSeleccionada)
      .where("hora", "==", null)
      .limit(1)
      .get();

    if (!bloqueoDia.empty) 
    {
      const aviso = document.createElement("p");
      aviso.textContent = "Este día está bloqueado completamente. No se pueden seleccionar horarios.";
      aviso.style.color = "red";
      contenedor.appendChild(aviso);
        // Deshabilitar botones en dias bloqueados
        document.getElementById("agregar-horario").disabled = true;
        document.getElementById("bloquear-dia").disabled = true;

      return;
    }
     else
    // Habilitar botones si el día no está bloqueado 
    {
      document.getElementById("agregar-horario").disabled = false;
      document.getElementById("bloquear-dia").disabled = false;
    }
    // 🔍 Verificar horarios bloqueados
    const snapshot = await db.collection("bloqueos")
      .where("fecha", "==", fechaSeleccionada)
      .get();

    const horariosBloqueados = snapshot.docs
      .map(doc => doc.data().hora)
      .filter(hora => hora); // excluir bloqueos de día completo

    const horarios = generarHorarios();
    horarios.forEach(hora => 
    {
      const label = document.createElement("label");
      label.style.marginRight = "10px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = hora;

      if (horariosBloqueados.includes(hora)) 
      {
        checkbox.disabled = true;
        label.style.opacity = "0.5";
      }

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${hora}`));
      contenedor.appendChild(label);
    });
  };

  fechaInput.addEventListener("input", listener);
  fechaInput._listener = listener; // guardar referencia para evitar duplicados
}

// 🕒 Mostrar bloqueos actuales
document.getElementById("filtro-fecha").addEventListener("change", mostrarBloqueos);

async function mostrarBloqueos() 
{
  const lista = document.getElementById("lista-bloqueos");
  lista.innerHTML = "";

  const filtroFecha = document.getElementById("filtro-fecha").value;

  const bloqueosRef = db.collection("bloqueos");
  const snapshot = filtroFecha
  ? await db.collection("bloqueos").where("fecha", "==", filtroFecha).get()
  : await db.collection("bloqueos").get();

  snapshot.forEach(doc => 
  {
    const { fecha, hora, nombre, telefono } = doc.data();
    const item = document.createElement("li");

    let texto = "";
    if (!hora) 
    {
      texto = `${fecha} (día completo)`;
    }
     else if (nombre && telefono) 
    {
      texto = `${fecha} - ${hora} (${nombre} - ${telefono})`;
    }
     else
    {
      texto = `${fecha} - ${hora} (bloqueado manualmente)`;
    }

    item.textContent = texto;

    const btnDesbloquear = document.createElement("button");
    btnDesbloquear.textContent = "Desbloquear";
    btnDesbloquear.onclick = async () => 
    {
      await db.collection("bloqueos").doc(doc.id).delete();
      mostrarBloqueos();
    };

    item.appendChild(btnDesbloquear);
    lista.appendChild(item);
  });
}

// 🔄 Inicializar
window.addEventListener("load", () => 
{
  setTimeout(() => 
  {
    poblarCheckboxHorarios();
    cargarReservas();
    document.getElementById("filtro-gestionadas").addEventListener("change", cargarReservas);
    mostrarBloqueos();
  }, 100);
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

// Obtener días bloqueados
async function obtenerDiasBloqueados()
{
  const snapshot = await db.collection("bloqueos").where("hora", "==", null).get();
  const dias = [];
  snapshot.forEach(doc => {
    const { fecha } = doc.data();
    dias.push(fecha);
  });
  return dias;
}


