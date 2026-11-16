package com.energy.site;

import com.energy.common.PageParams;
import com.energy.common.PageResponse;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.QueryParam;
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

/**
 * REST endpoints for sites, served under /api/v1/sites.
 * Entities never leave this class: requests arrive as SiteRequest and responses leave as SiteResponse.
 */
@Path("/sites")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SiteResource {

    /** POST /sites: validate, save, answer 201 with a Location header pointing at the new site. */
    @POST
    @Transactional
    public Response create(@Valid SiteRequest request, @Context UriInfo uriInfo) {
        Site site = new Site();
        site.name = request.name();
        site.threshold = request.threshold();
        site.persist();

        // Absolute URL of this request + the new id, e.g. .../api/v1/sites/42
        URI location = uriInfo.getAbsolutePathBuilder()
            .path(String.valueOf(site.id))
            .build();

        return Response.created(location)
            .entity(SiteResponse.from(site))
            .build();
    }

    /**
     * GET /sites?page=&size=: one page of sites, newest first (highest id), mapped from entities to
     * response records. A fixed order is needed for paging: without one, the database may return
     * rows in a different order on each request and pages could overlap or skip rows.
     * Newest first, so a site that was just created is on the first page.
     */
    @GET
    public PageResponse<SiteResponse> list(@QueryParam("page") String pageText,
                                           @QueryParam("size") String sizeText) {
        PageParams paging = PageParams.parse(pageText, sizeText);
        PanacheQuery<Site> query = Site.findAll(Sort.descending("id"));

        List<SiteResponse> items = query.page(Page.of(paging.page(), paging.size()))
            .list().stream().map(SiteResponse::from).toList();
        return new PageResponse<>(items, paging.page(), paging.size(), query.count());
    }

    /** GET /sites/{id}: one site, or 404 (NotFoundException is turned into our error body by ErrorMapper). */
    @GET
    @Path("/{id}")
    public SiteResponse get(@PathParam("id") Long id) {
        Site site = Site.findById(id);
        if (site == null) {
            throw new NotFoundException("Site " + id + " not found");
        }
        return SiteResponse.from(site);
    }

    /**
     * PUT /sites/{id}: replace name and threshold. 404 if the id is unknown, 400 if the body is invalid.
     * No persist() call: the entity is managed inside the transaction, so Hibernate saves the changes at commit.
     */
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
