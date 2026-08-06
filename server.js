const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del Frontend
app.use(express.static(__dirname));

// Configuración del cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de Multer usando Memoria RAM (ideal para la nube/Supabase)
const upload = multer({ storage: multer.memoryStorage() });

// Conexión a PostgreSQL (Soporta Render y Local)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/manos_granadinas',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ==========================================
// ENDPOINTS DE LA API REST
// ==========================================

// 1. Obtener todos los productos registrados
app.get('/api/productos', async (req, res) => {
    try {
        const query = `
            SELECT p.*, e.nombre_negocio 
            FROM productos p 
            JOIN emprendedores e ON p.emprendedor_id = e.id 
            ORDER BY p.creado_en DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// 2. Registro de Emprendedores
app.post('/api/registro', async (req, res) => {
    const { nombreNegocio, correo, telefono, geoposicion, usuario, password, codigoVerificacion } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO emprendedores (nombre_negocio, correo, telefono, geoposicion, usuario, password, codigo_verificacion, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente') RETURNING id`,
            [nombreNegocio, correo, telefono, geoposicion, usuario, password, codigoVerificacion]
        );
        res.json({ ok: true, id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'El usuario ya existe o hubo un problema.' });
    }
});

// 3. Activación de Cuenta por Código
app.post('/api/activar', async (req, res) => {
    const { usuario, codigo } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM emprendedores WHERE usuario = $1', [usuario]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        const user = userCheck.rows[0];
        if (user.codigo_verificacion === codigo) {
            await pool.query("UPDATE emprendedores SET estado = 'activo', codigo_verificacion = '' WHERE id = $1", [user.id]);
            res.json({ ok: true, mensaje: 'Cuenta activada exitosamente' });
        } else {
            res.status(400).json({ error: 'Código incorrecto' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// 4. Inicio de Sesión
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM emprendedores WHERE usuario = $1 AND password = $2', [usuario, password]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const user = result.rows[0];
        res.json({
            ok: true,
            id: user.id,
            nombreNegocio: user.nombre_negocio,
            estado: user.estado
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el login' });
    }
});

// 5. Publicación de Producto con Foto alojada en Supabase Storage
app.post('/api/productos', upload.single('foto'), async (req, res) => {
    const { emprendedorId, categoria, nombre, descripcion, precio } = req.body;
    const file = req.file;

    try {
        if (!file) {
            return res.status(400).json({ error: 'Debe adjuntar una imagen del producto' });
        }

        // Crear un nombre único para la imagen
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;

        // 1. Subir el buffer de la foto al bucket 'productos-imagenes' en Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productos-imagenes')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Error al subir a Supabase:', uploadError);
            return res.status(500).json({ error: 'Error al almacenar la imagen en Supabase' });
        }

        // 2. Obtener la URL pública generada por Supabase
        const { data: publicUrlData } = supabase.storage
            .from('productos-imagenes')
            .getPublicUrl(fileName);

        const imagenUrl = publicUrlData.publicUrl;

        // 3. Registrar el producto en la Base de Datos PostgreSQL en Render
        const result = await pool.query(
            `INSERT INTO productos (emprendedor_id, categoria, nombre, descripcion, precio, imagen_url)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [emprendedorId, categoria, nombre, descripcion, precio, imagenUrl]
        );

        res.json({ ok: true, producto: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar el producto' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
