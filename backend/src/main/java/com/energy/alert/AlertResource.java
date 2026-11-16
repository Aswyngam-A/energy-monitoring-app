package com.energy.alert;

import com.energy.site.Site;
import io.quarkus.panache.common.Sort;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

/**
 * REST endpoints for alerts, served under /api/v1/alerts.
 * Entities never leave this class: responses leave as AlertResponse.
 */
@Path("/alerts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AlertResource {

    /**
     * GET /alerts?siteId=: every alert, newest first, or only those of one site when siteId is given.
     * 404 if the site does not exist (so "unknown site" is not confused with "site without alerts",
     * which is an empty list).
     */
    @GET
    public List<AlertResponse> list(@QueryParam("siteId") String siteIdText) {
        // Read as text and parse here: if the parameter were declared as Long, a value like
        // "abc" would make JAX-RS answer 404 (its rule for failed query-parameter conversion),
        // but a malformed input is the client's mistake, so it must be a 400.
        Long siteId = parseSiteId(siteIdText);

        // Newest first; id breaks ties so alerts created at the same instant keep a stable order.
        Sort newestFirst = Sort.descending("createdAt", "id");

        List<Alert> alerts;
        if (siteId == null) {
            alerts = Alert.listAll(newestFirst);
        } else {
            if (Site.findById(siteId) == null) {
                throw new NotFoundException("Site " + siteId + " not found");
            }
            // "site.id" navigates the relation in the query, so the filter runs in the database.
            alerts = Alert.list("site.id", newestFirst, siteId);
        }

        return alerts.stream().map(AlertResponse::from).toList();
    }

    /**
     * PATCH /alerts/{id} with {"status": "..."}: moves the alert to another status.
     * PATCH (not PUT) because only one field is changed, not the whole alert.
     * 404 if the alert does not exist, 400 if the move is not allowed (see AlertTransitions)
     * or the body is invalid. Returns the updated alert.
     */
    @PATCH
    @Path("/{id}")
    @Transactional
    public AlertResponse updateStatus(@PathParam("id") Long id, @Valid AlertStatusRequest request) {
        Alert alert = Alert.findById(id);
        if (alert == null) {
            throw new NotFoundException("Alert " + id + " not found");
        }
        if (!AlertTransitions.isAllowed(alert.status, request.status())) {
            throw new BadRequestException(
                "Cannot change an alert from " + alert.status + " to " + request.status());
        }
        // The entity is managed inside this transaction, so the change is saved on commit.
        alert.status = request.status();
        return AlertResponse.from(alert);
    }

    /** Parses the optional siteId: absent or blank stays null (no filter), garbage becomes a 400. */
    private static Long parseSiteId(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(text.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("siteId must be a number");
        }
    }
}
