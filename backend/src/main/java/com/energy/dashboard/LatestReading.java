package com.energy.dashboard;

import java.math.BigDecimal;
import java.time.Instant;

/** The most recent measurement of a site: its value (kW) and when it was taken (ISO-8601 UTC). */
public record LatestReading(BigDecimal value, Instant timestamp) {}
