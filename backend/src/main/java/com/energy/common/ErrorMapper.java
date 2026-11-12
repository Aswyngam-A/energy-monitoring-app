package com.energy.common;
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
}
