package com.energy.common;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import java.util.List;

public class ErrorMapper {

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

    @ServerExceptionMapper
    public Response mapValidation(ConstraintViolationException ex) {
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
