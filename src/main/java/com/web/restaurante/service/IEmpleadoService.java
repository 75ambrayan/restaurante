package com.web.restaurante.service;

import com.web.restaurante.model.Cargo;
import com.web.restaurante.model.Empleado;
import com.web.restaurante.model.Usuario;

import java.util.List;
import java.util.Optional;

public interface IEmpleadoService {

    List<Empleado> listar();

    List<Empleado> listarRepartidoresActivos();

    Optional<Empleado> obtenerPorId(Long id);

    Optional<Empleado> obtenerPorUsuario(Usuario usuario);

    Empleado guardar(Empleado empleado);

    Empleado alternarEstado(Long id);

    List<Empleado> buscarPorTermino(String termino);

    List<Empleado> buscarPorTurno(String turno);

    List<Cargo> listarCargos();

    void eliminar(Long id);

    long contar();
}
