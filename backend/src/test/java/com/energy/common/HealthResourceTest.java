package com.energy.common;

import io.quarkus.test.common.http.TestHTTPEndpoint;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@TestHTTPEndpoint(HealthResource.class)
@QuarkusTest
class HealthResourceTest {

    @Test
    void healthEndpointUP() {
        given()
            .when().get()
            .then()
                .statusCode(200)
                .contentType("application/json")
                .body("status", is("UP"));
    }
}
