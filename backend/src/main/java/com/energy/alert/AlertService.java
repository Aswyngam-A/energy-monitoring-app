package com.energy.alert;

import com.energy.reading.Reading;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
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
     * Dedup (M6): if the sensor already has an active alert (OPEN or ACKNOWLEDGED), no second one is
     * raised, so a sensor that stays above the threshold does not flood the list. Once that alert is
     * RESOLVED, the next breach raises a new one. The reading itself is always stored by the caller.
     *
     * @Transactional with the default (REQUIRED) joins the caller's transaction when there is one,
     * so the reading and its alert are committed together or not at all, and starts its own
     * transaction when called alone.
     *
     * @return the new alert, or empty when the reading is within the threshold or the sensor
     *         already has an active alert
     */
    @Transactional
    public Optional<Alert> raiseIfBreached(Reading reading) {
        // The relations are lazy; this runs inside the transaction, so they can be loaded here.
        var sensor = reading.sensor;
        var site = sensor.site;

        if (!ThresholdRule.isBreached(reading.value, site.threshold)) {
            return Optional.empty();
        }

        // Serialize breaches of the same sensor: take a row lock on the sensor (released when the
        // transaction ends). A second request for the same sensor waits here until the first has
        // committed, so its check below sees the first one's alert. Without the lock, two requests
        // could both see "no active alert" and both insert one; the unique index of migration V5
        // would then refuse the second insert and that request would fail with a 500.
        Alert.getEntityManager().lock(sensor, LockModeType.PESSIMISTIC_WRITE);

        // Dedup is per sensor (not per site): two meters on one site each report their own problem.
        // The active statuses come from AlertTransitions, so the rule lives in one place.
        List<AlertStatus> active = Arrays.stream(AlertStatus.values())
                .filter(AlertTransitions::isActive)
                .toList();
        if (Alert.count("sensor.id = ?1 and status in ?2", sensor.id, active) > 0) {
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
