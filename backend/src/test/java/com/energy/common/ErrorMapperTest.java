package com.energy.common;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;

@QuarkusTest
class ErrorMapperTest {

    @Test
    void unknownPathReturnsJson404() {
        given()
            .when().get("/api/v1/does-not-exist")
            .then()
                .statusCode(404)
                .contentType("application/json")
                .body("status", equalTo(404))
                .body("error", equalTo("Not Found"));
    }
}
