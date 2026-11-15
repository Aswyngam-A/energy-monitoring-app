package com.energy.common;

/** Body of GET /health, e.g. {"status":"UP"}. */
public record HealthResponse (String status) {}
