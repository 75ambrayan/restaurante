// package com.web.restaurante.model;

// import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
// import com.web.restaurante.model.enums.EstadoPedido;
// import com.web.restaurante.model.enums.TipoPedido;
// import jakarta.persistence.*;
// import lombok.Getter;
// import lombok.NoArgsConstructor;
// import lombok.Setter;

// import java.time.LocalDateTime;
// import java.util.List;

// @Getter
// @Setter
// @NoArgsConstructor
// @Entity
// @Table(name = "pedido")
// public class Pedido {

//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;

//     private boolean frioListo = false;
//     private boolean calienteListo = false;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "id_repartidor")
//     @JsonIgnoreProperties("pedidos")
//     private Empleado repartidor;

//     @Column(name = "cliente_nombre", nullable = false)
//     private String cliente;

//     @Column(name = "direccion_entrega", nullable = false)
//     private String direccion;

//     @PrePersist
//     protected void onCreate() {
//         this.fechaCreacion = LocalDateTime.now();
//         if (this.estado == null) {
//             this.estado = EstadoPedido.PENDIENTE;
//         }
//     }

//     private Double latitud;
//     private Double longitud;

//     private LocalDateTime fechaCreacion;
//     private LocalDateTime fechaSalida;
//     private LocalDateTime fechaEntrega;

//     @Enumerated(EnumType.STRING)
//     @Column(name = "estado", length = 50)
//     private EstadoPedido estado;

//     @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//     private List<DetallePedido> listaDetalles;

//     @Enumerated(EnumType.STRING)
//     private TipoPedido tipoPedido;

//     @Column(name = "numero_mesa")
//     private Integer numeroMesa;

//     private Double montoTotal;

//     public boolean isListoParaServir() {
//         if (this.estado != EstadoPedido.PENDIENTE) {
//             return false;
//         }

//         boolean tieneFrio = false;
//         boolean tieneCaliente = false;

//         if (this.listaDetalles != null) {
//             for (DetallePedido d : this.listaDetalles) {
//                 if (d.getProducto() != null && d.getProducto().getCategoria() != null) {
//                     String catNombre = d.getProducto().getCategoria().getNombre().toUpperCase();
//                     if (catNombre.contains("FRI") || catNombre.contains("FRÍ")) {
//                         tieneFrio = true;
//                     }
//                     if (catNombre.contains("CALIENTE")) {
//                         tieneCaliente = true;
//                     }
//                 }
//             }
//         }

//         if (tieneFrio && tieneCaliente) {
//             return this.frioListo && this.calienteListo;
//         } else if (tieneFrio) {
//             return this.frioListo;
//         } else if (tieneCaliente) {
//             return this.calienteListo;
//         }

//         return false;
//     }
// }

package com.web.restaurante.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.web.restaurante.model.enums.EstadoPedido;
import com.web.restaurante.model.enums.TipoPedido;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean frioListo = false;
    private boolean calienteListo = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_repartidor")
    @JsonIgnoreProperties("pedidos")
    private Empleado repartidor;

    @Column(name = "cliente_nombre", nullable = false)
    private String cliente;

    @Column(name = "direccion_entrega", nullable = false)
    private String direccion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoPedido.PENDIENTE;
        }
    }

    private Double latitud;
    private Double longitud;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaSalida;
    private LocalDateTime fechaEntrega;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 50)
    private EstadoPedido estado;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetallePedido> listaDetalles;

    @Enumerated(EnumType.STRING)
    private TipoPedido tipoPedido;

    @Column(name = "numero_mesa")
    private Integer numeroMesa;

    private Double montoTotal;

    public boolean isListoParaServir() {
        // Listo para servir si está PREPARADO o ASIGNADO (pedidos locales del mesero)
        if (this.estado == EstadoPedido.PREPARADO || this.estado == EstadoPedido.ASIGNADO) {
            return true;
        }
        // Para pedidos aún en cocina (EN_COCINA), verificar si frío y caliente están listos
        if (this.estado != EstadoPedido.EN_COCINA) {
            return false;
        }

        boolean tieneFrio = false;
        boolean tieneCaliente = false;

        if (this.listaDetalles != null) {
            for (DetallePedido d : this.listaDetalles) {
                if (d.getProducto() != null && d.getProducto().getCategoria() != null) {
                    String catNombre = d.getProducto().getCategoria().getNombre().toUpperCase();
                    if (catNombre.contains("FRI") || catNombre.contains("FRÍ")) {
                        tieneFrio = true;
                    }
                    if (catNombre.contains("CALIENTE")) {
                        tieneCaliente = true;
                    }
                }
            }
        }

        if (tieneFrio && tieneCaliente) {
            return this.frioListo && this.calienteListo;
        } else if (tieneFrio) {
            return this.frioListo;
        } else if (tieneCaliente) {
            return this.calienteListo;
        }

        return false;
    }
}