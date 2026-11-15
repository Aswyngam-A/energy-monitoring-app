package com.energy.site;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "site")
public class Site extends PanacheEntity {

    @Column(nullable = false)
    public String name;

    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal threshold;
}
