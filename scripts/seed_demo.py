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

To keep the demo moving afterwards, run simulate_readings.py (or the compose "demo" profile).

Usage (the stack must be running, e.g. `docker compose up -d`):
    python3 scripts/seed_demo.py                       # against http://localhost:3000
    python3 scripts/seed_demo.py http://localhost:3100 # another base URL

Safe to re-run: a site whose name already exists is skipped, and the random numbers use a fixed
seed, so the data is the same every time. It only needs Python 3 (standard library).
"""
import random
import sys
from datetime import datetime, timedelta, timezone

from demo_common import SITES, Api, reading_value


def main():
    api = Api(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000")
    random.seed(42)  # same data every run

    existing = {s["name"] for s in api.call("GET", "/sites?size=100")["items"]}
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)

    created = 0
    for name, thr, sensors in SITES:
        if name in existing:
            print("skip (exists):", name)
            continue
        site = api.call("POST", "/sites", {"name": name, "threshold": thr})
        for sname, stype, typical, shape, spike in sensors:
            sensor = api.call("POST", f"/sites/{site['id']}/sensors", {"name": sname, "type": stype})
            for step in range(48, -1, -1):  # every 30 minutes for the last 24 hours, oldest first
                t = now - timedelta(minutes=30 * step)
                v = reading_value(typical, shape, t, thr)
                if spike and step == spike[0] * 2:
                    v = spike[1]
                api.call("POST", f"/sensors/{sensor['id']}/readings",
                         {"value": v, "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ")})
        created += 1
        print("created:", name)

    # Give the alerts a realistic lifecycle: some handled, some still waiting.
    fate = {"Vaccine Cold Chain Warehouse": ["ACKNOWLEDGED"],
            "Quality Control Laboratory": ["ACKNOWLEDGED", "RESOLVED"]}
    for a in api.call("GET", "/alerts?size=100")["items"]:
        if a["status"] == "OPEN" and a["siteName"] in fate:
            for status in fate[a["siteName"]]:
                api.call("PATCH", f"/alerts/{a['id']}", {"status": status})
    print("sites created:", created)


if __name__ == "__main__":
    main()
