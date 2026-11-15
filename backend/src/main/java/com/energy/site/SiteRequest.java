package com.energy.site;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Body of POST/PUT /sites. Constraints are checked when the resource parameter is @Valid. */
public record SiteRequest(
    @NotBlank String name,
    @NotNull @Positive BigDecimal threshold
) {}
