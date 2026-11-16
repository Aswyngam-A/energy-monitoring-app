package com.energy.alert;

import jakarta.validation.constraints.NotNull;

/**
 * Body of PATCH /alerts/{id}: the status the alert should move to. A name that is not an
 * AlertStatus (e.g. "EXPLODED") is rejected while the JSON is read (400), and a missing
 * status is rejected by @NotNull (400); whether the move itself is allowed is decided later by
 * AlertTransitions.
 */
public record AlertStatusRequest(@NotNull AlertStatus status) {}
