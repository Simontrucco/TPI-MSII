
class ModeloUsuarios {
    static getSTORAGE_KEY() {
        return 'usuarios_bodypaint_db';
    }

    static obtenerTodos() {
        const usuarios = localStorage.getItem(this.getSTORAGE_KEY());
        return usuarios ? JSON.parse(usuarios) : [];
    }

    static existeEmail(email) {
        const usuarios = this.obtenerTodos();
        return usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
    }

    static guardar(nuevoUsuario) {
        const usuarios = this.obtenerTodos();
        usuarios.push(nuevoUsuario);
        localStorage.setItem(this.getSTORAGE_KEY(), JSON.stringify(usuarios));
    }

    static autenticar(email, password) {
        const usuarios = this.obtenerTodos();
        return usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    }
}

/**
 * =================================================================
 * CAPA CONTROLADOR (Orquestador de Eventos y Lógica de Negocio)
 * =================================================================
 */
class AppController {
    static init() {
        this.bindEvents();
    }

    static bindEvents() {
        const formRegistro = document.getElementById('formRegistro');
        const formLogin = document.getElementById('formLogin');

        if (formRegistro) {
            formRegistro.addEventListener('submit', (e) => this.handleRegistro(e));
        }

        if (formLogin) {
            formLogin.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    static handleRegistro(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        
        // Atributos obligatorios del dominio
        const pais = document.getElementById('pais').value.trim();
        const provincia = document.getElementById('provincia').value.trim();
        const localidad = document.getElementById('localidad').value.trim();
        const calle = document.getElementById('calle').value.trim();
        const piso = document.getElementById('piso').value.trim();
        const depto = document.getElementById('depto').value.trim();

        const mensajeDiv = document.getElementById('mensaje');

        // Criterio de Aceptación: Validar existencia de mail único
        if (ModeloUsuarios.existeEmail(email)) {
            this.renderMensaje(mensajeDiv, 'Error: El correo electrónico ya se encuentra registrado.', 'error');
            return;
        }

        // Estructura Entidad Cliente
        const nuevoCliente = {
            nombre,
            apellido,
            email,
            password,
            direccionDefault: {
                pais,
                provincia,
                localidad,
                calle,
                piso: piso || null,
                depto: depto || null
            }
        };

        // Persistir mediante el Modelo
        ModeloUsuarios.guardar(nuevoCliente);

        this.renderMensaje(mensajeDiv, '✔ ¡Registro completado con éxito! Redirigiendo...', 'success');
        document.getElementById('formRegistro').reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    static handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const mensajeDiv = document.getElementById('mensaje');

        const usuarioValido = ModeloUsuarios.autenticar(email, password);

        if (usuarioValido) {
            localStorage.setItem('usuarioSesion', JSON.stringify(usuarioValido));
            this.renderMensaje(mensajeDiv, '✔ Autenticación exitosa. Cargando entorno...', 'success');
            
            setTimeout(() => {
                window.location.href = 'inicio.html';
            }, 1500);
        } else {
            this.renderMensaje(mensajeDiv, 'Error: Usuario o contraseña incorrectos.', 'error');
        }
    }

    // Auxiliar de la Vista
    static renderMensaje(elemento, texto, tipo) {
        elemento.innerText = texto;
        elemento.className = `msg ${tipo}`;
        elemento.style.display = 'block';
    }
}

// Inicializar el controlador una vez cargado el DOM
document.addEventListener('DOMContentLoaded', () => AppController.init());
