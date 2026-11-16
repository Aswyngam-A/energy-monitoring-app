package com.energy.dashboard;

import com.energy.alert.Alert;
import com.energy.alert.AlertStatus;
import com.energy.reading.Reading;
import com.energy.site.Site;
import io.quarkus.panache.common.Sort;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only overview for the dashboard, served under /api/v1/dashboard.
 * Built from three queries in total, however many sites exist: the sites, the OPEN-alert counts
 * of all sites at once, and the latest reading of all sites at once. Asking "latest reading?" and
 * "how many alerts?" once per site would be the N+1 problem.
 */
@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    /**
     * GET /dashboard/summary: one entry per site, ordered by name, with the latest reading
     * (by measurement time, over all the site's sensors; null if none) and the OPEN-alert count.
     * Not paginated: it is a compact overview with one small line per site.
     */
    @GET
    @Path("/summary")
    public List<SiteSummary> summary() {
        List<Site> sites = Site.listAll(Sort.ascending("name", "id"));

        // Aggregate query 1: GROUP BY site, one row per site that has at least one OPEN alert.
        // Sites missing from this map have none (count 0).
        Map<Long, Long> openAlerts = new HashMap<>();
        List<Object[]> countRows = Alert.getEntityManager().createQuery(
                "select a.site.id, count(a) from Alert a where a.status = :open group by a.site.id",
                Object[].class)
            .setParameter("open", AlertStatus.OPEN)
            .getResultList();
        for (Object[] row : countRows) {
            openAlerts.put((Long) row[0], (Long) row[1]);
        }

        // Query 2: every reading that is the newest of its site. The subquery finds each site's
        // maximum timestamp; the outer query keeps the readings at that instant. Two readings at
        // exactly the same instant would both match, so rows come highest id first and the first
        // one seen per site wins (putIfAbsent).
        Map<Long, LatestReading> latest = new HashMap<>();
        List<Object[]> latestRows = Reading.getEntityManager().createQuery(
                """
                select se.site.id, r.value, r.timestamp
                from Reading r join r.sensor se
                where r.timestamp = (
                    select max(r2.timestamp) from Reading r2 join r2.sensor se2
                    where se2.site.id = se.site.id)
                order by r.id desc
                """,
                Object[].class)
            .getResultList();
        for (Object[] row : latestRows) {
            latest.putIfAbsent((Long) row[0],
                new LatestReading((BigDecimal) row[1], (Instant) row[2]));
        }

        return sites.stream()
            .map(site -> new SiteSummary(
                site.id,
                site.name,
                latest.get(site.id),            // null when the site has no readings
                openAlerts.getOrDefault(site.id, 0L)))
            .toList();
    }
}
