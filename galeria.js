class Galeria {
  constructor(contenedorSelector, archivos) {
    this.contenedor = document.querySelector(contenedorSelector);
    this.archivos = archivos;
    this.modal = document.getElementById('modal');
    this.modalContenido = this.modal.querySelector('.modal-contenido');
    this.cerrarBtn = this.modal.querySelector('.cerrar');

    this.render();
    this.setupModal();
    this.setupLoopScroll();
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

  /// Configuración del scroll en bucle
setupLoopScroll() 
{
  const contenedor = this.contenedor;
  const scrollSpeed = 1;

  const autoScroll = () => 
  {
    contenedor.scrollLeft += scrollSpeed;
    // Reiniciar al inicio cuando llega al final
    if (contenedor.scrollLeft >= contenedor.scrollWidth - contenedor.clientWidth) 
    {
      contenedor.scrollLeft = 0;
    }
    requestAnimationFrame(autoScroll);
  };
  autoScroll();
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
    "./imagenes/video1.mp4",
    "./imagenes/muestra3.jpeg",
    "./imagenes/muestra4.jpeg",
    "./imagenes/video2.mp4",
    "./imagenes/muestra5.jpeg",
    "./imagenes/muestra6.jpeg",
    "./imagenes/video3.mp4",
    "./imagenes/muestra7.jpeg",
    "./imagenes/muestra8.jpeg",
    "./imagenes/video4.mp4",
    "./imagenes/muestra9.jpeg",
    "./imagenes/muestra10.jpeg",
    "./imagenes/video5.mp4",
    "./imagenes/video6.mp4",
  ];

  new Galeria('.galeria-contenedor', archivos);
});
