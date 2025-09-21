class Galeria {
  constructor(contenedorSelector, archivos) {
    this.contenedor = document.querySelector(contenedorSelector);
    this.archivos = archivos;
    this.modal = document.getElementById('modal');
    this.modalContenido = this.modal.querySelector('.modal-contenido');
    this.cerrarBtn = this.modal.querySelector('.cerrar');

    this.render();
    this.setupModal();
  }

  render() {
    this.archivos.forEach(archivo => {
      const item = document.createElement('div');
      item.classList.add('galeria-item');

      let elemento;
      if (archivo.endsWith('.mp4')) {
        elemento = document.createElement('video');
        elemento.src = archivo;
        elemento.muted = true;
      } else {
        elemento = document.createElement('img');
        elemento.src = archivo;
        elemento.alt = 'Galería';
      }

      elemento.classList.add('miniatura');
      item.appendChild(elemento);
      item.addEventListener('click', () => this.abrirModal(elemento));
      this.contenedor.appendChild(item);
    });
  }

  abrirModal(elemento) {
    const clone = elemento.cloneNode(true);
    if (clone.tagName === 'VIDEO') clone.controls = true;
    this.modalContenido.innerHTML = '';
    this.modalContenido.appendChild(clone);
    this.modal.style.display = 'flex';
  }

  setupModal() {
    this.cerrarBtn.addEventListener('click', () => {
      this.modal.style.display = 'none';
    });
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const archivos = [
    "./imagenes/muestra1.jpeg",
    "./imagenes/muestra2.jpeg",
    "./imagenes/muestra3.jpeg",
    "./imagenes/muestra4.jpeg",
    "./imagenes/muestra5.jpeg",
    "./imagenes/muestra6.jpeg",
    "./imagenes/muestra7.jpeg",
    "./imagenes/muestra8.jpeg",
    "./imagenes/video1.mp4",
    "./imagenes/video2.mp4",
    // ...hasta completar los 16
  ];

  new Galeria('.galeria-contenedor', archivos);
});
