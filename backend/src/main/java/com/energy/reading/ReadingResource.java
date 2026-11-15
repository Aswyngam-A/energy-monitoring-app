package com.energy.reading;

import com.energy.sensor.Sensor;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Duration;
import java.time.Instant;

/**
 * Readings are sent to their sensor: /api/v1/sensors/{sensorId}/readings.
 * Entities never leave this class: requests arrive as ReadingRequest, responses leave as ReadingResponse.
 */
@Path("/sensors/{sensorId}/readings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReadingResource {

    /** Does the actual work of storing a reading and raising an alert; this class only handles HTTP. */
    @Inject
    ReadingService readingService;

    /**
     * How far ahead of the server clock a client timestamp may be. Sensor clocks are never exact,
     * so a small tolerance avoids rejecting honest readings; an hour ahead is a client bug.
     */
    static final Duration MAX_FUTURE = Duration.ofMinutes(5);

    /**
     * POST /sensors/{sensorId}/readings: 404 if the sensor does not exist, 400 if the body is invalid
     * or the timestamp is too far in the future, otherwise save (via ReadingService, which also
     * raises an alert when the value is above the site's threshold) and answer 201 with the reading.
     * There is no Location header: single readings have no URL of their own in this API.
     */
    @POST
    @Transactional
    public Response create(@PathParam("sensorId") Long sensorId, @Valid ReadingRequest request) {
        Sensor sensor = Sensor.findById(sensorId);
        if (sensor == null) {
            throw new NotFoundException("Sensor " + sensorId + " not found");
        }

        // Timestamp rule (decided in M4): optional, defaults to server time, old values are fine,
        // values more than MAX_FUTURE ahead are rejected.
        Instant now = Instant.now();
        Instant timestamp = request.timestamp() != null ? request.timestamp() : now;
        if (timestamp.isAfter(now.plus(MAX_FUTURE))) {
            // BadRequestException is a WebApplicationException, so ErrorMapper gives it our error body.
            throw new BadRequestException("timestamp must not be more than "
                + MAX_FUTURE.toMinutes() + " minutes in the future");
        }

        Reading reading = readingService.ingest(sensor, request.value(), timestamp);

        return Response.status(Response.Status.CREATED)
            .entity(ReadingResponse.from(reading))
            .build();
    }
}
