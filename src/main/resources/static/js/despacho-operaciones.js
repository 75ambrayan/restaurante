let mapa;
let selectedPedidoNode = null;
let asignaciones = [];
let controlesRuta = [];
let marcadoresPendientes = [];
const coloresRepartidores = {};
let toastInstance = null;
let confirmModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initMapa();
    actualizarMapaCompleto();

    const toastEl = document.getElementById('liveToast');
    if (toastEl) toastInstance = bootstrap.Toast.getOrCreateInstance(toastEl);

    const modalEl = document.getElementById('modalConfirmar');
    if (modalEl) confirmModalInstance = new bootstrap.Modal(modalEl);

    document.querySelectorAll('.tarjeta-repartidor').forEach(rep => {
        rep.classList.remove('repartidor-ocupado');
        rep.style.borderLeft = "5px solid transparent";
    });
});

function verificarPedidosVacios() {
    const contenedor = document.getElementById('col-pedidos');
    if (!contenedor) return;

    const pedidosVisibles = Array.from(contenedor.querySelectorAll('.tarjeta-pedido'))
                                 .filter(p => p.style.display !== 'none').length;

    let mensajeVacio = document.getElementById('mensaje-vacio');

    if (pedidosVisibles === 0) {
        if (!mensajeVacio) {
            mensajeVacio = document.createElement('div');
            mensajeVacio.id = 'mensaje-vacio';
            mensajeVacio.className = 'text-center p-5 text-muted animate__animated animate__fadeIn';
            mensajeVacio.innerHTML = `
                <i class="bi bi-clipboard2-check-fill d-block mb-2" style="font-size: 2.5rem; color: #ced4da;"></i>
                <p class="fw-bold">No hay pedidos pendientes</p>
            `;
            contenedor.appendChild(mensajeVacio);
        }
    } else if (mensajeVacio) {
        mensajeVacio.remove();
    }
}

function ordenarAsignacionesPorCercania() {
    let n = asignaciones.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            const pedidoA = PEDIDOS_DATA.find(p => p.id == asignaciones[j].pedidoId);
            const pedidoB = PEDIDOS_DATA.find(p => p.id == asignaciones[j+1].pedidoId);
            if (pedidoA && pedidoB) {
                const distA = (pedidoA && pedidoA.latitud != null) ? Math.sqrt(Math.pow(pedidoA.latitud - ORIGEN_COORDS.lat, 2) + Math.pow(pedidoA.longitud - ORIGEN_COORDS.lng, 2)) : Infinity;
                const distB = (pedidoB && pedidoB.latitud != null) ? Math.sqrt(Math.pow(pedidoB.latitud - ORIGEN_COORDS.lat, 2) + Math.pow(pedidoB.longitud - ORIGEN_COORDS.lng, 2)) : Infinity;
                if (distA > distB) {
                    let temp = asignaciones[j];
                    asignaciones[j] = asignaciones[j + 1];
                    asignaciones[j + 1] = temp;
                }
            }
        }
    }
}

function actualizarMapaCompleto() {
    renderizarPuntosPendientes();
    if (asignaciones.length > 0) {
        trazarRutasReales();
    } else {
        limpiarRutas();
    }
    verificarPedidosVacios();
}


function cambiarColorRepartidor(inputEl) {
    const rId = inputEl.id.replace('color-', '');
    const nuevoColor = inputEl.value;

    coloresRepartidores[rId] = nuevoColor;

    asignaciones.forEach(asig => {
        if (asig.repartidorId == rId) asig.color = nuevoColor;
    });

    const tarjeta = document.querySelector(`.tarjeta-repartidor[data-id="${rId}"]`);
    if (tarjeta) {
        tarjeta.style.borderLeft = `5px solid ${nuevoColor}`;
        tarjeta.querySelectorAll('.mini-pedido-asignado').forEach(mini => mini.style.borderColor = nuevoColor);
    }

    actualizarMapaCompleto();
}


function seleccionarPedido(el) {
    // Cambiamos .seleccionada por .selected (para que coincida con el CSS)
    document.querySelectorAll('.tarjeta-pedido').forEach(n => n.classList.remove('selected'));
    selectedPedidoNode = el;
    el.classList.add('selected');
}

