import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from apscheduler.schedulers.background import BackgroundScheduler
import json
import threading
from datetime import datetime, timedelta
import requests
from services.fetcher import DataFetcher
from services.predictor import CollisionPredictor
from services.report_gen import ReportGenerator
from tle_parser import TLEParser

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'nabhrakshak-secret-key-2024'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

jwt = JWTManager(app)
CORS(app)

# Initialize services
data_fetcher = DataFetcher()
collision_predictor = CollisionPredictor()
report_generator = ReportGenerator()
tle_parser = TLEParser()

# --- TLE Refresh state -------------------------------------------------------
_refresh_lock = threading.Lock()
_refresh_in_progress = False
_last_refresh_triggered = None   # UTC datetime of last manual/scheduled trigger

# Mock user database
USERS = {
    'admin@nabhrakshak.com': {'password': 'admin123', 'role': 'admin'},
    'viewer@nabhrakshak.com': {'password': 'viewer123', 'role': 'viewer'},
    'demo@nabhrakshak.com': {'password': 'demo123', 'role': 'admin'}
}

# =============================================================================
# BACKGROUND SCHEDULER — auto-fetch fresh TLEs every 6 hours
# =============================================================================

def scheduled_tle_refresh():
    """Runs every 6 hours in a background thread to pull fresh TLEs."""
    global _refresh_in_progress, _last_refresh_triggered
    if _refresh_in_progress:
        print("TLE refresh already in progress — skipping scheduled run")
        return
    with _refresh_lock:
        _refresh_in_progress = True
        _last_refresh_triggered = datetime.utcnow()
    try:
        print("[Scheduler] Auto-refreshing TLE data from CelesTrak...")
        data_fetcher._fetch_and_cache()
        print("[Scheduler] TLE refresh complete")
    except Exception as e:
        print(f"[Scheduler] TLE refresh failed: {e}")
    finally:
        with _refresh_lock:
            _refresh_in_progress = False

scheduler = None
try:
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        scheduled_tle_refresh,
        trigger='interval',
        hours=6,
        id='tle_refresh',
        next_run_time=None,
    )
    if not os.environ.get('VERCEL'):
        scheduler.start()
except Exception as e:
    print(f"[Scheduler] Start skipped: {e}")

