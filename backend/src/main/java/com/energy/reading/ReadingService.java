package com.energy.reading;

import com.energy.alert.AlertService;
import com.energy.sensor.Sensor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Ingestion of readings: store the reading and, if it breaches the site's threshold, raise an
 * alert. Kept out of the resource so the resource only deals with HTTP (status codes, parsing,
 * validation) and this class holds what happens to the data.
 */
@ApplicationScoped
public class ReadingService {

    @Inject
    AlertService alertService;

    /**
     * Saves a reading for the sensor and raises an alert when it is above the site's threshold.
     *
     * The transaction boundary is here: the reading and its alert are written in one transaction,
     * so there is never a breaching reading without its alert (or the reverse). If saving the
     * alert fails, the reading is rolled back too.
     *
     * The caller has already validated the input and resolved the sensor.
     */
    @Transactional
    public Reading ingest(Sensor sensor, BigDecimal value, Instant timestamp) {
        Reading reading = new Reading();
        reading.sensor = sensor;
        reading.value = value;
        reading.timestamp = timestamp;
        reading.persist();

        alertService.raiseIfBreached(reading);
        return reading;
    }
}