function vincularRepartidor(elRepartidor) {
    if (elRepartidor.classList.contains('repartidor-ocupado')) return;
    if (!selectedPedidoNode) {
        notify("⚠️ Selecciona un pedido primero", "bg-warning");
        return;
    }

    const rId = elRepartidor.getAttribute('data-id');
    const pId = selectedPedidoNode.getAttribute('data-id');
    const cliente = selectedPedidoNode.getAttribute('data-cliente');
    const tagNombre = elRepartidor.querySelector('.nombre-tag');
    const nombreOriginal = tagNombre.getAttribute('data-nombre-original');

    const direccionFull = selectedPedidoNode.getAttribute('data-direccion') || "";
        const direccionCorta = direccionFull.split(',')[0];

    const colorInput = document.getElementById(`color-${rId}`);
    const colorElegido = colorInput ? colorInput.value : "#933D2D";
    coloresRepartidores[rId] = colorElegido;

    asignaciones.push({
        pedidoId: pId,
        repartidorId: rId,
        cliente: cliente,
        color: colorElegido,
        nombreRep: nombreOriginal
    });

    // UI Update
    tagNombre.innerText = `${nombreOriginal} - Ruta Activa`;
    elRepartidor.querySelector('.estado-texto').innerText = "Ocupado";
    elRepartidor.querySelector('.estado-texto').className = "estado-texto text-warning fw-bold";
    elRepartidor.style.borderLeft = `5px solid ${colorElegido}`;

    const contenedor = document.getElementById(`asignados-rep-${rId}`);
    if (contenedor) {
        const miniCard = document.createElement('div');
        miniCard.className = 'mini-pedido-asignado p-2 mb-1 border-start border-4 rounded bg-light d-flex justify-content-between align-items-center animate__animated animate__fadeInLeft';
        miniCard.id = `mini-p-${pId}`;
        miniCard.style.borderColor = colorElegido;
        miniCard.innerHTML = `
                    <div style="font-size: 0.75rem; line-height: 1.2;">
                        <b class="d-block text-dark">${cliente}</b>
                        <span class="text-muted"><i class="bi bi-geo-alt-fill" style="font-size: 0.7rem;"></i> ${direccionCorta}</span>
                    </div>
                    <i class="bi bi-trash3 text-danger cursor-pointer ms-2" onclick="quitarAsignacion(event, '${pId}')"></i>
                `;
        contenedor.appendChild(miniCard);
    }

    selectedPedidoNode.style.display = 'none';
    selectedPedidoNode = null;
    actualizarMapaCompleto();
}

function quitarAsignacion(event, pId) {
    if(event) event.stopPropagation();

    const asigRemovida = asignaciones.find(a => a.pedidoId === pId);
    asignaciones = asignaciones.filter(a => a.pedidoId !== pId);

    const miniCard = document.getElementById(`mini-p-${pId}`);
    if (miniCard) miniCard.remove();

    const pNode = document.getElementById(`pedido-${pId}`);
    if (pNode) {
        pNode.style.display = 'block';
        pNode.classList.remove('selected'); // Antes decía seleccionada
    }

    if (asigRemovida) {
        const rId = asigRemovida.repartidorId;
        const tieneMas = asignaciones.some(a => a.repartidorId === rId);
        if (!tieneMas) {
            const tarjeta = document.querySelector(`.tarjeta-repartidor[data-id="${rId}"]`);
            const tag = tarjeta.querySelector('.nombre-tag');
            tag.innerText = tag.getAttribute('data-nombre-original');
            tarjeta.querySelector('.estado-texto').innerText = "Libre";
            tarjeta.querySelector('.estado-texto').className = "estado-texto text-success fw-bold";
            tarjeta.style.borderLeft = "5px solid transparent";
        }
    }
    actualizarMapaCompleto();
}

/**
 * --- RENDERIZADO GEOESPACIAL ---
 */

