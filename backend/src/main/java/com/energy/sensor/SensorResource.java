package com.energy.sensor;

import com.energy.site.Site;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

import java.net.URI;

/**
 * Nested endpoints: sensors live under their site, /api/v1/sites/{siteId}/sensors.
 * Entities never leave this class: requests arrive as SensorRequest, responses leave as SensorResponse.
 */
@Path("/sites/{siteId}/sensors")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SensorResource {

    /**
     * POST /sites/{siteId}/sensors: 404 if the site does not exist, 400 if the body is invalid,
     * otherwise save and answer 201 with a Location header pointing at the new sensor.
     */
    @POST
    @Transactional
    public Response create(@PathParam("siteId") Long siteId,
                           @Valid SensorRequest request,
                           @Context UriInfo uriInfo) {
        Site site = Site.findById(siteId);
        if (site == null) {
            throw new NotFoundException("Site " + siteId + " not found");
        }

        Sensor sensor = new Sensor();
        sensor.name = request.name();
        sensor.type = request.type();
        sensor.site = site;
        sensor.persist();

        // A sensor's canonical URL is /sensors/{id} (not nested), so build it from the base URI.
        URI location = uriInfo.getBaseUriBuilder()
            .path("sensors")
            .path(String.valueOf(sensor.id))
            .build();

        return Response.created(location)
            .entity(SensorResponse.from(sensor))
            .build();
    }
}
