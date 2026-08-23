// @ts-nocheck
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.lights = {};
    this.sunAngle = 0;
    this.animationFrameId = null;
    this.lightingFrameId = null;

    // Component/rendering states
    this.isPlaying = options.isPlaying !== false;
    this.isPlayingLoop = true;
    this.isTracking = false;
    this.trackedSatellite = null;
    this.userInteracted = false;
    this.targetTrackingDistance = null;

    // Callbacks
    this.onObjectSelect = options.onObjectSelect || null;
    this.onReady = options.onReady || null;

    // Modules
    this.universe = null;
    this.earth = null;
    this.orbitalObjects = null;

    this.init();
  }

  init() {
    // 1. Scene setup — pitch black space
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 0, 3);

    // 3. Renderer setup — no alpha so background is truly black
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x000000, 1);

    this.container.appendChild(this.renderer.domElement);

    // 4. Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.15;
    this.controls.maxDistance = 15;
    this.controls.enablePan = false;

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Listeners
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    this.clickHandler = this.handleClick.bind(this);
    this.renderer.domElement.addEventListener('click', this.clickHandler);

    // Interaction listeners to detect manual override during tracking
    this.interactionHandler = () => {
      if (this.isTracking) {
        this.userInteracted = true;
      }
    };
    this.renderer.domElement.addEventListener('wheel', this.interactionHandler, { passive: true });
    this.renderer.domElement.addEventListener('mousedown', this.interactionHandler, { passive: true });
    this.renderer.domElement.addEventListener('touchstart', this.interactionHandler, { passive: true });
  }

  setupLighting() {
    // Earth.js manages its own lighting — SceneManager just needs minimal
    // satellite-visibility lighting. No sun animation, no sun mesh.

    // Very faint ambient for satellite visibility on night side
    const ambientLight = new THREE.AmbientLight(0x111122, 0.06);
    this.scene.add(ambientLight);

    // Fixed sun — same direction as Earth.js sunDirection
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.name = 'sunLight';
    sunLight.position.set(5, 2, 3);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    // Soft fill from opposite side
    const fillLight = new THREE.DirectionalLight(0x1a2a4a, 0.12);
    fillLight.position.set(-5, -1, -3);
    this.scene.add(fillLight);

    this.lights = {
      ambient: ambientLight,
      sun: sunLight,
      fill: fillLight
    };
  }

  setModules(universe, earth, orbitalObjects) {
    this.universe = universe;
    this.earth = earth;
    this.orbitalObjects = orbitalObjects;

    // Trigger ready callback
    if (this.onReady) {
      this.onReady();
    }
  }

  handleResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  resize() {
    this.handleResize();
  }

  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
  }

  startLoop() {
    this.isPlayingLoop = true;
    const loop = () => {
      if (!this.isPlayingLoop) return;
      this.animate();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopLoop() {
    this.isPlayingLoop = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate() {
    if (!this.scene || !this.renderer || !this.camera) return;

    const time = Date.now() * 0.001;

    // Update Modules
    if (this.isPlaying) {
      if (this.earth) this.earth.update(time);
      if (this.orbitalObjects) this.orbitalObjects.update(time);
    }

    if (this.universe) this.universe.update(time, this.lights.sun ? this.lights.sun.position : null);

    // Update atmosphere sun position parameter
    if (this.earth && this.lights.sun) {
      this.earth.updateSunPosition(this.lights.sun.position);
    }

    // Handle satellite tracking camera movement
    this.handleTrackingCamera();

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  handleTrackingCamera() {
    if (this.isTracking && this.trackedSatellite) {
      let trackedMesh = null;
      if (this.orbitalObjects) {
        trackedMesh = this.orbitalObjects.getSatelliteMesh(this.trackedSatellite.id);
        if (!trackedMesh && this.orbitalObjects.debrisList) {
          trackedMesh = this.orbitalObjects.debrisList.find(d => d.userData.data?.id === this.trackedSatellite.id);
        }
      }

      if (trackedMesh) {
        const satellitePosition = trackedMesh.position.clone();
        
        // Keep OrbitControls target centered on the Earth to prevent clipping through Earth
        if (this.controls) {
          this.controls.target.set(0, 0, 0);
        }
        
        let currentDistance = this.camera.position.length();
        
        // If the user has not overridden with manual zoom, smoothly zoom to target tracking distance
        if (!this.userInteracted && this.targetTrackingDistance) {
          currentDistance = THREE.MathUtils.lerp(currentDistance, this.targetTrackingDistance, 0.05);
          if (Math.abs(currentDistance - this.targetTrackingDistance) < 0.01) {
            this.userInteracted = true;
          }
        }
        
        // Smoothly rotate the camera position along the sphere's surface
        const targetCameraPosition = satellitePosition.clone().normalize().multiplyScalar(currentDistance);
        const lerpedPosition = this.camera.position.clone().lerp(targetCameraPosition, 0.05);
        this.camera.position.copy(lerpedPosition.normalize().multiplyScalar(currentDistance));
      }
    } else {
      // Ensure target returns smoothly to center when not tracking
      if (this.controls) {
        const center = new THREE.Vector3(0, 0, 0);
        if (this.controls.target.distanceTo(center) > 0.001) {
          this.controls.target.lerp(center, 0.1);
        }
      }
    }
  }

  handleClick(event) {
    if (!this.camera || !this.scene || !this.orbitalObjects) return;

    const rect = this.container.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.05; // Make it easier to click thin orbit lines
    raycaster.setFromCamera(mouse, this.camera);

    const interactiveObjects = this.orbitalObjects.getInteractiveObjects();
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      // Traverse up to find group if applicable, or get direct Mesh userData
      let targetObj = object;
      while (targetObj && !targetObj.userData.data && targetObj.parent) {
        targetObj = targetObj.parent;
      }

      if (targetObj && targetObj.userData.data) {
        const objectData = targetObj.userData.data;

        if (this.onObjectSelect) {
          this.onObjectSelect(objectData);
        }

        if (targetObj.userData.type === 'satellite' || targetObj.userData.type === 'orbit') {
          if (this.trackedSatellite && this.trackedSatellite.id === objectData.id) {
            this.stopTracking();
          } else {
            let trackingMesh = targetObj;
            if (targetObj.userData.type === 'orbit') {
              trackingMesh = this.orbitalObjects.getSatelliteMesh(objectData.id) || targetObj;
            }
            this.startTracking(objectData, trackingMesh);
          }
        }
      }
    } else {
      // Clicked on empty space - reset camera tracking
      if (this.isTracking) {
        this.stopTracking();
      }
    }
  }

  startTracking(satelliteData, satelliteMesh) {
    this.trackedSatellite = satelliteData;
    this.isTracking = true;
    this.userInteracted = false;

    const altitude = satelliteData.altitude || 500;
    const orbitRadius = (6371 + altitude) / 6371;
    this.targetTrackingDistance = Math.max(orbitRadius + 0.1, 1.15);

    if (satelliteMesh) {
      satelliteData.meshRef = satelliteMesh;
    }
  }

  stopTracking() {
    this.trackedSatellite = null;
    this.isTracking = false;
    this.targetTrackingDistance = null;
    this.userInteracted = false;

    if (this.controls) {
      this.controls.autoRotate = false;
    }
  }

  dispose() {
    // 1. Clean up animation frame loops
    this.stopLoop();

    // 2. Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('click', this.clickHandler);
      this.renderer.domElement.removeEventListener('wheel', this.interactionHandler);
      this.renderer.domElement.removeEventListener('mousedown', this.interactionHandler);
      this.renderer.domElement.removeEventListener('touchstart', this.interactionHandler);
    }

    // 3. Dispose of specific module resources
    if (this.earth) this.earth.dispose();
    if (this.universe) this.universe.dispose();
    if (this.orbitalObjects) this.orbitalObjects.dispose();

    // 4. Dispose of controls
    if (this.controls) {
      this.controls.dispose();
    }

    // 5. Recursively traverse and dispose scene geometries, materials, textures
    if (this.scene) {
      this.scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints && !object.isLine) return;

        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(object.material);
          }
        }
      });
    }

    // 6. Dispose of renderer
    if (this.renderer) {
      if (this.container && this.renderer.domElement) {
        try {
          this.container.removeChild(this.renderer.domElement);
        } catch (e) {
          console.warn("Could not remove renderer canvas: ", e);
        }
      }
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }

  disposeMaterial(material) {
    material.dispose();
    // Dispose of any textures
    for (const key in material) {
      if (material[key] && material[key].isTexture) {
        material[key].dispose();
      }
    }
  }
}
