"""Unit tests for the pure decisions of the demo scripts (no server needed).
Run:  python3 -m unittest discover -s scripts -v     (from the repository root)"""
import random
import unittest
from datetime import datetime, timedelta, timezone

import demo_common as d

NOW = datetime(2026, 11, 17, 12, 0, tzinfo=timezone.utc)


class ReadingValue(unittest.TestCase):
    def test_normal_values_stay_below_the_sites_limit_all_day_for_every_shape(self):
        for shape in ("day", "flat", "cycle"):
            for minute in range(0, 24 * 60, 30):
                t = NOW.replace(hour=0, minute=0) + timedelta(minutes=minute)
                self.assertLess(d.reading_value(110, shape, t, 220), 220, (shape, t))

    def test_daytime_is_busier_than_night_for_a_day_shaped_sensor(self):
        random.seed(1)
        noon = d.reading_value(100, "day", NOW.replace(hour=12), 1000)
        night = d.reading_value(100, "day", NOW.replace(hour=2), 1000)
        self.assertGreater(noon, night)

    def test_a_spike_is_above_the_limit_but_not_absurd(self):
        random.seed(2)
        for _ in range(100):
            v = d.spike_value(90)
            self.assertGreater(v, 90)
            self.assertLess(v, 90 * 1.2)


class OperatorDecision(unittest.TestCase):
    def alert(self, status, minutes_old):
        return {"status": status, "createdAt": (NOW - timedelta(minutes=minutes_old)).strftime("%Y-%m-%dT%H:%M:%SZ")}

    def test_a_fresh_open_alert_is_left_alone_so_a_visitor_can_click_it(self):
        self.assertIsNone(d.next_status(self.alert("OPEN", 3), NOW))

    def test_an_old_open_alert_gets_acknowledged(self):
        self.assertEqual(d.next_status(self.alert("OPEN", 11), NOW), "ACKNOWLEDGED")

    def test_an_old_acknowledged_alert_gets_resolved(self):
        self.assertEqual(d.next_status(self.alert("ACKNOWLEDGED", 21), NOW), "RESOLVED")

    def test_a_recent_acknowledged_alert_waits(self):
        self.assertIsNone(d.next_status(self.alert("ACKNOWLEDGED", 15), NOW))

    def test_a_resolved_alert_is_final(self):
        self.assertIsNone(d.next_status(self.alert("RESOLVED", 999), NOW))


class ParseInstant(unittest.TestCase):
    def test_reads_the_shapes_the_api_sends(self):
        # Whole seconds, milliseconds, microseconds (what PostgreSQL gives) and nanoseconds (Java's max).
        for text in ("2026-11-16T20:58:33Z", "2026-11-16T20:58:33.429Z", "2026-11-16T20:58:33.429014Z",
                     "2026-11-16T20:58:33.429014123Z"):
            parsed = d.parse_instant(text)
            self.assertEqual(parsed.tzinfo, timezone.utc, text)
            self.assertEqual((parsed.hour, parsed.minute, parsed.second), (20, 58, 33), text)

    def test_next_status_copes_with_fractional_seconds(self):
        alert = {"status": "OPEN", "createdAt": "2026-11-17T11:40:00.123456Z"}
        self.assertEqual(d.next_status(alert, NOW), "ACKNOWLEDGED")


if __name__ == "__main__":
    unittest.main()
