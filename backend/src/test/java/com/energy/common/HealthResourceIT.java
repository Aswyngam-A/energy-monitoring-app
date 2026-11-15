package com.energy.common;
import io.quarkus.test.junit.QuarkusIntegrationTest;

/** Runs HealthResourceTest again against the packaged application (a real, separate process). */
@QuarkusIntegrationTest
class HealthResourceIT extends HealthResourceTest {
    // Execute the same tests but in packaged mode.
}
