package com.energy.alert;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * What the API returns for an alert. The related rows are exposed only as ids plus the site's and
 * sensor's names (never as entities); the names let a UI show something readable without extra calls.
 * `value` and `threshold` are the numbers compared when the alert was raised, and `createdAt` is
 * the server time in ISO-8601 UTC, e.g. "2024-05-01T10:15:30Z".
 */
public record AlertResponse(
    Long id,
    Long siteId,
    String siteName,
    Long sensorId,
    String sensorName,
    Long readingId,
    BigDecimal value,
    BigDecimal threshold,
    Instant createdAt,
    AlertStatus status
) {

    /**
     * Copies an entity into its response form. Reading the names initialises the lazy site and
     * sensor; AlertResource preloads them for a whole page in two queries, so a list costs no
     * extra query per alert.
     */
    public static AlertResponse from(Alert alert) {
        return new AlertResponse(
            alert.id,
            alert.site.id,
            alert.site.name,
            alert.sensor.id,
            alert.sensor.name,
            alert.reading.id,
            alert.value,
            alert.threshold,
            alert.createdAt,
            alert.status
        );
    }
}
