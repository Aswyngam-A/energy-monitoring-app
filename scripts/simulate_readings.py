#!/usr/bin/env python3
"""
Keeps the EnergyWatch demo alive: every 30 seconds each sensor of the demo factory sends a fresh
reading, now and then one crosses its site's limit (so a real alert appears), and a simulated
operator acknowledges and resolves old alerts so they do not pile up. Everything goes through the
public REST API, like a real sensor or user would.

Usage (after seed_demo.py has created the sites):
    python3 scripts/simulate_readings.py                       # forever, http://localhost:3000
    python3 scripts/simulate_readings.py http://localhost:3000 --once      # one round, then exit
    python3 scripts/simulate_readings.py http://web --interval 10          # faster rounds
or with Docker:  docker compose --profile demo up -d      (service "simulator", see docker-compose.yml)

Stop with Ctrl+C (or `docker compose --profile demo stop simulator`). Standard library only.
"""
import argparse
import random
import time
import urllib.error
from datetime import datetime, timezone

from demo_common import SITES, Api, next_status, reading_value, spike_value

# Chance that a given sensor spikes in a given round: with 29 sensors and 30 s rounds, about one
# new alert every 17 minutes.
SPIKE_CHANCE = 0.001


def sensor_ids(api):
    """Maps (site name, sensor name) -> sensor id for the demo factory, read from the API."""
    wanted = {name: (thr, sensors) for name, thr, sensors in SITES}
    found = {}
    for site in api.call("GET", "/sites?size=100")["items"]:
        if site["name"] not in wanted:
            continue
        for sensor in api.call("GET", f"/sites/{site['id']}/sensors"):
            found[(site["name"], sensor["name"])] = sensor["id"]
    return found


def one_round(api, ids):
    """Sends one reading per sensor and lets the operator handle old alerts. Returns (readings, alerts handled)."""
    now = datetime.now(timezone.utc)
    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    sent = 0
    for name, threshold, sensors in SITES:
        for sensor_name, _type, typical, shape, _spike in sensors:
            sensor_id = ids.get((name, sensor_name))
            if sensor_id is None:
                continue
            value = spike_value(threshold) if random.random() < SPIKE_CHANCE else reading_value(typical, shape, now, threshold)
            api.call("POST", f"/sensors/{sensor_id}/readings", {"value": value, "timestamp": stamp})
            sent += 1

    handled = 0
    for alert in api.call("GET", "/alerts?size=100")["items"]:
        status = next_status(alert, now)
        if status:
            api.call("PATCH", f"/alerts/{alert['id']}", {"status": status})
            handled += 1
    return sent, handled


def main():
    parser = argparse.ArgumentParser(description="Keep the EnergyWatch demo alive.")
    parser.add_argument("base", nargs="?", default="http://localhost:3000", help="app base URL")
    parser.add_argument("--interval", type=float, default=30, help="seconds between rounds (default 30)")
    parser.add_argument("--once", action="store_true", help="run a single round and exit")
    args = parser.parse_args()

    api = Api(args.base)
    ids = {}
    while True:
        try:
            if not ids:  # first round, or the sites did not exist yet
                ids = sensor_ids(api)
                if not ids:
                    print("no demo sites found: run scripts/seed_demo.py first", flush=True)
            if ids:
                sent, handled = one_round(api, ids)
                print(f"{datetime.now(timezone.utc):%H:%M:%S} sent {sent} readings, handled {handled} alerts", flush=True)
        except (urllib.error.URLError, OSError) as error:
            # The app may be starting or restarting: report and try again next round.
            print("waiting for the app:", error, flush=True)
        if args.once:
            return
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
