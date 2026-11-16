package com.energy.common;

import jakarta.ws.rs.BadRequestException;

/**
 * The ?page=&size= parameters of a list endpoint, already checked.
 * Conventions (decided in M7): page is 0-based, size defaults to 20 and may not exceed 100, so
 * no request can ask for "everything at once". Anything invalid is the client's mistake: 400.
 *
 * The parameters are received as text and parsed here (not declared as Integer in the resource)
 * because JAX-RS answers 404, not 400, when a typed query parameter cannot be converted.
 */
public record PageParams(int page, int size) {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    /** Reads the two optional parameters; absent or blank means the default. */
    public static PageParams parse(String pageText, String sizeText) {
        int page = 0;
        int size = DEFAULT_SIZE;

        if (pageText != null && !pageText.isBlank()) {
            page = toInt(pageText, "page must be a whole number, 0 or more");
            if (page < 0) {
                throw new BadRequestException("page must be a whole number, 0 or more");
            }
        }
        if (sizeText != null && !sizeText.isBlank()) {
            String message = "size must be a whole number between 1 and " + MAX_SIZE;
            size = toInt(sizeText, message);
            if (size < 1 || size > MAX_SIZE) {
                throw new BadRequestException(message);
            }
        }
        return new PageParams(page, size);
    }

    private static int toInt(String text, String message) {
        try {
            return Integer.parseInt(text.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException(message);
        }
    }
}
