package com.energy.common;
import java.util.List;

/**
 * The single error format of the API.
 * status: HTTP code, error: its reason phrase, message: what went wrong,
 * details: extra lines such as one per failed validation rule (empty when there are none).
 */
public record ErrorResponse (int status, String error, String message, List<String> details) {}
