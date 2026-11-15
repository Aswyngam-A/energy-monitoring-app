 package com.energy.site;
 import java.math.BigDecimal;

 public record SiteResponse (Long id, String name, BigDecimal threshold) {

 public static SiteResponse from(Site site) {
        return new SiteResponse(site.id, site.name, site.threshold);
    }
 }
