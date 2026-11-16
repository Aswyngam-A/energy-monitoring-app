package com.energy.common;

import java.util.List;

/**
 * What a paginated list endpoint returns: the slice itself plus what a client needs to build
 * page controls. `total` is the number of matching rows over ALL pages (it respects the filters),
 * so the client can compute the number of pages as ceil(total / size).
 * (Named PageResponse to avoid a clash with Panache's own Page class.)
 */
public record PageResponse<T>(List<T> items, int page, int size, long total) {}
