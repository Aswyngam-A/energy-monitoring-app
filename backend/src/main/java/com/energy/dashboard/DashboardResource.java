package com.energy.dashboard;

import com.energy.alert.Alert;
import com.energy.alert.AlertStatus;
import com.energy.common.PageParams;
import com.energy.common.PageResponse;
import com.energy.reading.Reading;
import com.energy.site.Site;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only overview for the dashboard, served under /api/v1/dashboard.
 * Built from a fixed number of queries, however many sites exist: one page of sites (plus a COUNT
 * for the total), then the OPEN-alert counts and the latest readings of the sites on that page,
 * each in a single query. Asking "latest reading?" and "how many alerts?" once per site would be
 * the N+1 problem.
 */
@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    /**
     * GET /dashboard/summary?page=&size=: one page of entries, one per site, ordered by name
     * (id breaks ties), each with the latest reading (by measurement time, over all the site's
     * sensors; null if none) and the OPEN-alert count. Paging follows PageParams (400 if invalid).
     */
    @GET
    @Path("/summary")
    public PageResponse<SiteSummary> summary(@QueryParam("page") String pageText,
                                             @QueryParam("size") String sizeText) {
        PageParams paging = PageParams.parse(pageText, sizeText);

        PanacheQuery<Site> query = Site.findAll(Sort.ascending("name", "id"));
        List<Site> sites = query.page(Page.of(paging.page(), paging.size())).list();
        long total = query.count();
        if (sites.isEmpty()) {
            // Nothing on this page (no sites, or a page beyond the end): skip the aggregates.
            return new PageResponse<>(List.of(), paging.page(), paging.size(), total);
        }
        // The aggregates below only look at the sites of this page.
        List<Long> siteIds = sites.stream().map(site -> site.id).toList();

        // Aggregate query 1: GROUP BY site, one row per site that has at least one OPEN alert.
        // Sites missing from this map have none (count 0).
        Map<Long, Long> openAlerts = new HashMap<>();
        List<Object[]> countRows = Alert.getEntityManager().createQuery(
                "select a.site.id, count(a) from Alert a "
                    + "where a.status = :open and a.site.id in :ids group by a.site.id",
                Object[].class)
            .setParameter("open", AlertStatus.OPEN)
            .setParameter("ids", siteIds)
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
                where se.site.id in :ids
                  and r.timestamp = (
                    select max(r2.timestamp) from Reading r2 join r2.sensor se2
                    where se2.site.id = se.site.id)
                order by r.id desc
                """,
                Object[].class)
            .setParameter("ids", siteIds)
            .getResultList();
        for (Object[] row : latestRows) {
            latest.putIfAbsent((Long) row[0],
                new LatestReading((BigDecimal) row[1], (Instant) row[2]));
        }

        List<SiteSummary> items = sites.stream()
            .map(site -> new SiteSummary(
                site.id,
                site.name,
                latest.get(site.id),            // null when the site has no readings
                openAlerts.getOrDefault(site.id, 0L)))
            .toList();
        return new PageResponse<>(items, paging.page(), paging.size(), total);
    }
}
