package com.web.restaurante.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "mesa")
@Data
public class Mesa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer numero;

    @Column(length = 20)
    private String estado;
}