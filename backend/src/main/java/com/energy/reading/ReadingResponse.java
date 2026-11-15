package com.energy.reading;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What the API returns for a reading. Exposes the owning sensor's id and name (not the Sensor
 * entity): the name lets a site-wide table show which sensor sent each reading without extra calls.
 * The timestamp is serialized as ISO-8601 UTC, e.g. "2024-05-01T10:15:30Z".
 */
public record ReadingResponse(Long id, BigDecimal value, Instant timestamp, Long sensorId, String sensorName) {

    /**
     * Copies an entity into its response form. Reading the sensor's name needs the (lazy) Sensor to
     * be loaded: call this inside the transaction, or after a query that fetched the sensor with
     * "join fetch", otherwise Hibernate throws LazyInitializationException.
     */
    public static ReadingResponse from(Reading reading) {
        return new ReadingResponse(
            reading.id, reading.value, reading.timestamp, reading.sensor.id, reading.sensor.name);
    }
}
