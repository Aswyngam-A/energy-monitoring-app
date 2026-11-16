package com.energy.dashboard;

import com.energy.alert.Alert;
import com.energy.alert.AlertStatus;
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
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.contains;

/**
 * HTTP-level tests for GET /api/v1/dashboard/summary: a page of entries, one per site, with its
 * latest reading (by measurement time, across all of the site's sensors) and the number of its
 * OPEN alerts. Polish item 4 made the endpoint paginated ({items, page, size, total} like the other
 * lists, sites ordered by name), so the earlier tests read their values from `items` (same checks,
 * new response shape: a decided change, not a weakened test).
 * Data is inserted directly so each test controls exactly what the summary should show.
 */
@QuarkusTest
class DashboardResourceTest {

    private static final String PATH = "/api/v1/dashboard/summary";

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
    Long insertReading(Long sensorId, String value, String timestamp) {
        Reading reading = new Reading();
        reading.sensor = Sensor.findById(sensorId);
        reading.value = new BigDecimal(value);
        reading.timestamp = Instant.parse(timestamp);
        reading.persist();
        return reading.id;
    }

    /** Inserts an alert (and the reading it points at) for the sensor, in the given status. */
    @Transactional
    void insertAlert(Long sensorId, AlertStatus status) {
        Sensor sensor = Sensor.findById(sensorId);
        // The database allows only one active alert per sensor (V5): extra active alerts for the
        // same site go to an extra sensor of that site.
        if (status != AlertStatus.RESOLVED
                && Alert.count("sensor.id = ?1 and status <> ?2", sensor.id, AlertStatus.RESOLVED) > 0) {
            Site site = sensor.site;
            sensor = new Sensor();
            sensor.name = "Extra sensor";
            sensor.site = site;
            sensor.persist();
        }
        Reading reading = new Reading();
        reading.sensor = sensor;
        reading.value = new BigDecimal("150");
        reading.timestamp = Instant.parse("2020-01-01T00:00:00Z");
        reading.persist();

        Alert alert = new Alert();
        alert.site = sensor.site;
        alert.sensor = sensor;
        alert.reading = reading;
        alert.value = reading.value;
        alert.threshold = new BigDecimal("100.00");
        alert.createdAt = Instant.parse("2020-01-01T00:00:00Z");
        alert.status = status;
        alert.persist();
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

    private ValidatableResponse get() {
        return given().when().get(PATH).then();
    }

    private ValidatableResponse getPage(String page, String size) {
        var request = given();
        if (page != null) request = request.queryParam("page", page);
        if (size != null) request = request.queryParam("size", size);
        return request.when().get(PATH).then();
    }

    private void insertSites(int n) {
        // Zero-padded so name order equals numeric order: Site 01, Site 02, ...
        for (int i = 1; i <= n; i++) {
            insertSite(String.format("Site %02d", i));
        }
    }

    @Test
    void noSitesGivesAnEmptyArray() {
        get().statusCode(200).body("items.size()", is(0))
            .body("total", is(0));
    }

    @Test
    void siteWithoutReadingsOrAlertsHasNullLatestReadingAndZeroAlerts() {
        Long siteId = insertSite("Quiet");

        get()
            .statusCode(200)
            .body("items.size()", is(1))
            .body("items[0].siteId", is(siteId.intValue()))
            .body("items[0].siteName", is("Quiet"))
            .body("items[0].latestReading", nullValue())
            .body("items[0].openAlerts", is(0));
    }

    @Test
    void latestReadingIsTheMostRecentByTimestampAcrossTheSitesSensors() {
        Long siteId = insertSite("A");
        Long meter = insertSensor(siteId, "Meter");
        Long thermo = insertSensor(siteId, "Thermo");
        insertReading(meter, "10", "2024-05-01T10:00:00Z");
        insertReading(thermo, "30", "2024-05-01T12:00:00Z"); // the newest measurement
        // Inserted last but measured earlier: "latest" is by measurement time, not insertion order.
        insertReading(meter, "20", "2024-05-01T11:00:00Z");

        get()
            .statusCode(200)
            .body("items[0].latestReading.value", is(30f))
            .body("items[0].latestReading.timestamp", is("2024-05-01T12:00:00Z"));
    }

    @Test
    void readingsOfOtherSitesDoNotMixIn() {
        Long a = insertSite("A");
        Long b = insertSite("B");
        insertReading(insertSensor(a, "Meter A"), "10", "2024-05-01T10:00:00Z");
        insertReading(insertSensor(b, "Meter B"), "99", "2024-05-02T10:00:00Z");

        get()
            .statusCode(200)
            .body("items.latestReading.value", contains(10f, 99f));
    }

    @Test
    void openAlertsCountsOnlyOpenOnesOfThatSite() {
        Long a = insertSite("A");
        Long b = insertSite("B");
        Long sensorA = insertSensor(a, "Meter A");
        Long sensorB = insertSensor(b, "Meter B");
        insertAlert(sensorA, AlertStatus.OPEN);
        insertAlert(sensorA, AlertStatus.RESOLVED);
        insertAlert(sensorA, AlertStatus.ACKNOWLEDGED);
        insertAlert(sensorB, AlertStatus.OPEN);
        insertAlert(sensorB, AlertStatus.OPEN);

        // Same meaning as the nav badge: only OPEN counts.
        get()
            .statusCode(200)
            .body("items.openAlerts", contains(1, 2));
    }

    @Test
    void sitesAreListedByName() {
        insertSite("Charlie");
        insertSite("Alpha");
        insertSite("Bravo");

        get()
            .statusCode(200)
            .body("items.siteName", contains("Alpha", "Bravo", "Charlie"));
    }

    // ---- pagination (polish item 4) ----

    @Test
    void responseIsAPageWithItsMetadata() {
        insertSites(3);

        get()
            .statusCode(200)
            .body("page", is(0))
            .body("size", is(20))
            .body("total", is(3))
            .body("items.size()", is(3));
    }

    @Test
    void sizeLimitsTheItemsButTotalCountsEverySite() {
        insertSites(5);

        getPage("0", "2")
            .statusCode(200)
            .body("items.siteName", contains("Site 01", "Site 02"))
            .body("size", is(2))
            .body("total", is(5));
    }

    @Test
    void pageSelectsTheSliceInTheSameOrder() {
        insertSites(5);

        getPage("1", "2").body("items.siteName", contains("Site 03", "Site 04"));
        getPage("2", "2").body("items.siteName", contains("Site 05"));
    }

    @Test
    void pageBeyondTheEndIsEmptyButKeepsTheTotal() {
        insertSites(3);

        getPage("5", "2")
            .statusCode(200)
            .body("items.size()", is(0))
            .body("total", is(3));
    }

    @Test
    void latestReadingAndAlertCountsAreOfTheSitesOnThePageOnly() {
        // The aggregates are computed for the page's sites; they must still be matched to the
        // right site on a later page.
        Long first = insertSite("Alpha");
        Long second = insertSite("Bravo");
        insertReading(insertSensor(first, "Meter A"), "10", "2024-05-01T10:00:00Z");
        Long sensorB = insertSensor(second, "Meter B");
        insertReading(sensorB, "99", "2024-05-02T10:00:00Z");
        insertAlert(sensorB, AlertStatus.OPEN);

        getPage("1", "1")
            .statusCode(200)
            .body("items.size()", is(1))
            .body("items[0].siteName", is("Bravo"))
            .body("items[0].latestReading.value", is(99f))
            .body("items[0].openAlerts", is(1));
    }

    @Test
    void badPageOrSizeReturns400() {
        getPage("-1", null).statusCode(400).body("status", is(400));
        getPage("abc", null).statusCode(400);
        getPage(null, "0").statusCode(400);
        getPage(null, "101").statusCode(400);
        getPage(null, "abc").statusCode(400);
    }

    // ---- sparkline + threshold (UI design follow-up) ----

    @Test
    void eachEntryCarriesItsSitesThreshold() {
        insertSite("A"); // insertSite gives every site the threshold 100.00

        get().statusCode(200).body("items[0].threshold", is(100.0f));
    }

    @Test
    void trendIsThePeakPerMeasurementTimeOldestFirst() {
        Long siteId = insertSite("A");
        Long meter = insertSensor(siteId, "Meter");
        Long pump = insertSensor(siteId, "Pump");
        // Two sensors measured at the same instants: the trend keeps the higher value of each instant
        // (the one the threshold is about). Inserted out of order on purpose.
        insertReading(meter, "20", "2024-05-01T11:00:00Z");
        insertReading(pump, "35", "2024-05-01T11:00:00Z");
        insertReading(meter, "10", "2024-05-01T10:00:00Z");
        insertReading(pump, "5", "2024-05-01T10:00:00Z");
        insertReading(meter, "40", "2024-05-01T12:00:00Z");

        get().statusCode(200).body("items[0].trend", contains(10f, 35f, 40f));
    }

    @Test
    void trendHoldsOnlyTheLatest24MeasurementTimes() {
        Long siteId = insertSite("A");
        Long meter = insertSensor(siteId, "Meter");
        // 30 readings, value = hour number 0..29, one per hour.
        for (int hour = 0; hour < 30; hour++) {
            insertReading(meter, String.valueOf(hour),
                Instant.parse("2024-05-01T00:00:00Z").plusSeconds(3600L * hour).toString());
        }

        get().statusCode(200)
            .body("items[0].trend.size()", is(24))
            .body("items[0].trend[0]", is(6f))    // the 24 newest are 6..29, oldest first
            .body("items[0].trend[23]", is(29f));
    }

    @Test
    void trendIsEmptyWithoutReadingsAndNeverMixesInOtherSites() {
        Long quiet = insertSite("A quiet");
        Long busy = insertSite("B busy");
        insertReading(insertSensor(busy, "Meter"), "50", "2024-05-01T10:00:00Z");

        get().statusCode(200)
            .body("items[0].siteId", is(quiet.intValue()))
            .body("items[0].trend.size()", is(0))
            .body("items[1].trend", contains(50f));
    }

    // ---- overview: the live numbers of the home page ----

    private ValidatableResponse getOverview() {
        return given().when().get("/api/v1/dashboard/overview").then();
    }

    @Test
    void overviewOfAnEmptySystemIsAllZerosAndNoLastReading() {
        getOverview().statusCode(200)
            .body("sites", is(0))
            .body("openAlerts", is(0))
            .body("totalKw", is(0f))
            .body("lastReadingAt", nullValue());
    }

    @Test
    void overviewCountsSitesAndOnlyOpenAlerts() {
        Long a = insertSite("A");
        Long b = insertSite("B");
        insertAlert(insertSensor(a, "M1"), AlertStatus.OPEN);
        insertAlert(insertSensor(b, "M2"), AlertStatus.ACKNOWLEDGED);
        insertAlert(insertSensor(b, "M3"), AlertStatus.RESOLVED);

        getOverview().statusCode(200)
            .body("sites", is(2))
            .body("openAlerts", is(1));
    }

    @Test
    void totalKwAddsUpTheLatestReadingOfEverySensor() {
        Long a = insertSite("A");
        Long b = insertSite("B");
        Long meter = insertSensor(a, "Meter");
        Long pump = insertSensor(b, "Pump");
        // Only the newest reading of each sensor counts: meter 30 (not 10 or 20), pump 5.
        insertReading(meter, "10", "2024-05-01T10:00:00Z");
        insertReading(meter, "30", "2024-05-01T12:00:00Z");
        insertReading(pump, "5", "2024-05-01T09:00:00Z");
        insertReading(meter, "20", "2024-05-01T11:00:00Z");

        getOverview().statusCode(200)
            .body("totalKw", is(35f))
            // The newest measurement of the whole system, whichever sensor sent it.
            .body("lastReadingAt", is("2024-05-01T12:00:00Z"));
    }
}
