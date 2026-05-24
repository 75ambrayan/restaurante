package com.web.restaurante.service;

import com.web.restaurante.model.DetallePedido;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.enums.EstadoPedido;

import java.util.List;

public interface IPedidoService {

    Pedido guardar(Pedido pedido);
    Pedido obtenerPorId(Long id);
    List<Pedido> listarPreparados();

    List<Pedido> listarPedidosCalientes();
    List<Pedido> listarPedidosFrios();
    List<DetallePedido> obtenerDetallesPorTipo(Long pedidoId, String tipoCocina);
    List<Pedido> listarPreparadosParaDespacho();
    void completarEstacion(Long pedidoId, String tipoEstacion);

    List<Pedido> optimizarTrayectoBurbuja(List<Pedido> pedidos);
    List<List<Pedido>> generarSugerenciasDeRuta();

    void asignarRepartidor(Long pedidoId, Empleado repartidor);
    void asignarRutaARepartidor(List<Long> pedidosIds, Long empleadoId); // El del error
    void iniciarRuta(Long pedidoId);
    void marcarComoEntregado(Long pedidoId);
    void actualizarEstadoPedido(Long id, EstadoPedido nuevoEstado);
    List<Pedido> listarPedidosPorRepartidor(Long idEmpleado);
    List<Pedido> listarPedidosPorCobrar();
    void cobrarPedido(Long id);
    void guardarPedido(Pedido pedido);

    /** Delivery pendientes con coordenadas — vienen directo de la carta digital */
    List<Pedido> listarDeliveryPendientesConCoordenadas();

    /** Pedidos PENDIENTE de carta esperando aprobación del cajero */
    List<Pedido> listarPendientesDeCarta();

    /** Cajero aprueba pedido → cambia a EN_COCINA */
    void aprobarPedidoACocina(Long pedidoId);
}