function renderizarPuntosPendientes() {
    marcadoresPendientes.forEach(m => mapa.removeLayer(m));
    marcadoresPendientes = [];
    const idsAsignados = asignaciones.map(a => String(a.pedidoId));

    PEDIDOS_DATA.forEach(p => {
        if (!idsAsignados.includes(String(p.id))) {
            if (p.latitud == null || p.longitud == null) return;
            const marker = L.circleMarker([p.latitud, p.longitud], {
                radius: 7, fillColor: "#adb5bd", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(mapa).bindPopup(`<b>${p.cliente}</b><br>${p.direccion || ''}`);
            marcadoresPendientes.push(marker);
        }
    });
}

function trazarRutasReales() {
    limpiarRutas();
    ordenarAsignacionesPorCercania();

    const rutasPorRepartidor = asignaciones.reduce((acc, asig) => {
        if (!acc[asig.repartidorId]) {
            acc[asig.repartidorId] = {
                color: asig.color,
                puntos: [L.latLng(ORIGEN_COORDS.lat, ORIGEN_COORDS.lng)]
            };
        }
        const p = PEDIDOS_DATA.find(ped => ped.id == asig.pedidoId);
        if (p && p.latitud != null && p.longitud != null) acc[asig.repartidorId].puntos.push(L.latLng(parseFloat(p.latitud), parseFloat(p.longitud)));
        return acc;
    }, {});

    Object.values(rutasPorRepartidor).forEach(ruta => {
        const control = L.Routing.control({
            waypoints: ruta.puntos,
            // Ajustes de precisión para calles no indexadas en Chiclayo (como zonas de Las Brisas)
            routerOptions: {
                radius: 1000 // Busca la pista transitable más cercana en un radio de 1km
            },
            missingRouteTolerance: 100, // Si la calle está desconectada en OSM, une con línea recta en vez de colgarse
            createLine: function() { return null; },
            showAlternatives: false,
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: false,
            show: false,
            createMarker: (i, wp) => L.marker(wp.latLng).bindPopup(i === 0 ? "La Jama" : `Parada #${i}`)
        }).addTo(mapa);

        control.on('routesfound', function(e) {
            const coordinates = e.routes[0].coordinates;

            const shadowLine = L.polyline(coordinates, {
                color: 'white',
                weight: 8,
                opacity: 1,
                pane: 'capaBordes'
            }).addTo(mapa);

            const mainLine = L.polyline(coordinates, {
                color: ruta.color,
                weight: 5,
                opacity: 0.7,
                lineJoin: 'round',
                pane: 'capaLineas'
            }).addTo(mapa);

            controlesRuta.push(shadowLine, mainLine, control);
        });
    });
}


function limpiarRutas() {
    controlesRuta.forEach(item => {
        if (item.removeControl) mapa.removeControl(item);
        else if (item.remove) item.remove();
    });
    controlesRuta = [];
}

function initMapa() {
    mapa = L.map('mapa-principal', { zoomControl: false, attributionControl: false })
            .setView([ORIGEN_COORDS.lat, ORIGEN_COORDS.lng], 14);

    mapa.createPane('capaBordes');
    mapa.createPane('capaLineas');
    mapa.getPane('capaBordes').style.zIndex = 400;
    mapa.getPane('capaLineas').style.zIndex = 401;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

    // Marcador de La Jama con estilo del restaurante (Verde y Peach)
    L.circleMarker([ORIGEN_COORDS.lat, ORIGEN_COORDS.lng], {
        radius: 10,
        fillColor: "#1B3A2C", // Verde Jama
        color: "#fed7aa",     // Borde Peach
        weight: 3,
        fillOpacity: 1
    }).addTo(mapa).bindPopup("<b>La Jama</b><br>Punto de Origen");
}

function notify(msj, type) {
    const toastEl = document.getElementById('liveToast');
    const toastMsgEl = document.getElementById('toastMessage');
    if (toastEl && toastMsgEl && toastInstance) {
        toastEl.className = `toast align-items-center text-white border-0 ${type}`;
        toastMsgEl.innerText = msj;
        toastInstance.show();
    }
}

function abrirConfirmacion() {
    if (asignaciones.length === 0) {
        alert("⚠️ Debes asignar al menos un pedido a un repartidor antes de despachar.");
        return;
    }

    const lista = document.getElementById('listaResumen');
    if (lista) {
        lista.innerHTML = asignaciones.map(a => `
            <div class="mb-2 border-bottom pb-1">
                <i class="bi bi-truck text-primary me-2"></i>
                <b style="color: ${a.color}">#${a.pedidoId}</b> - ${a.cliente}
                <span class="badge bg-dark ms-2">${a.nombreRep}</span>
            </div>
        `).join('');
    }

    // Rearmar el modal si no existe todavía (por si el DOM tardó)
    if (!confirmModalInstance) {
        const modalEl = document.getElementById('modalConfirmar');
        if (modalEl) confirmModalInstance = new bootstrap.Modal(modalEl);
    }

    if (confirmModalInstance) {
        confirmModalInstance.show();
    } else {
        // Fallback: si Bootstrap no cargó el modal, preguntar con confirm()
        if (confirm("¿Confirmar el despacho de " + asignaciones.length + " pedido(s)?")) {
            ejecutarEnvioFinal();
        }
    }
}

function ejecutarEnvioFinal() {
    if (confirmModalInstance) confirmModalInstance.hide();
    notify("🚀 Despachando unidades...", "bg-dark");

    const agrupado = asignaciones.reduce((acc, cur) => {
        if (!acc[cur.repartidorId]) acc[cur.repartidorId] = [];
        acc[cur.repartidorId].push(cur.pedidoId);
        return acc;
    }, {});

    const promesas = Object.keys(agrupado).map(rId => {
        // Spring necesita cada pedido como parámetro separado: pedidos=41&pedidos=39
        const formData = new URLSearchParams();
        agrupado[rId].forEach(pId => formData.append('pedidos', pId));
        formData.append('repartidorId', rId);

        return fetch('/admin/despacho/asignar', {
            method: 'POST',
            body: formData,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
        });
    });

    Promise.all(promesas)
        .then(() => {
            notify("✅ Despacho confirmado", "bg-success");
            setTimeout(() => window.location.reload(), 1500);
        })
        .catch(err => {
            console.error("Error al despachar:", err);
            notify("❌ Error al despachar: " + err.message, "bg-danger");
        });



}