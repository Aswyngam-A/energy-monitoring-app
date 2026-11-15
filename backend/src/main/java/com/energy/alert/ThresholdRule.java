package com.energy.alert;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * The business rule that decides whether a reading raises an alert.
 *
 * It is a plain class with one static method and no dependencies (no database, no framework), so
 * it can be tested with plain JUnit in milliseconds and read in isolation. The ingestion service
 * calls it; the rule itself knows nothing about HTTP, entities or transactions.
 */
public final class ThresholdRule {

    // Static-only utility class: nobody should create an instance.
    private ThresholdRule() {}

    /**
     * True when {@code value} is strictly above {@code threshold} (decided in M5: ">" not ">=",
     * so a reading exactly at the limit is allowed).
     *
     * Uses compareTo, not equals: BigDecimal.equals also compares the scale, so 100.000 and 100.00
     * would count as different numbers, while compareTo compares only the numeric value.
     *
     * @throws NullPointerException if either argument is null (a missing value is a bug in the caller)
     */
    public static boolean isBreached(BigDecimal value, BigDecimal threshold) {
        Objects.requireNonNull(value, "value");
        Objects.requireNonNull(threshold, "threshold");
        return value.compareTo(threshold) > 0;
    }
}
