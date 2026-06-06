// Seleccionamos todos los botones de la lista y secciones
const botones = document.querySelectorAll('.lista-servicios li');
const secciones = document.querySelectorAll('.seccion-contenido');

// 1. Lógica del Enrutador de Pestañas
botones.forEach(boton => {
    boton.addEventListener('click', () => {
        // Escondemos todas las secciones primero
        secciones.forEach(seccion => {
            seccion.style.display = 'none';
        });

        // Limpiamos acentos y pasamos a minúsculas para coincidir con los IDs
        const textoBoton = boton.innerText.toLowerCase()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Mostramos la sección activa
        const seccionAMostrar = document.getElementById(textoBoton);
        if (seccionAMostrar) {
            seccionAMostrar.style.display = 'block';
        }
    });
});

// 2. Sistema del Portal Automatizado para Emprendedores
const authPanel = document.getElementById('auth-panel');
const uploadPanel = document.getElementById('upload-panel');
const btnIngresar = document.getElementById('btn-ingresar');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const nombreNegocioTxt = document.getElementById('nombre-negocio-txt');
const formProducto = document.getElementById('form-producto');

let negocioActual = "";
let categoriaActual = "";

// Login Simulado
btnIngresar.addEventListener('click', () => {
    const nombreInput = document.getElementById('emp-nombre').value.trim();
    const categoriaInput = document.getElementById('emp-categoria').value;

    if (nombreInput === "") {
        alert("Por favor, introduce el nombre de tu emprendimiento para continuar.");
        return;
    }

    negocioActual = nombreInput;
    categoriaActual = categoriaInput;

    nombreNegocioTxt.innerText = negocioActual;
    authPanel.style.display = 'none';
    uploadPanel.style.display = 'block';
});

// Desconexión del Panel
btnCerrarSesion.addEventListener('click', () => {
    authPanel.style.display = 'block';
    uploadPanel.style.display = 'none';
    formProducto.reset();
});

// Procesar y Publicar Producto en la sección asignada
formProducto.addEventListener('submit', (e) => {
    e.preventDefault();

    const prodNombre = document.getElementById('prod-nombre').value;
    const prodDescripcion = document.getElementById('prod-descripcion').value;
    const prodPrecio = document.getElementById('prod-precio').value;
    const prodFotoFile = document.getElementById('prod-foto').files[0];

    if (!prodFotoFile) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const urlImagen = event.target.result;

        // Estructura limpia de la tarjeta inyectada
        const nuevaTarjetaHTML = `
            <div class="tarjeta animated-in">
                <img src="${urlImagen}" alt="${prodNombre}" class="img-producto">
                <div class="info-producto">
                    <h3>${prodNombre}</h3>
                    <p class="autor-tag">Por: ${negocioActual}</p>
                    <p>${prodDescripcion}</p>
                    <span class="precio">C$ ${parseInt(prodPrecio).toLocaleString()}</span>
                </div>
            </div>
        `;

        const seccionDestino = document.getElementById(categoriaActual);
        let contenedorProductos = seccionDestino.querySelector('.contenedor-productos');

        // Si el contenedor Grid no existe en esa pestaña, se autogenera en el momento
        if (!contenedorProductos) {
            contenedorProductos = document.createElement('div');
            contenedorProductos.className = 'contenedor-productos';
            seccionDestino.appendChild(contenedorProductos);
        }

        // Se inserta de primero en el catálogo de la sección
        contenedorProductos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);

        alert(`¡Éxito! Tu producto se ha incorporado automáticamente al catálogo de ${categoriaActual.toUpperCase()}.`);
        formProducto.reset();
    };

    reader.readAsDataURL(prodFotoFile);
});