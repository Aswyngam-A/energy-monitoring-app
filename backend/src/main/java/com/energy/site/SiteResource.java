package com.energy.site;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.validation.Valid;

import java.net.URI;

@Path("/sites")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SiteResource {

    @POST
    @Transactional
    public Response create(@Valid SiteRequest request, @Context UriInfo uriInfo) {
        Site site = new Site();
        site.name = request.name();
        site.threshold = request.threshold();
        site.persist();

        URI location = uriInfo.getAbsolutePathBuilder()
            .path(String.valueOf(site.id))
            .build();

        return Response.created(location)
            .entity(SiteResponse.from(site))
            .build();
    }
}
