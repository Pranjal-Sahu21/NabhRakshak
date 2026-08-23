import requests
import json
import os
import sys
import math
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

# Allow importing TLEParser from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tle_parser import TLEParser

import tempfile

class DataFetcher:
    """Service for fetching and managing space debris data from CelesTrak"""

    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.cache_file = os.path.join(base_dir, 'data', 'cache.json')
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            test_path = os.path.join(os.path.dirname(self.cache_file), '.write_test')
            with open(test_path, 'w') as f:
                f.write('ok')
            os.remove(test_path)
        except (PermissionError, OSError):
            self.cache_file = os.path.join(tempfile.gettempdir(), 'nabhrakshak_cache.json')

        self.cache_duration = timedelta(hours=6)
        self.tle_parser = TLEParser()

        # Regular expression to identify Indian (ISRO) satellites
        self.indian_pattern = re.compile(
            r'\b(CARTOSAT|GSAT|RISAT|INSAT|OCEANSAT|ASTROSAT|RESOURCESAT|SCATSAT|SARAL|EMISAT|CMS|ADITYA|PRATHAM|JUGNU|SRMSAT|SWAYAM|PISAT|NIUSAT|ANUSAT|SPADEX|SHAKUNTALA|AZADISAT|HYSIS|IRS|ISRO|EOS)(?:[- ]?\d*[A-Z]*)?\b',
            re.IGNORECASE
        )

        # Real CelesTrak TLE endpoints
        self.celestrak_urls = {
            'stations':  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
            'active':    'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
            'debris':    'https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle',
            'visual':    'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
        }

    # ------------------------------------------------------------------ #
    #  PUBLIC API METHODS (called by app.py routes)                        #
    # ------------------------------------------------------------------ #

    def get_dashboard_stats(self) -> Dict:
        data = self._load_cached_data()
        all_satellites = data.get('satellites', [])
        
        # Only track Indian satellites
        satellites = [s for s in all_satellites if self.indian_pattern.search(s.get('name', ''))]
        debris     = data.get('debris', [])
        alerts     = data.get('alerts', [])

        return {
            'total_tracked_objects': len(satellites) + len(debris),
            'active_satellites':     len([s for s in satellites if s.get('status') == 'active']),
            'debris_objects':        len(debris),
            'high_risk_collisions':  len([a for a in alerts if a.get('severity') in ['high', 'critical']]),
            'last_update':           data.get('last_updated', datetime.utcnow().isoformat()),
            'system_status':         'online',
            'data_sources':          ['CelesTrak'],
            'stats':                 data.get('stats', {}),
        }

    def get_debris_data(self, object_type='all', altitude_range=None,
                        risk_level='all', limit=100) -> List[Dict]:
        data = self._load_cached_data()
        # Include Indian satellites only
        all_satellites = data.get('satellites', [])
        satellites = [s for s in all_satellites if self.indian_pattern.search(s.get('name', ''))]
        objects = satellites + data.get('debris', [])

        filtered = []
        for obj in objects:
            if object_type != 'all' and obj.get('object_type') != object_type:
                continue
            if altitude_range and None not in altitude_range:
                alt = obj.get('altitude', 0)
                if not (altitude_range[0] <= alt <= altitude_range[1]):
                    continue
            if risk_level != 'all' and obj.get('risk_level') != risk_level:
                continue
            filtered.append(obj)

        risk_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        filtered.sort(
            key=lambda x: (risk_order.get(x.get('risk_level', 'low'), 1),
                           -x.get('altitude', 0)),
            reverse=True
        )
        return filtered[:limit]

    def get_satellites(self) -> List[Dict]:
        all_satellites = self._load_cached_data().get('satellites', [])
        return [s for s in all_satellites if self.indian_pattern.search(s.get('name', ''))]

    def get_rockets(self, orbit_type='all') -> List[Dict]:
        rockets = self._get_static_rockets()
        if orbit_type != 'all':
            rockets = [r for r in rockets if r.get('target_orbit', '').lower() == orbit_type.lower()]
        return rockets

    def get_heatmap_data(self) -> List[Dict]:
        data    = self._load_cached_data()
        objects = data.get('satellites', []) + data.get('debris', [])
        points  = []

        for lat in range(-90, 91, 10):
            for lng in range(-180, 181, 10):
                density = sum(
                    1 for obj in objects
                    if abs(lat) <= obj.get('inclination', 0) and obj.get('altitude', 0) > 200
                )
                if density > 0:
                    points.append({
                        'lat': lat, 'lng': lng,
                        'density': density,
                        'intensity': min(density / 10.0, 1.0)
                    })

        return points

    def get_timeline_data(self, start_time=None, end_time=None) -> Dict:
        if not start_time:
            start_time = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        if not end_time:
            end_time   = (datetime.utcnow() + timedelta(hours=24)).isoformat()

        data    = self._load_cached_data()
        objects = (data.get('satellites', []) + data.get('debris', []))[:100]

        start_dt = datetime.fromisoformat(start_time.replace('Z', ''))
        end_dt   = datetime.fromisoformat(end_time.replace('Z', ''))

        timeline, current = [], start_dt
        while current <= end_dt:
            snapshot = {'timestamp': current.isoformat(), 'objects': []}
            for obj in objects:
                period   = obj.get('orbital_period', 90)
                diff_min = (current - start_dt).total_seconds() / 60
                phase    = (diff_min / period) % 1
                inc_rad  = math.radians(obj.get('inclination', 0))
                snapshot['objects'].append({
                    'id':       obj.get('id'),
                    'name':     obj.get('name'),
                    'lat':      math.sin(phase * 2 * math.pi) * math.degrees(inc_rad),
                    'lng':      (phase * 360 - 180) % 360 - 180,
                    'altitude': obj.get('altitude'),
                    'type':     obj.get('object_type'),
                    'risk':     obj.get('risk_level'),
                })
            timeline.append(snapshot)
            current += timedelta(hours=1)

        return {
            'timeline':        timeline,
            'start_time':      start_time,
            'end_time':        end_time,
            'total_snapshots': len(timeline),
        }

    def initialize_sample_data(self):
        """Fallback: write an empty cache so app.py doesn't crash on first run."""
        os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
        empty = {
            'satellites':   [],
            'debris':       [],
            'rockets':      self._get_static_rockets(),
            'alerts':       [],
            'stats':        {},
            'last_updated': '2000-01-01T00:00:00',
        }
        with open(self.cache_file, 'w') as f:
            json.dump(empty, f, indent=2)

    # ------------------------------------------------------------------ #
    #  INTERNAL: CACHE MANAGEMENT                                          #
    # ------------------------------------------------------------------ #

    def _load_cached_data(self) -> Dict:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    data = json.load(f)
                last_updated = datetime.fromisoformat(
                    data.get('last_updated', '2000-01-01T00:00:00')
                )
                if datetime.utcnow() - last_updated < self.cache_duration:
                    print("✅ Serving from cache")
                    return data

                # Cache is stale but exists — return it immediately and refresh in background
                if data.get('satellites') or data.get('debris'):
                    print("⏳ Cache stale — serving stale data instantly, refreshing in background...")
                    import threading
                    t = threading.Thread(target=self._fetch_and_cache, daemon=True)
                    t.start()
                    return data
            except Exception as e:
                print(f"⚠️  Cache read error: {e}")

        # No usable cache at all — must fetch synchronously
        return self._fetch_and_cache()

    def _fetch_and_cache(self) -> Dict:
        print("🌐 Fetching live TLE data from CelesTrak...")
        satellites, debris = [], []

        for group, url in self.celestrak_urls.items():
            try:
                resp = requests.get(url, timeout=15)
                resp.raise_for_status()
                parsed = self.tle_parser.parse_tle_string(resp.text)

                for obj in parsed:
                    if obj['object_type'] in ('debris', 'rocket_body'):
                        debris.append(obj)
                    else:
                        satellites.append(obj)

                print(f"  ✅ {group}: {len(parsed)} objects")
            except Exception as e:
                print(f"  ❌ {group} failed: {e}")

        # Deduplicate by catalog number
        satellites = self._deduplicate(satellites)
        debris     = self._deduplicate(debris)

        data = {
            'satellites':   satellites,
            'debris':       debris,
            'rockets':      self._get_static_rockets(),
            'alerts':       [],
            'stats':        self._calculate_stats(satellites, debris),
            'last_updated': datetime.utcnow().isoformat(),
        }

        os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
        with open(self.cache_file, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"💾 Cached {len(satellites)} satellites + {len(debris)} debris objects")
        return data

    # ------------------------------------------------------------------ #
    #  HELPERS                                                             #
    # ------------------------------------------------------------------ #

    def _deduplicate(self, objects: List[Dict]) -> List[Dict]:
        seen, result = set(), []
        for obj in objects:
            key = obj.get('catalog_number') or obj.get('id')
            if key not in seen:
                seen.add(key)
                result.append(obj)
        return result

    def _calculate_stats(self, satellites: List[Dict], debris: List[Dict]) -> Dict:
        all_objects = satellites + debris
        risk_dist   = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        orbit_dist  = {'LEO': 0, 'MEO': 0, 'GEO': 0, 'HEO': 0}

        for obj in all_objects:
            risk_dist[obj.get('risk_level', 'low')] += 1
            alt = obj.get('altitude', 0)
            if alt < 2000:           orbit_dist['LEO'] += 1
            elif alt < 35000:        orbit_dist['MEO'] += 1
            elif alt <= 36000:       orbit_dist['GEO'] += 1
            else:                    orbit_dist['HEO'] += 1

        return {
            'total_objects':     len(all_objects),
            'active_satellites': len([s for s in satellites if s.get('status') == 'active']),
            'debris_count':      len(debris),
            'risk_distribution': risk_dist,
            'orbit_distribution': orbit_dist,
        }

    def _get_static_rockets(self) -> List[Dict]:
        return [
            {
                'id': 'falcon9', 'name': 'Falcon 9',
                'manufacturer': 'SpaceX',
                'payload_capacity': {'LEO': 22800, 'GTO': 8300},
                'target_orbit': 'LEO', 'reusable': True, 'active': True,
                'risk_assessment': 'low',
                'launch_sites': ['Kennedy Space Center', 'Vandenberg SFB'],
            },
            {
                'id': 'atlas5', 'name': 'Atlas V',
                'manufacturer': 'ULA',
                'payload_capacity': {'LEO': 18850, 'GTO': 8900},
                'target_orbit': 'GTO', 'reusable': False, 'active': True,
                'risk_assessment': 'low',
                'launch_sites': ['Cape Canaveral'],
            },
            {
                'id': 'ariane5', 'name': 'Ariane 5',
                'manufacturer': 'Arianespace',
                'payload_capacity': {'LEO': 21000, 'GTO': 10500},
                'target_orbit': 'GTO', 'reusable': False, 'active': True,
                'risk_assessment': 'medium',
                'launch_sites': ['Kourou'],
            },
        ]
