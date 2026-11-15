package com.energy.alert;

import com.energy.reading.Reading;
import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Raised when a reading is above its site's threshold. Maps to the `alert` table created by
 * migration V4. Internal only: the API will expose a response record, never this class.
 * The id comes from PanacheEntity, generated from the `alert_seq` sequence.
 */
@Entity
@Table(name = "alert")
public class Alert extends PanacheEntity {

    // The three relations are LAZY: a related row is only loaded when a field other than its id
    // is used, so code that reads more than ids must run inside a transaction (or use "join fetch").

    /** The site whose threshold was exceeded. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    public Site site;

    /** The sensor that sent the reading. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensor_id", nullable = false)
    public Sensor sensor;

    /** The reading that caused this alert. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_id", nullable = false)
    public Reading reading;

    /** The reading's value (kW) at the time. Copied, so it stays correct whatever happens later. */
    @Column(nullable = false, precision = 12, scale = 3)
    public BigDecimal value;

    /** The site's threshold at the time. Copied: the site's threshold can be edited later. */
    @Column(nullable = false, precision = 12, scale = 2)
    public BigDecimal threshold;

    /** Server time when the alert was raised (UTC instant, TIMESTAMPTZ column `created_at`). */
    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    /**
     * STRING stores the enum's name ("OPEN") instead of its position. The default, ORDINAL, would
     * store 0, 1, 2... and silently change meaning if the enum were ever reordered.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public AlertStatus status;
}
