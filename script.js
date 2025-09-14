import { db } from "./firebase-config.js";
import 
{
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const form = document.getElementById("form-reserva");
const fechaInput = document.getElementById("fecha");
const horaInput = document.getElementById("hora");

async function cargarHorariosOcupados()
{
  // Consulta reservas confirmadas
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("estado", "==", "confirmado"));
  const snapshot = await getDocs(q);

  // Lista de horarios ocupados
  const horariosOcupados = snapshot.docs.map(doc => doc.data().fechaHora);

  // Deshabilitar horarios ocupados en el <select> de hora
  const opciones = horaInput.querySelectorAll("option");
  opciones.forEach(option => 
  {
    const fechaSeleccionada = fechaInput.value;
    const fechaHora = `${fechaSeleccionada}T${option.value}`;
    if (horariosOcupados.includes(fechaHora)) 
    {
      option.disabled = true;
    } else 
    {
      option.disabled = false;
    }
  });
}

// Detectar cambio de fecha para actualizar horarios
fechaInput.addEventListener("change", cargarHorariosOcupados);

// Guardar nueva reserva
form.addEventListener("submit", async (e) => 
 {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const fecha = fechaInput.value;
  const hora = horaInput.value;
  const fechaHora = `${fecha}T${hora}`;

  // Verificar si el turno sigue libre
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("fechaHora", "==", fechaHora), where("estado", "!=", "cancelado"));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    alert("Lo siento el horiario ya fue reservado. Por favor elige otro,");
    return;
  }

  // Guardar en Firestore
  try {
    await addDoc(reservasRef, {
      nombre,
      telefono,
      fechaHora,
      estado: "pendiente",
      creadoEn: new Date()
 });
    alert("Tu turno fue registrado. \nTe contactaremos para confirmarlo. \nGRACIAS!");
    form.reset();
    cargarHorariosOcupados(); // vuelve a bloquear el horario
  } catch (error) {
    console.error("Error al guardar la reserva:", error);
    alert("Hubo un error al guardar tu turno. Intenta de nuevo.");
  }
});

// Al cargar la página, deshabilita horarios si hay fecha seleccionada
window.addEventListener("DOMContentLoaded", cargarHorariosOcupados);
