const modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));

function abrirModalNuevo() {
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalTitulo').innerText = 'Nuevo Producto';
    document.getElementById('imgPrevia').src = '/img/no-photo.png';
    modalProducto.show();
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('imgPrevia').src = reader.result;
    };
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

function editarProducto(id) {
    console.log("Editando producto:", id);
    fetch(`/admin/productos/api/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener datos");
            return res.json();
        })
        .then(p => {
            document.getElementById('prodId').value = p.id;
            document.getElementById('prodNombre').value = p.nombre;
            document.getElementById('prodDesc').value = p.descripcion || '';
            document.getElementById('prodPrecio').value = p.precio;
            document.getElementById('prodStock').value = p.stock || 0;

            if (p.categoria) {
                document.getElementById('prodCat').value = p.categoria.id;
            }

            const img = document.getElementById('imgPrevia');
            img.src = p.imagen ? `/imagenes/${p.imagen}` : '/img/no-photo.png';

            document.getElementById('modalTitulo').innerText = 'Editar Producto';
            modalProducto.show();
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar el producto', 'error');
        });
}





function cambiarEstado(id, checkbox) {
    const nuevoEstado = checkbox.checked ? 1 : 0;
    fetch(`/admin/productos/estado/${id}?estado=${nuevoEstado}`, {
        method: 'POST'
    }).then(res => {
        if (!res.ok) {
            checkbox.checked = !checkbox.checked;
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    });
}

function filtrarTabla() {
    const input = document.getElementById("busqueda").value.toUpperCase();
    const rows = document.querySelectorAll("#tablaProductos tbody tr");

    rows.forEach(row => {
        const nombre = row.cells[1].textContent.toUpperCase();
        const categoria = row.cells[2].textContent.toUpperCase();
        row.style.display = (nombre.includes(input) || categoria.includes(input)) ? "" : "none";
    });
}

function eliminarProducto(id) {
    Swal.fire({
        title: '¿Eliminar plato?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1B3A2C',
        cancelButtonColor: '#933D2D',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = `/admin/productos/eliminar/${id}`;
        }
    });
}