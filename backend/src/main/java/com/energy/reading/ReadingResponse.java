package com.energy.reading;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What the API returns for a reading. Exposes only the owning sensor's id (not the Sensor entity).
 * The timestamp is serialized as ISO-8601 UTC, e.g. "2024-05-01T10:15:30Z".
 */
public record ReadingResponse(Long id, BigDecimal value, Instant timestamp, Long sensorId) {

    /** Copies an entity into its response form. */
    public static ReadingResponse from(Reading reading) {
        // Reading only the id of a LAZY relation does not trigger a database query.
        return new ReadingResponse(reading.id, reading.value, reading.timestamp, reading.sensor.id);
    }
}
