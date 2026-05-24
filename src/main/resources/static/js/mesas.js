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

// --- GESTIÓN DE FLUJO HISTÓRICO Y CICLO DE CONTROL DE MESAS ---
function prepararGestion(elemento) {
    const id = elemento.getAttribute('data-id');
    const estado = elemento.getAttribute('data-estado');
    currentMesaNumero = elemento.getAttribute('data-numero');
    const pedidoEstado = elemento.getAttribute('data-pedido-estado');

    // Capturamos el ID del pedido persistente de la BD para la adición
    currentPedidoId = elemento.getAttribute('data-pedido-id');
    currentMesaId = id;

    if (estado === 'DISPONIBLE') {
        window.location.href = '/admin/mesero/nuevo?mesaId=' + id;
    } else {
        document.getElementById('lblNumero').innerText = currentMesaNumero;

        const btnEntregar = document.getElementById('btnEntregarPlato');
        const btnDesocupar = document.getElementById('btnDesocupar');
        const alertaConsumo = document.getElementById('alertaConsumo');
        const txtConfirmacion = document.getElementById('textoConfirmacion');
        const numMesaTexto = document.getElementById('numMesaTexto');
        const tarjetaMesa = elemento;

        // Reset inicial
        btnEntregar.classList.add('d-none');
        txtConfirmacion.classList.add('d-none');
        alertaConsumo.classList.add('d-none');
        btnDesocupar.classList.remove('disabled');

        // Evaluación dinámica de estados en Salón
        if (tarjetaMesa.classList.contains('lista-para-recoger')) {
            numMesaTexto.innerText = currentMesaNumero;
            txtConfirmacion.classList.remove('d-none');
            btnEntregar.classList.remove('d-none');
            btnDesocupar.classList.add('disabled');
        } else if (pedidoEstado === 'ENTREGADO') {
            alertaConsumo.classList.remove('d-none');
        } else if (pedidoEstado === 'ASIGNADO' || pedidoEstado === 'PREPARADO') {
            // Pedido local listo — permitir cobrar y liberar mesa
            alertaConsumo.classList.remove('d-none');
            btnDesocupar.classList.remove('disabled');
        } else {
            btnDesocupar.classList.add('disabled'); // En preparación — aún no listo
        }

        if (mesaModal) mesaModal.show();
    }
}

function abrirGestion(id, estado, numero) {
    currentMesaId = id;
    if (estado === 'DISPONIBLE') {
        window.location.href = '/admin/mesero/nuevo?mesaId=' + id;
    } else {
        document.getElementById('lblNumero').innerText = numero;
        if (mesaModal) mesaModal.show();
    }
}

// NUEVA FUNCIÓN CONSOLIDADA: Envía la mesa y arrastra la orden activa para acumular
function irAMenu() {
    if (currentMesaId) {
        let url = '/admin/mesero/nuevo?mesaId=' + currentMesaId;
        if (currentPedidoId) {
            url += '&pedidoId=' + currentPedidoId;
        }
        window.location.href = url;
    }
}

// --- ENTREGA Y FACTURACIÓN (PRECUENTA) ---
async function marcarComoEntregado() {
    if (!currentMesaNumero) {
        alert("No se ha seleccionado ninguna mesa.");
        return;
    }

    if (confirm(`¿Confirmas que ya se le entregó el pedido a la mesa #${currentMesaNumero}?`)) {
        try {
            const res = await fetch('/admin/mesas/entregar-plato/' + currentMesaNumero, { method: 'POST' });
            if (res.ok) {
                if (mesaModal) mesaModal.hide();
                window.location.reload();
            } else {
                alert("Error al registrar la entrega del plato en el servidor.");
            }
        } catch (error) {
            console.error("Error en la petición de entrega:", error);
            alert("Sin conexión con el servidor.");
        }
    }
}

async function validarDesocupar() {
    let mesaNumero = document.getElementById('lblNumero').innerText;
    let tarjetaMesa = document.querySelector(`[data-numero="${mesaNumero}"]`);

    const pedidoEstadoActual = tarjetaMesa.getAttribute('data-pedido-estado');
    const estadosNoCobrar = ['EN_COCINA', 'PENDIENTE'];
    if (estadosNoCobrar.includes(pedidoEstadoActual)) {
        alert(`¡No puedes desocupar la Mesa #${mesaNumero}! Los cocineros aún no terminan los platos.`);
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

async function confirmarPagoFinal() {
    if (confirm("¿Confirmas que recibiste el pago completo y deseas liberar la mesa?")) {
        try {
            const res = await fetch('/admin/mesas/liberar/' + currentMesaId, { method: 'POST' });
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
