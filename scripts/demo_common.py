"""
Shared model of the demo factory, used by seed_demo.py (history) and simulate_readings.py (live).
Standard library only. Nothing here talks to the network except the small Api helper.
"""
import json
import math
import random
import re
import urllib.request
from datetime import datetime, timedelta, timezone


class Api:
    """Minimal JSON client for the EnergyWatch REST API (base = e.g. http://localhost:3000)."""

    def __init__(self, base):
        self.base = base.rstrip("/") + "/api/v1"

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, method=method, data=data,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.loads(response.read() or "null")


# site name, threshold kW, [(sensor, type, typical kW, 24h-shape, spike)]
# shape: "day" = busier in daytime, "flat" = round the clock, "cycle" = on/off batches
# spike = (hours_ago, kW) -> one reading above the site's threshold (raises an alert)
SITES = [
 ("Basel Tablet Production Plant", 220, [
   ("Tablet press line A", "power", 110, "day", None), ("Tablet press line B", "power", 105, "day", None),
   ("Granulation and drying", "power", 140, "day", (3, 236)), ("Coating drum", "power", 70, "day", None)]),
 ("Vaccine Cold Chain Warehouse", 90, [
   ("Cold room -20C", "power", 55, "flat", None), ("Cold room 2-8C", "power", 40, "flat", None),
   ("Refrigeration compressors", "power", 65, "flat", (5, 97)), ("Backup generator charger", "power", 8, "flat", None)]),
 ("Sterile Fill-Finish Cleanroom", 130, [
   ("Vial filling line", "power", 70, "day", None), ("Autoclave sterilizer", "power", 60, "cycle", None),
   ("Cleanroom air handling", "hvac", 60, "flat", None), ("Lyophilizer", "power", 85, "cycle", None)]),
 ("Quality Control Laboratory", 45, [
   ("HPLC instruments", "power", 12, "day", None), ("Fume hoods", "hvac", 10, "day", None),
   ("Stability chambers", "power", 16, "flat", (9, 51)), ("Laboratory HVAC", "hvac", 14, "flat", None)]),
 ("Packaging and Serialisation Hall", 80, [
   ("Blister line", "power", 30, "day", None), ("Cartoning and labelling", "power", 22, "day", None),
   ("Serialisation printers", "power", 8, "day", None), ("Conveyors", "power", 10, "day", None)]),
 ("Utilities Plant - Water and Steam", 180, [
   ("Purified water loop pumps", "power", 35, "flat", None), ("Clean steam boiler", "power", 120, "day", (2, 191)),
   ("Air compressors", "power", 55, "flat", None)]),
 ("R&D Pilot Plant", 60, [
   ("Pilot reactor", "power", 25, "day", None), ("Pilot spray dryer", "power", 30, "cycle", None),
   ("Laboratory freezers", "power", 6, "flat", None)]),
 ("Head Office - Zurich", 35, [
   ("Office floors lighting", "power", 12, "day", None), ("Server room", "power", 8, "flat", None),
   ("Office HVAC", "hvac", 14, "day", None)]),
]



def reading_value(typical, shape, t, threshold):
    """A believable normal reading (kW) for a sensor at time t (UTC); always below the site's limit."""
    hour = t.hour + t.minute / 60
    day = max(0.0, math.sin((hour - 6) / 12 * math.pi))  # 0 at night, 1 around noon (UTC)
    if shape == "day":
        f = 0.55 + 0.45 * day
    elif shape == "cycle":
        f = 1.0 if (int(hour * 2) % 5) < 2 else 0.35  # batch on/off pattern
    else:
        f = 0.93 + 0.07 * math.sin(hour / 24 * 2 * math.pi)
    v = typical * f * random.uniform(0.95, 1.05)
    return round(min(v, threshold * 0.9), 3)  # normal operation stays below the site's threshold


def spike_value(threshold):
    """A reading that crosses the limit by 3-15 %: this is what makes the app raise an alert."""
    return round(threshold * random.uniform(1.03, 1.15), 3)


# How long a simulated operator lets an alert wait. Long enough that a visitor can click
# Acknowledge / Resolve themselves first; short enough that alerts do not pile up forever.
ACK_AFTER = timedelta(minutes=10)
RESOLVE_AFTER = timedelta(minutes=20)


def parse_instant(text):
    """Reads an ISO-8601 UTC instant as the API sends it ("...:33Z", "...:33.429014Z", up to nanoseconds)."""
    # Python reads at most microseconds (6 digits), so longer fractions are cut.
    text = re.sub(r"(\.\d{6})\d+", r"\1", text)
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def next_status(alert, now):
    """The status the simulated operator moves this alert to, or None to leave it alone."""
    age = now - parse_instant(alert["createdAt"])
    if alert["status"] == "OPEN" and age >= ACK_AFTER:
        return "ACKNOWLEDGED"
    if alert["status"] == "ACKNOWLEDGED" and age >= RESOLVE_AFTER:
        return "RESOLVED"
    return None
