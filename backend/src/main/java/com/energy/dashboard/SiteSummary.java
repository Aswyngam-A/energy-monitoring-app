package com.energy.dashboard;

/**
 * One line of the dashboard: a site, its latest reading (null while it has none) and how many of
 * its alerts are OPEN (the same count the nav badge shows, split per site).
 */
public record SiteSummary(Long siteId, String siteName, LatestReading latestReading, long openAlerts) {}
