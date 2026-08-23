import * as THREE from 'three';

// Performance optimization utilities for the 3D globe
export const PerformanceOptimizer = {
  
  // Level of Detail (LOD) management for satellites
  createLODSatellite: (highDetailModel, mediumDetailModel, lowDetailModel) => {
    const lod = new THREE.LOD();
    
    // High detail for close viewing (distance < 5 units)
    if (highDetailModel) {
      lod.addLevel(highDetailModel, 0);
    }
    
    // Medium detail for medium distance (5-15 units)
    if (mediumDetailModel) {
      lod.addLevel(mediumDetailModel, 5);
    }
    
    // Low detail for far viewing (>15 units)
    if (lowDetailModel) {
      lod.addLevel(lowDetailModel, 15);
    } else {
      // Fallback to simple geometry
      const simpleGeometry = new THREE.SphereGeometry(0.01, 6, 6);
      const simpleMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const simpleMesh = new THREE.Mesh(simpleGeometry, simpleMaterial);
      lod.addLevel(simpleMesh, 15);
    }
    
    return lod;
  },
  
  // Frustum culling for satellites outside view
  updateVisibility: (satellites, camera) => {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    satellites.forEach(satellite => {
      if (satellite.userData && satellite.userData.type === 'satellite') {
        const sphere = new THREE.Sphere(satellite.position, 0.1);
        satellite.visible = frustum.intersectsSphere(sphere);
      }
    });
  },
  
  // Batch update satellite positions for better performance
  batchUpdateSatellites: (satellites, deltaTime, speed, orbitalMechanics) => {
    const positions = [];
    const updates = [];
    
    satellites.forEach((satellite, index) => {
      if (satellite.userData && satellite.userData.type === 'satellite') {
        const satData = satellite.userData;
        
        // Update mean anomaly
        satData.currentMeanAnomaly += satData.meanMotion * deltaTime * speed;
        satData.currentMeanAnomaly = satData.currentMeanAnomaly % (2 * Math.PI);
        
        // Calculate new position
        const position = orbitalMechanics.orbitalToCartesian(
          satData.altitude,
          satData.inclination,
          satData.longitudeOfAscendingNode,
          satData.argumentOfPerigee,
          satData.currentMeanAnomaly * 180 / Math.PI
        );
        
        // Scale position
        const scaledPosition = {
          x: position.x / orbitalMechanics.EARTH_RADIUS,
          y: position.y / orbitalMechanics.EARTH_RADIUS,
          z: position.z / orbitalMechanics.EARTH_RADIUS
        };
        
        updates.push({ satellite, position: scaledPosition });
      }
    });
    
    // Apply all position updates at once
    updates.forEach(({ satellite, position }) => {
      satellite.position.set(position.x, position.y, position.z);
    });
    
    return updates.length;
  },
  
  // Optimize orbit line rendering
  createOptimizedOrbitLine: (satData, segments = 32) => {
    // Use fewer segments for distant orbits
    const distance = satData.altitude;
    let actualSegments = segments;
    
    if (distance > 10000) {
      actualSegments = Math.max(16, segments / 2);
    } else if (distance > 5000) {
      actualSegments = Math.max(24, segments * 0.75);
    }
    
    const orbitPoints = [];
    for (let i = 0; i <= actualSegments; i++) {
      const angle = (i / actualSegments) * 2 * Math.PI;
      const radius = (6371 + satData.altitude) / 6371;
      
      orbitPoints.push(new THREE.Vector3(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      ));
    }
    
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: PerformanceOptimizer.getOrbitColor(satData.type),
      transparent: true,
      opacity: 0.4
    });
    
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    
    // Apply orbital transformations
    if (satData.inclination) {
      orbitLine.rotation.x = satData.inclination * Math.PI / 180;
    }
    if (satData.longitudeOfAscendingNode) {
      orbitLine.rotation.y = satData.longitudeOfAscendingNode * Math.PI / 180;
    }
    
    return orbitLine;
  },
  
  // Get orbit color based on satellite type
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
  
  // Memory management for satellite labels
  optimizeLabels: (satellites, camera) => {
    const cameraPosition = camera.position;
    const maxLabelDistance = 10; // Only show labels within this distance
    
    satellites.forEach(satellite => {
      const labels = satellite.children.filter(child => 
        child.userData && child.userData.type === 'label'
      );
      
      labels.forEach(label => {
        const distance = cameraPosition.distanceTo(satellite.position);
        label.visible = distance < maxLabelDistance;
        
        // Scale labels based on distance
        if (label.visible) {
          const scale = Math.max(0.1, Math.min(1, maxLabelDistance / distance));
          label.scale.set(scale * 0.3, scale * 0.075, 1);
        }
      });
    });
  },
  
  // Adaptive quality based on performance
  adaptiveQuality: {
    targetFPS: 60,
    currentFPS: 60,
    frameCount: 0,
    lastTime: 0,
    qualityLevel: 'high', // 'high', 'medium', 'low'
    
    update: function(currentTime) {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) { // Update every second
        this.currentFPS = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Adjust quality based on FPS
        if (this.currentFPS < 30 && this.qualityLevel !== 'low') {
          this.qualityLevel = 'low';
          return 'reduce_quality';
        } else if (this.currentFPS < 45 && this.qualityLevel === 'high') {
          this.qualityLevel = 'medium';
          return 'reduce_quality';
        } else if (this.currentFPS > 55 && this.qualityLevel !== 'high') {
          this.qualityLevel = 'high';
          return 'increase_quality';
        }
      }
      
      return 'maintain';
    },
    
    getSettings: function() {
      switch (this.qualityLevel) {
        case 'low':
          return {
            orbitSegments: 16,
            maxVisibleSatellites: 20,
            showLabels: false,
            showOrbits: false,
            lodDistance: [2, 8, 20]
          };
        case 'medium':
          return {
            orbitSegments: 32,
            maxVisibleSatellites: 50,
            showLabels: true,
            showOrbits: true,
            lodDistance: [3, 10, 25]
          };
        case 'high':
        default:
          return {
            orbitSegments: 64,
            maxVisibleSatellites: 100,
            showLabels: true,
            showOrbits: true,
            lodDistance: [5, 15, 35]
          };
      }
    }
  },
  
  // Optimize rendering by grouping similar objects
  createInstancedSatellites: (satellites, maxInstances = 100) => {
    const instanceGroups = {};
    
    satellites.forEach(satData => {
      const type = satData.type || 'default';
      if (!instanceGroups[type]) {
        instanceGroups[type] = [];
      }
      instanceGroups[type].push(satData);
    });
    
    const instancedMeshes = {};
    
    Object.keys(instanceGroups).forEach(type => {
      const group = instanceGroups[type];
      const count = Math.min(group.length, maxInstances);
      
      if (count > 1) {
        // Create instanced geometry for this type
        let geometry, material;
        
        switch (type) {
          case 'communication':
            geometry = new THREE.BoxGeometry(0.03, 0.03, 0.03);
            material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            break;
          case 'navigation':
            geometry = new THREE.OctahedronGeometry(0.025);
            material = new THREE.MeshBasicMaterial({ color: 0x0066ff });
            break;
          default:
            geometry = new THREE.SphereGeometry(0.02, 8, 8);
            material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        }
        
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        const matrix = new THREE.Matrix4();
        
        group.slice(0, count).forEach((satData, index) => {
          // Calculate position (simplified)
          const radius = (6371 + satData.altitude) / 6371;
          const angle = (index / count) * Math.PI * 2;
          
          matrix.setPosition(
            radius * Math.cos(angle),
            0,
            radius * Math.sin(angle)
          );
          
          instancedMesh.setMatrixAt(index, matrix);
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMeshes[type] = instancedMesh;
      }
    });
    
    return instancedMeshes;
  }
};

// Performance monitoring utilities
export const PerformanceMonitor = {
  stats: {
    frameTime: 0,
    renderTime: 0,
    updateTime: 0,
    triangles: 0,
    drawCalls: 0
  },
  
  startFrame: function() {
    this.frameStart = performance.now();
  },
  
  endFrame: function() {
    this.stats.frameTime = performance.now() - this.frameStart;
  },
  
  startRender: function() {
    this.renderStart = performance.now();
  },
  
  endRender: function() {
    this.stats.renderTime = performance.now() - this.renderStart;
  },
  
  startUpdate: function() {
    this.updateStart = performance.now();
  },
  
  endUpdate: function() {
    this.stats.updateTime = performance.now() - this.updateStart;
  },
  
  updateStats: function(renderer) {
    if (renderer.info) {
      this.stats.triangles = renderer.info.render.triangles;
      this.stats.drawCalls = renderer.info.render.calls;
    }
  },
  
  getReport: function() {
    return {
      fps: Math.round(1000 / this.stats.frameTime),
      frameTime: Math.round(this.stats.frameTime * 100) / 100,
      renderTime: Math.round(this.stats.renderTime * 100) / 100,
      updateTime: Math.round(this.stats.updateTime * 100) / 100,
      triangles: this.stats.triangles,
      drawCalls: this.stats.drawCalls
    };
  }
};