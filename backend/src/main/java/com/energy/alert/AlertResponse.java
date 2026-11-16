package com.energy.alert;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What the API returns for an alert. The related rows are exposed only as ids (never as entities).
 * `value` and `threshold` are the numbers compared when the alert was raised, and `createdAt` is
 * the server time in ISO-8601 UTC, e.g. "2024-05-01T10:15:30Z".
 */
public record AlertResponse(
    Long id,
    Long siteId,
    Long sensorId,
    Long readingId,
    BigDecimal value,
    BigDecimal threshold,
    Instant createdAt,
    AlertStatus status
) {

    /**
     * Copies an entity into its response form. Only ids and plain columns are read, so the lazy
     * relations are not loaded: building the whole list costs no extra queries per alert.
     */
    public static AlertResponse from(Alert alert) {
        return new AlertResponse(
            alert.id,
            alert.site.id,
            alert.sensor.id,
            alert.reading.id,
            alert.value,
            alert.threshold,
            alert.createdAt,
            alert.status
        );
    }
}
