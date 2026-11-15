package com.energy.site;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Checks the Site entity, the V1 migration and Panache work together:
 * a site can be saved and read back from a real PostgreSQL (started by Quarkus Dev Services).
 */
@QuarkusTest
class SiteTest {

    /** Saves one site. @Transactional makes it commit when the method returns, so the data is really stored. */
    @Transactional
    void createSite() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();
    }

    /** Empties the table after each test so tests do not see each other's rows. */
    @AfterEach
    @Transactional
    void cleanUp() {
        Site.deleteAll();
    }

    @Test
    void siteCanBePersistedAndFound() {
        createSite();  // transaction commits here

        Site found = Site.find("name", "Test Site").firstResult();
        assertNotNull(found);
        assertNotNull(found.id); // the id was generated from site_seq
        assertEquals("Test Site", found.name);
        // compareTo, not equals: equals also compares scale (100.0 vs 100.00)
        assertEquals(0, new BigDecimal("100.00").compareTo(found.threshold));
    }
}
