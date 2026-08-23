// Official ISRO (Indian Space Research Organisation) Active Satellite Fleet
// 22 LEO  |  31 GEO/GSO  |  1 GTO  =  54 total active satellites

export const ISRO_SATELLITE_STATS = {
  totalActive: 54,
  leoCount: 22,
  geoCount: 31,
  gtoCount: 1,
  operator: 'ISRO / Government of India'
};

export const isroSatellites = [

  // ── 22 LOW EARTH ORBIT (LEO) ──────────────────────────────────────────────
  {
    id: 'isro-leo-1', name: 'EOS-04 (RISAT-1A)',
    orbit: 'LEO', altitude: 529, inclination: 97.5,
    latitude: 22.5, longitude: 88.4, raan: 270, velocity: 7.59,
    type: 'satellite', status: 'active',
    mission: 'Radar Imaging Earth Observation',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-2', name: 'Cartosat-3',
    orbit: 'LEO', altitude: 509, inclination: 97.5,
    latitude: 18.9, longitude: 72.8, raan: 260, velocity: 7.61,
    type: 'satellite', status: 'active',
    mission: 'High Resolution Earth Observation',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-3', name: 'EOS-06 (Oceansat-3)',
    orbit: 'LEO', altitude: 743, inclination: 98.4,
    latitude: -10.2, longitude: 55.6, raan: 280, velocity: 7.46,
    type: 'satellite', status: 'active',
    mission: 'Oceanographic Studies',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-4', name: 'EOS-01',
    orbit: 'LEO', altitude: 570, inclination: 37.0,
    latitude: 28.6, longitude: 77.2, raan: 230, velocity: 7.56,
    type: 'satellite', status: 'active',
    mission: 'Agriculture & Disaster Management',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-5', name: 'Cartosat-2F',
    orbit: 'LEO', altitude: 505, inclination: 97.4,
    latitude: 12.9, longitude: 80.2, raan: 255, velocity: 7.62,
    type: 'satellite', status: 'active',
    mission: 'Cartographic & Urban Mapping',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-6', name: 'Cartosat-2E',
    orbit: 'LEO', altitude: 505, inclination: 97.4,
    latitude: 33.4, longitude: 74.8, raan: 265, velocity: 7.62,
    type: 'satellite', status: 'active',
    mission: 'Remote Sensing',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-7', name: 'Cartosat-2D',
    orbit: 'LEO', altitude: 505, inclination: 97.4,
    latitude: 8.5, longitude: 76.9, raan: 275, velocity: 7.62,
    type: 'satellite', status: 'active',
    mission: 'Earth Observation',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-8', name: 'Cartosat-2C',
    orbit: 'LEO', altitude: 505, inclination: 97.4,
    latitude: 25.3, longitude: 82.9, raan: 245, velocity: 7.62,
    type: 'satellite', status: 'active',
    mission: 'High Resolution Cartography',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-9', name: 'Resourcesat-2A',
    orbit: 'LEO', altitude: 817, inclination: 98.7,
    latitude: 16.5, longitude: 96.2, raan: 285, velocity: 7.41,
    type: 'satellite', status: 'active',
    mission: 'Resource Monitoring',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-10', name: 'Resourcesat-2',
    orbit: 'LEO', altitude: 817, inclination: 98.7,
    latitude: -5.1, longitude: 38.5, raan: 295, velocity: 7.41,
    type: 'satellite', status: 'active',
    mission: 'Multispectral Imaging',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-11', name: 'RISAT-2BR1',
    orbit: 'LEO', altitude: 556, inclination: 37.0,
    latitude: 20.7, longitude: 85.8, raan: 220, velocity: 7.57,
    type: 'satellite', status: 'active',
    mission: 'Radar Reconnaissance',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-12', name: 'RISAT-2B',
    orbit: 'LEO', altitude: 556, inclination: 37.0,
    latitude: 40.2, longitude: 68.3, raan: 210, velocity: 7.57,
    type: 'satellite', status: 'active',
    mission: 'X-Band Synthetic Aperture Radar',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-13', name: 'XPoSat',
    orbit: 'LEO', altitude: 650, inclination: 6.0,
    latitude: 4.8, longitude: 120.4, raan: 180, velocity: 7.52,
    type: 'satellite', status: 'active',
    mission: 'X-ray Polarimetry Astronomy',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-14', name: 'Astrosat',
    orbit: 'LEO', altitude: 650, inclination: 6.0,
    latitude: 2.2, longitude: 145.6, raan: 190, velocity: 7.52,
    type: 'satellite', status: 'active',
    mission: 'Space Astronomy Observatory',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-15', name: 'SARAL (AltiKa)',
    orbit: 'LEO', altitude: 786, inclination: 98.5,
    latitude: -30.4, longitude: 20.1, raan: 300, velocity: 7.43,
    type: 'satellite', status: 'active',
    mission: 'Ocean Topography & Altimetry',
    country: 'India', operator: 'ISRO / CNES', risk: 'low'
  },
  {
    id: 'isro-leo-16', name: 'INS-1C',
    orbit: 'LEO', altitude: 505, inclination: 97.4,
    latitude: 14.1, longitude: 103.7, raan: 250, velocity: 7.62,
    type: 'satellite', status: 'active',
    mission: 'Nanosatellite Technology Demo',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-17', name: 'Anand (Pixxel)',
    orbit: 'LEO', altitude: 510, inclination: 97.5,
    latitude: 30.0, longitude: 60.3, raan: 260, velocity: 7.61,
    type: 'satellite', status: 'active',
    mission: 'Hyperspectral Earth Imaging',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-18', name: 'YouthSat',
    orbit: 'LEO', altitude: 817, inclination: 98.7,
    latitude: 50.6, longitude: 40.2, raan: 310, velocity: 7.41,
    type: 'satellite', status: 'active',
    mission: 'Stellar & Ionospheric Physics',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-19', name: 'IMS-1 (Third Eye)',
    orbit: 'LEO', altitude: 817, inclination: 98.7,
    latitude: 60.1, longitude: 130.5, raan: 320, velocity: 7.41,
    type: 'satellite', status: 'active',
    mission: 'Multispectral Remote Sensing',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-20', name: 'EOS-02',
    orbit: 'LEO', altitude: 471, inclination: 37.1,
    latitude: -15.3, longitude: 160.8, raan: 200, velocity: 7.64,
    type: 'satellite', status: 'active',
    mission: 'Optical & Infrared Observation',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-21', name: 'EOS-07',
    orbit: 'LEO', altitude: 450, inclination: 37.2,
    latitude: -25.8, longitude: -60.4, raan: 205, velocity: 7.65,
    type: 'satellite', status: 'active',
    mission: 'Millimeter-wave Payload Demo',
    country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-leo-22', name: 'EOS-08',
    orbit: 'LEO', altitude: 475, inclination: 37.4,
    latitude: 45.2, longitude: -80.1, raan: 215, velocity: 7.63,
    type: 'satellite', status: 'active',
    mission: 'Microsatellite Payload Demo',
    country: 'India', operator: 'ISRO', risk: 'low'
  },

  // ── 31 GEOSTATIONARY / GSO ────────────────────────────────────────────────
  // All GEO at 35786 km, spread across Indian Ocean / Asia-Pacific longitudes
  {
    id: 'isro-geo-1', name: 'GSAT-24',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 83.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'DTH Telecommunication', country: 'India', operator: 'NSIL', risk: 'low'
  },
  {
    id: 'isro-geo-2', name: 'GSAT-30',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 83.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'High Power Telecommunication', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-3', name: 'GSAT-31',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 48.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Ku-band Telecommunications', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-4', name: 'GSAT-7A',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Defense Communication', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-5', name: 'GSAT-7 (Rukmini)',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 68.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Naval Communication', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-6', name: 'GSAT-29',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'High Throughput Satellite', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-7', name: 'GSAT-11',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Heavyweight Broadband Satellite', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-8', name: 'GSAT-19',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 48.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'HTS Communication Demo', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-9', name: 'GSAT-17',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 93.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'C & S-band Telecom', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-10', name: 'GSAT-15',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 93.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'DTH & Radio Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-11', name: 'GSAT-16',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Ku & C-band Telecom', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-12', name: 'GSAT-14',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Ku-band Communication', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-13', name: 'GSAT-10',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 83.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Communication & IRNSS Augmentation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-14', name: 'GSAT-8 (GRAMSAT)',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Communication & GAGAN Payload', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-15', name: 'GSAT-6',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 83.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'S-band Mobile Communication', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-16', name: 'INSAT-4B',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 93.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Telecommunications Backup', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-17', name: 'INSAT-4CR',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'High Power Transponder', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-18', name: 'INSAT-3DR',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Meteorology & Search/Rescue', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-19', name: 'INSAT-3D',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 82.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Advanced Meteorological Observatory', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-20', name: 'INSAT-3DS',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 91.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Climate & Ocean Monitoring', country: 'India', operator: 'ISRO', risk: 'low'
  },
  // NavIC / IRNSS constellation — 4 GSO (inclined ~29°) + 3 GEO
  {
    id: 'isro-geo-21', name: 'IRNSS-1A',
    orbit: 'GSO', altitude: 35786, inclination: 29.0,
    latitude: 29.0, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-22', name: 'IRNSS-1B',
    orbit: 'GSO', altitude: 35786, inclination: 29.0,
    latitude: -29.0, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-23', name: 'IRNSS-1C',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 83.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-24', name: 'IRNSS-1D',
    orbit: 'GSO', altitude: 35786, inclination: 29.0,
    latitude: 29.0, longitude: 111.75, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-25', name: 'IRNSS-1E',
    orbit: 'GSO', altitude: 35786, inclination: 29.0,
    latitude: -29.0, longitude: 111.75, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-26', name: 'IRNSS-1F',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 32.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-27', name: 'IRNSS-1G',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 129.5, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-28', name: 'IRNSS-1I',
    orbit: 'GSO', altitude: 35786, inclination: 29.5,
    latitude: 29.5, longitude: 55.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC Regional Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-29', name: 'NVS-01',
    orbit: 'GSO', altitude: 35786, inclination: 29.5,
    latitude: -29.5, longitude: 111.75, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'NavIC 2nd Generation Navigation', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-30', name: 'Kalpana-1 (METSAT-1)',
    orbit: 'GEO', altitude: 35786, inclination: 0.1,
    latitude: 0, longitude: 74.0, raan: 0, velocity: 3.07,
    type: 'satellite', status: 'active',
    mission: 'Meteorological Satellite', country: 'India', operator: 'ISRO', risk: 'low'
  },
  {
    id: 'isro-geo-31', name: 'HysIS',
    orbit: 'LEO', altitude: 636, inclination: 97.9,
    latitude: 18.0, longitude: 66.0, raan: 290, velocity: 7.52,
    type: 'satellite', status: 'active',
    mission: 'Hyperspectral Imaging', country: 'India', operator: 'ISRO', risk: 'low'
  },

  // ── 1 GEO TRANSFER ORBIT ──────────────────────────────────────────────────
  {
    id: 'isro-gto-1', name: 'NVS-02',
    orbit: 'GTO', altitude: 18000, inclination: 19.3,
    latitude: 10.2, longitude: 78.5, raan: 30, velocity: 4.80,
    type: 'satellite', status: 'active',
    mission: 'NavIC 2nd Gen (GTO Transfer Orbit)', country: 'India', operator: 'ISRO', risk: 'low'
  }
];
