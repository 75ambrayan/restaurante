let currentMesaId = null;
let currentMesaNumero = null;
let currentPedidoId = null;
let mesaModal = null;
let precuentaModal = null;

// --- CONFIGURACIÓN WEBSOCKET ---
var socket = new SockJS('/ws-restaurante');
var stompClient = Stomp.over(socket);

stompClient.connect({}, function (frame) {
    console.log('Conectado a WebSocket: ' + frame);
    stompClient.subscribe('/topic/notificaciones', function (notificacion) {
        mostrarNotificacionCocina(notificacion.body);
    });
});

function mostrarNotificacionCocina(mensaje) {
    var audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Sonido bloqueado por el navegador"));

    const toastDiv = document.createElement('div');
    toastDiv.className = 'position-fixed bottom-0 end-0 p-3';
    toastDiv.style.zIndex = '9999';
    toastDiv.innerHTML = `
        <div class="toast show align-items-center text-white bg-warning border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body" style="color: black !important;">
                    <i class="bi bi-bell-fill me-2"></i> <strong>AVISO:</strong> ${mensaje}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`;
    document.body.appendChild(toastDiv);

    setTimeout(() => { window.location.reload(); }, 4000);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    const modalElement = document.getElementById('modalMesa');
    if (modalElement) {
        mesaModal = new bootstrap.Modal(modalElement);
    }

    const precuentaElement = document.getElementById('modalPrecuenta');
    if (precuentaElement) {
        precuentaModal = new bootstrap.Modal(precuentaElement);
    }
});

function prepararGestion(elemento) {
    const id = elemento.getAttribute('data-id');
    currentMesaNumero = elemento.getAttribute('data-numero');
    const pedidoEstado = elemento.getAttribute('data-pedido-estado');

    currentPedidoId = elemento.getAttribute('data-pedido-id');
    currentMesaId = id;

    // REGLA DE ORO: Si no hay pedido activo en la BD, la mesa está limpia (Verde) -> Vamos a la carta
    if (pedidoEstado === 'NINGUNO' || !currentPedidoId) {
        window.location.href = '/admin/mesero/nuevo?mesaId=' + id;
        return;
    }

    // SI HAY UN PEDIDO EN CURSO (ROJO, AMARILLO O BLANCO): Abrimos el modal de control
    document.getElementById('lblNumero').innerText = currentMesaNumero;

    const btnEntregar = document.getElementById('btnEntregarPlato');
    const btnDesocupar = document.getElementById('btnDesocupar');
    const txtConfirmacion = document.getElementById('textoConfirmacion');
    const numMesaTexto = document.getElementById('numMesaTexto');
    const tarjetaMesa = elemento;

    // Reset por defecto para el estado ROJO (En cocina, botones de acción bloqueados)
    btnEntregar.classList.add('d-none');
    txtConfirmacion.classList.add('d-none');
    btnDesocupar.classList.add('disabled');

    // MESA AMARILLA: Validamos si la cocina ya terminó el lote
    if (tarjetaMesa.classList.contains('lista-para-recoger')) {
        numMesaTexto.innerText = currentMesaNumero;
        txtConfirmacion.classList.remove('d-none');
        btnEntregar.classList.remove('d-none');
    }
    // MESA BLANCA: Validamos si el mesero ya marcó "Todo Conforme" (Pedido cambia a ASIGNADO)
    else if (pedidoEstado === 'ASIGNADO') {
        btnDesocupar.classList.remove('disabled');
    }

    if (mesaModal) mesaModal.show();
}

// --- REDIRECCIONES Y ACCIONES DEL MODAL ---
function abrirGestion(id, estado, numero) {
    window.location.href = '/admin/mesero/nuevo?mesaId=' + id;
}

function irAMenu() {
    if (currentMesaId) {
        let url = '/admin/mesero/nuevo?mesaId=' + currentMesaId;
        if (currentPedidoId) {
            url += '&pedidoId=' + currentPedidoId;
        }
        window.location.href = url;
    }
}

// Llama al endpoint "marcar-en-mesa" que cambia el estado a ASIGNADO (Blanco)
async function marcarComoEntregado() {
    if (!currentMesaNumero) {
        alert("No se ha seleccionado ninguna mesa.");
        return;
    }

    if (confirm(`¿Confirmas que la orden está completa y todo conforme en la mesa #${currentMesaNumero}?`)) {
        try {
            const res = await fetch('/admin/mesero/marcar-en-mesa/' + currentPedidoId, { method: 'POST' });
            if (res.ok) {
                if (mesaModal) mesaModal.hide();
                window.location.reload();
            } else {
                alert("Error al registrar la entrega en el servidor.");
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            alert("Sin conexión con el servidor.");
        }
    }
}

// Inicia el proceso de pago final
async function validarDesocupar() {
    let mesaNumero = document.getElementById('lblNumero').innerText;
    let tarjetaMesa = document.querySelector(`[data-numero="${mesaNumero}"]`);

    const pedidoEstadoActual = tarjetaMesa.getAttribute('data-pedido-estado');
    const estadosNoCobrar = ['EN_COCINA', 'PENDIENTE'];
    if (estadosNoCobrar.includes(pedidoEstadoActual)) {
        alert(`¡No puedes cobrar la Mesa #${mesaNumero}! Aún hay productos en cocina.`);
        return;
    }

    try {
        const res = await fetch('/admin/mesas/precuenta/' + mesaNumero);
        if (!res.ok) {
            alert("No se encontraron consumos activos para esta mesa.");
            return;
        }

        const data = await res.json();

        document.getElementById('precuentaNumMesa').innerText = mesaNumero;
        document.getElementById('precuentaTotal').innerText = data.montoTotal.toFixed(2);

        const cuerpoTabla = document.getElementById('tablaPrecuentaCuerpo');
        cuerpoTabla.innerHTML = '';

        data.detalles.forEach(d => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${d.producto.nombre}</td>
                <td class="text-center fw-bold">${d.cantidad}</td>
                <td class="text-end">S/. ${d.precioUnitario.toFixed(2)}</td>
                <td class="text-end fw-bold">S/. ${d.subtotal.toFixed(2)}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });

        if (mesaModal) mesaModal.hide();
        if (precuentaModal) precuentaModal.show();

    } catch (error) {
        console.error("Error al cargar precuenta:", error);
        alert("Error al conectar con el servidor para generar la precuenta.");
    }
}

// Ejecuta el cierre de comanda y pone la mesa en Verde nuevamente
async function confirmarPagoFinal() {
    if (confirm("¿Confirmas el pago completo y deseas desocupar la mesa?")) {
        try {
            const res = await fetch(`/admin/mesero/finalizar-atencion/${currentPedidoId}?mesaId=${currentMesaId}`, { method: 'POST' });
            if (res.ok) {
                if (precuentaModal) precuentaModal.hide();
                window.location.reload();
            } else {
                alert("Error al liberar la mesa");
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            alert("Sin conexión con el servidor");
        }
    }
}