package com.energy.site;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.validation.Valid;

import jakarta.ws.rs.NotFoundException;

import java.net.URI;
import java.util.List;

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

    @GET
    public List<SiteResponse> list() {
        return Site.<Site>listAll()
            .stream()
            .map(SiteResponse::from)
            .toList();
    }

    @GET
    @Path("/{id}")
    public SiteResponse get(@PathParam("id") Long id) {
        Site site = Site.findById(id);
        if (site == null) {
            throw new NotFoundException("Site " + id + " not found");
        }
        return SiteResponse.from(site);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public SiteResponse update(@PathParam("id") Long id, @Valid SiteRequest request) {
        Site site = Site.findById(id);
        if (site == null) {
            throw new NotFoundException("Site " + id + " not found");
        }
        site.name = request.name();
        site.threshold = request.threshold();
        return SiteResponse.from(site);
    }
}
