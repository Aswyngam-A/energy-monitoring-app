package com.energy.dashboard;

import java.math.BigDecimal;
import java.util.List;

/**
 * One line of the dashboard: a site, its power threshold (kW), its latest reading (null while it
 * has none), how many of its alerts are OPEN (the same count the nav badge shows, split per site),
 * and a small trend for the tile's sparkline.
 *
 * `trend` is the site's PEAK value at each of its most recent measurement times (at most 24,
 * oldest first, empty without readings). Peak, not average: an alert is raised when any single
 * reading passes the threshold, so the highest value per instant is the one that matters and is
 * directly comparable with `threshold`.
 */
public record SiteSummary(Long siteId, String siteName, BigDecimal threshold,
                          LatestReading latestReading, long openAlerts, List<BigDecimal> trend) {}
