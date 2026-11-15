-- First migration: the site table.
-- Flyway runs this once, at startup, and records it. Never edit it after it has run on a real
-- database: add a V2__... file instead.

-- Hibernate asks this sequence for ids. INCREMENT BY 50 must match Hibernate's allocation size
-- (it takes one value and hands out the next 50 ids from memory).
-- The id column has no DEFAULT on purpose: only Hibernate generates ids.
CREATE SEQUENCE site_seq INCREMENT BY 50 START WITH 1;

CREATE TABLE site (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    threshold NUMERIC(12,2) NOT NULL  -- up to 10 digits before the decimal point, 2 after
);