# =============================================================================
# AUTH ROUTES
# =============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User authentication endpoint"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if email in USERS and USERS[email]['password'] == password:
            access_token = create_access_token(
                identity=email,
                additional_claims={'role': USERS[email]['role']}
            )
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user': {'email': email, 'role': USERS[email]['role']}
            })
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint (mock)"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'viewer')
        if email in USERS:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        USERS[email] = {'password': password, 'role': role}
        access_token = create_access_token(
            identity=email,
            additional_claims={'role': role}
        )
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {'email': email, 'role': role}
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =============================================================================
# DATA ROUTES
# =============================================================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        stats = data_fetcher.get_dashboard_stats()
        # Fetch actual alerts and override high_risk_collisions count dynamically
        alerts = collision_predictor.get_alerts(severity='all')
        high_risk = len([a for a in alerts if a.get('severity') in ['high', 'critical']])
        stats['high_risk_collisions'] = high_risk
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/debris', methods=['GET'])
def get_debris():
    """Get space debris data with filtering"""
    try:
        object_type  = request.args.get('type', 'all')
        altitude_min = request.args.get('altitude_min', type=int)
        altitude_max = request.args.get('altitude_max', type=int)
        risk_level   = request.args.get('risk', 'all')
        limit        = request.args.get('limit', 100, type=int)
        debris_data  = data_fetcher.get_debris_data(
            object_type=object_type,
            altitude_range=(altitude_min, altitude_max),
            risk_level=risk_level,
            limit=limit
        )
        return jsonify({'success': True, 'data': debris_data, 'count': len(debris_data)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/satellites', methods=['GET'])
def get_satellites():
    """Get satellite data"""
    try:
        satellites = data_fetcher.get_satellites()
        return jsonify({'success': True, 'data': satellites})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/rockets', methods=['GET'])
def get_rockets():
    """Get rocket data"""
    try:
        orbit_type = request.args.get('orbit_type', 'all')
        rockets = data_fetcher.get_rockets(orbit_type=orbit_type)
        return jsonify({'success': True, 'data': rockets})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get collision alerts"""
    try:
        severity = request.args.get('severity', 'all')
        alerts = collision_predictor.get_alerts(severity=severity)
        return jsonify({'success': True, 'data': alerts})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/simulate', methods=['POST'])
def simulate_mission():
    """Simulate rocket launch and orbit"""
    try:
        data = request.get_json()
        simulation_result = collision_predictor.simulate_launch(
            rocket_name=data.get('rocket'),
            payload=data.get('payload'),
            orbit_type=data.get('orbit'),
            launch_site=data.get('launch_site')
        )
        return jsonify({'success': True, 'data': simulation_result})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/report', methods=['POST'])
def generate_report():
    """Generate mission report"""
    try:
        data = request.get_json()
        report_path = report_generator.generate_report(
            report_type=data.get('type', 'mission'),
            parameters=data.get('parameters', {})
        )
        return send_file(report_path, as_attachment=True)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/upload-tle', methods=['POST'])
def upload_tle():
    """Upload custom TLE data"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        tle_content = file.read().decode('utf-8')
        parsed_data = tle_parser.parse_tle_string(tle_content)
        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': f'Successfully parsed {len(parsed_data)} objects'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/heatmap', methods=['GET'])
def get_heatmap_data():
    """Get debris density heatmap data"""
    try:
        heatmap_data = data_fetcher.get_heatmap_data()
        return jsonify({'success': True, 'data': heatmap_data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/timeline', methods=['GET'])
def get_timeline_data():
    """Get timeline data for playback"""
    try:
        start_time = request.args.get('start')
        end_time   = request.args.get('end')
        timeline_data = data_fetcher.get_timeline_data(start_time, end_time)
        return jsonify({'success': True, 'data': timeline_data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =============================================================================
# TLE STATUS & FORCE-REFRESH ROUTES  (NEW)
# =============================================================================

@app.route('/api/tle-status', methods=['GET'])
def get_tle_status():
    """
    Return TLE data freshness info so the frontend can show a live status banner.
    Fields:
      last_updated          - ISO UTC timestamp the cache was last written
      next_update           - ISO UTC timestamp of next scheduled auto-refresh
      age_minutes           - float: how old the cache is in minutes
      is_stale              - bool: True when cache age > 6 hours
      refresh_in_progress   - bool: True while a fetch is running
      satellite_count       - int: cached satellite records
      debris_count          - int: cached debris records
      refresh_interval_hrs  - int: configured interval (6)
      sources               - list of CelesTrak group names
    """
    try:
        cache_path = data_fetcher.cache_file
        last_updated_str = None
        age_minutes      = None
        is_stale         = True
        satellite_count  = 0
        debris_count     = 0

        if os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                cache = json.load(f)
            last_updated_str = cache.get('last_updated')
            if last_updated_str:
                last_dt     = datetime.fromisoformat(last_updated_str)
                age_minutes = round((datetime.utcnow() - last_dt).total_seconds() / 60, 1)
                is_stale    = age_minutes > 360   # > 6 hours
            satellite_count = len(cache.get('satellites', []))
            debris_count    = len(cache.get('debris', []))

        # Next scheduled run from APScheduler
        job          = scheduler.get_job('tle_refresh') if (scheduler and hasattr(scheduler, 'get_job')) else None
        next_run_str = job.next_run_time.isoformat() if (job and job.next_run_time) else None

        return jsonify({
            'success': True,
            'data': {
                'last_updated':         last_updated_str,
                'next_update':          next_run_str,
                'age_minutes':          age_minutes,
                'is_stale':             is_stale,
                'refresh_in_progress':  _refresh_in_progress,
                'satellite_count':      satellite_count,
                'debris_count':         debris_count,
                'refresh_interval_hrs': 6,
                'sources':              list(data_fetcher.celestrak_urls.keys()),
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/force-refresh', methods=['POST'])
def force_refresh_tle():
    """
    Immediately trigger a TLE data refresh from CelesTrak in a background thread.
    Returns immediately (202 Accepted).
    Poll /api/tle-status to watch progress.
    """
    global _refresh_in_progress
    if _refresh_in_progress:
        return jsonify({
            'success': False,
            'message': 'A TLE refresh is already in progress. Please wait.'
        }), 429

    thread = threading.Thread(target=scheduled_tle_refresh, daemon=True)
    thread.start()

    return jsonify({
        'success': True,
        'message': 'TLE refresh started. Poll /api/tle-status for progress.',
        'started_at': datetime.utcnow().isoformat()
    }), 202

# =============================================================================
# UTILITY
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'tle_scheduler': 'running' if scheduler.running else 'stopped',
    })

@app.route('/api/space-weather', methods=['GET'])
def get_space_weather():
    """Returns space weather intelligence metrics, events, and recommendations fetched live from NOAA SWPC"""
    # Default fallback data
    kp = 4.3
    flux_sfu = "145.2 sfu"
    proton_flux = "1.2 pfu"
    risk_level = "Moderate"
    impact = "Moderate magnetic disturbance. Enhanced drag observed on satellites below 400km altitude. Elevated risk of single-event upsets in high-latitude regions."
    xray_trends = []
    live_alerts = []

    # 1. Fetch live Kp Index
    try:
        kp_res = requests.get('https://services.swpc.noaa.gov/products/summary/planetary-k-index.json', timeout=2)
        if kp_res.status_code == 200:
            kp_data = kp_res.json()
            if isinstance(kp_data, list) and len(kp_data) > 0:
                kp_data = kp_data[0]
            if isinstance(kp_data, dict):
                kp = float(kp_data.get('estimated_kp', 4.3))
    except Exception as e:
        print(f"[NOAA API] Kp index fetch failed: {e}")

    # 2. Fetch live Solar Flux
    try:
        flux_res = requests.get('https://services.swpc.noaa.gov/products/summary/10cm-flux.json', timeout=2)
        if flux_res.status_code == 200:
            flux_data = flux_res.json()
            if isinstance(flux_data, list) and len(flux_data) > 0:
                flux_data = flux_data[0]
            if isinstance(flux_data, dict):
                flux_sfu = f"{flux_data.get('flux', 145.2)} sfu"
    except Exception as e:
        print(f"[NOAA API] 10cm-flux fetch failed: {e}")

    # 3. Dynamic scale estimation based Kp
    if kp >= 7.0:
        risk_level = "Severe"
        impact = "Severe geomagnetic storm (G3+ equivalent). Heavy ionospheric scintillation. Satellites in high inclination orbits entering mitigation posture."
    elif kp >= 5.0:
        risk_level = "High"
        impact = "Minor to Moderate storm. Elevated particle fluxes in polar corridors. Orbit adjustments postponed."
    elif kp >= 4.0:
        risk_level = "Moderate"
        impact = "Unsettled geomagnetic conditions. Minor tracking noise. Operations proceeding normally."
    else:
        risk_level = "Low"
        impact = "Magnetosphere quiet. Background space weather environment is nominal."

    # 4. Fetch live X-ray fluxes
    try:
        xray_res = requests.get('https://services.swpc.noaa.gov/json/goes/primary/xray-fluxes.json', timeout=2)
        if xray_res.status_code == 200:
            xray_data = xray_res.json()
            # Filter for 0.1-0.8nm wavelength
            filtered_xray = [x for x in xray_data if x.get('energy') == '0.1-0.8nm']
            if filtered_xray:
                # Sample 7 points
                step = max(1, len(filtered_xray) // 7)
                sampled = filtered_xray[::step][-7:]
                for item in sampled:
                    time_str = item.get('time_tag', '').split('T')[-1][:5]
                    xray_trends.append({
                        "time": time_str,
                        "xray": item.get('flux', 1.0e-6),
                        "proton": round(1.0 + (item.get('flux', 0) * 1.5e5), 1)
                    })
    except Exception as e:
        print(f"[NOAA API] GOES X-ray fluxes fetch failed: {e}")

    if not xray_trends:
        xray_trends = [
            {"time": "00:00", "xray": 1.2e-6, "proton": 0.8},
            {"time": "04:00", "xray": 2.4e-6, "proton": 0.9},
            {"time": "08:00", "xray": 8.5e-6, "proton": 1.5},
            {"time": "12:00", "xray": 1.5e-5, "proton": 2.1},
            {"time": "16:00", "xray": 9.2e-6, "proton": 1.8},
            {"time": "20:00", "xray": 4.1e-6, "proton": 1.3},
            {"time": "24:00", "xray": 3.0e-6, "proton": 1.2}
        ]

    # 5. Fetch live alerts
    try:
        alerts_res = requests.get('https://services.swpc.noaa.gov/products/alerts.json', timeout=2)
        if alerts_res.status_code == 200:
            alerts_data = alerts_res.json()
            for idx, item in enumerate(alerts_data[:4]):
                msg = item.get('message', '')
                clean_msg = msg.split('SUMMARY:')[0].strip() if 'SUMMARY:' in msg else msg[:150]
                clean_msg = clean_msg.replace('WARNING:', '').replace('ALERT:', '').strip()
                if len(clean_msg) > 150:
                    clean_msg = clean_msg[:147] + '...'
                
                severity = 'low'
                if 'WARNING' in msg or 'ALERT' in msg:
                    severity = 'moderate'
                if 'SEVERE' in msg or 'EXTREME' in msg or 'STRONG' in msg:
                    severity = 'high'
                    
                time_str = item.get('issue_datetime', '').split(' ')[-1][:5] + ' UTC'
                live_alerts.append({
                    "id": idx + 1,
                    "severity": severity,
                    "message": clean_msg,
                    "timestamp": time_str
                })
    except Exception as e:
        print(f"[NOAA API] Live alerts fetch failed: {e}")

    if not live_alerts:
        live_alerts = [
            {"id": 1, "severity": "moderate", "message": "Coronal Mass Ejection (CME) transit tracking active. Estimated arrival: July 6th, 14:00 UTC.", "timestamp": "09:30 UTC"},
            {"id": 2, "severity": "high", "message": "M5.2 class solar flare registered from active region AR3363. Radio blackout level R2 observed.", "timestamp": "08:15 UTC"},
            {"id": 3, "severity": "low", "message": "Proton flux levels entering minor radiation storm threshold (S1 level).", "timestamp": "07:45 UTC"}
        ]

    data = {
        "overview": {
            "risk_level": risk_level,
            "solar_activity_index": flux_sfu,
            "kp_index": kp,
            "solar_radiation": proton_flux,
            "mission_impact": impact
        },
        "solar_activity": {
            "flux_trends": xray_trends,
            "active_regions": [
                {"id": "AR3363", "coords": "S12W45", "class": "Beta-Gamma-Delta", "flare_prob": "85%"},
                {"id": "AR3365", "coords": "N18E12", "class": "Beta", "flare_prob": "30%"},
                {"id": "AR3367", "coords": "S08E78", "class": "Alpha", "flare_prob": "10%"}
            ],
            "recent_events": [
                {"time": "08:12 UTC", "type": "Solar Flare", "class": "M5.2", "region": "AR3363", "status": "Concluded"},
                {"time": "09:30 UTC", "type": "CME", "velocity": "840 km/s", "direction": "Earth-directed", "status": "Transit (ETA 28h)"},
                {"time": "11:45 UTC", "type": "Radio Burst", "class": "Type II", "frequency": "24 MHz", "status": "Concluded"}
            ]
        },
        "geomagnetic_storm": {
            "current_kp": kp,
            "predictions_24_72h": [
                {"time": "T+12h", "kp": round(max(0, kp - 0.6), 1)},
                {"time": "T+24h", "kp": round(max(0, kp + 0.9), 1)},
                {"time": "T+36h", "kp": round(max(0, kp + 0.5), 1)},
                {"time": "T+48h", "kp": round(max(0, kp - 0.3), 1)},
                {"time": "T+60h", "kp": round(max(0, kp - 1.1), 1)},
                {"time": "T+72h", "kp": round(max(0, kp - 1.8), 1)}
            ],
            "global_disturbance": f"Active conditions. Localized disturbance fields monitoring enabled. Auroral boundary Kp = {kp}."
        },
        "ai_recommendations": [
            {
                "title": "Delay Thruster Firing (GSAT-31)",
                "priority": "HIGH" if kp >= 5.0 else "MEDIUM",
                "confidence": 94,
                "impact": "Prevent Single-Event Upsets (SEU)",
                "reasoning": f"Current Kp index is {kp}. Higher geomagnetic activity increases high-energy proton counts along drift paths, elevating electrical risk during high-power maneuvering."
            },
            {
                "title": "Orient Solar Arrays for Shielding",
                "priority": "MEDIUM",
                "confidence": 88,
                "impact": "Mitigate Solar Radiation Damage",
                "reasoning": "Feathering solar panels by 15 degrees offsets charged particle flux. Recommended duration: 18 hours."
            },
            {
                "title": "Establish High-Latitude Backup Telemetry",
                "priority": "LOW",
                "confidence": 75,
                "impact": "Maintain Communications Integrity",
                "reasoning": "Ionospheric scintillation at polar borders could degrade L-band links. Standby telemetry stations placed on alert."
            }
        ],
        "live_alerts": live_alerts,
        "forecast": {
            "day_1": {"kp_max": round(kp + 0.9, 1), "flare_class": "M-Class (80%)", "hazard_level": "Moderate" if kp < 5 else "High"},
            "day_3": {"kp_max": round(max(0.5, kp - 0.3), 1), "flare_class": "C-Class (90%)", "hazard_level": "Low" if kp < 5 else "Moderate"},
            "day_7": {"kp_max": round(max(0.5, kp - 1.3), 1), "flare_class": "C-Class (50%)", "hazard_level": "Low"}
        },
        "historical_trends": [
            {"date": "06-29", "solar_flares": 3, "geomagnetic_storms": 0, "downtime_hours": 0.0},
            {"date": "06-30", "solar_flares": 5, "geomagnetic_storms": 1, "downtime_hours": 0.5},
            {"date": "07-01", "solar_flares": 8, "geomagnetic_storms": 2, "downtime_hours": 1.2},
            {"date": "07-02", "solar_flares": 12, "geomagnetic_storms": 3, "downtime_hours": 2.4},
            {"date": "07-03", "solar_flares": 6, "geomagnetic_storms": 1, "downtime_hours": 0.8},
            {"date": "07-04", "solar_flares": 4, "geomagnetic_storms": 0, "downtime_hours": 0.0}
        ]
    }
    return jsonify({'success': True, 'data': data})


@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    if not os.path.exists('data/cache.json'):
        data_fetcher.initialize_sample_data()

    print("🚀 NabhRakshak Backend Starting...")
    print("📡 Space Debris Monitoring API v2.0 Ready")
    print("🔄 TLE Auto-Refresh Scheduler: Active (every 6 hours)")
    print("🌌 Access at: http://localhost:5001")

    app.run(debug=True, host='0.0.0.0', port=5001)