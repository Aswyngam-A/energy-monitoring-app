package com.energy.alert;

import com.energy.reading.Reading;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Creates alerts. A service holds a piece of business logic that is neither HTTP handling (the
 * resource's job) nor the decision rule itself (ThresholdRule): here, "if this reading breaches
 * its site's threshold, record an alert".
 *
 * @ApplicationScoped: one shared instance for the whole application, injected where needed.
 */
@ApplicationScoped
public class AlertService {

    /**
     * Raises an alert for the reading if it is above its site's threshold; does nothing otherwise.
     *
     * @Transactional with the default (REQUIRED) joins the caller's transaction when there is one,
     * so the reading and its alert are committed together or not at all, and starts its own
     * transaction when called alone.
     *
     * @return the new alert, or empty when the reading is within the threshold
     */
    @Transactional
    public Optional<Alert> raiseIfBreached(Reading reading) {
        // The relations are lazy; this runs inside the transaction, so they can be loaded here.
        var sensor = reading.sensor;
        var site = sensor.site;

        if (!ThresholdRule.isBreached(reading.value, site.threshold)) {
            return Optional.empty();
        }

        Alert alert = new Alert();
        alert.site = site;
        alert.sensor = sensor;
        alert.reading = reading;
        // Snapshot: copy the numbers now, because the site's threshold can be edited later.
        alert.value = reading.value;
        alert.threshold = site.threshold;
        alert.createdAt = Instant.now();
        alert.status = AlertStatus.OPEN;
        alert.persist();
        return Optional.of(alert);
    }
}
