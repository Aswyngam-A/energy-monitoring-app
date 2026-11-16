package com.energy.alert;

import com.energy.reading.Reading;
import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * The database itself enforces "one active (OPEN or ACKNOWLEDGED) alert per sensor" (migration V5,
 * a partial unique index). The application checks the rule too (AlertService), but only the
 * database can guarantee it when two requests arrive at the same moment, so these tests bypass the
 * service and insert alerts directly.
 */
@QuarkusTest
class AlertUniqueActiveIndexTest {

    /** A site with two sensors; returns their ids as {sensorA, sensorB}. */
    @Transactional
    Long[] insertTwoSensors() {
        Site site = new Site();
        site.name = "Index site";
        site.threshold = new BigDecimal("100.00");
        site.persist();
        Long[] ids = new Long[2];
        for (int i = 0; i < 2; i++) {
            Sensor sensor = new Sensor();
            sensor.name = "Sensor " + i;
            sensor.site = site;
            sensor.persist();
            ids[i] = sensor.id;
        }
        return ids;
    }

    /** Inserts one alert (with its own reading) for the sensor in the given status. */
    @Transactional
    void insertAlert(Long sensorId, AlertStatus status) {
        Sensor sensor = Sensor.findById(sensorId);
        Reading reading = new Reading();
        reading.sensor = sensor;
        reading.value = new BigDecimal("150");
        reading.timestamp = Instant.now();
        reading.persist();

        Alert alert = new Alert();
        alert.site = sensor.site;
        alert.sensor = sensor;
        alert.reading = reading;
        alert.value = reading.value;
        alert.threshold = new BigDecimal("100.00");
        alert.createdAt = Instant.now();
        alert.status = status;
        alert.persist();
        // Force the INSERT now, so a violation surfaces inside this method, not at commit time.
        Alert.flush();
    }

    @AfterEach
    @Transactional
    void cleanUp() {
        Alert.deleteAll();
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    @Test
    void twoOpenAlertsForTheSameSensorAreRefused() {
        Long sensor = insertTwoSensors()[0];
        insertAlert(sensor, AlertStatus.OPEN);

        assertThrows(PersistenceException.class, () -> insertAlert(sensor, AlertStatus.OPEN));
    }

    @Test
    void openAndAcknowledgedForTheSameSensorAreRefused() {
        Long sensor = insertTwoSensors()[0];
        insertAlert(sensor, AlertStatus.ACKNOWLEDGED);

        assertThrows(PersistenceException.class, () -> insertAlert(sensor, AlertStatus.OPEN));
    }

    @Test
    void anyNumberOfResolvedAlertsAreAllowedNextToOneActive() {
        Long sensor = insertTwoSensors()[0];
        insertAlert(sensor, AlertStatus.RESOLVED);
        insertAlert(sensor, AlertStatus.RESOLVED);

        assertDoesNotThrow(() -> insertAlert(sensor, AlertStatus.OPEN));
    }

    @Test
    void differentSensorsMayEachHaveAnActiveAlert() {
        Long[] sensors = insertTwoSensors();
        insertAlert(sensors[0], AlertStatus.OPEN);

        assertDoesNotThrow(() -> insertAlert(sensors[1], AlertStatus.OPEN));
    }
}
