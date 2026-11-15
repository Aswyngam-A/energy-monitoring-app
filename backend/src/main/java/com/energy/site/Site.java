package com.energy.site;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * A monitored location. Maps to the `site` table created by Flyway migration V1.
 * Internal only: the API exposes SiteRequest / SiteResponse, never this class.
 * Panache style: public fields, and persist()/find()/deleteAll() come from the base class.
 * PanacheEntity supplies the `id`, generated from the `site_seq` sequence (see V1__create_site.sql).
 */
@Entity
@Table(name = "site")
public class Site extends PanacheEntity {

    /** Human-readable name of the site. */
    @Column(nullable = false)
    public String name;

    /**
     * Alert threshold. BigDecimal (not double) to avoid floating-point rounding; precision and
     * scale must match NUMERIC(12,2) in the migration. The unit is decided in a later milestone.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal threshold;
}
