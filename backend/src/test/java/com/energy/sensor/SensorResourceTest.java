package com.energy.sensor;

import com.energy.site.Site;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasItems;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * HTTP-level tests for POST /api/v1/sites/{siteId}/sensors: 201, 400 and 404.
 * The path is written in full (not via @TestHTTPEndpoint) because it contains a {siteId} variable.
 */
@QuarkusTest
class SensorResourceTest {

    private static final String SENSORS_PATH = "/api/v1/sites/{siteId}/sensors";

    /** Saves a site to attach sensors to, and returns its id (commits when the method returns). */
    @Transactional
    Long insertSite() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();
        return site.id;
    }

    /** Sensors first: they hold a foreign key to site, so the site cannot be deleted before them. */
    @AfterEach
    @Transactional
    void cleanUp() {
        Sensor.deleteAll();
        Site.deleteAll();
    }

    @Test
    void createSensorWithValidInputReturns201() {
        Long siteId = insertSite();

        ExtractableResponse<Response> response = given()
            .contentType("application/json")
            .body("""
                { "name": "Main meter", "type": "power" }
                """)
            .when().post(SENSORS_PATH, siteId)
            .then()
                .statusCode(201)
                .header("Location", notNullValue())
                .body("id", notNullValue())
                .body("name", is("Main meter"))
                .body("type", is("power"))
                .body("siteId", is(siteId.intValue()))
                .extract();

        // Location points at the new sensor's own URL (GET /sensors/{id}, added in the next step).
        String id = String.valueOf((Object) response.path("id"));
        String location = response.header("Location");
        assertTrue(location.endsWith("/api/v1/sensors/" + id),
            "Location should end with /api/v1/sensors/" + id + " but was " + location);
    }

    @Test
    void createSensorWithoutTypeReturns201() {
        Long siteId = insertSite();

        given()
            .contentType("application/json")
            .body("""
                { "name": "Untyped" }
                """)
            .when().post(SENSORS_PATH, siteId)
            .then()
                .statusCode(201)
                .body("name", is("Untyped"))
                .body("type", nullValue());
    }

    @Test
    void createSensorWithBlankNameReturns400() {
        Long siteId = insertSite();

        given()
            .contentType("application/json")
            .body("""
                { "name": "", "type": "power" }
                """)
            .when().post(SENSORS_PATH, siteId)
            .then()
                .statusCode(400)
                // Same error shape as sites: ErrorResponse with "<field>: <message>" details.
                .body("status", is(400))
                .body("details", hasItems("name: must not be blank"));
    }

    @Test
    void createSensorWithMissingNameReturns400() {
        Long siteId = insertSite();

        given()
            .contentType("application/json")
            .body("""
                { "type": "power" }
                """)
            .when().post(SENSORS_PATH, siteId)
            .then()
                .statusCode(400);
    }

    @Test
    void createSensorForUnknownSiteReturns404() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "Main meter", "type": "power" }
                """)
            .when().post(SENSORS_PATH, 999999L)
            .then()
                .statusCode(404);
    }
}
