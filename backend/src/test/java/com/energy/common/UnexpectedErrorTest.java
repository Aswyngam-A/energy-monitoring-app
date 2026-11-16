package com.energy.common;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.Matchers.containsString;

/**
 * An unexpected failure (a bug, not a client mistake) must still answer in the API's standard
 * error format, and must not leak internals (exception class names, SQL, stack traces).
 *
 * The nested resource exists only in the test application: it throws on purpose to provoke a 500.
 * It is a separate class from ErrorMapperTest because that one is also run against the packaged
 * app (ErrorMapperIT), where test classes are not present.
 */
@QuarkusTest
class UnexpectedErrorTest {

    /** Test-only endpoint (served under /api/v1 like every resource); the name cannot clash with real ones. */
    @Path("/test-support/boom")
    public static class BoomResource {
        @GET
        public String boom() {
            throw new IllegalStateException("secret internal detail: jdbc:postgresql://db/prod");
        }
    }

    @Test
    void unexpectedExceptionBecomesAStandard500WithoutInternals() {
        given()
            .when().get("/api/v1/test-support/boom")
            .then()
                .statusCode(500)
                .contentType("application/json")
                .body("status", is(500))
                .body("error", is("Internal Server Error"))
                .body("message", is("Unexpected error"))
                .body("details.size()", is(0))
                // Nothing from the exception reaches the client.
                .body("message", not(containsString("secret")))
                .body("error", not(containsString("IllegalState")));
    }
}
