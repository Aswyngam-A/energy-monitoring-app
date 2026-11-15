package com.energy.reading;

import com.energy.sensor.Sensor;
import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.hasItems;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * HTTP-level tests for POST /api/v1/sensors/{sensorId}/readings: 201, 400 and 404.
 * The path is written in full because it contains a {sensorId} variable.
 */
@QuarkusTest
class ReadingResourceTest {

    private static final String READINGS_PATH = "/api/v1/sensors/{sensorId}/readings";

    /** Saves a site with one sensor and returns the sensor's id (commits when the method returns). */
    @Transactional
    Long insertSensor() {
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

    /** Children first: readings point at sensors and sensors at sites (foreign keys). */
    @AfterEach
    @Transactional
    void cleanUp() {
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    /** Posts a body to the readings endpoint of a sensor and returns the RestAssured "then" step. */
    private io.restassured.response.ValidatableResponse post(Long sensorId, String body) {
        return given()
            .contentType("application/json")
            .body(body)
            .when().post(READINGS_PATH, sensorId)
            .then();
    }

    @Test
    void createReadingWithTimestampReturns201AndStoresIt() {
        Long sensorId = insertSensor();

        ExtractableResponse<Response> response = post(sensorId, """
            { "value": 12.345, "timestamp": "2024-05-01T10:15:30Z" }
            """)
            .statusCode(201)
            .body("id", notNullValue())
            .body("value", is(12.345f))
            .body("sensorId", is(sensorId.intValue()))
            .extract();

        // The client's timestamp is kept as given (an absolute UTC instant).
        assertEquals(Instant.parse("2024-05-01T10:15:30Z"), Instant.parse(response.path("timestamp")));
        assertEquals(1, Reading.count());
    }

    @Test
    void createReadingWithoutTimestampUsesServerTime() {
        Long sensorId = insertSensor();
        Instant before = Instant.now();

        ExtractableResponse<Response> response = post(sensorId, """
            { "value": 5 }
            """)
            .statusCode(201)
            .extract();

        // The server filled in "now": between the moment before the call and the moment after it.
        Instant stored = Instant.parse(response.path("timestamp"));
        assertTrue(!stored.isBefore(before.minusSeconds(1)) && !stored.isAfter(Instant.now().plusSeconds(1)),
            "timestamp should be about now but was " + stored);
    }

    @Test
    void zeroValueIsAccepted() {
        Long sensorId = insertSensor();

        post(sensorId, """
            { "value": 0 }
            """)
            .statusCode(201);
    }

    @Test
    void oldTimestampIsAccepted() {
        Long sensorId = insertSensor();

        post(sensorId, """
            { "value": 1, "timestamp": "2020-01-01T00:00:00Z" }
            """)
            .statusCode(201);
    }

    @Test
    void timestampSlightlyAheadIsAcceptedToAllowClockDrift() {
        Long sensorId = insertSensor();
        // 1 minute ahead is inside the 5 minute tolerance (sensor clocks are never exact).
        String timestamp = Instant.now().plus(Duration.ofMinutes(1)).toString();

        post(sensorId, "{ \"value\": 1, \"timestamp\": \"" + timestamp + "\" }")
            .statusCode(201);
    }

    @Test
    void negativeValueReturns400() {
        Long sensorId = insertSensor();

        post(sensorId, """
            { "value": -1 }
            """)
            .statusCode(400)
            // Same error shape as sites and sensors.
            .body("status", is(400))
            .body("details", hasItems("value: must be greater than or equal to 0"));
    }

    @Test
    void missingValueReturns400() {
        Long sensorId = insertSensor();

        post(sensorId, """
            { "timestamp": "2024-05-01T10:15:30Z" }
            """)
            .statusCode(400);
    }

    @Test
    void tooManyDecimalsReturns400() {
        Long sensorId = insertSensor();

        // The column keeps 3 decimals; silently rounding 1.2345 would hide a client mistake.
        post(sensorId, """
            { "value": 1.2345 }
            """)
            .statusCode(400);
    }

    @Test
    void timestampFarInTheFutureReturns400() {
        Long sensorId = insertSensor();
        String timestamp = Instant.now().plus(Duration.ofHours(1)).toString();

        post(sensorId, "{ \"value\": 1, \"timestamp\": \"" + timestamp + "\" }")
            .statusCode(400)
            .body("status", is(400));
    }

    @Test
    void malformedTimestampReturns400() {
        Long sensorId = insertSensor();

        post(sensorId, """
            { "value": 1, "timestamp": "yesterday" }
            """)
            .statusCode(400);
    }

    @Test
    void createReadingForUnknownSensorReturns404() {
        post(999999L, """
            { "value": 1 }
            """)
            .statusCode(404);
    }
}
