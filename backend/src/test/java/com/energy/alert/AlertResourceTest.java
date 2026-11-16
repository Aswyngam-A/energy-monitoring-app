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

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.contains;

/**
 * HTTP-level tests for /api/v1/alerts: GET (all alerts newest first, optionally only those of one
 * site; 400 for a malformed siteId, 404 for an unknown site) and PATCH /{id} (move an alert to
 * another status following AlertTransitions; 400 for an illegal move or a bad body, 404 if missing).
 * Alerts are inserted directly (not through ingestion) so each test controls the exact data.
 */
@QuarkusTest
class AlertResourceTest {

    private static final String PATH = "/api/v1/alerts";

    /** A site and one of its sensors, the parents an alert needs. */
    record Ids(Long siteId, Long sensorId) {}

    @Transactional
    Ids insertSiteWithSensor(String siteName) {
        Site site = new Site();
        site.name = siteName;
        site.threshold = new BigDecimal("100.00");
        site.persist();

        Sensor sensor = new Sensor();
        sensor.name = siteName + " meter";
        sensor.site = site;
        sensor.persist();
        return new Ids(site.id, sensor.id);
    }

    /** Saves a reading plus the alert it raised, with a chosen value and creation time. Returns the alert id. */
    @Transactional
    Long insertAlert(Ids ids, String value, String createdAt) {
        return insertAlert(ids, value, createdAt, AlertStatus.OPEN);
    }

    /** Same, with a chosen status (for the PATCH tests). */
    @Transactional
    Long insertAlert(Ids ids, String value, String createdAt, AlertStatus status) {
        Reading reading = new Reading();
        reading.sensor = Sensor.findById(ids.sensorId());
        reading.value = new BigDecimal(value);
        reading.timestamp = Instant.parse(createdAt);
        reading.persist();

        Alert alert = new Alert();
        alert.site = Site.findById(ids.siteId());
        alert.sensor = reading.sensor;
        alert.reading = reading;
        alert.value = reading.value;
        alert.threshold = new BigDecimal("100.00");
        alert.createdAt = Instant.parse(createdAt);
        alert.status = status;
        alert.persist();
        return alert.id;
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

    private ValidatableResponse get(String siteId) {
        var request = given();
        if (siteId != null) request = request.queryParam("siteId", siteId);
        return request.when().get(PATH).then();
    }

    @Test
    void listsEveryAlertNewestFirst() {
        Ids a = insertSiteWithSensor("A");
        Ids b = insertSiteWithSensor("B");
        insertAlert(a, "110", "2024-05-01T10:00:00Z");
        insertAlert(b, "120", "2024-05-01T12:00:00Z");
        insertAlert(a, "130", "2024-05-01T11:00:00Z");

        get(null)
            .statusCode(200)
            // Newest first by creation time, across sites: 12:00, 11:00, 10:00.
            .body("value", contains(120f, 130f, 110f));
    }

    @Test
    void eachAlertHasTheFieldsOfTheContract() {
        Ids ids = insertSiteWithSensor("A");
        Long alertId = insertAlert(ids, "150.5", "2024-05-01T10:00:00Z");

        get(null)
            .statusCode(200)
            .body("size()", is(1))
            .body("[0].id", is(alertId.intValue()))
            .body("[0].siteId", is(ids.siteId().intValue()))
            .body("[0].sensorId", is(ids.sensorId().intValue()))
            .body("[0].readingId", notNullValue())
            .body("[0].value", is(150.5f))
            .body("[0].threshold", is(100.0f))
            .body("[0].createdAt", is("2024-05-01T10:00:00Z"))
            .body("[0].status", is("OPEN"));
    }

    @Test
    void siteIdKeepsOnlyThatSitesAlerts() {
        Ids a = insertSiteWithSensor("A");
        Ids b = insertSiteWithSensor("B");
        insertAlert(a, "110", "2024-05-01T10:00:00Z");
        insertAlert(b, "120", "2024-05-01T11:00:00Z");
        insertAlert(a, "130", "2024-05-01T12:00:00Z");

        get(String.valueOf(a.siteId()))
            .statusCode(200)
            .body("value", contains(130f, 110f));
    }

    @Test
    void noAlertsReturnsAnEmptyArray() {
        get(null)
            .statusCode(200)
            .body("size()", is(0));
    }

    @Test
    void siteWithoutAlertsReturnsAnEmptyArray() {
        Ids ids = insertSiteWithSensor("Quiet");

        get(String.valueOf(ids.siteId()))
            .statusCode(200)
            .body("size()", is(0));
    }

    @Test
    void unknownSiteReturns404() {
        get("999999")
            .statusCode(404)
            .body("status", is(404));
    }

    @Test
    void malformedSiteIdReturns400() {
        get("abc")
            .statusCode(400)
            .body("status", is(400));
    }

    // ---- GET /alerts?status= ----

    private ValidatableResponse getByStatus(String siteId, String status) {
        var request = given();
        if (siteId != null) request = request.queryParam("siteId", siteId);
        if (status != null) request = request.queryParam("status", status);
        return request.when().get(PATH).then();
    }

    @Test
    void statusKeepsOnlyAlertsInThatStatus() {
        Ids ids = insertSiteWithSensor("A");
        insertAlert(ids, "110", "2024-05-01T10:00:00Z", AlertStatus.OPEN);
        insertAlert(ids, "120", "2024-05-01T11:00:00Z", AlertStatus.ACKNOWLEDGED);
        insertAlert(ids, "130", "2024-05-01T12:00:00Z", AlertStatus.RESOLVED);

        getByStatus(null, "ACKNOWLEDGED").statusCode(200).body("value", contains(120f));
        getByStatus(null, "OPEN").statusCode(200).body("value", contains(110f));
        getByStatus(null, "RESOLVED").statusCode(200).body("value", contains(130f));
    }

    @Test
    void statusAndSiteIdCombine() {
        Ids a = insertSiteWithSensor("A");
        Ids b = insertSiteWithSensor("B");
        insertAlert(a, "110", "2024-05-01T10:00:00Z", AlertStatus.OPEN);
        insertAlert(a, "120", "2024-05-01T11:00:00Z", AlertStatus.RESOLVED);
        insertAlert(b, "130", "2024-05-01T12:00:00Z", AlertStatus.OPEN);

        // Only site A's OPEN alert: both filters apply.
        getByStatus(String.valueOf(a.siteId()), "OPEN").statusCode(200).body("value", contains(110f));
    }

    @Test
    void statusWithNoMatchReturnsAnEmptyArray() {
        Ids ids = insertSiteWithSensor("A");
        insertAlert(ids, "110", "2024-05-01T10:00:00Z", AlertStatus.OPEN);

        getByStatus(null, "RESOLVED").statusCode(200).body("size()", is(0));
    }

    @Test
    void withoutStatusEveryStatusIsListed() {
        Ids ids = insertSiteWithSensor("A");
        insertAlert(ids, "110", "2024-05-01T10:00:00Z", AlertStatus.OPEN);
        insertAlert(ids, "120", "2024-05-01T11:00:00Z", AlertStatus.RESOLVED);

        getByStatus(null, null).statusCode(200).body("size()", is(2));
        // A blank value counts as "not given", like a blank siteId.
        getByStatus(null, "").statusCode(200).body("size()", is(2));
    }

    @Test
    void unknownStatusReturns400() {
        getByStatus(null, "EXPLODED").statusCode(400).body("status", is(400));
    }

    // ---- PATCH /alerts/{id} ----

    private ValidatableResponse patch(Object alertId, String body) {
        return given()
            .contentType("application/json")
            .body(body)
            .when().patch(PATH + "/" + alertId)
            .then();
    }

    /** Reads the status back through the API (the source of truth for the client). */
    private String statusOf(Long alertId) {
        return given().when().get(PATH).then().extract()
            .path("find { it.id == " + alertId + " }.status");
    }

    @Test
    void acknowledgesAnOpenAlert() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z");

        patch(id, "{\"status\":\"ACKNOWLEDGED\"}")
            .statusCode(200)
            // The response is the updated alert, same shape as in the list.
            .body("id", is(id.intValue()))
            .body("status", is("ACKNOWLEDGED"));
        org.junit.jupiter.api.Assertions.assertEquals("ACKNOWLEDGED", statusOf(id));
    }

