// Enrutador de secciones básicas
const botones = document.querySelectorAll('.lista-servicios li');
const secciones = document.querySelectorAll('.seccion-contenido');

botones.forEach(boton => {
    boton.addEventListener('click', () => {
        secciones.forEach(sec => sec.style.display = 'none');
        const txt = boton.innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const target = document.getElementById(txt);
        if (target) target.style.display = 'block';
    });
});

// ==========================================
// CENTRAL DE SEGURIDAD Y CONFIGURACIÓN
// ==========================================
const TU_NUMERO_WHATSAPP = "50587961435"; 

// Componentes UI
const authPanel = document.getElementById('auth-panel');
const activationPanel = document.getElementById('activation-panel');
const uploadPanel = document.getElementById('upload-panel');
const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const formLoginBox = document.getElementById('form-login-box');
const formRegistroBox = document.getElementById('form-registro-box');

// Botones y Variables Globales
const btnObtenerGeo = document.getElementById('btn-obtener-geo');
const inputGeoposicion = document.getElementById('reg-geoposicion');
const btnRegistrarCuenta = document.getElementById('btn-registrar-cuenta');
const btnVerificarCodigo = document.getElementById('btn-verificar-codigo');
const btnCancelarActivacion = document.getElementById('btn-cancelar-activacion');
const btnIngresar = document.getElementById('btn-ingresar');
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
const nombreNegocioTxt = document.getElementById('nombre-negocio-txt');
const formProducto = document.getElementById('form-producto');

let negocioActual = "";
let emprendedorIdActual = null;
let usuarioEnEsperaDeActivacion = "";

// Intercambio de subformularios
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('activo'); tabRegistro.classList.remove('activo');
    formLoginBox.style.display = 'block'; formRegistroBox.style.display = 'none';
});
tabRegistro.addEventListener('click', () => {
    tabRegistro.classList.add('activo'); tabLogin.classList.remove('activo');
    formLoginBox.style.display = 'none'; formRegistroBox.style.display = 'block';
});

// Geolocalización
btnObtenerGeo.addEventListener('click', () => {
    if (navigator.geolocation) {
        btnObtenerGeo.innerText = "Buscando...";
        navigator.geolocation.getCurrentPosition((pos) => {
            inputGeoposicion.value = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
            btnObtenerGeo.innerText = "✓ Capturado";
            btnObtenerGeo.style.backgroundColor = "#27ae60"; btnObtenerGeo.style.color = "white";
        }, () => { alert("Activa el acceso a tu ubicación."); btnObtenerGeo.innerText = "📍 Ubicación GPS"; });
    }
});

// 1. Cargar productos almacenados en PostgreSQL al iniciar la app
async function cargarProductosDesdeBD() {
    try {
        const res = await fetch('/api/productos');
        const productos = await res.json();

        productos.forEach(prod => {
            const nuevaTarjetaHTML = `
                <div class="tarjeta animated-in">
                    <div class="contenedor-img-producto" onclick="abrirZoomImage('${prod.imagen_url}')">
                        <img src="${prod.imagen_url}" alt="${prod.nombre}" class="img-producto">
                        <span class="badge-zoom">🔍 Zoom</span>
                    </div>
                    <div class="info-producto">
                        <h3>${prod.nombre}</h3>
                        <p class="autor-tag">Por: ${prod.nombre_negocio || 'Emprendedor'}</p>
                        <p>${prod.descripcion}</p>
                        
                        <div class="footer-tarjeta">
                            <span class="precio">C$ ${parseInt(prod.precio).toLocaleString()}</span>
                            <div class="acciones-emprendedor">
                    ${prod.telefono ? `
    <a href="https://wa.me/505${prod.telefono.replace(/\s+/g, '')}?text=${encodeURIComponent('Hola, vi tu producto ' + prod.nombre + ' en Manos Granadinas.')}" 
       target="_blank" class="btn-accion btn-ws" title="WhatsApp">
        <span class="num-ws">${prod.telefono}</span>
    </a>
` : ''}
                               ${(prod.geoposicion || prod.latitud) ? `
    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((prod.geoposicion || `${prod.latitud},${prod.longitud}`).trim())}" 
       target="_blank" class="btn-accion btn-mapa" title="Ver Ruta">
        📍 Ver mapa
    </a>
` : ''}

                            </div>
                        </div>
                    </div>
                </div>`;
            const dest = document.getElementById(prod.categoria)?.querySelector('.contenedor-productos');
            if (dest) dest.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
        });
    } catch (err) {
        console.error('Error al cargar productos iniciales:', err);
    }
}
document.addEventListener('DOMContentLoaded', cargarProductosDesdeBD);

