-- V2: sensors that belong to a site.
-- Same id strategy as V1: Hibernate takes ids from `<table>_seq` in blocks of 50,
-- so the sequence must INCREMENT BY 50 and the column has no DEFAULT.
CREATE SEQUENCE sensor_seq INCREMENT BY 50 START WITH 1;

CREATE TABLE sensor (
    id      BIGINT PRIMARY KEY,
    name    TEXT   NOT NULL,
    -- Free-text kind of sensor (e.g. 'power', 'temperature'); optional, so nullable.
    type    TEXT,
    -- Foreign key: every sensor belongs to exactly one site, and the database enforces it
    -- (a sensor cannot point at a missing site; a site with sensors cannot be deleted).
    site_id BIGINT NOT NULL REFERENCES site (id)
);

-- Listing the sensors of a site filters on site_id; Postgres does not index foreign keys by itself.
CREATE INDEX idx_sensor_site_id ON sensor (site_id);