    @Test
    void resolvesAnAcknowledgedAlert() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z", AlertStatus.ACKNOWLEDGED);

        patch(id, "{\"status\":\"RESOLVED\"}").statusCode(200).body("status", is("RESOLVED"));
        org.junit.jupiter.api.Assertions.assertEquals("RESOLVED", statusOf(id));
    }

    @Test
    void resolvesAnOpenAlertDirectly() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z");

        patch(id, "{\"status\":\"RESOLVED\"}").statusCode(200).body("status", is("RESOLVED"));
    }

    @Test
    void refusesToReopenAResolvedAlert() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z", AlertStatus.RESOLVED);

        patch(id, "{\"status\":\"OPEN\"}")
            .statusCode(400)
            .body("message", org.hamcrest.Matchers.containsString("RESOLVED"));
        // Nothing changed.
        org.junit.jupiter.api.Assertions.assertEquals("RESOLVED", statusOf(id));
    }

    @Test
    void refusesToMoveToTheCurrentStatus() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z");

        patch(id, "{\"status\":\"OPEN\"}").statusCode(400);
    }

    @Test
    void refusesToGoBackFromAcknowledgedToOpen() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z", AlertStatus.ACKNOWLEDGED);

        patch(id, "{\"status\":\"OPEN\"}").statusCode(400);
        org.junit.jupiter.api.Assertions.assertEquals("ACKNOWLEDGED", statusOf(id));
    }

    @Test
    void refusesAnUnknownStatusName() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z");

        patch(id, "{\"status\":\"EXPLODED\"}").statusCode(400);
    }

    @Test
    void refusesAMissingStatus() {
        Long id = insertAlert(insertSiteWithSensor("A"), "150", "2024-05-01T10:00:00Z");

        patch(id, "{}").statusCode(400);
    }

    @Test
    void unknownAlertIs404() {
        patch(999999, "{\"status\":\"ACKNOWLEDGED\"}").statusCode(404);
    }
}