// Lógica del Zoom de Imagen
function abrirZoomImage(url) {
    const modal = document.getElementById('modal-zoom');
    const imgAmpliada = document.getElementById('img-zoom-ampliada');
    imgAmpliada.src = url;
    modal.style.display = 'flex';
}

document.getElementById('cerrar-zoom')?.addEventListener('click', () => {
    document.getElementById('modal-zoom').style.display = 'none';
});

// Control del Botón Flotante para Volver Arriba
const btnSubir = document.getElementById('btn-volver-arriba');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        btnSubir.style.display = 'block';
    } else {
        btnSubir.style.display = 'none';
    }
});

btnSubir?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 2. Flujo de Registro (Guarda en PostgreSQL)
btnRegistrarCuenta.addEventListener('click', async () => {
    const regNombre = document.getElementById('reg-nombre-comercial').value.trim();
    const regCorreo = document.getElementById('reg-correo').value.trim();
    const regTelefono = document.getElementById('reg-telefono').value.trim();
    const regGeo = inputGeoposicion.value;
    const regUser = document.getElementById('reg-usuario').value.trim().toLowerCase();
    const regPass = document.getElementById('reg-password').value;

    if (!regNombre || !regCorreo || !regTelefono || !regGeo || !regUser || !regPass) {
        alert("Completa todos los parámetros e incluye la geoposición.");
        return;
    }

    const tokenAleatorio = `MG-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
        const respuesta = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreNegocio: regNombre,
                correo: regCorreo,
                telefono: regTelefono,
                geoposicion: regGeo,
                usuario: regUser,
                password: regPass,
                codigoVerificacion: tokenAleatorio
            })
        });

        const data = await respuesta.json();
        if (!respuesta.ok) {
            alert(data.error || "Error al registrar usuario.");
            return;
        }

        usuarioEnEsperaDeActivacion = regUser;

        const textoWhatsApp = encodeURIComponent(
            `¡Nueva Solicitud de Registro! 🔔 Manos Granadinas\n\n` +
            `• Negocio: ${regNombre}\n` +
            `• Usuario creado: ${regUser}\n` +
            `• Contacto: ${regTelefono} / ${regCorreo}\n` +
            `• Ubicación: https://www.google.com/maps?q=${regGeo}\n\n` +
            `🔑 CÓDIGO DE ACTIVACIÓN: ${tokenAleatorio}\n\n` +
            `(Reenvía este código al emprendedor si apruebas su espacio)`
        );

        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${TU_NUMERO_WHATSAPP}&text=${textoWhatsApp}`;
        alert(`✨ ¡Ficha Generada con Éxito! ✨\n\nEl código temporal generado es: ${tokenAleatorio}\n\nAcepta este mensaje para abrir WhatsApp.`);
        window.open(urlWhatsApp, '_blank');

        authPanel.style.display = 'none';
        activationPanel.style.display = 'block';

    } catch (err) {
        alert("Error de conexión con el servidor de base de datos.");
    }
});

// 3. Verificación del Código enviado por WhatsApp
btnVerificarCodigo.addEventListener('click', async () => {
    const codigoIngresado = document.getElementById('activation-code-input').value.trim().toUpperCase();

    try {
        const res = await fetch('/api/activar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: usuarioEnEsperaDeActivacion,
                codigo: codigoIngresado
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert(`¡Felicidades! La cuenta ha sido activada de forma exitosa.\nYa puedes iniciar sesión con tus credenciales.`);
            document.getElementById('activation-code-input').value = "";
            activationPanel.style.display = 'none';
            authPanel.style.display = 'block';
            tabLogin.click();
        } else {
            alert(data.error || "Código de activación incorrecto.");
        }
    } catch (err) {
        alert("Error de red al activar la cuenta.");
    }
});

btnCancelarActivacion.addEventListener('click', () => {
    activationPanel.style.display = 'none';
    authPanel.style.display = 'block';
});

// 4. Login Tradicional
btnIngresar.addEventListener('click', async () => {
    const usuarioInput = document.getElementById('emp-usuario').value.trim().toLowerCase();
    const passwordInput = document.getElementById('emp-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuarioInput, password: passwordInput })
        });

        const data = await res.json();

        if (res.ok) {
            if (data.estado === "pendiente") {
                usuarioEnEsperaDeActivacion = usuarioInput;
                alert("Esta cuenta se encuentra bloqueada debido a que no ha sido activada con su código correspondiente.");
                authPanel.style.display = 'none';
                activationPanel.style.display = 'block';
                return;
            }

            negocioActual = data.nombreNegocio;
            emprendedorIdActual = data.id;
            nombreNegocioTxt.innerText = negocioActual;
            authPanel.style.display = 'none';
            uploadPanel.style.display = 'block';
            
            document.getElementById('emp-usuario').value = "";
            document.getElementById('emp-password').value = "";
        } else {
            alert(data.error || "Usuario o contraseña incorrectos.");
        }
    } catch (err) {
        alert("Error al conectar con el servidor.");
    }
});

btnCerrarSesion.addEventListener('click', () => {
    authPanel.style.display = 'block';
    uploadPanel.style.display = 'none';
    formProducto.reset();
    emprendedorIdActual = null;
    negocioActual = "";
});

// 5. Publicación de Productos
formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cat = document.getElementById('prod-categoria').value;
    const name = document.getElementById('prod-nombre').value;
    const desc = document.getElementById('prod-descripcion').value;
    const price = document.getElementById('prod-precio').value;
    const file = document.getElementById('prod-foto').files[0];

    if (!file || !emprendedorIdActual) {
        alert("Asegúrate de haber subido una imagen y de haber iniciado sesión.");
        return;
    }

    const formData = new FormData();
    formData.append('emprendedorId', emprendedorIdActual);
    formData.append('categoria', cat);
    formData.append('nombre', name);
    formData.append('descripcion', desc);
    formData.append('precio', price);
    formData.append('foto', file);

    try {
        const res = await fetch('/api/productos', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            const nuevaTarjetaHTML = `
                <div class="tarjeta animated-in">
                    <div class="contenedor-img-producto" onclick="abrirZoomImage('${data.producto.imagen_url}')">
                        <img src="${data.producto.imagen_url}" alt="${name}" class="img-producto">
                        <span class="badge-zoom">🔍 Zoom</span>
                    </div>
                    <div class="info-producto">
                        <h3>${name}</h3>
                        <p class="autor-tag">Por: ${negocioActual}</p>
                        <p>${desc}</p>
                        
                        <div class="footer-tarjeta">
                            <span class="precio">C$ ${parseInt(price).toLocaleString()}</span>
                        </div>
                    </div>
                </div>`;
            const dest = document.getElementById(cat).querySelector('.contenedor-productos');
            if (dest) dest.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
            
            alert(`¡Publicado con éxito en ${cat.toUpperCase()} y guardado en la base de datos!`);
            formProducto.reset();
        } else {
            alert(data.error || "No se pudo publicar el producto.");
        }
    } catch (err) {
        alert("Error al subir el producto al servidor.");
    }
});
