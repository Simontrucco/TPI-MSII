
const STORAGE_USER_KEY = 'usuarios_bodypaint_db';
const STORAGE_CART_KEY = 'carrito_activo_bodypaint';

class ModeloUsuarios {
    static obtenerTodos() {
        const u = localStorage.getItem(STORAGE_USER_KEY);
        return u ? JSON.parse(u) : [];
    }

    static existeEmail(email) {
        return this.obtenerTodos().some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    static guardar(nuevoUsuario) {
        const u = this.obtenerTodos();
        u.push(nuevoUsuario);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u));
    }

    static autenticar(email, password) {
        return this.obtenerTodos().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    }
}

const ProductosDominio = [
    { id: 1, nombre: "Kit Pinturas Aquacolor Profesionales", categoria: "Pigmentos", precio: 15500 },
    { id: 2, nombre: "Set de Pinceles Calibrados de Precisión", categoria: "Herramientas", precio: 6800 },
    { id: 3, nombre: "Brillantina Cosmética Destellos Cromo", categoria: "Efectos", precio: 3400 },
    { id: 4, nombre: "Esponjas de Densidad Modular (x3)", categoria: "Herramientas", precio: 2200 },
    { id: 5, nombre: "Plantillas Estructuradas Reutilizables", categoria: "Soportes", precio: 4500 }
];

class ModeloCarrito {
    constructor() {
        const guardado = localStorage.getItem(STORAGE_CART_KEY);
        this.state = guardado ? JSON.parse(guardado) : [];
    }

    sincronizar() {
        localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(this.state));
    }

    agregar(producto) {
        const match = this.state.find(item => item.producto.id === producto.id);
        if (match) {
            match.cantidad += 1;
        } else {
            this.state.push({ producto, cantidad: 1 });
        }
        this.sincronizar();
    }

    remover(id) {
        this.state = this.state.filter(item => item.producto.id !== id);
        this.sincronizar();
    }

    getTotal() {
        return this.state.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
    }

    getItemsCount() {
        return this.state.reduce((acc, item) => acc + item.cantidad, 0);
    }
}

const AppCore = (() => {
    let carritoInstance;

    const init = () => {
        carritoInstance = new ModeloCarrito();
        bindGlobalEvents();
        renderCatalogo();
        renderCarritoState();
    };

    const bindGlobalEvents = () => {
        const formRegistro = document.getElementById('formRegistro');
        const formLogin = document.getElementById('formLogin');

        if (formRegistro) formRegistro.addEventListener('submit', handleRegistro);
        if (formLogin) formLogin.addEventListener('submit', handleLogin);
    };

    const handleRegistro = (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const msgContainer = document.getElementById('mensaje');

        if (ModeloUsuarios.existeEmail(email)) {
            renderAlert(msgContainer, 'El correo indicado ya se encuentra registrado.', 'error');
            return;
        }

        const cliente = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            email,
            password: document.getElementById('password').value,
            direccionDefault: {
                pais: document.getElementById('pais').value.trim(),
                provincia: document.getElementById('provincia').value.trim(),
                localidad: document.getElementById('localidad').value.trim(),
                calle: document.getElementById('calle').value.trim()
            }
        };

        ModeloUsuarios.guardar(cliente);
        renderAlert(msgContainer, '✔ Cuenta creada con éxito. Redirigiendo...', 'success');
        
        setTimeout(() => { window.location.href = 'login.html'; }, 1800);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const pass = document.getElementById('password').value;
        const msgContainer = document.getElementById('mensaje');

        const auth = ModeloUsuarios.autenticar(email, pass);
        if (auth) {
            localStorage.setItem('usuarioSesion', JSON.stringify(auth));
            renderAlert(msgContainer, '✔ Acceso autorizado.', 'success');
            setTimeout(() => { window.location.href = 'inicio.html'; }, 1200);
        } else {
            renderAlert(msgContainer, 'Credenciales de acceso incorrectas.', 'error');
        }
    };

    const renderCatalogo = () => {
        const grid = document.getElementById('contenedor-productos');
        if (!grid) return;

        grid.innerHTML = '';
        ProductosDominio.forEach(p => {
            const el = document.createElement('div');
            el.className = 'product-card';
            el.innerHTML = `
                <div>
                    <span class="category">${p.categoria}</span>
                    <h3>${p.nombre}</h3>
                </div>
                <div>
                    <div class="price">$${p.precio.toLocaleString('es-AR')}</div>
                    <button class="btn-add">Añadir</button>
                </div>
            `;
            
            el.querySelector('.btn-add').addEventListener('click', () => {
                carritoInstance.agregar(p);
                renderCarritoState();
                showToast(`Agregado: ${p.nombre}`);
            });
            grid.appendChild(el);
        });
    };

    const renderCarritoState = () => {
        const itemsWrapper = document.getElementById('items-carrito');
        const totalWrapper = document.getElementById('total-precio');
        const badge = document.getElementById('badge-contador');

        if (!itemsWrapper) return;
        itemsWrapper.innerHTML = '';

        if (badge) badge.innerText = carritoInstance.getItemsCount();

        if (carritoInstance.state.length === 0) {
            itemsWrapper.innerHTML = '<p class="empty-message">No hay elementos seleccionados.</p>';
            totalWrapper.innerText = '$0';
            return;
        }

        carritoInstance.state.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <div class="item-details">
                    <span class="item-name">${item.producto.nombre}</span>
                    <span class="item-qty">Unidades: ${item.cantidad}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight:600; font-size:13px;">$${(item.producto.precio * item.cantidad).toLocaleString('es-AR')}</span><br>
                    <button class="btn-remove">Quitar</button>
                </div>
            `;

            row.querySelector('.btn-remove').addEventListener('click', () => {
                carritoInstance.remover(item.producto.id);
                renderCarritoState();
            });

            itemsWrapper.appendChild(row);
        });

        totalWrapper.innerText = `$${carritoInstance.getTotal().toLocaleString('es-AR')}`;
    };

    const renderAlert = (target, text, type) => {
        target.innerText = text;
        target.className = `msg ${type}`;
        target.style.display = 'block';
    };

    const showToast = (text) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.innerText = text;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2200);
    };

    return { start: init };
})();

document.addEventListener('DOMContentLoaded', () => AppCore.start());