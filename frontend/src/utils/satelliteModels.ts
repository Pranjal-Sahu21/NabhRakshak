// @ts-nocheck
import * as THREE from 'three';

// Enhanced satellite model creation utilities
export const SatelliteModels = {
  
  // Create International Space Station model
  createISS: () => {
    const issGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.12);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    issGroup.add(body);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.25, 0.01, 0.08);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.15, 0, 0);
    issGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.15, 0, 0);
    issGroup.add(rightPanel);
    
    // Communication arrays
    const arrayGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.06);
    const arrayMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 4; i++) {
      const array = new THREE.Mesh(arrayGeometry, arrayMaterial);
      const angle = (i / 4) * Math.PI * 2;
      array.position.set(
        Math.cos(angle) * 0.05,
        0.03,
        Math.sin(angle) * 0.05
      );
      issGroup.add(array);
    }
    
    return issGroup;
  },
  
  // Create Hubble Space Telescope model
  createHubble: () => {
    const hubbleGroup = new THREE.Group();
    
    // Main telescope body
    const bodyGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.1);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x888888,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    hubbleGroup.add(body);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.04);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.05, 0, 0);
    hubbleGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.05, 0, 0);
    hubbleGroup.add(rightPanel);
    
    // Telescope aperture
    const apertureGeometry = new THREE.RingGeometry(0.02, 0.025, 16);
    const apertureMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide
    });
    const aperture = new THREE.Mesh(apertureGeometry, apertureMaterial);
    aperture.position.y = 0.05;
    aperture.rotation.x = Math.PI / 2;
    hubbleGroup.add(aperture);
    
    return hubbleGroup;
  },
  
  // Create GPS satellite model
  createGPS: () => {
    const gpsGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.06);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0066ff,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    gpsGroup.add(body);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.12, 0.01, 0.06);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    
    const topPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    topPanel.position.y = 0.03;
    gpsGroup.add(topPanel);
    
    const bottomPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    bottomPanel.position.y = -0.03;
    gpsGroup.add(bottomPanel);
    
    // Antenna
    const antennaGeometry = new THREE.ConeGeometry(0.01, 0.03);
    const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 0.045;
    gpsGroup.add(antenna);
    
    return gpsGroup;
  },
  
  // Create Starlink satellite model
  createStarlink: () => {
    const starlinkGroup = new THREE.Group();
    
    // Flat rectangular body
    const bodyGeometry = new THREE.BoxGeometry(0.06, 0.01, 0.04);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    starlinkGroup.add(body);
    
    // Solar panel (integrated)
    const panelGeometry = new THREE.BoxGeometry(0.06, 0.005, 0.04);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = 0.008;
    starlinkGroup.add(panel);
    
    // Phased array antenna
    const antennaGeometry = new THREE.BoxGeometry(0.04, 0.002, 0.03);
    const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = -0.008;
    starlinkGroup.add(antenna);
    
    return starlinkGroup;
  },
  
  // Create weather satellite model
  createWeatherSat: () => {
    const weatherGroup = new THREE.Group();
    
    // Cylindrical body
    const bodyGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.08);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    weatherGroup.add(body);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.1, 0.01, 0.05);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.06, 0, 0);
    weatherGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.06, 0, 0);
    weatherGroup.add(rightPanel);
    
    // Weather instruments
    const instrumentGeometry = new THREE.SphereGeometry(0.01);
    const instrumentMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 3; i++) {
      const instrument = new THREE.Mesh(instrumentGeometry, instrumentMaterial);
      instrument.position.set(0, 0.05, (i - 1) * 0.02);
      weatherGroup.add(instrument);
    }
    
    return weatherGroup;
  },
  
  // Create Earth observation satellite model
  createEarthObsSat: () => {
    const obsGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(0.05, 0.03, 0.08);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff,
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    obsGroup.add(body);
    
    // Camera/sensor
    const cameraGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.04);
    const cameraMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.position.y = -0.035;
    camera.rotation.x = Math.PI / 2;
    obsGroup.add(camera);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.04);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x003366,
      transparent: true,
      opacity: 0.8
    });
    
    const topPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    topPanel.position.y = 0.02;
    obsGroup.add(topPanel);
    
    return obsGroup;
  },
  
  // Create space debris model
  createDebris: (size = 'medium') => {
    const debrisGroup = new THREE.Group();
    
    let geometry, material;
    
    switch (size) {
      case 'small':
        geometry = new THREE.TetrahedronGeometry(0.01);
        material = new THREE.MeshBasicMaterial({ 
          color: 0xff4444,
          transparent: true,
          opacity: 0.6
        });
        break;
      case 'large':
        geometry = new THREE.BoxGeometry(0.04, 0.02, 0.06);
        material = new THREE.MeshBasicMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.7
        });
        break;
      default: // medium
        geometry = new THREE.OctahedronGeometry(0.02);
        material = new THREE.MeshBasicMaterial({ 
          color: 0xff6666,
          transparent: true,
          opacity: 0.6
        });
    }
    
    const debris = new THREE.Mesh(geometry, material);
    debrisGroup.add(debris);
    
    // Add some random rotation for realism
    debris.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    return debrisGroup;
  },
  
  // Get appropriate model based on satellite type
  getModelForType: (type, data = {}) => {
    switch (type) {
      case 'space_station':
        return SatelliteModels.createISS();
      case 'observatory':
        return SatelliteModels.createHubble();
      case 'navigation':
        return SatelliteModels.createGPS();
      case 'communication':
        return SatelliteModels.createStarlink();
      case 'weather':
        return SatelliteModels.createWeatherSat();
      case 'earth_observation':
        return SatelliteModels.createEarthObsSat();
      case 'debris':
        return SatelliteModels.createDebris(data.size || 'medium');
      default:
        // Generic satellite
        const genericGroup = new THREE.Group();
        const geometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x888888,
          transparent: true,
          opacity: 0.8
        });
        const satellite = new THREE.Mesh(geometry, material);
        genericGroup.add(satellite);
        return genericGroup;
    }
  }
};

