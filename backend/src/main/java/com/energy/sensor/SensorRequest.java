package com.energy.sensor;

import jakarta.validation.constraints.NotBlank;

/**
 * Body of POST /sites/{siteId}/sensors. The site comes from the URL, not the body,
 * so a client cannot attach a sensor to a different site than the one it posted to.
 * `type` has no constraint: it is optional and may be null.
 */
public record SensorRequest(
    @NotBlank String name,
    String type
) {}
