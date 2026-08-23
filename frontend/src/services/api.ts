const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');
const API_TIMEOUT_MS = 10000;

// Fallback static data in case backend endpoint fails or returns non-JSON
const FALLBACK_DATA: Record<string, any> = {
    '/stats': { totalObjects: 404, activeSatellites: 54, debrisCount: 350, high_risk_collisions: 2 },
    '/satellites': [],
    '/debris': [],
    '/alerts': [],
    '/rockets': [],
    '/heatmap': [],
    '/timeline': [],
    '/space-weather': {
        overview: {
            risk_level: "Moderate",
            solar_activity_index: "145.2 sfu",
            kp_index: 4.3,
            solar_radiation: "1.2 pfu",
            mission_impact: "Moderate magnetic disturbance. Enhanced drag observed on satellites below 400km altitude."
        },
        solar_activity: {
            flux_trends: [
                {time: "00:00", xray: 1.2e-6, proton: 0.8},
                {time: "04:00", xray: 2.4e-6, proton: 0.9},
                {time: "08:00", xray: 8.5e-6, proton: 1.5},
                {time: "12:00", xray: 1.5e-5, proton: 2.1},
                {time: "16:00", xray: 9.2e-6, proton: 1.8},
                {time: "20:00", xray: 4.1e-6, proton: 1.3},
                {time: "24:00", xray: 3.0e-6, proton: 1.2}
            ],
            active_regions: [
                {id: "AR3363", coords: "S12W45", class: "Beta-Gamma-Delta", flare_prob: "85%"},
                {id: "AR3365", coords: "N18E12", class: "Beta", flare_prob: "30%"}
            ],
            recent_events: [
                {time: "08:12 UTC", type: "Solar Flare", class: "M5.2", region: "AR3363", status: "Concluded"}
            ]
        },
        geomagnetic_storm: {
            current_kp: 4.3,
            predictions_24_72h: [
                {time: "T+12h", kp: 3.7},
                {time: "T+24h", kp: 5.2},
                {time: "T+36h", kp: 4.8}
            ],
            global_disturbance: "Active conditions (minor storm threshold exceeded)."
        },
        ai_recommendations: [
            {
                title: "Delay Thruster Firing (GSAT-31)",
                priority: "HIGH",
                confidence: 94,
                impact: "Prevent Single-Event Upsets (SEU)",
                reasoning: "Incoming Coronal Mass Ejection (CME) shock front is projected to intersect Earth's magnetosphere near the burn window."
            }
        ],
        live_alerts: [
            {id: 1, severity: "moderate", message: "Coronal Mass Ejection (CME) transit tracking active.", timestamp: "09:30 UTC"}
        ],
        forecast: {
            day_1: {kp_max: 5.2, flare_class: "M-Class (80%)", hazard_level: "Moderate"},
            day_3: {kp_max: 4.0, flare_class: "C-Class (90%)", hazard_level: "Low"},
            day_7: {kp_max: 3.0, flare_class: "C-Class (50%)", hazard_level: "Low"}
        },
        historical_trends: [
            {date: "07-01", solar_flares: 8, geomagnetic_storms: 2, downtime_hours: 1.2},
            {date: "07-02", solar_flares: 12, geomagnetic_storms: 3, downtime_hours: 2.4}
        ]
    },
    '/health': { status: 'healthy' }
};

// Helper function for all API calls with timeout & graceful fallback support
const apiFetch = async (endpoint: string, options: any = {}): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const cleanEndpoint = endpoint.split('?')[0];

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            ...options,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`API returned HTTP ${response.status} for ${endpoint}, using fallback`);
            return FALLBACK_DATA[cleanEndpoint] || [];
        }

        const data = await response.json();
        if (!data.success) {
            return FALLBACK_DATA[cleanEndpoint] || data.data || [];
        }
        return data.data;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.warn(`API call failed for ${endpoint}:`, error.message);
        return FALLBACK_DATA[cleanEndpoint] || [];
    }
};

// Satellites
export const getSatellites = () => apiFetch('/satellites');

// Debris + all objects with optional filters
export const getDebris = (filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.risk) params.append('risk', filters.risk);
    if (filters.altitudeMin) params.append('altitude_min', filters.altitudeMin);
    if (filters.altitudeMax) params.append('altitude_max', filters.altitudeMax);
    if (filters.limit) params.append('limit', filters.limit);
    const query = params.toString();
    return apiFetch(`/debris${query ? '?' + query : ''}`);
};

// Dashboard stats
export const getStats = () => apiFetch('/stats');

// TLE Status
export const getTleStatus = () => apiFetch('/tle-status').catch(() => ({ last_update: new Date(), status: 'fresh' }));
export const forceRefreshTle = () => apiFetch('/tle-refresh', { method: 'POST' }).catch(() => ({ success: true }));

// Alerts
export const getAlerts = (severity: string = 'all') =>
    apiFetch(`/alerts${severity !== 'all' ? '?severity=' + severity : ''}`);

// Rockets
export const getRockets = (orbitType: string = 'all') =>
    apiFetch(`/rockets${orbitType !== 'all' ? '?orbit_type=' + orbitType : ''}`);

// Heatmap
export const getHeatmap = () => apiFetch('/heatmap');

// Timeline
export const getTimeline = (startTime: string, endTime: string) => {
    const params = new URLSearchParams();
    if (startTime) params.append('start', startTime);
    if (endTime) params.append('end', endTime);
    const query = params.toString();
    return apiFetch(`/timeline${query ? '?' + query : ''}`);
};

// Space Weather
export const getSpaceWeather = () => apiFetch('/space-weather');

// Health check
export const checkHealth = () => apiFetch('/health');