package com.energy.common;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import java.util.List;

/**
 * Turns exceptions into the API's single error format ({@link ErrorResponse}),
 * so clients always receive the same JSON shape whatever went wrong.
 */
public class ErrorMapper {

    /** Any WebApplicationException (e.g. NotFoundException -> 404) keeps its status; the body gets our shape. */
    @ServerExceptionMapper
    public Response map(WebApplicationException ex) {
        Response original = ex.getResponse();
        ErrorResponse body = new ErrorResponse(
            original.getStatus(),
            original.getStatusInfo().getReasonPhrase(),
            ex.getMessage(),
            List.of()
        );
        return Response.status(original.getStatus())
            .entity(body)
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    /**
     * Bean Validation failures (@Valid on a request body) -> 400 with one entry per violated
     * rule in `details`, e.g. "threshold: must be greater than 0".
     */
    @ServerExceptionMapper
    public Response mapValidation(ConstraintViolationException ex) {
        // One readable line per violation: "<field>: <message>".
        List<String> details = ex.getConstraintViolations().stream()
            .map(v -> fieldName(v) + ": " + v.getMessage())
            .toList();

        ErrorResponse body = new ErrorResponse(400, "Bad Request", "Validation failed", details);
        return Response.status(400)
            .entity(body)
            .type(MediaType.APPLICATION_JSON)
            .build();
    }

    // "create.request.threshold" -> "threshold" (drops the Java method and parameter names)
    private static String fieldName(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath().toString();
        return path.substring(path.lastIndexOf('.') + 1);
    }
}
