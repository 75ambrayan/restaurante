document.addEventListener('DOMContentLoaded', function() {

    // 1. Buscador en Tiempo Real
    const buscador = document.getElementById('buscadorPedido');
    const tabla = document.getElementById('tablaCaja').getElementsByTagName('tbody')[0];

    if (buscador) {
        buscador.addEventListener('keyup', function() {
            const texto = buscador.value.toLowerCase();
            const filas = tabla.getElementsByTagName('tr');

            Array.from(filas).forEach(fila => {
                const contenido = fila.textContent.toLowerCase();
                if (contenido.indexOf(texto) !== -1) {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            });
        });
    }

    // 2. Confirmación de Cobro Animada
    const formularios = document.querySelectorAll('.form-liquidar');

    formularios.forEach(form => {
        form.addEventListener('submit', function(e) {
            const confirmacion = confirm('¿Confirmas que recibiste el pago de esta orden?');

            if (!confirmacion) {
                e.preventDefault();
            } else {
                // Opcional: Feedback visual antes de recargar
                const btn = form.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
            }
        });
    });
});