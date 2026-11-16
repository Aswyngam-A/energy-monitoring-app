package com.energy.alert;

import org.junit.jupiter.api.Test;

import static com.energy.alert.AlertStatus.ACKNOWLEDGED;
import static com.energy.alert.AlertStatus.OPEN;
import static com.energy.alert.AlertStatus.RESOLVED;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for the alert state machine (decided in M6): OPEN -> ACKNOWLEDGED, OPEN -> RESOLVED,
 * ACKNOWLEDGED -> RESOLVED. RESOLVED is final (no reopening) and staying in the same status is
 * not a transition. Plain JUnit, like ThresholdRuleTest: the rule has no dependencies.
 */
class AlertTransitionsTest {

    @Test
    void openCanBeAcknowledged() {
        assertTrue(AlertTransitions.isAllowed(OPEN, ACKNOWLEDGED));
    }

    @Test
    void openCanBeResolvedDirectly() {
        assertTrue(AlertTransitions.isAllowed(OPEN, RESOLVED));
    }

    @Test
    void acknowledgedCanBeResolved() {
        assertTrue(AlertTransitions.isAllowed(ACKNOWLEDGED, RESOLVED));
    }

    @Test
    void acknowledgedCannotGoBackToOpen() {
        assertFalse(AlertTransitions.isAllowed(ACKNOWLEDGED, OPEN));
    }

    @Test
    void resolvedIsFinal() {
        assertFalse(AlertTransitions.isAllowed(RESOLVED, OPEN));
        assertFalse(AlertTransitions.isAllowed(RESOLVED, ACKNOWLEDGED));
    }

    @Test
    void staying_in_the_same_status_is_not_a_transition() {
        for (AlertStatus status : AlertStatus.values()) {
            assertFalse(AlertTransitions.isAllowed(status, status), status + " -> " + status);
        }
    }

    @Test
    void activeMeansNotResolved() {
        // "Active" alerts are the ones that block a new alert for the same sensor (dedup, step 3).
        assertTrue(AlertTransitions.isActive(OPEN));
        assertTrue(AlertTransitions.isActive(ACKNOWLEDGED));
        assertFalse(AlertTransitions.isActive(RESOLVED));
    }

    @Test
    void nullStatusesAreRejected() {
        assertThrows(NullPointerException.class, () -> AlertTransitions.isAllowed(null, OPEN));
        assertThrows(NullPointerException.class, () -> AlertTransitions.isAllowed(OPEN, null));
        assertThrows(NullPointerException.class, () -> AlertTransitions.isActive(null));
    }
}
