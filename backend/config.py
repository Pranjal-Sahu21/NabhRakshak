import os

CELESTRAK_GROUPS = {
    "stations": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
    "active":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
    "debris":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle",
    "visual":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle",
}

TRACK_ISRO_ONLY = True
ISRO_NAME_PATTERN = (
    r'\b(CARTOSAT|GSAT|RISAT|INSAT|OCEANSAT|ASTROSAT|RESOURCESAT|SCATSAT|SARAL|'
    r'EMISAT|CMS|ADITYA|PRATHAM|JUGNU|SRMSAT|SWAYAM|PISAT|NIUSAT|ANUSAT|SPADEX|'
    r'SHAKUNTALA|AZADISAT|HYSIS|IRS|ISRO|EOS)(?:[- ]?\d*[A-Z]*)?\b'
)

MAX_SATELLITES_TRACKED = 60
MAX_DEBRIS_TRACKED = 300
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "cache.json")
CACHE_DURATION_HOURS = 6
AUTO_REFRESH_INTERVAL_HOURS = 6
CONJUNCTION_LOOKAHEAD_HOURS = 24
CONJUNCTION_STEP_HOURS = 1
CONJUNCTION_THRESHOLD_KM = 25.0
AABB_PREFILTER_KM = 25.0

SEVERITY_THRESHOLDS_KM = {
    "critical": 3.0,
    "high": 8.0,
    "medium": 15.0,
}

ORBIT_PATH_DEFAULT_HOURS = 6
ORBIT_PATH_DEFAULT_STEP_MINUTES = 5
ORBIT_PATH_MAX_HOURS = 48
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'nabh-dev-only-change-in-prod-DO-NOT-DEPLOY')
JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24

ROCKETS = {
    'Falcon 9': {
        'name': 'Falcon 9', 'manufacturer': 'SpaceX',
        'height': 70, 'diameter': 3.7, 'mass': 549054,
        'payload_capacity': {'LEO': 22800, 'GTO': 8300, 'Mars': 4020},
        'stages': 2, 'reusable': True,
        'thrust': 7607, 'specific_impulse': 282,
    },
    'Atlas V': {
        'name': 'Atlas V', 'manufacturer': 'ULA',
        'height': 58.3, 'diameter': 3.8, 'mass': 334500,
        'payload_capacity': {'LEO': 18850, 'GTO': 8900},
        'stages': 2, 'reusable': False,
        'thrust': 3827, 'specific_impulse': 311,
    },
    'Ariane 5': {
        'name': 'Ariane 5', 'manufacturer': 'Arianespace',
        'height': 52, 'diameter': 5.4, 'mass': 777000,
        'payload_capacity': {'LEO': 21000, 'GTO': 10500},
        'stages': 2, 'reusable': False,
        'thrust': 13350, 'specific_impulse': 278,
    },
}
ORBIT_TYPES = {
    'LEO': {'altitude_range': (400, 800), 'inclination_range': (28.5, 98.0), 'eccentricity_range': (0.0001, 0.01)},
    'MEO': {'altitude_range': (2000, 35000), 'inclination_range': (0, 90), 'eccentricity_range': (0.001, 0.1)},
    'GEO': {'altitude_range': (35786, 35786), 'inclination_range': (0, 5), 'eccentricity_range': (0.0001, 0.01)},
    'SSO': {'altitude_range': (600, 1000), 'inclination_range': (98.0, 98.0), 'eccentricity_range': (0.0001, 0.01)},
}
LAUNCH_SITES = {
    'Kennedy Space Center': {
        'name': 'Kennedy Space Center', 'location': 'Florida, USA',
        'latitude': 28.5721, 'longitude': -80.6480,
        'operator': 'NASA', 'optimal_orbits': ['LEO', 'GTO', 'Interplanetary'],
    },
    'Vandenberg SFB': {
        'name': 'Vandenberg Space Force Base', 'location': 'California, USA',
        'latitude': 34.7420, 'longitude': -120.5724,
        'operator': 'US Space Force', 'optimal_orbits': ['SSO', 'Polar'],
    },
    'Kourou': {
        'name': 'Guiana Space Centre', 'location': 'French Guiana',
        'latitude': 5.2389, 'longitude': -52.7683,
        'operator': 'Arianespace', 'optimal_orbits': ['GTO', 'LEO'],
    },
    'Baikonur': {
        'name': 'Baikonur Cosmodrome', 'location': 'Kazakhstan',
        'latitude': 45.9200, 'longitude': 63.3420,
        'operator': 'Roscosmos', 'optimal_orbits': ['LEO', 'MEO', 'GTO'],
    },
}

PAYLOAD_CLASSIFICATION_KEYWORDS = {
    'satellite': ['satellite', 'sat'],
    'scientific': ['telescope', 'observatory'],
    'communication': ['communication', 'comm'],
    'earth_observation': ['weather', 'climate'],
    'navigation': ['navigation', 'gps'],
}

NOAA_KP_INDEX_URL = 'https://services.swpc.noaa.gov/products/summary/planetary-k-index.json'
NOAA_SOLAR_FLUX_URL = 'https://services.swpc.noaa.gov/products/summary/10cm-flux.json'
NOAA_XRAY_FLUX_URL = 'https://services.swpc.noaa.gov/json/goes/primary/xray-fluxes.json'
NOAA_ALERTS_URL = 'https://services.swpc.noaa.gov/products/alerts.json'
NOAA_REQUEST_TIMEOUT_SECONDS = 2

KP_RISK_THRESHOLDS = {
    'Severe': 7.0,
    'High': 5.0,
    'Moderate': 4.0,
}
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
PORT = int(os.environ.get("PORT", 5001))
DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"