// Orbital path creation utilities
export const OrbitVisualizer = {
  
  // Create orbital path with enhanced visualization
  createOrbitPath: (satData, segments = 128) => {
    const orbitGroup = new THREE.Group();
    
    // Main orbit line
    const orbitPoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      // This would use the orbital mechanics from satelliteData.js
      // For now, creating a simple circular orbit
      const radius = (6371 + satData.altitude) / 6371; // Normalized to Earth radius
      orbitPoints.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
    }
    
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: OrbitVisualizer.getOrbitColor(satData.type),
      transparent: true,
      opacity: 0.4,
      linewidth: 2
    });
    
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    
    // Apply orbital inclination and other parameters
    if (satData.inclination) {
      orbitLine.rotation.x = satData.inclination * Math.PI / 180;
    }
    if (satData.longitudeOfAscendingNode) {
      orbitLine.rotation.y = satData.longitudeOfAscendingNode * Math.PI / 180;
    }
    
    orbitGroup.add(orbitLine);
    
    // Add orbit direction indicator
    const directionGeometry = new THREE.ConeGeometry(0.01, 0.03);
    const directionMaterial = new THREE.MeshBasicMaterial({ 
      color: orbitMaterial.color 
    });
    const directionIndicator = new THREE.Mesh(directionGeometry, directionMaterial);
    
    // Position at 90 degrees on the orbit
    const indicatorRadius = (6371 + satData.altitude) / 6371;
    directionIndicator.position.set(0, 0, indicatorRadius);
    directionIndicator.rotation.x = -Math.PI / 2;
    
    orbitGroup.add(directionIndicator);
    
    return orbitGroup;
  },
  
  // Get color based on satellite type
  getOrbitColor: (type) => {
    const colors = {
      'space_station': 0x00ffff,
      'observatory': 0xff6600,
      'navigation': 0x0066ff,
      'communication': 0x00ff00,
      'weather': 0xffff00,
      'earth_observation': 0xff00ff,
      'debris': 0xff0000,
      'default': 0x888888
    };
    
    return colors[type] || colors.default;
  },
  
  // Create ground track visualization
  createGroundTrack: (satData, duration = 3600) => {
    const trackPoints = [];
    const timeStep = duration / 100; // 100 points over the duration
    
    for (let i = 0; i <= 100; i++) {
      const time = i * timeStep;
      // This would calculate the ground track using orbital mechanics
      // For now, creating a simple sinusoidal pattern
      const longitude = (time / duration) * 360 - 180;
      const latitude = Math.sin(longitude * Math.PI / 180) * satData.inclination || 0;
      
      // Convert to 3D coordinates on Earth surface
      const phi = latitude * Math.PI / 180;
      const theta = longitude * Math.PI / 180;
      
      trackPoints.push(new THREE.Vector3(
        Math.cos(phi) * Math.cos(theta),
        Math.sin(phi),
        Math.cos(phi) * Math.sin(theta)
      ));
    }
    
    const trackGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints);
    const trackMaterial = new THREE.LineBasicMaterial({
      color: OrbitVisualizer.getOrbitColor(satData.type),
      transparent: true,
      opacity: 0.6
    });
    
    return new THREE.Line(trackGeometry, trackMaterial);
  }
};