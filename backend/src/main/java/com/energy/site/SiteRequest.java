package com.energy.site;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SiteRequest(
    @NotBlank String name,
    @NotNull @Positive BigDecimal threshold
) {}
