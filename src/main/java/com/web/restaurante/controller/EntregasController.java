package com.web.restaurante.controller;

import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;
import com.web.restaurante.model.Pedido;
import com.web.restaurante.service.IPedidoService;
import com.web.restaurante.service.IEmpleadoService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin/entregas")
@RequiredArgsConstructor
public class EntregasController {

    private final IPedidoService pedidoService;
    private final IEmpleadoService empleadoService;

    @GetMapping("/mis-pedidos")
    public String listarMisPedidos(HttpSession session, Model model) {
        Usuario usuario = (Usuario) session.getAttribute("usuarioLogueado");
        if (usuario == null) return "redirect:/login";

        Empleado repartidor = empleadoService.obtenerPorUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("Empleado no vinculado"));

        List<Pedido> misPedidos = pedidoService.listarPedidosPorRepartidor(repartidor.getId());

        model.addAttribute("pedidos", misPedidos);
        model.addAttribute("nombreRepartidor", repartidor.getNombre());

        return "admin/mis-pedidos";
    }

    @PostMapping("/iniciar/{id}")
    @ResponseBody
    public String iniciarRuta(@PathVariable Long id) {
        pedidoService.iniciarRuta(id);
        return "OK";
    }

    @PostMapping("/completar/{id}")
    @ResponseBody
    public String completarEntrega(@PathVariable Long id) {
        pedidoService.marcarComoEntregado(id);
        return "OK";
    }
}