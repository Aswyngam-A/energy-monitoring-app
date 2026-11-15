package com.energy.sensor;

import com.energy.site.Site;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A device that sends readings for one site. Maps to the `sensor` table created by migration V2.
 * Internal only: the API will expose request/response records, never this class.
 * The id comes from PanacheEntity, generated from the `sensor_seq` sequence.
 */
@Entity
@Table(name = "sensor")
public class Sensor extends PanacheEntity {

    /** Human-readable name of the sensor. */
    @Column(nullable = false)
    public String name;

    /** Optional free-text kind of sensor (e.g. "power"); null when not given. */
    public String type;

    /**
     * The site this sensor belongs to (many sensors -> one site). The foreign key column is
     * `site_id`. LAZY means the Site row is only loaded when this field is first used, which
     * is why code that reads it must run inside a transaction (or map to a DTO before leaving one).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    public Site site;
}
