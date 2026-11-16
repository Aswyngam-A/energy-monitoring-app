-- V5: the database enforces "at most one active alert per sensor" (M6 rule, hardened in M7).
-- Active = OPEN or ACKNOWLEDGED; RESOLVED alerts are history and may be any number.
--
-- Why in the database too: AlertService checks the rule before inserting, but "check, then insert"
-- is not atomic, so two requests arriving together could both pass the check. A constraint is the
-- only guarantee that holds whatever the application does.

-- Data fix first, so the index can be created on a database that already holds duplicates (the
-- rule only exists since M6): for every sensor keep its newest active alert and mark the older
-- active ones RESOLVED. A no-op on a database that has no duplicates.
UPDATE alert
SET status = 'RESOLVED'
WHERE status IN ('OPEN', 'ACKNOWLEDGED')
  AND EXISTS (
      SELECT 1
      FROM alert newer
      WHERE newer.sensor_id = alert.sensor_id
        AND newer.status IN ('OPEN', 'ACKNOWLEDGED')
        AND (newer.created_at > alert.created_at
             OR (newer.created_at = alert.created_at AND newer.id > alert.id))
  );

-- A partial unique index: only rows matching the WHERE are indexed, so uniqueness applies to
-- active alerts only. Keep the status list in sync with AlertTransitions.isActive.
CREATE UNIQUE INDEX uq_alert_one_active_per_sensor
    ON alert (sensor_id)
    WHERE status IN ('OPEN', 'ACKNOWLEDGED');
