package com.energy.site;

import jakarta.transaction.Transactional;
import io.quarkus.test.common.http.TestHTTPEndpoint;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.hasItems;

import org.junit.jupiter.api.AfterEach;

/**
 * HTTP-level tests for /api/v1/sites: every status code of the contract (201, 200, 400, 404).
 * @TestHTTPEndpoint makes .post()/.get() target the resource's base path, so no URL is repeated.
 */
@TestHTTPEndpoint(SiteResource.class)
@QuarkusTest
class SiteResourceTest {

    /** Empties the table after each test so counts and ids do not leak between tests. */
    @AfterEach
    @Transactional
    void cleanUp() {
        Site.deleteAll();
    }

    @Test
    void createSiteWithValidInputReturns201() {
        ExtractableResponse<Response> response = given()
            .contentType("application/json")
            .body("""
                {
                  "name": "Test Site",
                  "threshold": 100.00
                }
                """)
            .when().post()
            .then()
                .statusCode(201)
                .header("Location", notNullValue())
                .body("id", notNullValue())
                .body("name", is("Test Site"))
                .body("threshold", is(100.00f))
                .extract();

        // Location must point at the new resource: .../sites/{id}. Only the end is compared
        // because the host and port depend on the test environment.
        String location = response.header("Location");
        String id = String.valueOf((Object) response.path("id"));
        assertTrue(location.endsWith("/sites/" + id),
            "Location should end with /sites/" + id + " but was " + location);
    }

    @Test
    void siteBlankNameIsRejected() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "", "threshold": 100.00 }
                """)
            .when().post()
            .then()
                .statusCode(400);
    }

    @Test
    void siteNonPositiveThresholdIsRejected() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "Test Site", "threshold": 0 }
                """)
            .when().post()
            .then()
                .statusCode(400);
    }

    @Test
    void siteMissingThresholdIsRejected() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "Test Site" }
                """)
            .when().post()
            .then()
                .statusCode(400);
    }

    @Transactional
    Long insertSite(String name, String threshold) {
        Site site = new Site();
        site.name = name;
        site.threshold = new java.math.BigDecimal(threshold);
        site.persist();
        return site.id;
    }

    @Test
    void listReturnsAllSites() {
        insertSite("A", "10.00");
        insertSite("B", "20.00");

        given()
            .when().get()
            .then()
                .statusCode(200)
                .body("items.size()", is(2))
                .body("total", is(2));
    }

    // ---- pagination (M7): the list is a page { items, page, size, total }, newest site first ----

    @Test
    void listIsAPageOrderedNewestFirst() {
        insertSite("A", "10.00");
        insertSite("B", "20.00");
        insertSite("C", "30.00");

        given().queryParam("size", 2)
            .when().get()
            .then()
                .statusCode(200)
                .body("items.name", org.hamcrest.Matchers.contains("C", "B"))
                .body("page", is(0))
                .body("size", is(2))
                .body("total", is(3));

        given().queryParam("page", 1).queryParam("size", 2)
            .when().get()
            .then()
                .statusCode(200)
                .body("items.name", org.hamcrest.Matchers.contains("A"))
                .body("total", is(3));
    }

    @Test
    void listWithDefaultsUsesPageZeroAndSizeTwenty() {
        insertSite("A", "10.00");

        given()
            .when().get()
            .then()
                .body("page", is(0))
                .body("size", is(20));
    }

    @Test
    void listWithBadPageOrSizeReturns400() {
        given().queryParam("page", -1).when().get().then().statusCode(400);
        given().queryParam("size", 101).when().get().then().statusCode(400);
        given().queryParam("size", "abc").when().get().then().statusCode(400);
    }

    @Test
    void getExistingSiteReturns200() {
        Long id = insertSite("A", "10.00");

        given()
            .when().get("/{id}", id)
            .then()
                .statusCode(200)
                .body("name", is("A"));
    }

    @Test
    void getUnknownSiteReturns404() {
        given()
            .when().get("/{id}", 999999L)
            .then()
                .statusCode(404);
    }

    @Test
    void updateExistingSiteReturns200() {
        Long id = insertSite("Old", "10.00");

        given()
            .contentType("application/json")
            .body("""
                { "name": "New", "threshold": 20.00 }
                """)
            .when().put("/{id}", id)
            .then()
                .statusCode(200)
                .body("name", is("New"))
                .body("threshold", is(20.00f));
    }

    @Test
    void updateUnknownSiteReturns404() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "New", "threshold": 20.00 }
                """)
            .when().put("/{id}", 999999L)
            .then()
                .statusCode(404);
    }

    @Test
    void updateWithInvalidBodyReturns400() {
        Long id = insertSite("A", "10.00");

        given()
            .contentType("application/json")
            .body("""
                { "name": "", "threshold": -5 }
                """)
            .when().put("/{id}", id)
            .then()
                .statusCode(400);
    }

    @Test
    void validationErrorUsesErrorResponseShape() {
        given()
            .contentType("application/json")
            .body("""
                { "name": "", "threshold": -1 }
                """)
            .when().post()
            .then()
                .statusCode(400)
                .body("status", is(400))
                .body("error", is("Bad Request"))
                .body("details", hasItems(
                    "name: must not be blank",
                    "threshold: must be greater than 0"
                ));
    }
}
