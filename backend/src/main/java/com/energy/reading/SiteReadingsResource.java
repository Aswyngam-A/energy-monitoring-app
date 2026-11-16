package com.energy.reading;

import com.energy.common.PageParams;
import com.energy.common.PageResponse;
import com.energy.site.Site;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Reading of a whole site (all of its sensors), /api/v1/sites/{siteId}/readings.
 * Kept apart from ReadingResource because that class is rooted at a sensor, not a site.
 */
@Path("/sites/{siteId}/readings")
@Produces(MediaType.APPLICATION_JSON)
public class SiteReadingsResource {

    /**
     * GET /sites/{siteId}/readings?from=&to=&page=&size=: one page of the readings of every sensor
     * of the site, newest first.
     * `from` and `to` are optional ISO-8601 instants (e.g. 2024-05-01T10:00:00Z); both ends are
     * inclusive. 404 if the site is unknown, 400 if a date is malformed or `from` is after `to`.
     *
     * The query parameters are read as plain strings and parsed here so that a bad value gives
     * our own clear 400 instead of depending on how the framework reacts to a failed conversion.
     */
    @GET
    public PageResponse<ReadingResponse> list(@PathParam("siteId") Long siteId,
                                              @QueryParam("from") String from,
                                              @QueryParam("to") String to,
                                              @QueryParam("page") String pageText,
                                              @QueryParam("size") String sizeText) {
        if (Site.findById(siteId) == null) {
            throw new NotFoundException("Site " + siteId + " not found");
        }

        PageParams paging = PageParams.parse(pageText, sizeText);
        Instant fromInstant = parseInstant("from", from);
        Instant toInstant = parseInstant("to", to);
        if (fromInstant != null && toInstant != null && fromInstant.isAfter(toInstant)) {
            throw new BadRequestException("from must not be after to");
        }

        // Build the query from the filters that were given. Optional filters are added to the text
        // only when present, because "(:from is null or ...)" fails on PostgreSQL, which cannot
        // work out the type of a null parameter.
        StringBuilder hql = new StringBuilder(
            // "join fetch" loads each reading's sensor in the same SQL query, so mapping to
            // ReadingResponse (which reads sensor.name) does not trigger one extra query per row.
            "select r from Reading r join fetch r.sensor s where s.site.id = :siteId");
        Map<String, Object> params = new HashMap<>();
        params.put("siteId", siteId);
        if (fromInstant != null) {
            hql.append(" and r.timestamp >= :from");
            params.put("from", fromInstant);
        }
        if (toInstant != null) {
            hql.append(" and r.timestamp <= :to");
            params.put("to", toInstant);
        }
        // id breaks ties between readings with the same timestamp, so page boundaries are stable.
        hql.append(" order by r.timestamp desc, r.id desc");

        PanacheQuery<Reading> query = Reading.find(hql.toString(), params);
        List<ReadingResponse> items = query.page(Page.of(paging.page(), paging.size()))
            .list().stream().map(ReadingResponse::from).toList();
        // Panache derives the COUNT from the same query (dropping the join fetch and the order),
        // so the total respects the site and the date range.
        return new PageResponse<>(items, paging.page(), paging.size(), query.count());
    }

    /** Parses an optional ISO-8601 instant; null stays null, garbage becomes a 400 naming the parameter. */
    private static Instant parseInstant(String name, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new BadRequestException(name + " must be an ISO-8601 instant, e.g. 2024-05-01T10:00:00Z");
        }
    }
}
