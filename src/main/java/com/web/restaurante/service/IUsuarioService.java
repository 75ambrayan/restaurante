package com.web.restaurante.service;

import com.web.restaurante.model.Usuario;

import java.util.List;
import java.util.Optional;

public interface IUsuarioService {
    List<Usuario> listar();
    Optional<Usuario> obtenerPorId(Long id);
    Optional<Usuario> encontrarPorUsuario(String usuario);

    Usuario guardar(Usuario usuario);
    Usuario alternarEstado(Long id);

    void eliminar(Long id);

    long contar();

    boolean verificarClave(String claveTextoPlano, String claveEncriptada);
}
