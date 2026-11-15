package com.energy.reading;

import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Checks the Reading entity, the V3 migration and the Reading -> Sensor relationship work together:
 * a reading can be saved and read back with its value, UTC timestamp and sensor.
 */
@QuarkusTest
class ReadingTest {

    /** Saves a site with one sensor and returns the sensor's id (commits when the method returns). */
    @Transactional
    Long createSensor() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();

        Sensor sensor = new Sensor();
        sensor.name = "Main meter";
        sensor.site = site;
        sensor.persist();
        return sensor.id;
    }

    /** Saves a reading for the given sensor. */
    @Transactional
    void createReading(Long sensorId, BigDecimal value, Instant timestamp) {
        Reading reading = new Reading();
        reading.sensor = Sensor.findById(sensorId);
        reading.value = value;
        reading.timestamp = timestamp;
        reading.persist();
    }

    /**
     * Empties all three tables after each test, children first: readings point at sensors and
     * sensors point at sites, so the database rejects deleting a parent that still has children.
     */
    @AfterEach
    @Transactional
    void cleanUp() {
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    /** Reads the first reading back and the id of its sensor, inside one transaction (sensor is lazy). */
    @Transactional
    Object[] readFirst() {
        Reading found = Reading.<Reading>findAll().firstResult();
        return new Object[] {found.id, found.value, found.timestamp, found.sensor.id};
    }

    @Test
    void readingCanBePersistedWithItsSensor() {
        Long sensorId = createSensor();
        // Postgres timestamps keep microseconds; Instant.now() can have nanoseconds. Truncate so
        // the value we save is exactly the value we read back.
        Instant timestamp = Instant.now().truncatedTo(ChronoUnit.MICROS);
        createReading(sensorId, new BigDecimal("12.345"), timestamp);

        Object[] found = readFirst();

        assertNotNull(found[0]); // the id was generated from reading_seq
        // compareTo, not equals: equals also compares scale (12.345 vs 12.3450)
        assertEquals(0, new BigDecimal("12.345").compareTo((BigDecimal) found[1]));
        assertEquals(timestamp, found[2]);
        assertEquals(sensorId, found[3]);
    }

    @Test
    void zeroIsAValidValue() {
        Long sensorId = createSensor();
        createReading(sensorId, BigDecimal.ZERO, Instant.now());

        assertEquals(1, Reading.count());
    }
}
