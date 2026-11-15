package com.energy.alert;

/**
 * Where an alert is in its life. For now there is only OPEN (just raised). A later milestone
 * adds ACKNOWLEDGED and RESOLVED; because the column stores the enum's name as text, adding
 * values here needs no database migration.
 */
public enum AlertStatus {
    OPEN
}
