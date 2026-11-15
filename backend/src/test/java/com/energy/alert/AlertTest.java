package com.energy.alert;

import com.energy.reading.Reading;
import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.persistence.EntityManager;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Checks the Alert entity, the V4 migration and the relationships to site, sensor and reading work
 * together: an alert can be saved and read back, its status is stored as text, and the value and
 * threshold are stored on the alert itself (a snapshot taken when the alert was raised).
 */
@QuarkusTest
class AlertTest {

    @Inject
    EntityManager em;

    /** Ids of the rows a test needs, returned together from one transaction. */
    record Ids(Long siteId, Long sensorId, Long readingId) {}

    /** Saves a site, a sensor and a reading, and returns their ids (commits when the method returns). */
    @Transactional
    Ids createReading() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();

        Sensor sensor = new Sensor();
        sensor.name = "Main meter";
        sensor.site = site;
        sensor.persist();

        Reading reading = new Reading();
        reading.sensor = sensor;
        reading.value = new BigDecimal("150.500");
        reading.timestamp = Instant.now().truncatedTo(ChronoUnit.MICROS);
        reading.persist();
        return new Ids(site.id, sensor.id, reading.id);
    }

    /** Saves an alert for the given rows. */
    @Transactional
    void createAlert(Ids ids, Instant createdAt) {
        Alert alert = new Alert();
        alert.site = Site.findById(ids.siteId());
        alert.sensor = Sensor.findById(ids.sensorId());
        alert.reading = Reading.findById(ids.readingId());
        alert.value = new BigDecimal("150.500");
        alert.threshold = new BigDecimal("100.00");
        alert.createdAt = createdAt;
        alert.status = AlertStatus.OPEN;
        alert.persist();
    }

    /**
     * Empties every table after each test, children first: an alert points at a reading, a sensor
     * and a site; a reading points at a sensor; a sensor points at a site (all foreign keys).
     */
    @AfterEach
    @Transactional
    void cleanUp() {
        Alert.deleteAll();
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    /** Reads the first alert back inside one transaction (its relations are lazy). */
    @Transactional
    Alert readFirst() {
        Alert found = Alert.<Alert>findAll().firstResult();
        // Touch the ids of the relations while the session is open; ids need no extra query.
        assertNotNull(found.site.id);
        return found;
    }

    @Test
    void alertCanBePersistedWithItsRelations() {
        Ids ids = createReading();
        Instant createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
        createAlert(ids, createdAt);

        Alert found = readFirst();

        assertNotNull(found.id); // generated from alert_seq
        assertEquals(AlertStatus.OPEN, found.status);
        // compareTo, not equals: equals also compares scale (100.0 vs 100.00)
        assertEquals(0, new BigDecimal("150.5").compareTo(found.value));
        assertEquals(0, new BigDecimal("100").compareTo(found.threshold));
        assertEquals(createdAt, found.createdAt);
    }

    @Test
    void relationsPointAtTheRightRows() {
        Ids ids = createReading();
        createAlert(ids, Instant.now());

        assertEquals(ids.siteId(), idOf("site"));
        assertEquals(ids.sensorId(), idOf("sensor"));
        assertEquals(ids.readingId(), idOf("reading"));
    }

    /** Reads one relation's id with a query on the foreign key columns, without loading the relation. */
    @Transactional
    Long idOf(String relation) {
        return em.createQuery("select a." + relation + ".id from Alert a", Long.class).getSingleResult();
    }

    @Test
    void statusIsStoredAsTextNotAsANumber() {
        // @Enumerated(STRING) keeps the column readable ("OPEN") and safe when enum values are
        // added or reordered later; the default (ORDINAL) would store 0 and break on reordering.
        createAlert(createReading(), Instant.now());

        assertEquals("OPEN", rawStatus());
    }

    /** Reads the status column as plain text, bypassing the enum mapping. */
    @Transactional
    String rawStatus() {
        return (String) em.createNativeQuery("select status from alert").getSingleResult();
    }

    @Test
    void alertKeepsItsSnapshotWhenTheSiteThresholdChanges() {
        Ids ids = createReading();
        createAlert(ids, Instant.now());

        changeSiteThreshold(ids.siteId(), new BigDecimal("500.00"));

        // The site now says 500, but the alert still records the 100 that was exceeded.
        assertEquals(0, new BigDecimal("100").compareTo(readFirst().threshold));
    }

    @Transactional
    void changeSiteThreshold(Long siteId, BigDecimal threshold) {
        Site site = Site.findById(siteId);
        site.threshold = threshold;
    }
}
