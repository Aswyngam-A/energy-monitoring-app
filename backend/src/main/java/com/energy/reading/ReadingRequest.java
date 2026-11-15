package com.energy.reading;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Body of POST /sensors/{sensorId}/readings. The sensor comes from the URL, not the body.
 *
 * @param value     measured value in kW; zero or more, at most 9 integer and 3 decimal digits
 *                  (the NUMERIC(12,3) column), so nothing is silently rounded
 * @param timestamp when it was measured, ISO-8601 in JSON (e.g. "2024-05-01T10:15:30Z");
 *                  optional: the server uses its own time when it is null
 */
public record ReadingRequest(
    @NotNull @PositiveOrZero @Digits(integer = 9, fraction = 3) BigDecimal value,
    Instant timestamp
) {}
