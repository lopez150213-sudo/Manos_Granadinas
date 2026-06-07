// Seleccionamos todos los botones de la lista y secciones
const botones = document.querySelectorAll('.lista-servicios li');
const secciones = document.querySelectorAll('.seccion-contenido');

// 1. Lógica del Enrutador de Pestañas
botones.forEach(boton => {
    boton.addEventListener('click', () => {
        secciones.forEach(seccion => {
            seccion.style.display = 'none';
        });

        const textoBoton = boton.innerText.toLowerCase()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const seccionAMostrar = document.getElementById(textoBoton);
        if (seccionAMostrar) {
            seccionAMostrar.style.display = 'block';
        }
    });
});

// ==========================================
// PARÁMETROS DE LLAVES DE ACCESO (GENERAL)
// ==========================================
const usuariosAutorizados = {
    "artes_pantanal": { nombreNegocio: "Artesanías El Pantanal", password: "granada2026" },
    "antojitos_cuevas": { nombreNegocio: "Antojitos Cuevas", password: "panaderia_mary" },
    "textiles_sultana": { nombreNegocio: "Bordados La Sultana", password: "textiles_local" }
};

// Componentes del Portal
const authPanel = document.getElementById('auth-panel');
const uploadPanel = document.getElementById('upload-panel');
const btnIngresar = document.getElementById('btn-ingresar');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const nombreNegocioTxt = document.getElementById('nombre-negocio-txt');
const formProducto = document.getElementById('form-producto');

// Variable global para recordar el nombre comercial activo
let negocioActual = "";

// 2. Control de Acceso General
btnIngresar.addEventListener('click', () => {
    const usuarioInput = document.getElementById('emp-usuario').value.trim();
    const passwordInput = document.getElementById('emp-password').value;

    const cuentaEncontrada = usuariosAutorizados[usuarioInput];

    if (cuentaEncontrada && cuentaEncontrada.password === passwordInput) {
        negocioActual = cuentaEncontrada.nombreNegocio;

        // Cambiamos la interfaz del panel
        nombreNegocioTxt.innerText = negocioActual;
        
        authPanel.style.display = 'none';
        uploadPanel.style.display = 'block';
        
        // Limpiamos los campos del login
        document.getElementById('emp-usuario').value = "";
        document.getElementById('emp-password').value = "";
    } else {
        alert("Error de autenticación: Usuario o contraseña incorrectos.");
    }
});

// Desconexión del Panel
btnCerrarSesion.addEventListener('click', () => {
    authPanel.style.display = 'block';
    uploadPanel.style.display = 'none';
    formProducto.reset();
});

// 3. Procesar y Publicar en la Categoría Elegida por el Usuario
formProducto.addEventListener('submit', (e) => {
    e.preventDefault();

    const categoriaElegida = document.getElementById('prod-categoria').value; // <--- Lee la opción que seleccionó el usuario
    const prodNombre = document.getElementById('prod-nombre').value;
    const prodDescripcion = document.getElementById('prod-descripcion').value;
    const prodPrecio = document.getElementById('prod-precio').value;
    const prodFotoFile = document.getElementById('prod-foto').files[0];

    if (!prodFotoFile) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const urlImagen = event.target.result;

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

        const seccionDestino = document.getElementById(categoriaElegida);
        let contenedorProductos = seccionDestino.querySelector('.contenedor-productos');

        if (!contenedorProductos) {
            contenedorProductos = document.createElement('div');
            contenedorProductos.className = 'contenedor-productos';
            seccionDestino.appendChild(contenedorProductos);
        }

        contenedorProductos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);

        alert(`¡Éxito! Tu producto se incorporó de forma automática a la sección de ${categoriaElegida.toUpperCase()}.`);
        formProducto.reset();
    };

    reader.readAsDataURL(prodFotoFile);
});