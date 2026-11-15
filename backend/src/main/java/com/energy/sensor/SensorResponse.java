package com.energy.sensor;

/**
 * What the API returns for a sensor. Exposes only the owning site's id (not the Site entity),
 * which also avoids touching the lazy relationship's other fields.
 */
public record SensorResponse(Long id, String name, String type, Long siteId) {

    /** Copies an entity into its response form. Call it while the transaction is still open. */
    public static SensorResponse from(Sensor sensor) {
        // Reading only the id of a LAZY relation does not trigger a database query.
        return new SensorResponse(sensor.id, sensor.name, sensor.type, sensor.site.id);
    }
}
