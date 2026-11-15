package com.energy.alert;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for the alert rule. A plain JUnit test: no @QuarkusTest, so no application and no
 * database are started and it runs in milliseconds. That is possible because the rule is a plain
 * class with no dependencies, which is the point of keeping business rules out of the resource.
 */
class ThresholdRuleTest {

    private static BigDecimal bd(String number) {
        return new BigDecimal(number);
    }

    @Test
    void valueAboveThresholdIsABreach() {
        assertTrue(ThresholdRule.isBreached(bd("100.01"), bd("100.00")));
    }

    @Test
    void valueEqualToThresholdIsNotABreach() {
        // Decided in M5: strictly greater than. Being exactly at the limit is allowed.
        assertFalse(ThresholdRule.isBreached(bd("100.00"), bd("100.00")));
    }

    @Test
    void valueBelowThresholdIsNotABreach() {
        assertFalse(ThresholdRule.isBreached(bd("99.99"), bd("100.00")));
    }

    @Test
    void equalValuesWithADifferentScaleAreStillEqual() {
        // 100.000 (reading, 3 decimals) vs 100.00 (threshold, 2 decimals): BigDecimal.equals would
        // say "different" because the scale differs, so the rule must compare with compareTo.
        assertFalse(ThresholdRule.isBreached(bd("100.000"), bd("100.00")));
    }

    @Test
    void smallestPossibleStepAboveThresholdIsABreach() {
        // The reading has 3 decimals, the threshold 2: 100.001 is the first value above 100.00.
        assertTrue(ThresholdRule.isBreached(bd("100.001"), bd("100.00")));
    }

    @Test
    void zeroValueIsNotABreachOfAPositiveThreshold() {
        assertFalse(ThresholdRule.isBreached(BigDecimal.ZERO, bd("0.01")));
    }

    @Test
    void largeValuesAreComparedExactly() {
        // double would lose the last digits here; BigDecimal keeps them.
        assertTrue(ThresholdRule.isBreached(bd("999999999.999"), bd("999999999.99")));
    }

    @Test
    void nullArgumentsAreRejected() {
        assertThrows(NullPointerException.class, () -> ThresholdRule.isBreached(null, bd("1")));
        assertThrows(NullPointerException.class, () -> ThresholdRule.isBreached(bd("1"), null));
    }
}
