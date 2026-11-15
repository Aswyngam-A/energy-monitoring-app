-- V3: readings sent by sensors.
-- Same id strategy as V1/V2: Hibernate takes ids from `<table>_seq` in blocks of 50,
-- so the sequence must INCREMENT BY 50 and the column has no DEFAULT.
CREATE SEQUENCE reading_seq INCREMENT BY 50 START WITH 1;

CREATE TABLE reading (
    id          BIGINT PRIMARY KEY,
    -- Measured value in kW (the unit is a convention of the API, not stored per row).
    -- NUMERIC(12,3): exact decimals, up to 999,999,999.999. The API rejects negatives.
    value       NUMERIC(12, 3) NOT NULL,
    -- When the measurement was taken. TIMESTAMPTZ stores an absolute instant (UTC internally),
    -- which maps to java.time.Instant. Named recorded_at because "timestamp" is also an SQL type name.
    recorded_at TIMESTAMPTZ    NOT NULL,
    -- Foreign key: every reading belongs to exactly one sensor, enforced by the database.
    sensor_id   BIGINT         NOT NULL REFERENCES sensor (id)
);

-- The main query is "readings of a sensor (or of all sensors of a site) in a time range".
-- A composite index on (sensor_id, recorded_at) lets Postgres jump to one sensor's rows
-- and read them already ordered by time, instead of scanning the whole table.
CREATE INDEX idx_reading_sensor_recorded_at ON reading (sensor_id, recorded_at);
