package com.energy.dashboard;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * The few numbers of the whole system shown on the home page: how many sites exist, how many
 * alerts are OPEN, the load right now (kW: the newest reading of every sensor, added up) and when
 * the newest measurement was taken (null while there are no readings at all).
 */
public record Overview(long sites, long openAlerts, BigDecimal totalKw, Instant lastReadingAt) {}
