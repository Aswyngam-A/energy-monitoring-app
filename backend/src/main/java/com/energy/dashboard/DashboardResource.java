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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only overview for the dashboard, served under /api/v1/dashboard.
 * Built from a fixed number of queries, however many sites exist: one page of sites (plus a COUNT
 * for the total), then the OPEN-alert counts and the latest readings of the sites on that page,
 * each in a single query (plus one more for the sparkline trends). Asking "latest reading?" and "how many alerts?" once per site would be
 * the N+1 problem.
 */
@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    /** How many measurement times the sparkline of a tile covers. */
    private static final int TREND_POINTS = 24;

    /**
     * GET /dashboard/overview: system-wide totals (see Overview). Three small queries: two counts,
     * and one that picks each sensor's newest reading with DISTINCT ON (a PostgreSQL feature: the
     * first row per sensor in the given order, here newest first, id breaking ties) and adds them up.
     */
    @GET
    @Path("/overview")
    public Overview overview() {
        long sites = Site.count();
        long openAlerts = Alert.count("status", AlertStatus.OPEN);

        Object[] row = (Object[]) Reading.getEntityManager().createNativeQuery(
                """
                select coalesce(sum(value), 0.000), max(recorded_at) from (
                  select distinct on (sensor_id) value, recorded_at
                  from reading
                  order by sensor_id, recorded_at desc, id desc) latest
                """)
            .getSingleResult();
        // A native query returns the raw JDBC types: NUMERIC -> BigDecimal, TIMESTAMPTZ -> Instant
        // (Hibernate 6) or java.sql.Timestamp; convert defensively.
        BigDecimal totalKw = (BigDecimal) row[0];
        Instant lastReadingAt = row[1] == null ? null
            : row[1] instanceof java.sql.Timestamp ts ? ts.toInstant()
            : row[1] instanceof java.time.OffsetDateTime odt ? odt.toInstant()
            : (Instant) row[1];
        return new Overview(sites, openAlerts, totalKw, lastReadingAt);
    }

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

        // Query 3: the trend. Per site and measurement time the highest value, numbered from the
        // newest (row_number over a partition per site), keeping the TREND_POINTS newest. Plain SQL
        // because the numbering needs a window function. Rows come oldest first within each site.
        Map<Long, List<BigDecimal>> trends = new HashMap<>();
        @SuppressWarnings("unchecked")
        List<Object[]> trendRows = Reading.getEntityManager().createNativeQuery(
                """
                select site_id, peak from (
                  select se.site_id as site_id, max(r.value) as peak, r.recorded_at as at,
                         row_number() over (partition by se.site_id order by r.recorded_at desc) as rn
                  from reading r join sensor se on se.id = r.sensor_id
                  where se.site_id in (:ids)
                  group by se.site_id, r.recorded_at) t
                where rn <= :points
                order by site_id, at
                """)
            .setParameter("ids", siteIds)
            .setParameter("points", TREND_POINTS)
            .getResultList();
        for (Object[] row : trendRows) {
            trends.computeIfAbsent(((Number) row[0]).longValue(), id -> new ArrayList<>())
                .add((BigDecimal) row[1]);
        }

        List<SiteSummary> items = sites.stream()
            .map(site -> new SiteSummary(
                site.id,
                site.name,
                site.threshold,
                latest.get(site.id),            // null when the site has no readings
                openAlerts.getOrDefault(site.id, 0L),
                trends.getOrDefault(site.id, List.of())))
            .toList();
        return new PageResponse<>(items, paging.page(), paging.size(), total);
    }
}
