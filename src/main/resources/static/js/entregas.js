function cambiarEstadoPedido(id, accion) {
    const base = '/admin/entregas/';
    const url = accion === 'iniciar' ? `${base}iniciar/${id}` : `${base}completar/${id}`;

    const titulo = accion === 'iniciar' ? '¿Iniciar entrega?' : '¿Pedido entregado?';

    Swal.fire({
        title: titulo,
        text: "Este cambio se notificará al centro de control.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1B3A2C',
        cancelButtonColor: '#933D2D',
        confirmButtonText: 'Sí, confirmar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(url, { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        location.reload();
                    } else {
                        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
                    }
                })
                .catch(err => console.error("Error en fetch:", err));
        }
    });
}