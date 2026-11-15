-- V4: alerts raised when a reading is above its site's threshold.
-- Same id strategy as V1-V3: Hibernate takes ids from `<table>_seq` in blocks of 50,
-- so the sequence must INCREMENT BY 50 and the column has no DEFAULT.
CREATE SEQUENCE alert_seq INCREMENT BY 50 START WITH 1;

CREATE TABLE alert (
    id         BIGINT PRIMARY KEY,
    -- The three foreign keys. site_id could be derived through sensor, but keeping it here makes
    -- "alerts of a site" a direct lookup, and the API exposes siteId, sensorId and readingId.
    site_id    BIGINT         NOT NULL REFERENCES site (id),
    sensor_id  BIGINT         NOT NULL REFERENCES sensor (id),
    reading_id BIGINT         NOT NULL REFERENCES reading (id),
    -- A snapshot of what was compared when the alert was raised. The site's threshold can be
    -- edited later; the alert must keep saying what was exceeded at the time.
    -- Same precision as reading.value (12,3) and site.threshold (12,2).
    value      NUMERIC(12, 3) NOT NULL,
    threshold  NUMERIC(12, 2) NOT NULL,
    -- Server time when the alert was raised (not the reading's own timestamp).
    created_at TIMESTAMPTZ    NOT NULL,
    -- Stored as the enum's name ('OPEN'). Plain TEXT with no CHECK constraint on purpose: a later
    -- milestone adds statuses (ACKNOWLEDGED, RESOLVED) without needing a migration.
    status     TEXT           NOT NULL
);

-- The alerts list is filtered by site and shown newest first.
CREATE INDEX idx_alert_site_created_at ON alert (site_id, created_at);
-- Foreign keys are not indexed automatically in PostgreSQL. This one lets "delete or look up a
-- reading's alert" avoid scanning the whole table.
CREATE INDEX idx_alert_reading_id ON alert (reading_id);
