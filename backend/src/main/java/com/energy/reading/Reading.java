package com.energy.reading;

import com.energy.sensor.Sensor;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One measurement sent by a sensor. Maps to the `reading` table created by migration V3.
 * Internal only: the API will expose request/response records, never this class.
 * The id comes from PanacheEntity, generated from the `reading_seq` sequence.
 */
@Entity
@Table(name = "reading")
public class Reading extends PanacheEntity {

    /**
     * Measured value in kW. BigDecimal (not double) to avoid floating-point rounding;
     * precision and scale must match NUMERIC(12,3) in the migration.
     */
    @Column(nullable = false, precision = 12, scale = 3)
    public BigDecimal value;

    /**
     * When the measurement was taken, as an absolute point in time (UTC). Instant maps to the
     * TIMESTAMPTZ column; the column is called recorded_at to avoid the SQL type name "timestamp".
     */
    @Column(name = "recorded_at", nullable = false)
    public Instant timestamp;

    /**
     * The sensor that sent this reading (many readings -> one sensor), foreign key `sensor_id`.
     * LAZY: the Sensor row is only loaded when the field is first used, so code that reads
     * more than the id must run inside a transaction.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensor_id", nullable = false)
    public Sensor sensor;
}
