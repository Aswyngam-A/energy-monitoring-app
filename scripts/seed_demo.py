#!/usr/bin/env python3
"""
Demo data for EnergyWatch: a made-up pharmaceutical manufacturer ("a medicines factory").

What it creates, through the public REST API only (no direct database access, so every rule of
the app runs: validation, alert raising, status changes):
  - 8 sites (tablet plant, vaccine cold chain, cleanroom, QC lab, packaging, utilities, R&D, office),
    each with its own power threshold in kW;
  - 29 sensors across them;
  - 24 hours of readings per sensor, one every 30 minutes (UTC, ending now), with a day/night rhythm;
  - a few over-threshold readings, which makes the app raise real alerts; some of those alerts are
    then acknowledged / resolved so the alerts page shows every status.

Usage (the stack must be running, e.g. `docker compose up -d`):
    python3 scripts/seed_demo.py                       # against http://localhost:3000
    python3 scripts/seed_demo.py http://localhost:3100 # another base URL

Safe to re-run: a site whose name already exists is skipped, and the random numbers use a fixed
seed, so the data is the same every time. It only needs Python 3 (standard library).
"""
import sys
import json, math, random, urllib.request
from datetime import datetime, timedelta, timezone

# The app is reached through nginx (port 3000), which forwards /api to the backend.
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/") + "/api/v1"
random.seed(42)  # same data every run

def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or "null")

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

existing = {s["name"] for s in call("GET", "/sites?size=100")["items"]}
now = datetime.now(timezone.utc).replace(second=0, microsecond=0)

def value(typical, shape, t, thr):
    hour = t.hour + t.minute / 60
    day = max(0.0, math.sin((hour - 6) / 12 * math.pi))  # 0 at night, 1 around noon (UTC)
    if shape == "day":   f = 0.55 + 0.45 * day
    elif shape == "cycle": f = 1.0 if (int(hour * 2) % 5) < 2 else 0.35  # batch on/off pattern
    else:                f = 0.93 + 0.07 * math.sin(hour / 24 * 2 * math.pi)
    v = typical * f * random.uniform(0.95, 1.05)
    return round(min(v, thr * 0.9), 3)  # normal operation stays below the site's threshold

created = 0
for name, thr, sensors in SITES:
    if name in existing:
        print("skip (exists):", name); continue
    site = call("POST", "/sites", {"name": name, "threshold": thr})
    for sname, stype, typical, shape, spike in sensors:
        sensor = call("POST", f"/sites/{site['id']}/sensors", {"name": sname, "type": stype})
        for step in range(48, -1, -1):          # every 30 minutes for the last 24 hours, oldest first
            t = now - timedelta(minutes=30 * step)
            v = value(typical, shape, t, thr)
            if spike and step == spike[0] * 2:
                v = spike[1]
            call("POST", f"/sensors/{sensor['id']}/readings", {"value": v, "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ")})
    created += 1
    print("created:", name)

# Give the alerts a realistic lifecycle: some handled, some still waiting.
alerts = call("GET", "/alerts?size=100")["items"]
fate = {"Vaccine Cold Chain Warehouse": ["ACKNOWLEDGED"],
        "Quality Control Laboratory": ["ACKNOWLEDGED", "RESOLVED"]}
for a in alerts:
    if a["status"] == "OPEN" and a["siteName"] in fate:
        for st in fate[a["siteName"]]:
            call("PATCH", f"/alerts/{a['id']}", {"status": st})
print("sites created:", created)
