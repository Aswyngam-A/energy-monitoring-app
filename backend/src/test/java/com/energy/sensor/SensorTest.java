package com.energy.sensor;

import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Checks the Sensor entity, the V2 migration and the Sensor -> Site relationship work together:
 * a sensor can be saved with its site and read back, and `type` is optional.
 */
@QuarkusTest
class SensorTest {

    /** Saves a site and returns its id (the transaction commits when the method returns). */
    @Transactional
    Long createSite() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();
        return site.id;
    }

    /** Saves a sensor attached to the given site; type may be null. */
    @Transactional
    void createSensor(Long siteId, String name, String type) {
        Sensor sensor = new Sensor();
        sensor.name = name;
        sensor.type = type;
        sensor.site = Site.findById(siteId);
        sensor.persist();
    }

    /**
     * Empties both tables after each test. Sensors go first: they hold a foreign key to site,
     * so deleting a site that still has sensors would be rejected by the database.
     */
    @AfterEach
    @Transactional
    void cleanUp() {
        Sensor.deleteAll();
        Site.deleteAll();
    }

    @Test
    void sensorCanBePersistedWithItsSite() {
        Long siteId = createSite();
        createSensor(siteId, "Main meter", "power");

        Sensor found = readSensor("Main meter");
        assertNotNull(found);
        assertNotNull(found.id);
        assertEquals("power", found.type);
        assertEquals(siteId, siteIdOf(found));
    }

    @Test
    void sensorTypeIsOptional() {
        Long siteId = createSite();
        createSensor(siteId, "Untyped", null);

        Sensor found = readSensor("Untyped");
        assertNotNull(found);
        assertNull(found.type);
    }

    /** Reads a sensor by name inside a transaction so lazy fields could be touched safely. */
    @Transactional
    Sensor readSensor(String name) {
        return Sensor.find("name", name).firstResult();
    }

    /** Reads the site id through the relationship, inside a transaction (the site may be lazy). */
    @Transactional
    Long siteIdOf(Sensor sensor) {
        Sensor managed = Sensor.findById(sensor.id);
        return managed.site.id;
    }
}
