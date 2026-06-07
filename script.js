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
const TU_NUMERO_WHATSAPP = "50587961435"; // <--- Tu número de Nicaragua (Modifícalo si deseas)

// Base de datos integrada con estados de activación
const usuariosAutorizados = {
    "artes_pantanal": { nombreNegocio: "Artesanías El Pantanal", password: "granada2026", estado: "activo", codigoVerificacion: "" },
    "antojitos_cuevas": { nombreNegocio: "Antojitos Cuevas", password: "panaderia_mary", estado: "activo", codigoVerificacion: "" }
};

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
let usuarioEnEsperaDeActivacion = ""; // Guarda el puntero temporal del usuario en proceso

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

// 3. Flujo de Registro Avanzado con Corrección de Enlace
btnRegistrarCuenta.addEventListener('click', () => {
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
    if (usuariosAutorizados[regUser]) {
        alert("El nombre de usuario ya existe.");
        return;
    }

    // GENERAR CÓDIGO DE ACTIVACIÓN SECRETO (Aleatorio entre 1000 y 9999)
    const tokenAleatorio = `MG-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insertar la cuenta pero dejarla bloqueada en estado "pendiente"
    usuariosAutorizados[regUser] = {
        nombreNegocio: regNombre,
        password: regPass,
        estado: "pendiente",
        codigoVerificacion: tokenAleatorio
    };

    usuarioEnEsperaDeActivacion = regUser; // Guardamos quién se está registrando

    // Compilar mensaje estructurado para WhatsApp de forma limpia y segura (Corregido)
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
    
    // Alerta de desarrollo para que sepas el código sin ver WhatsApp obligatoriamente
    alert(`✨ ¡Ficha Generada con Éxito! ✨\n\nEl código temporal generado para este registro es: ${tokenAleatorio}\n\nAcepta este mensaje para abrir la ventana de WhatsApp.`);
    
    // Abrir WhatsApp en pestaña nueva de forma segura
    window.open(urlWhatsApp, '_blank');

    // Cambiar la pantalla al bloqueador de activación
    authPanel.style.display = 'none';
    activationPanel.style.display = 'block';
});

// 4. Verificación del Código enviado por WhatsApp
btnVerificarCodigo.addEventListener('click', () => {
    const codigoIngresado = document.getElementById('activation-code-input').value.trim().toUpperCase();
    const cuenta = usuariosAutorizados[usuarioEnEsperaDeActivacion];

    if (cuenta && cuenta.codigoVerificacion === codigoIngresado) {
        cuenta.estado = "activo";
        cuenta.codigoVerificacion = ""; // Limpiamos el token por seguridad
        
        alert(`¡Felicidades! La cuenta de "${cuenta.nombreNegocio}" ha sido activada de forma exitosa.\nYa puedes iniciar sesión con tus credenciales.`);
        
        document.getElementById('activation-code-input').value = "";
        activationPanel.style.display = 'none';
        authPanel.style.display = 'block';
        tabLogin.click();
    } else {
        alert("Código de activación incorrecto. Verifica el texto enviado por el administrador.");
    }
});

btnCancelarActivacion.addEventListener('click', () => {
    activationPanel.style.display = 'none';
    authPanel.style.display = 'block';
});

// 5. Verificación de Login Tradicional con filtro de estado activo
btnIngresar.addEventListener('click', () => {
    const usuarioInput = document.getElementById('emp-usuario').value.trim().toLowerCase();
    const passwordInput = document.getElementById('emp-password').value;

    const cuentaEncontrada = usuariosAutorizados[usuarioInput];

    if (cuentaEncontrada && cuentaEncontrada.password === passwordInput) {
        
        if (cuentaEncontrada.estado === "pendiente") {
            usuarioEnEsperaDeActivacion = usuarioInput;
            alert("Esta cuenta se encuentra bloqueada debido a que no ha sido activada con su código correspondiente.");
            authPanel.style.display = 'none';
            activationPanel.style.display = 'block';
            return;
        }

        negocioActual = cuentaEncontrada.nombreNegocio;
        nombreNegocioTxt.innerText = negocioActual;
        authPanel.style.display = 'none';
        uploadPanel.style.display = 'block';
        
        document.getElementById('emp-usuario').value = "";
        document.getElementById('emp-password').value = "";
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
});

btnCerrarSesion.addEventListener('click', () => {
    authPanel.style.display = 'block'; uploadPanel.style.display = 'none'; formProducto.reset();
});

// 6. Publicación Automática de Productos
formProducto.addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = document.getElementById('prod-categoria').value;
    const name = document.getElementById('prod-nombre').value;
    const desc = document.getElementById('prod-descripcion').value;
    const price = document.getElementById('prod-precio').value;
    const file = document.getElementById('prod-foto').files[0];

    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const nuevaTarjetaHTML = `
            <div class="tarjeta animated-in">
                <img src="${event.target.result}" alt="${name}" class="img-producto">
                <div class="info-producto">
                    <h3>${name}</h3>
                    <p class="autor-tag">Por: ${negocioActual}</p>
                    <p>${desc}</p>
                    <span class="precio">C$ ${parseInt(price).toLocaleString()}</span>
                </div>
            </div>`;
        const dest = document.getElementById(cat).querySelector('.contenedor-productos');
        dest.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
        alert(`¡Publicado en ${cat.toUpperCase()}!`);
        formProducto.reset();
    };
    reader.readAsDataURL(file);
});