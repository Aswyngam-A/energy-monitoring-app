package com.energy.site;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SiteTest {

    @Transactional
    void createSite() {
        Site site = new Site();
        site.name = "Test Site";
        site.threshold = new BigDecimal("100.00");
        site.persist();
    }

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
        assertNotNull(found.id);
        assertEquals("Test Site", found.name);
        assertEquals(0, new BigDecimal("100.00").compareTo(found.threshold));
    }
}
