package com.energy.reading;

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
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItems;

/**
 * HTTP-level tests for GET /api/v1/sites/{siteId}/readings?from=&to=: all of a site's readings,
 * optionally limited to a time range (both ends inclusive), newest first; 400 and 404 cases.
 */
@QuarkusTest
class SiteReadingsResourceTest {

    private static final String PATH = "/api/v1/sites/{siteId}/readings";

    // Three fixed instants, one hour apart, used to build ranges: T1 < T2 < T3.
    private static final String T1 = "2024-05-01T10:00:00Z";
    private static final String T2 = "2024-05-01T11:00:00Z";
    private static final String T3 = "2024-05-01T12:00:00Z";

    @Transactional
    Long insertSite(String name) {
        Site site = new Site();
        site.name = name;
        site.threshold = new BigDecimal("100.00");
        site.persist();
        return site.id;
    }

    @Transactional
    Long insertSensor(Long siteId, String name) {
        Sensor sensor = new Sensor();
        sensor.name = name;
        sensor.site = Site.findById(siteId);
        sensor.persist();
        return sensor.id;
    }

    @Transactional
    void insertReading(Long sensorId, String value, String timestamp) {
        Reading reading = new Reading();
        reading.sensor = Sensor.findById(sensorId);
        reading.value = new BigDecimal(value);
        reading.timestamp = Instant.parse(timestamp);
        reading.persist();
    }

    /** Children first: readings point at sensors and sensors at sites (foreign keys). */
    @AfterEach
    @Transactional
    void cleanUp() {
        Reading.deleteAll();
        Sensor.deleteAll();
        Site.deleteAll();
    }

    /** One site with one sensor holding three readings at T1, T2, T3 (values 1, 2, 3). */
    private Long siteWithThreeReadings() {
        Long siteId = insertSite("Site A");
        Long sensorId = insertSensor(siteId, "Meter");
        insertReading(sensorId, "1", T1);
        insertReading(sensorId, "2", T2);
        insertReading(sensorId, "3", T3);
        return siteId;
    }

    private ValidatableResponse get(Long siteId, String from, String to) {
        var request = given();
        if (from != null) request = request.queryParam("from", from);
        if (to != null) request = request.queryParam("to", to);
        return request.when().get(PATH, siteId).then();
    }

    @Test
    void withoutRangeReturnsAllReadingsNewestFirst() {
        Long siteId = siteWithThreeReadings();

        get(siteId, null, null)
            .statusCode(200)
            .body("items.size()", is(3))
            // Newest first: values 3, 2, 1.
            .body("items.value", contains(3f, 2f, 1f));
    }

    @Test
    void includesReadingsOfEverySensorOfTheSiteWithTheirNames() {
        Long siteId = insertSite("Site A");
        Long meter = insertSensor(siteId, "Meter");
        Long thermo = insertSensor(siteId, "Thermo");
        insertReading(meter, "1", T1);
        insertReading(thermo, "2", T2);

        get(siteId, null, null)
            .statusCode(200)
            .body("items.size()", is(2))
            .body("items.sensorName", hasItems("Meter", "Thermo"))
            .body("items.sensorId", hasItems(meter.intValue(), thermo.intValue()));
    }

    @Test
    void doesNotReturnReadingsOfOtherSites() {
        Long siteA = siteWithThreeReadings();
        Long siteB = insertSite("Site B");
        Long sensorB = insertSensor(siteB, "Other meter");
        insertReading(sensorB, "99", T2);

        get(siteA, null, null)
            .statusCode(200)
            .body("items.size()", is(3))
            .body("items.value", contains(3f, 2f, 1f));
    }

    @Test
    void fromKeepsReadingsAtOrAfterIt() {
        Long siteId = siteWithThreeReadings();

        // Inclusive: the reading exactly at T2 is kept.
        get(siteId, T2, null)
            .statusCode(200)
            .body("items.value", contains(3f, 2f));
    }

    @Test
    void toKeepsReadingsAtOrBeforeIt() {
        Long siteId = siteWithThreeReadings();

        get(siteId, null, T2)
            .statusCode(200)
            .body("items.value", contains(2f, 1f));
    }

    @Test
    void fromAndToTogetherSelectTheRange() {
        Long siteId = siteWithThreeReadings();

        get(siteId, T2, T2)
            .statusCode(200)
            .body("items.value", contains(2f));
    }

    @Test
    void rangeWithNoReadingsReturnsEmptyArray() {
        Long siteId = siteWithThreeReadings();

        get(siteId, "2030-01-01T00:00:00Z", null)
            .statusCode(200)
            .body("items.size()", is(0));
    }

    @Test
    void siteWithoutReadingsReturnsEmptyArray() {
        Long siteId = insertSite("Empty");

        get(siteId, null, null)
            .statusCode(200)
            .body("items.size()", is(0));
    }

    @Test
    void fromAfterToReturns400() {
        Long siteId = siteWithThreeReadings();

        get(siteId, T3, T1)
            .statusCode(400)
            .body("status", is(400));
    }

    @Test
    void malformedFromReturns400() {
        Long siteId = siteWithThreeReadings();

        get(siteId, "yesterday", null).statusCode(400);
    }

    @Test
    void malformedToReturns400() {
        Long siteId = siteWithThreeReadings();

        get(siteId, null, "2024-13-45").statusCode(400);
    }

    @Test
    void unknownSiteReturns404() {
        get(999999L, null, null).statusCode(404);
    }

    // ---- pagination (M7): the list is a page { items, page, size, total } ----

    private ValidatableResponse getPage(Long siteId, String page, String size) {
        var request = given();
        if (page != null) request = request.queryParam("page", page);
        if (size != null) request = request.queryParam("size", size);
        return request.when().get(PATH, siteId).then();
    }

    @Test
    void responseIsAPageWithItsMetadata() {
        Long siteId = siteWithThreeReadings();

        getPage(siteId, null, null)
            .statusCode(200)
            .body("items.size()", is(3))
            .body("page", is(0))
            .body("size", is(20))
            .body("total", is(3));
    }

    @Test
    void pagesSliceTheNewestFirstOrder() {
        Long siteId = siteWithThreeReadings();

        getPage(siteId, "0", "2").body("items.value", contains(3f, 2f)).body("total", is(3));
        getPage(siteId, "1", "2").body("items.value", contains(1f)).body("page", is(1));
        getPage(siteId, "2", "2").body("items.size()", is(0)).body("total", is(3));
    }

    @Test
    void totalFollowsTheDateRange() {
        Long siteId = siteWithThreeReadings();

        // T2..T3 holds two readings; page size 1 shows one of them but total says 2.
        given().queryParam("from", T2).queryParam("size", 1)
            .when().get(PATH, siteId).then()
            .statusCode(200)
            .body("items.value", contains(3f))
            .body("total", is(2));
    }

    @Test
    void badPageOrSizeReturns400() {
        Long siteId = siteWithThreeReadings();

        getPage(siteId, "-1", null).statusCode(400);
        getPage(siteId, null, "0").statusCode(400);
        getPage(siteId, null, "101").statusCode(400);
    }
}
