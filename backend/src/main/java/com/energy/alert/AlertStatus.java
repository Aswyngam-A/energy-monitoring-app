package com.energy.alert;

/**
 * Where an alert is in its life: OPEN (just raised), ACKNOWLEDGED (someone has seen it and is
 * dealing with it) and RESOLVED (finished). Which moves between them are allowed is decided by
 * {@link AlertTransitions}. The column stores the enum's name as text with no CHECK constraint,
 * so adding ACKNOWLEDGED and RESOLVED needed no database migration.
 */
public enum AlertStatus {
    OPEN,
    ACKNOWLEDGED,
    RESOLVED
}
