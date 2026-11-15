 package com.energy.site;
 import java.math.BigDecimal;

 /** What the API returns for a site. A separate type from the Site entity, so the table layout stays private. */
public record SiteResponse (Long id, String name, BigDecimal threshold) {

 /** Copies an entity into its response form. */
 public static SiteResponse from(Site site) {
        return new SiteResponse(site.id, site.name, site.threshold);
    }
 }
