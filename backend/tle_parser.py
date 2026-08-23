import re
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional

class TLEParser:
    """Two-Line Element (TLE) data parser for satellite orbital elements"""
    
    def __init__(self):
        self.tle_pattern = re.compile(r'^[12] \d{5}')
    
    def parse_tle_string(self, tle_content: str) -> List[Dict]:
        """Parse TLE data from string content"""
        lines = tle_content.strip().split('\n')
        satellites = []
        
        i = 0
        while i < len(lines):
            # Look for satellite name (line before TLE data)
            if i + 2 < len(lines) and self._is_tle_line(lines[i + 1]) and self._is_tle_line(lines[i + 2]):
                name = lines[i].strip()
                line1 = lines[i + 1].strip()
                line2 = lines[i + 2].strip()
                
                try:
                    satellite_data = self._parse_tle_lines(name, line1, line2)
                    satellites.append(satellite_data)
                except Exception as e:
                    print(f"Error parsing TLE for {name}: {e}")
                
                i += 3
            else:
                i += 1
        
        return satellites
    
    def _is_tle_line(self, line: str) -> bool:
        """Check if line is a valid TLE line"""
        return bool(self.tle_pattern.match(line.strip()))
    
    def _parse_tle_lines(self, name: str, line1: str, line2: str) -> Dict:
        """Parse individual TLE lines into satellite data"""
        # Line 1 parsing
        catalog_number = int(line1[2:7])
        classification = line1[7]
        launch_year = int(line1[9:11])
        launch_number = int(line1[11:14])
        launch_piece = line1[14:17].strip()
        epoch_year = int(line1[18:20])
        epoch_day = float(line1[20:32])
        mean_motion_derivative = float(line1[33:43])
        mean_motion_second_derivative = self._parse_exponential(line1[44:52])
        bstar = self._parse_exponential(line1[53:61])
        ephemeris_type = int(line1[62])
        element_number = int(line1[64:68])
        
        # Line 2 parsing
        inclination = float(line2[8:16])
        raan = float(line2[17:25])  # Right Ascension of Ascending Node
        eccentricity = float('0.' + line2[26:33])
        argument_of_perigee = float(line2[34:42])
        mean_anomaly = float(line2[43:51])
        mean_motion = float(line2[52:63])
        revolution_number = int(line2[63:68])
        
        # Calculate additional orbital parameters
        orbital_period = 1440.0 / mean_motion  # minutes
        semi_major_axis = self._calculate_semi_major_axis(mean_motion)
        apogee, perigee = self._calculate_apogee_perigee(semi_major_axis, eccentricity)
        
        # Determine object type and risk level
        object_type = self._classify_object(name, catalog_number)
        risk_level = self._assess_risk(apogee, perigee, inclination, object_type)
        
        # Convert epoch to datetime
        epoch_datetime = self._epoch_to_datetime(epoch_year, epoch_day)
        
        return {
            'id': catalog_number,
            'name': name.strip(),
            'catalog_number': catalog_number,
            'classification': classification,
            'launch_year': 2000 + launch_year if launch_year < 57 else 1900 + launch_year,
            'launch_number': launch_number,
            'launch_piece': launch_piece,
            'epoch': epoch_datetime.isoformat(),
            'inclination': inclination,
            'raan': raan,
            'eccentricity': eccentricity,
            'argument_of_perigee': argument_of_perigee,
            'mean_anomaly': mean_anomaly,
            'mean_motion': mean_motion,
            'revolution_number': revolution_number,
            'orbital_period': orbital_period,
            'semi_major_axis': semi_major_axis,
            'apogee': apogee,
            'perigee': perigee,
            'altitude': (apogee + perigee) / 2,
            'object_type': object_type,
            'risk_level': risk_level,
            'status': 'active' if object_type == 'satellite' else 'debris',
            'last_updated': datetime.utcnow().isoformat(),
            'tle_line1': line1,
            'tle_line2': line2
        }
    
    def _parse_exponential(self, exp_str: str) -> float:
        """Parse exponential notation in TLE format"""
        if not exp_str.strip():
            return 0.0
        
        try:
            # Handle format like "+12345-3" -> 0.12345e-3
            if len(exp_str) >= 8:
                mantissa = exp_str[:6]
                exponent = exp_str[6:8]
                sign = 1 if exp_str[0] == '+' else -1
                return sign * float('0.' + mantissa[1:]) * (10 ** int(exponent))
            return 0.0
        except:
            return 0.0
    
    def _calculate_semi_major_axis(self, mean_motion: float) -> float:
        """Calculate semi-major axis from mean motion"""
        # Earth's gravitational parameter (km³/s²)
        mu = 398600.4418
        
        # Convert mean motion from rev/day to rad/s
        n = mean_motion * 2 * math.pi / 86400
        
        # Semi-major axis calculation: a = (μ/n²)^(1/3)
        a = (mu / (n * n)) ** (1/3)
        return a
    
    def _calculate_apogee_perigee(self, semi_major_axis: float, eccentricity: float) -> Tuple[float, float]:
        """Calculate apogee and perigee altitudes"""
        earth_radius = 6371.0  # km
        
        apogee = semi_major_axis * (1 + eccentricity) - earth_radius
        perigee = semi_major_axis * (1 - eccentricity) - earth_radius
        
        return max(0, apogee), max(0, perigee)
    
    def _classify_object(self, name: str, catalog_number: int) -> str:
        """Classify space object type based on name and catalog number"""
        name_lower = name.lower()
        
        # Debris indicators
        debris_keywords = ['debris', 'fragment', 'rocket body', 'r/b', 'deb', 'fragmentation']
        if any(keyword in name_lower for keyword in debris_keywords):
            return 'debris'
        
        # Rocket body indicators
        rocket_keywords = ['rocket', 'booster', 'stage', 'centaur', 'falcon', 'atlas']
        if any(keyword in name_lower for keyword in rocket_keywords):
            return 'rocket_body'
        
        # Satellite indicators (default for most tracked objects)
        satellite_keywords = ['sat', 'satellite', 'iss', 'station', 'telescope', 'probe']
        if any(keyword in name_lower for keyword in satellite_keywords):
            return 'satellite'
        
        # Default classification based on catalog number ranges
        if catalog_number < 10000:
            return 'satellite'
        elif catalog_number < 40000:
            return 'debris'
        else:
            return 'satellite'
    
    def _assess_risk(self, apogee: float, perigee: float, inclination: float, object_type: str) -> str:
        """Assess collision risk level"""
        avg_altitude = (apogee + perigee) / 2
        
        # High-traffic orbital regions
        leo_crowded = 400 <= avg_altitude <= 1000  # LEO congested zone
        geo_belt = 35700 <= avg_altitude <= 35900   # GEO belt
        
        # Risk factors
        risk_score = 0
        
        # Altitude-based risk
        if leo_crowded:
            risk_score += 3
        elif geo_belt:
            risk_score += 2
        elif avg_altitude < 2000:
            risk_score += 2
        
        # Inclination-based risk (sun-synchronous and polar orbits are crowded)
        if 95 <= inclination <= 105:  # Sun-synchronous
            risk_score += 2
        elif inclination > 80:  # Polar
            risk_score += 1
        
        # Object type risk
        if object_type == 'debris':
            risk_score += 2
        elif object_type == 'rocket_body':
            risk_score += 1
        
        # Eccentricity risk (highly elliptical orbits cross multiple altitude bands)
        eccentricity = abs(apogee - perigee) / (apogee + perigee)
        if eccentricity > 0.1:
            risk_score += 1
        
        # Classify risk level
        if risk_score >= 6:
            return 'critical'
        elif risk_score >= 4:
            return 'high'
        elif risk_score >= 2:
            return 'medium'
        else:
            return 'low'
    
    def _epoch_to_datetime(self, year: int, day_of_year: float) -> datetime:
        """Convert TLE epoch to datetime"""
        # Handle 2-digit year
        if year < 57:
            year += 2000
        else:
            year += 1900
        
        # Create datetime from year and day of year
        base_date = datetime(year, 1, 1)
        epoch_date = base_date + timedelta(days=day_of_year - 1)
        
        return epoch_date
    
    def get_orbital_elements_summary(self, satellites: List[Dict]) -> Dict:
        """Generate summary statistics for orbital elements"""
        if not satellites:
            return {}
        
        altitudes = [sat['altitude'] for sat in satellites]
        inclinations = [sat['inclination'] for sat in satellites]
        
        # Orbit type classification
        orbit_types = {'LEO': 0, 'MEO': 0, 'GEO': 0, 'HEO': 0}
        object_types = {'satellite': 0, 'debris': 0, 'rocket_body': 0}
        risk_levels = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
        
        for sat in satellites:
            alt = sat['altitude']
            if alt < 2000:
                orbit_types['LEO'] += 1
            elif alt < 35000:
                orbit_types['MEO'] += 1
            elif 35000 <= alt <= 36000:
                orbit_types['GEO'] += 1
            else:
                orbit_types['HEO'] += 1
            
            object_types[sat['object_type']] += 1
            risk_levels[sat['risk_level']] += 1
        
        return {
            'total_objects': len(satellites),
            'altitude_stats': {
                'min': min(altitudes),
                'max': max(altitudes),
                'avg': sum(altitudes) / len(altitudes)
            },
            'inclination_stats': {
                'min': min(inclinations),
                'max': max(inclinations),
                'avg': sum(inclinations) / len(inclinations)
            },
            'orbit_distribution': orbit_types,
            'object_distribution': object_types,
            'risk_distribution': risk_levels
        }