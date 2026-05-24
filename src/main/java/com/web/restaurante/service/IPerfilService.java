package com.web.restaurante.service;

import com.web.restaurante.model.Opcion;
import com.web.restaurante.model.Perfil;

import java.util.List;
import java.util.Optional;

public interface IPerfilService {
    List<Perfil> listar();
    Optional<Perfil> obtenerPorId(Long id);
    Optional<Perfil> encontrarPorNombre(String nombre);


    Perfil guardar(Perfil perfil);
    Perfil alternarEstado(Long id);

    void eliminar(Long id);

    List<Opcion> listarOpciones();

}
