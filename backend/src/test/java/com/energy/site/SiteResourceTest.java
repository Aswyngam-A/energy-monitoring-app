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

import org.junit.jupiter.api.AfterEach;

@TestHTTPEndpoint(SiteResource.class)
@QuarkusTest
class SiteResourceTest {

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
}
