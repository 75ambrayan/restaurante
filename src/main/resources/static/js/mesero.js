let carrito = [];

function prepararAgregarAlCarrito(elemento) {
    const id = elemento.getAttribute('data-id');
    const nombre = elemento.getAttribute('data-nombre');
    const precio = parseFloat(elemento.getAttribute('data-precio'));
    agregarAlCarrito(id, nombre, precio);
}

function agregarAlCarrito(id, nombre, precio) {
    const existe = carrito.find(item => item.productoId === id);
    if (existe) {
        existe.cantidad++;
        existe.subtotal = existe.cantidad * precio;
    } else {
        carrito.push({ productoId: id, nombre: nombre, precio: precio, cantidad: 1, subtotal: precio });
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const container = document.getElementById('lista-items');
    let html = '';
    let total = 0;

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 opacity-50">
                <i class="bi bi-cart-x" style="font-size: 3rem;"></i>
                <p class="mt-2">Comanda vacía</p>
            </div>`;
        document.getElementById('total-monto').innerText = "0.00";
        return;
    }

    carrito.forEach((item, index) => {
        total += item.subtotal;
        html += `
            <div class="cart-item-card shadow-sm border-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="d-block fw-bold text-dark">${item.nombre}</span>
                        <small class="text-muted">${item.cantidad} x S/ ${item.precio.toFixed(2)}</small>
                    </div>
                    <div class="text-end">
                        <span class="d-block fw-bold text-primary">S/ ${item.subtotal.toFixed(2)}</span>
                        <button class="btn btn-sm text-danger p-0" onclick="eliminarItem(${index})">
                           <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
    document.getElementById('total-monto').innerText = total.toFixed(2);
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    renderizarCarrito();
}

function filtrarProductos() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.producto-card');

    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.querySelector('.nombre-producto').innerText.toLowerCase();
        tarjeta.style.display = nombre.includes(texto) ? '' : 'none';
    });
}

async function enviarPedido() {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaId = urlParams.get('mesaId');
    // --- 1. CAPTURAMOS EL PEDIDO ID DE LA URL (EL CABLE QUE FALTABA) ---
    const pedidoId = urlParams.get('pedidoId');

    if(carrito.length === 0) {
        alert("Agrega al menos un producto");
        return;
    }

    // --- 2. ARMAMOS EL OBJETO CON EL ID HISTÓRICO ---
    const pedido = {
        // Si existe un pedidoId en la URL, se convierte a entero y se inyecta. Si no, viaja null
        id: pedidoId ? parseInt(pedidoId) : null,
        cliente: document.getElementById('cliente').value || "Mesa " + mesaId,
        direccion: document.getElementById('direccion').value,
        listaDetalles: carrito.map(item => ({
            producto: { id: parseInt(item.productoId) }, // Aseguramos que viaje como número
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.subtotal
        }))
    };

    try {
        // Enviamos los datos al controlador
        const response = await fetch('/admin/mesero/guardar' + (mesaId ? '?mesaId=' + mesaId : ''), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        // --- 3. CORRECCIÓN DE LECTURA DE RESPUESTA SÍNCRONA ---
        const resultadoTexto = await response.text();

        if (resultadoTexto === "OK") {
            alert("¡Orden enviada a cocina!");
            window.location.href = '/admin/mesas';
        } else {
            alert("Error al procesar el pedido: " + resultadoTexto);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Fallo de conexión");
    }
}