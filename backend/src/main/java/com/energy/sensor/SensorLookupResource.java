package com.energy.sensor;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * A sensor's own URL, /api/v1/sensors/{id}. Kept apart from SensorResource because a JAX-RS class
 * has one root @Path, and that one is nested under a site (/sites/{siteId}/sensors).
 * This is also where POST's Location header points.
 */
@Path("/sensors")
@Produces(MediaType.APPLICATION_JSON)
public class SensorLookupResource {

    /** GET /sensors/{id}: one sensor, or 404 (turned into our error body by ErrorMapper). */
    @GET
    @Path("/{id}")
    public SensorResponse get(@PathParam("id") Long id) {
        Sensor sensor = Sensor.findById(id);
        if (sensor == null) {
            throw new NotFoundException("Sensor " + id + " not found");
        }
        return SensorResponse.from(sensor);
    }
}
