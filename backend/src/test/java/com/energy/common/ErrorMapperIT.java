package com.energy.common;
import io.quarkus.test.junit.QuarkusIntegrationTest;

/** Runs ErrorMapperTest again against the packaged application (a real, separate process). */
@QuarkusIntegrationTest
class ErrorMapperIT extends ErrorMapperTest {
    // Execute the same tests but in packaged mode.
}
