// Seleccionamos todos los botones de la lista
const botones = document.querySelectorAll('.lista-servicios li');
// Seleccionamos todas las secciones de contenido
const secciones = document.querySelectorAll('.seccion-contenido');

botones.forEach(boton => {
    boton.addEventListener('click', () => {
        // 1. Limpiamos: Escondemos todas las secciones primero
        secciones.forEach(seccion => {
            seccion.style.display = 'none';
        });

        // 2. Obtenemos el nombre del botón y lo pasamos a minúsculas sin acentos
        // Esto es para que coincida con el ID del HTML
        const textoBoton = boton.innerText.toLowerCase()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 3. Mostramos la sección correspondiente
        const seccionAMostrar = document.getElementById(textoBoton);
        if (seccionAMostrar) {
            seccionAMostrar.style.display = 'block';
        }
    });
});

