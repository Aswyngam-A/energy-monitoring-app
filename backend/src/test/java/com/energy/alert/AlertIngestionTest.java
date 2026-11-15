package com.energy.alert;

import com.energy.reading.Reading;
import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.ValidatableResponse;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Integration tests for the rule "a reading above the site's threshold raises an alert":
 * readings are posted through the real endpoint and the alert table is checked afterwards.
 * (The comparison itself is covered by the plain unit test ThresholdRuleTest; these tests check
 * that the rule is wired into ingestion and that the alert is filled in correctly.)
 */
@QuarkusTest
class AlertIngestionTest {

    /** Everything one alert should point at, read inside a transaction (the relations are lazy). */
    record AlertView(Long siteId, Long sensorId, Long readingId, BigDecimal value,
                     BigDecimal threshold, Instant createdAt, AlertStatus status) {}

    /** Saves a site with the given threshold and one sensor; returns the sensor's id. */
    @Transactional
    Long insertSensor(String threshold) {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal(threshold);
        site.persist();

        Sensor sensor = new Sensor();
        sensor.name = "Main meter";
        sensor.site = site;
        sensor.persist();
        return sensor.id;
    }

    /** Children first: alert -> reading -> sensor -> site (foreign keys). */
    @AfterEach
    @Transactional
    void cleanUp() {
        Alert.deleteAll();
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    private ValidatableResponse postReading(Long sensorId, String json) {
        return given()
            .contentType("application/json")
            .body(json)
            .when().post("/api/v1/sensors/{sensorId}/readings", sensorId)
            .then();
    }

    /** Reads every alert with the ids of its relations, inside one transaction. */
    @Transactional
    List<AlertView> alerts() {
        return Alert.<Alert>listAll().stream()
            .map(a -> new AlertView(a.site.id, a.sensor.id, a.reading.id,
                a.value, a.threshold, a.createdAt, a.status))
            .toList();
    }

    @Test
    void readingAboveThresholdRaisesAnAlertWithAllTheDetails() {
        Long sensorId = insertSensor("100.00");
        Instant before = Instant.now();

        Number readingId = postReading(sensorId, """
            { "value": 150.5 }
            """)
            .statusCode(201)
            .extract().path("id");

        List<AlertView> alerts = alerts();
        assertEquals(1, alerts.size());
        AlertView alert = alerts.get(0);
        assertEquals(sensorId, alert.sensorId());
        assertEquals(readingId.longValue(), alert.readingId());
        assertEquals(0, new BigDecimal("150.5").compareTo(alert.value()));
        assertEquals(0, new BigDecimal("100").compareTo(alert.threshold()));
        assertEquals(AlertStatus.OPEN, alert.status());
        // createdAt is the server time of the ingestion: between "before the call" and "now".
        assertTrue(!alert.createdAt().isBefore(before.minusSeconds(1))
                && !alert.createdAt().isAfter(Instant.now().plusSeconds(1)),
            "createdAt should be about now but was " + alert.createdAt());
    }

    @Test
    void alertPointsAtTheSiteOfTheSensor() {
        Long sensorId = insertSensor("100.00");

        postReading(sensorId, """
            { "value": 101 }
            """).statusCode(201);

        Long siteId = Site.<Site>findAll().firstResultOptional().map(s -> s.id).orElseThrow();
        assertEquals(siteId, alerts().get(0).siteId());
    }

    @Test
    void readingEqualToThresholdRaisesNoAlert() {
        Long sensorId = insertSensor("100.00");

        postReading(sensorId, """
            { "value": 100 }
            """).statusCode(201);

        assertEquals(0, alerts().size());
        assertEquals(1, Reading.count()); // the reading itself is still stored
    }

    @Test
    void readingBelowThresholdRaisesNoAlert() {
        Long sensorId = insertSensor("100.00");

        postReading(sensorId, """
            { "value": 99.999 }
            """).statusCode(201);

        assertEquals(0, alerts().size());
    }

    @Test
    void everyBreachingReadingRaisesItsOwnAlert() {
        Long sensorId = insertSensor("100.00");

        // No de-duplication yet (that is a later milestone): two breaches, two alerts.
        postReading(sensorId, """
            { "value": 120 }
            """).statusCode(201);
        postReading(sensorId, """
            { "value": 130 }
            """).statusCode(201);

        assertEquals(2, alerts().size());
        assertEquals(2, Reading.count());
    }

    @Test
    void rejectedReadingStoresNeitherReadingNorAlert() {
        Long sensorId = insertSensor("100.00");

        // 400: the future timestamp is refused even though the value would breach the threshold.
        String future = Instant.now().plusSeconds(3600).toString();
        postReading(sensorId, "{ \"value\": 500, \"timestamp\": \"" + future + "\" }")
            .statusCode(400);

        assertEquals(0, Reading.count());
        assertEquals(0, alerts().size());
    }
}
