// @ts-nocheck
import * as THREE from 'three';
import * as satellite from 'satellite.js';

export class OrbitalObjects {
  constructor(scene) {
    this.scene = scene;

    this.satellitesGroup = new THREE.Group();
    this.debrisGroup = new THREE.Group();
    
    this.scene.add(this.satellitesGroup);
    this.scene.add(this.debrisGroup);

    // Save tracking structures to update positions easily
    this.satellitesList = [];
    this.debrisList = [];
    this.showOrbits = true; // Orbit lines visibility state

    // Constants for orbital mechanics
    this.EARTH_RADIUS = 6371; // km
    this.MU = 398600.4418;    // Earth's gravitational parameter (km³/s²)

    // Procedural textures
    this.foilBumpMap = this.createFoilBumpMap();
    this.solarPanelTexture = this.createSolarPanelTexture();

    // Shared Geometries (instantiated once, reused across all updates)
    this.satelliteGeometry = new THREE.BoxGeometry(0.002, 0.002, 0.002);
    this.panelGeometry = new THREE.BoxGeometry(0.005, 0.0001, 0.0025);
    this.antennaGeometry = new THREE.CylinderGeometry(0.00015, 0.00015, 0.003);
    this.strutGeometry = new THREE.CylinderGeometry(0.00015, 0.00015, 0.004);
    this.dishGeometry = new THREE.ConeGeometry(0.0015, 0.0008, 16, 1, true);
    this.dishSupportGeometry = new THREE.CylinderGeometry(0.0001, 0.0001, 0.0012);
    this.directionGeometry = new THREE.ConeGeometry(0.001, 0.003, 8);
    this.velocityGeometry = new THREE.CylinderGeometry(0.0001, 0.0001, 0.008);
    this.commRangeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    this.groundTrackGeometry = new THREE.SphereGeometry(1.001, 16, 16);
    this.debrisGeometry = new THREE.SphereGeometry(0.005, 6, 6);
    this.hitBoxGeometry = new THREE.SphereGeometry(0.04, 8, 8);

    // Shared Materials (instantiated once, reused across all updates)
    this.panelMaterial = new THREE.MeshStandardMaterial({
      map: this.solarPanelTexture,
      metalness: 0.8,
      roughness: 0.2
    });

    this.antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 1.0,
      roughness: 0.1
    });

    this.velocityMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.7
    });

    this.commRangeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    this.activeSatelliteMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5c158, // Golden MLI foil
      emissive: 0x3d3012, // Amber emissive glow so it is visible in the dark
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.3,
      bumpMap: this.foilBumpMap,
      bumpScale: 0.005
    });

    this.inactiveSatelliteMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c8c8c, // Silver MLI foil
      emissive: 0x1f1f1f, // Grey emissive glow
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.4,
      bumpMap: this.foilBumpMap,
      bumpScale: 0.005
    });

    this.activeDirectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.9
    });

    this.inactiveDirectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.9
    });

    this.activeGroundTrackMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    this.inactiveGroundTrackMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    this.activeOrbitMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });

    this.inactiveOrbitMaterial = new THREE.LineBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });

    this.activeFutureOrbitMaterial = new THREE.LineBasicMaterial({
      color: 0x88ff00,
      transparent: true,
      opacity: 0.3,
      linewidth: 1
    });

    this.inactiveFutureOrbitMaterial = new THREE.LineBasicMaterial({
      color: 0xff8844,
      transparent: true,
      opacity: 0.3,
      linewidth: 1
    });

    this.debrisMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0x220000,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.9
    });

    this.hitBoxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0
    });
  }

  // Calculate orbital period using Kepler's third law
  calculateOrbitalPeriod(altitude) {
    const semiMajorAxis = this.EARTH_RADIUS + altitude;
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / this.MU);
  }

  // Calculate mean motion (radians per second)
  calculateMeanMotion(altitude) {
    const period = this.calculateOrbitalPeriod(altitude);
    return (2 * Math.PI) / period;
  }

  // Convert orbital elements to Cartesian coordinates
  orbitalToCartesian(altitude, inclination, raan, argOfPerigee, meanAnomaly) {
    const radius = (this.EARTH_RADIUS + altitude) / this.EARTH_RADIUS; // Normalized
    
    const incRad = inclination * Math.PI / 180;
    const raanRad = raan * Math.PI / 180;
    const argPerigeeRad = argOfPerigee * Math.PI / 180;
    const meanAnomalyRad = meanAnomaly * Math.PI / 180;
    
    // For circular orbits, true anomaly ≈ mean anomaly
    const trueAnomaly = meanAnomalyRad;
    
    // Position in orbital plane
    const x_orbital = radius * Math.cos(trueAnomaly);
    const y_orbital = radius * Math.sin(trueAnomaly);
    const z_orbital = 0;
    
    // Rotations
    // 1. Rotate by argument of perigee
    const x1 = x_orbital * Math.cos(argPerigeeRad) - y_orbital * Math.sin(argPerigeeRad);
    const y1 = x_orbital * Math.sin(argPerigeeRad) + y_orbital * Math.cos(argPerigeeRad);
    const z1 = z_orbital;
    
    // 2. Rotate by inclination
    const x2 = x1;
    const y2 = y1 * Math.cos(incRad) - z1 * Math.sin(incRad);
    const z2 = y1 * Math.sin(incRad) + z1 * Math.cos(incRad);
    
    // 3. Rotate by RAAN
    const x3 = x2 * Math.cos(raanRad) - y2 * Math.sin(raanRad);
    const y3 = x2 * Math.sin(raanRad) + y2 * Math.cos(raanRad);
    const z3 = z2;
    
    return { x: x3, y: y3, z: z3 };
  }

  updateSatellites(satellitesData) {
    // Clear existing satellites and lines
    this.clearGroup(this.satellitesGroup);
    this.satellitesList = [];

    satellitesData.forEach((satellite) => {
      const satData = {
        altitude: satellite.altitude || (400 + Math.random() * 1000),
        inclination: satellite.inclination || Math.random() * 180,
        raan: satellite.longitude || Math.random() * 360,
        argOfPerigee: Math.random() * 360,
        meanAnomaly: Math.random() * 360,
        ...satellite
      };

      const position = this.orbitalToCartesian(
        satData.altitude,
        satData.inclination,
        satData.raan,
        satData.argOfPerigee,
        satData.meanAnomaly
      );

      const satelliteGroup = new THREE.Group();

      // Main body
      const satelliteMaterial = satellite.status === 'active' 
        ? this.activeSatelliteMaterial 
        : this.inactiveSatelliteMaterial;
      const satelliteMesh = new THREE.Mesh(this.satelliteGeometry, satelliteMaterial);
      satelliteGroup.add(satelliteMesh);

      // Solar panel struts (arms)
      const leftStrut = new THREE.Mesh(this.strutGeometry, this.antennaMaterial);
      leftStrut.rotation.z = Math.PI / 2;
      leftStrut.position.set(-0.0022, 0, 0);
      satelliteGroup.add(leftStrut);

      const rightStrut = new THREE.Mesh(this.strutGeometry, this.antennaMaterial);
      rightStrut.rotation.z = -Math.PI / 2;
      rightStrut.position.set(0.0022, 0, 0);
      satelliteGroup.add(rightStrut);

      // Solar panels (angled for realism)
      const leftPanel = new THREE.Mesh(this.panelGeometry, this.panelMaterial);
      leftPanel.position.set(-0.005, 0, 0);
      leftPanel.rotation.x = Math.PI / 6;
      satelliteGroup.add(leftPanel);

      const rightPanel = new THREE.Mesh(this.panelGeometry, this.panelMaterial);
      rightPanel.position.set(0.005, 0, 0);
      rightPanel.rotation.x = Math.PI / 6;
      satelliteGroup.add(rightPanel);

      // Dish Support & Parabolic Dish Antenna (pointing towards Earth, which is -Y locally)
      const dishSupport = new THREE.Mesh(this.dishSupportGeometry, this.antennaMaterial);
      dishSupport.position.set(0, -0.002, 0);
      satelliteGroup.add(dishSupport);

      const dish = new THREE.Mesh(this.dishGeometry, this.antennaMaterial);
      dish.position.set(0, -0.0026, 0);
      dish.rotation.x = Math.PI; // point down
      satelliteGroup.add(dish);

      // Optical Camera Sensor pointing down (Y) with cyan glowing lens
      const cameraGeom = new THREE.CylinderGeometry(0.0003, 0.0003, 0.0008);
      const cameraLensGeom = new THREE.CylinderGeometry(0.0002, 0.0002, 0.0001);
      const cameraLensMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      
      const camera = new THREE.Mesh(cameraGeom, this.panelMaterial);
      camera.position.set(0.0006, -0.0018, 0.0006);
      satelliteGroup.add(camera);

      const cameraLens = new THREE.Mesh(cameraLensGeom, cameraLensMat);
      cameraLens.position.set(0.0006, -0.0022, 0.0006);
      satelliteGroup.add(cameraLens);

      // Invisible Raycasting Hitbox for easier click detection
      const hitBox = new THREE.Mesh(this.hitBoxGeometry, this.hitBoxMaterial);
      satelliteGroup.add(hitBox);

      // Position
      satelliteGroup.position.set(position.x, position.y, position.z);
      
      const meanMotion = this.calculateMeanMotion(satData.altitude);
      satelliteGroup.userData = {
        type: 'satellite',
        data: satData,
        meanAnomaly: satData.meanAnomaly * Math.PI / 180,
        meanMotion: meanMotion
      };

      // Orbit Path (dynamic geometry, custom per satellite)
      const orbitPoints = [];
      const futureOrbitPoints = [];
      const segments = 128;

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const orbitPos = this.orbitalToCartesian(
          satData.altitude,
          satData.inclination,
          satData.raan,
          satData.argOfPerigee,
          angle * 180 / Math.PI
        );
        orbitPoints.push(new THREE.Vector3(orbitPos.x, orbitPos.y, orbitPos.z));
      }

      for (let orbit = 1; orbit <= 2; orbit++) {
        for (let i = 0; i <= 50; i++) {
          const angle = (i / 50) * 2 * Math.PI;
          const perturbation = orbit * 0.002;
          const orbitPos = this.orbitalToCartesian(
            satData.altitude - perturbation * 10,
            satData.inclination + perturbation,
            satData.raan + perturbation * 5,
            satData.argOfPerigee,
            angle * 180 / Math.PI
          );
          futureOrbitPoints.push(new THREE.Vector3(orbitPos.x, orbitPos.y, orbitPos.z));
        }
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = satellite.status === 'active' 
        ? this.activeOrbitMaterial 
        : this.inactiveOrbitMaterial;
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.userData = {
        type: 'orbit',
        data: satData
      };
      orbitLine.visible = this.showOrbits;

      const futureOrbitGeometry = new THREE.BufferGeometry().setFromPoints(futureOrbitPoints);
      const futureOrbitMaterial = satellite.status === 'active' 
        ? this.activeFutureOrbitMaterial 
        : this.inactiveFutureOrbitMaterial;
      const futureOrbitLine = new THREE.Line(futureOrbitGeometry, futureOrbitMaterial);
      futureOrbitLine.visible = this.showOrbits;

      // Tracking Group and overlays
      const trackingGroup = new THREE.Group();

      const directionMaterial = satellite.status === 'active'
        ? this.activeDirectionMaterial
        : this.inactiveDirectionMaterial;
      const directionIndicator = new THREE.Mesh(this.directionGeometry, directionMaterial);

      const velocityIndicator = new THREE.Mesh(this.velocityGeometry, this.velocityMaterial);

      directionIndicator.position.copy(satelliteGroup.position);
      velocityIndicator.position.copy(satelliteGroup.position);

      directionIndicator.lookAt(
        satelliteGroup.position.x + 0.1,
        satelliteGroup.position.y,
        satelliteGroup.position.z
      );

      trackingGroup.add(directionIndicator);
      trackingGroup.add(velocityIndicator);

      satelliteGroup.userData.tracking = {
        directionIndicator,
        velocityIndicator,
        orbitLine,
        futureOrbitLine
      };

      this.satellitesGroup.add(satelliteGroup);
      this.satellitesGroup.add(orbitLine);
      this.satellitesGroup.add(futureOrbitLine);
      this.satellitesGroup.add(trackingGroup);

      this.satellitesList.push(satelliteGroup);
    });
  }

  updateDebris(debrisData) {
    this.clearGroup(this.debrisGroup);
    this.debrisList = [];

    debrisData.forEach((debrisItem, index) => {
      const phi = (90 - debrisItem.latitude) * Math.PI / 180;
      const theta = (debrisItem.longitude + 180) * Math.PI / 180;
      const radius = 1.08;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const debrisMesh = new THREE.Mesh(this.debrisGeometry, this.debrisMaterial);
      debrisMesh.position.set(x, y, z);
      debrisMesh.userData = { type: 'debris', data: debrisItem };

      this.debrisGroup.add(debrisMesh);
      this.debrisList.push(debrisMesh);
    });
  }

  update(time) {
    const deltaTime = 0.016;
    const timeAcceleration = 100;

    // Satellites orbital motion
    this.satellitesList.forEach((child, index) => {
      const satData = child.userData.data;
      let newPos;
      let velocity;

      if (satData.tle_line1 && satData.tle_line2) {
        try {
          if (!child.userData.satrec) {
            child.userData.satrec = satellite.twoline2satrec(satData.tle_line1, satData.tle_line2);
          }

          // Propagate using real epoch time
          const dateObj = new Date(time * 1000);
          const positionAndVelocity = satellite.propagate(child.userData.satrec, dateObj);
          const positionEci = positionAndVelocity.position;
          const velocityEci = positionAndVelocity.velocity;

          if (positionEci && velocityEci) {
            const gmst = satellite.gstime(dateObj);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

            const latitude = satellite.degreesLat(positionGd.latitude);
            const longitude = satellite.degreesLong(positionGd.longitude);
            const altitude = positionGd.height;

            const speed = Math.sqrt(
              velocityEci.x * velocityEci.x +
              velocityEci.y * velocityEci.y +
              velocityEci.z * velocityEci.z
            );

            child.userData.currentLatitude = latitude;
            child.userData.currentLongitude = longitude;
            child.userData.currentAltitude = altitude;
            child.userData.currentVelocity = speed;

            const phi = (90 - latitude) * Math.PI / 180;
            const theta = (longitude + 180) * Math.PI / 180;
            const radius = (6371 + altitude) / 6371;

            newPos = {
              x: radius * Math.sin(phi) * Math.cos(theta),
              y: radius * Math.cos(phi),
              z: radius * Math.sin(phi) * Math.sin(theta)
            };

            velocity = new THREE.Vector3(
              velocityEci.x,
              velocityEci.z,
              -velocityEci.y
            ).normalize();
          }
        } catch (e) {
          // ignore and fall back
        }
      }

      // Keplerian fallback if SGP4 fails or TLE is missing
      if (!newPos || !velocity) {
        child.userData.meanAnomaly += child.userData.meanMotion * deltaTime * timeAcceleration;
        const orbitPos = this.orbitalToCartesian(
          satData.altitude,
          satData.inclination,
          satData.raan,
          satData.argOfPerigee,
          child.userData.meanAnomaly * 180 / Math.PI
        );
        newPos = { x: orbitPos.x, y: orbitPos.y, z: orbitPos.z };

        const nextAnomaly = child.userData.meanAnomaly + 0.01;
        const nextPos = this.orbitalToCartesian(
          satData.altitude,
          satData.inclination,
          satData.raan,
          satData.argOfPerigee,
          nextAnomaly * 180 / Math.PI
        );
        velocity = new THREE.Vector3(
          nextPos.x - newPos.x,
          nextPos.y - newPos.y,
          nextPos.z - newPos.z
        ).normalize();
      }

      child.userData.velocity = velocity;

      // Lerp position
      child.position.lerp(new THREE.Vector3(newPos.x, newPos.y, newPos.z), 0.1);

      // Align model rotation to velocity
      child.lookAt(child.position.clone().add(velocity));
      child.rotation.z += 0.01;

      // Realism wobble
      const wobble = Math.sin(time * 5 + index) * 0.001;
      child.position.x += wobble;
      child.position.y += wobble * 0.5;

      // Update overlays
      const tracking = child.userData.tracking;
      if (tracking) {
        if (tracking.directionIndicator) {
          tracking.directionIndicator.position.copy(child.position);
          tracking.directionIndicator.lookAt(
            child.position.x + velocity.x * 0.1,
            child.position.y + velocity.y * 0.1,
            child.position.z + velocity.z * 0.1
          );
        }
        if (tracking.velocityIndicator) {
          tracking.velocityIndicator.position.copy(child.position);
          tracking.velocityIndicator.lookAt(
            child.position.x + velocity.x * 0.2,
            child.position.y + velocity.y * 0.2,
            child.position.z + velocity.z * 0.2
          );
        }
        if (tracking.orbitLine) {
          const activityPulse = 0.4 + Math.sin(time * 3 + index) * 0.2;
          tracking.orbitLine.material.opacity = satData.status === 'active' ? activityPulse : 0.2;
        }
        if (tracking.futureOrbitLine) {
          const predictionPulse = 0.2 + Math.sin(time * 1.5 + index) * 0.1;
          tracking.futureOrbitLine.material.opacity = predictionPulse;
        }
      }
    });

    // Debris motion
    this.debrisList.forEach((child, index) => {
      const debData = child.userData.data;

      if (debData && debData.tle_line1 && debData.tle_line2) {
        try {
          if (!child.userData.satrec) {
            child.userData.satrec = satellite.twoline2satrec(debData.tle_line1, debData.tle_line2);
          }

          const dateObj = new Date(time * 1000);
          const positionAndVelocity = satellite.propagate(child.userData.satrec, dateObj);
          const positionEci = positionAndVelocity.position;

          if (positionEci) {
            const gmst = satellite.gstime(dateObj);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

            const latitude = satellite.degreesLat(positionGd.latitude);
            const longitude = satellite.degreesLong(positionGd.longitude);
            const altitude = positionGd.height;

            child.userData.currentLatitude = latitude;
            child.userData.currentLongitude = longitude;
            child.userData.currentAltitude = altitude;

            const phi = (90 - latitude) * Math.PI / 180;
            const theta = (longitude + 180) * Math.PI / 180;
            const radius = (6371 + altitude) / 6371;

            child.position.set(
              radius * Math.sin(phi) * Math.cos(theta),
              radius * Math.cos(phi),
              radius * Math.sin(phi) * Math.sin(theta)
            );
            return;
          }
        } catch (e) {
          // Fall back on error
        }
      }

      // Fallback
      const radius = 1.08;
      const speed = 0.3 + (index % 5) * 0.1;
      const angle = time * speed + index * 0.5;

      child.position.x = radius * Math.cos(angle);
      child.position.z = radius * Math.sin(angle);
    });
  }

  getSatelliteMesh(satelliteId) {
    return this.satellitesList.find(child => child.userData.data && child.userData.data.id === satelliteId);
  }

  setShowOrbits(show) {
    this.showOrbits = show;
    this.satellitesList.forEach(child => {
      const tracking = child.userData.tracking;
      if (tracking) {
        if (tracking.orbitLine) tracking.orbitLine.visible = show;
        if (tracking.futureOrbitLine) tracking.futureOrbitLine.visible = show;
      }
    });
  }

  getInteractiveObjects() {
    const objects = [...this.satellitesList, ...this.debrisList];
    this.satellitesList.forEach(sat => {
      if (sat.userData.tracking && sat.userData.tracking.orbitLine) {
        objects.push(sat.userData.tracking.orbitLine);
      }
    });
    return objects;
  }

  clearGroup(group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      this.disposeObject(obj);
    }
  }

  disposeObject(obj) {
    // Only dispose of non-shared dynamic geometries
    if (obj.geometry && !this.isSharedGeometry(obj.geometry)) {
      obj.geometry.dispose();
    }
    
    // Recursively dispose of children
    if (obj.children) {
      obj.children.forEach(child => this.disposeObject(child));
    }
  }

  isSharedGeometry(geom) {
    return geom === this.satelliteGeometry ||
           geom === this.panelGeometry ||
           geom === this.antennaGeometry ||
           geom === this.directionGeometry ||
           geom === this.velocityGeometry ||
           geom === this.commRangeGeometry ||
           geom === this.groundTrackGeometry ||
           geom === this.debrisGeometry ||
           geom === this.strutGeometry ||
           geom === this.dishGeometry ||
           geom === this.dishSupportGeometry ||
           geom === this.hitBoxGeometry;
  }

  dispose() {
    this.clearGroup(this.satellitesGroup);
    this.clearGroup(this.debrisGroup);
    
    // Remove groups from scene
    this.scene.remove(this.satellitesGroup);
    this.scene.remove(this.debrisGroup);

    // Dispose of all shared geometries
    this.satelliteGeometry.dispose();
    this.panelGeometry.dispose();
    this.antennaGeometry.dispose();
    this.strutGeometry.dispose();
    this.dishGeometry.dispose();
    this.dishSupportGeometry.dispose();
    this.directionGeometry.dispose();
    this.velocityGeometry.dispose();
    this.commRangeGeometry.dispose();
    this.groundTrackGeometry.dispose();
    this.debrisGeometry.dispose();
    this.hitBoxGeometry.dispose();

    // Dispose of textures
    this.foilBumpMap.dispose();
    this.solarPanelTexture.dispose();

    // Dispose of all shared materials
    this.panelMaterial.dispose();
    this.antennaMaterial.dispose();
    this.velocityMaterial.dispose();
    this.commRangeMaterial.dispose();
    this.activeSatelliteMaterial.dispose();
    this.inactiveSatelliteMaterial.dispose();
    this.activeDirectionMaterial.dispose();
    this.inactiveDirectionMaterial.dispose();
    this.activeGroundTrackMaterial.dispose();
    this.inactiveGroundTrackMaterial.dispose();
    this.activeOrbitMaterial.dispose();
    this.inactiveOrbitMaterial.dispose();
    this.activeFutureOrbitMaterial.dispose();
    this.inactiveFutureOrbitMaterial.dispose();
    this.debrisMaterial.dispose();
    this.hitBoxMaterial.dispose();

    this.satellitesList = [];
    this.debrisList = [];
  }

  createFoilBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Fill with base grey (no bump)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw noise/crinkle pattern using random gradients/shapes
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const r = Math.random() * 15 + 5;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const val = Math.floor(Math.random() * 80) - 40; // positive/negative bump
      grad.addColorStop(0, `rgba(${128 + val}, ${128 + val}, ${128 + val}, 0.5)`);
      grad.addColorStop(1, 'rgba(128, 128, 128, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createSolarPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Base blue color for solar cells
    ctx.fillStyle = '#08172c';
    ctx.fillRect(0, 0, 256, 128);
    
    // Draw cells grid
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    const cols = 12;
    const rows = 6;
    const cellW = 256 / cols;
    const cellH = 128 / rows;
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Cell background
        ctx.fillStyle = '#0b2447';
        ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
        
        // Draw grid details inside cell
        ctx.strokeStyle = '#1e40af';
        ctx.strokeRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
        
        // Specular line
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(i * cellW + cellW / 2, j * cellH + 2);
        ctx.lineTo(i * cellW + cellW / 2, j * cellH + cellH - 2);
        ctx.stroke();
      }
    }
    
    // Draw outer golden frame
    ctx.strokeStyle = '#cca43b'; // gold
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 254, 126);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
