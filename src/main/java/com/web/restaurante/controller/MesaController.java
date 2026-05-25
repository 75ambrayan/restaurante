package com.web.restaurante.controller;

import com.web.restaurante.model.Mesa;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.repository.MesaRepository;
import com.web.restaurante.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin/mesas")
@RequiredArgsConstructor
public class MesaController {

    private final MesaRepository mesaRepository;
    private final PedidoRepository pedidoRepository;

    @GetMapping
    public String verPlanoMesas(Model model) {
        model.addAttribute("mesas", mesaRepository.findAll());

        // CORRECCIÓN: Ahora enviamos a la vista TODOS los pedidos que estén activos en el salón
        // (En cocina, preparados, asignados), excepto los ya cobrados o cancelados.
        List<Pedido> pedidosActivos = pedidoRepository.findAll().stream()
                .filter(p -> p.getEstado() != EstadoPedido.PAGADO && p.getEstado() != EstadoPedido.CANCELADO)
                .toList();

        model.addAttribute("pedidos", pedidosActivos);
        return "admin/mesas";
    }

    @PostMapping("/entregar-plato/{idMesa}")
    @ResponseBody
    public String entregarPlato(@PathVariable Integer idMesa) {
        List<Pedido> pedidosPendientes = pedidoRepository.findByNumeroMesaAndEstado(idMesa, EstadoPedido.PENDIENTE);

        if (pedidosPendientes.isEmpty()) {
            throw new RuntimeException("No se encontró pedido pendiente para esta mesa");
        }

        Pedido p = pedidosPendientes.get(pedidosPendientes.size() - 1);

        p.setEstado(EstadoPedido.ENTREGADO);
        pedidoRepository.save(p);
        return "OK";
    }

    @PostMapping("/liberar/{idMesa}")
    @ResponseBody
    public String liberarMesa(@PathVariable Long idMesa) {
        Mesa m = mesaRepository.findById(idMesa).orElseThrow();
        m.setEstado("DISPONIBLE");
        mesaRepository.save(m);

        // Buscar pedidos activos de la mesa en cualquier estado no finalizado
        List<Pedido> pedidosActivos = pedidoRepository.findByNumeroMesa(m.getNumero())
                .stream()
                .filter(p -> p.getEstado() != EstadoPedido.PAGADO
                        && p.getEstado() != EstadoPedido.CANCELADO)
                .collect(java.util.stream.Collectors.toList());

        for (Pedido p : pedidosActivos) {
            p.setEstado(EstadoPedido.PAGADO);
            p.setNumeroMesa(null);
            p.setFechaEntrega(java.time.LocalDateTime.now());
            pedidoRepository.save(p);
        }

        return "OK";
    }

    @GetMapping("/precuenta/{numeroMesa}")
    @ResponseBody
    public ResponseEntity<?> obtenerPrecuenta(@PathVariable Integer numeroMesa) {
        // Buscar pedido activo sin importar el estado (local no pasa por ENTREGADO)
        List<Pedido> pedidos = pedidoRepository.findByNumeroMesa(numeroMesa)
                .stream()
                .filter(p -> p.getEstado() != EstadoPedido.PAGADO
                        && p.getEstado() != EstadoPedido.CANCELADO)
                .collect(java.util.stream.Collectors.toList());

        if (pedidos.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Pedido pedidoActivo = pedidos.get(pedidos.size() - 1);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("idPedido", pedidoActivo.getId());
        respuesta.put("montoTotal", pedidoActivo.getMontoTotal());
        respuesta.put("detalles", pedidoActivo.getListaDetalles());

        return ResponseEntity.ok(respuesta);
    }
}