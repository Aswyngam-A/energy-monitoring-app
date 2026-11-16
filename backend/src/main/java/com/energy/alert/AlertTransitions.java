package com.energy.alert;

import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * The alert state machine as a pure rule (no database, no framework), so it is tested with plain
 * JUnit like {@link ThresholdRule}.
 *
 * <pre>
 *   OPEN ---> ACKNOWLEDGED ---> RESOLVED
 *     \______________________/
 * </pre>
 * Decided in M6: RESOLVED is final (a later breach raises a brand-new alert instead of reopening),
 * and "moving" to the status the alert already has is not a transition.
 */
public final class AlertTransitions {

    // For each status, the statuses it may move to. A status missing here (or mapped to an empty
    // set) is a dead end. Keeping the table as data makes the rules easy to read and to change.
    private static final Map<AlertStatus, Set<AlertStatus>> ALLOWED = Map.of(
            AlertStatus.OPEN, Set.of(AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED),
            AlertStatus.ACKNOWLEDGED, Set.of(AlertStatus.RESOLVED),
            AlertStatus.RESOLVED, Set.of());

    private AlertTransitions() {
        // Static helper only; nothing to instantiate.
    }

    /** True if an alert currently in {@code from} may be moved to {@code to}. */
    public static boolean isAllowed(AlertStatus from, AlertStatus to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        return ALLOWED.get(from).contains(to);
    }

    /**
     * True while the alert still needs attention (anything but RESOLVED). Used by the dedup rule:
     * a sensor with an active alert does not get a second one.
     */
    public static boolean isActive(AlertStatus status) {
        Objects.requireNonNull(status, "status");
        return status != AlertStatus.RESOLVED;
    }
}
