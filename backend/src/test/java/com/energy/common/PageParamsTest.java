package com.energy.common;

import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for reading the ?page=&size= query parameters (decided in M7: 0-based page, default
 * size 20, maximum 100, anything else is a 400). Plain JUnit: the parsing is a pure function.
 */
class PageParamsTest {

    @Test
    void absentParametersGiveTheFirstPageOfTwenty() {
        PageParams params = PageParams.parse(null, null);
        assertEquals(0, params.page());
        assertEquals(20, params.size());
    }

    @Test
    void blankParametersCountAsAbsent() {
        PageParams params = PageParams.parse(" ", "");
        assertEquals(0, params.page());
        assertEquals(20, params.size());
    }

    @Test
    void validValuesAreUsed() {
        PageParams params = PageParams.parse("3", "50");
        assertEquals(3, params.page());
        assertEquals(50, params.size());
    }

    @Test
    void theMaximumSizeIsAccepted() {
        assertEquals(100, PageParams.parse(null, "100").size());
    }

    @Test
    void sizeAboveTheMaximumIsRejected() {
        assertThrows(BadRequestException.class, () -> PageParams.parse(null, "101"));
    }

    @Test
    void sizeZeroOrNegativeIsRejected() {
        assertThrows(BadRequestException.class, () -> PageParams.parse(null, "0"));
        assertThrows(BadRequestException.class, () -> PageParams.parse(null, "-5"));
    }

    @Test
    void negativePageIsRejected() {
        assertThrows(BadRequestException.class, () -> PageParams.parse("-1", null));
    }

    @Test
    void nonNumericValuesAreRejected() {
        assertThrows(BadRequestException.class, () -> PageParams.parse("abc", null));
        assertThrows(BadRequestException.class, () -> PageParams.parse(null, "ten"));
        assertThrows(BadRequestException.class, () -> PageParams.parse("1.5", null));
    }

    @Test
    void errorMessagesNameTheParameter() {
        assertEquals("page must be a whole number, 0 or more",
            assertThrows(BadRequestException.class, () -> PageParams.parse("x", null)).getMessage());
        assertEquals("size must be a whole number between 1 and 100",
            assertThrows(BadRequestException.class, () -> PageParams.parse(null, "x")).getMessage());
    }
}
