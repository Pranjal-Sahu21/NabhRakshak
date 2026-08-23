// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  PlayIcon, PauseIcon, SunIcon,
  ArrowsPointingOutIcon, ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const getRealTimeSunDir = () => {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const sunLong = (12 - utcHours) * 15;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const declination = 23.44 * Math.sin((360 / 365) * (dayOfYear - 80) * Math.PI / 180);
  const phi = (90 - declination) * Math.PI / 180;
  const theta = (sunLong + 180) * Math.PI / 180;
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
};

const HyperrealisticGlobe = ({
  satellites = [],
  debris = [],
  onObjectSelect,
  className = '',
  showControls = true,
  settings = {}
}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const starsRef = useRef(null);
  const satellitesGroupRef = useRef(null);
  const debrisGroupRef = useRef(null);
  const animIdRef = useRef(null);
  const lightingFrameRef = useRef(null);
  const onObjectSelectRef = useRef(onObjectSelect);
  useEffect(() => {
    onObjectSelectRef.current = onObjectSelect;
  }, [onObjectSelect]);

  const orbitsGroupRef = useRef(null);


  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [globeReady, setGlobeReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── STARFIELD ───────────────────────────────────────────────────────────────
  const buildStarfield = useCallback((scene) => {
    const COUNT = 20000; // reduced from 80k for performance
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    const types = [
      { c: [1.0, 0.35, 0.05], w: 0.07 },
      { c: [1.0, 0.60, 0.25], w: 0.13 },
      { c: [1.0, 1.0,  0.90], w: 0.30 },
      { c: [0.95,0.98, 1.0 ], w: 0.20 },
      { c: [0.88,0.93, 1.0 ], w: 0.18 },
      { c: [0.75,0.82, 1.0 ], w: 0.08 },
      { c: [0.55,0.65, 1.0 ], w: 0.04 },
    ];

    for (let i = 0; i < COUNT; i++) {
      const r   = 400 + Math.random() * 1200;
      const phi = Math.acos(2 * Math.random() - 1);
      const th  = Math.random() * Math.PI * 2;
      positions[i*3]   = r * Math.sin(phi) * Math.cos(th);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(th);
      positions[i*3+2] = r * Math.cos(phi);

      let rnd = Math.random(), cum = 0, t = types[0];
      for (const x of types) { cum += x.w; if (rnd <= cum) { t = x; break; } }
      colors[i*3]   = Math.min(1, t.c[0] + (Math.random()-.5)*.07);
      colors[i*3+1] = Math.min(1, t.c[1] + (Math.random()-.5)*.07);
      colors[i*3+2] = Math.min(1, t.c[2] + (Math.random()-.5)*.07);

      const m = Math.random();
      sizes[i] = m < .003 ? 5 + Math.random()*3
               : m < .015 ? 3.5 + Math.random()*1.5
               : m < .07  ? 2.2 + Math.random()
               : m < .2   ? 1.5 + Math.random()*.7
               :             .9 + Math.random()*.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying vec3  vColor;
        varying float vSize;
        uniform float uTime;
        void main() {
          vColor = color;
          vSize  = size;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = sin(uTime*2.5 + position.x*73.0)*0.07 + 0.93;
          gl_PointSize  = size * tw * (300.0 / -mv.z);
          gl_Position   = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vSize;
        void main() {
          vec2  c    = gl_PointCoord - .5;
          float dist = length(c);
          if (dist > .5) discard;
          float core  = 1.0 - smoothstep(.0, .22, dist);
          float halo  = .55 * (1.0 - smoothstep(.22, .5, dist));
          float I     = core + halo;
          if (vSize > 3.0) {
            float s1 = max(.0, 1.-abs(c.x)/.018)*(1.-dist*1.9);
            float s2 = max(.0, 1.-abs(c.y)/.018)*(1.-dist*1.9);
            I += (max(.0,s1)+max(.0,s2))*.7;
          }
          float boost = 2.2 + vSize*.28;
          vec3  col   = vSize>4.? mix(vColor,vec3(1.),0.28*core) : vColor;
          gl_FragColor = vec4(col * I * boost, I);
        }
      `,
      transparent:  true,
      blending:     THREE.AdditiveBlending,
      depthWrite:   false,
      vertexColors: true
    });

    const stars = new THREE.Points(geo, mat);
    starsRef.current = stars;
    scene.add(stars);
  }, []);

  // ─── EARTH ────────────────────────────────────────────────────────────────────
  const buildEarth = useCallback((scene, sunDir) => {
    const loader = new THREE.TextureLoader();

    // Load real NASA textures
    const dayTex   = loader.load('assets/earth-blue-marble.jpg');
    const nightTex = loader.load('assets/earth-night.jpg');
    const bumpTex  = loader.load('assets/earth-topology.png');
    dayTex.anisotropy   = 16;
    nightTex.anisotropy = 16;
    bumpTex.anisotropy  = 8;

    // Day/Night PBR shader — real-time sun direction
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDay:   { value: dayTex },
        uNight: { value: nightTex },
        uBump:  { value: bumpTex },
        uSun:   { value: sunDir }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vUv     = uv;
          vNormal = normalize((modelMatrix * vec4(normal,0.)).xyz);
          vWorld  = (modelMatrix * vec4(position,1.)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uDay;
        uniform sampler2D uNight;
        uniform sampler2D uBump;
        uniform vec3 uSun;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vec3 N       = normalize(vNormal);
          vec3 sun     = normalize(uSun);
          vec3 view    = normalize(cameraPosition - vWorld);
          float NdotL  = dot(N, sun);
          float day    = smoothstep(-0.25, 0.25, NdotL);

          vec3 dayCol   = texture2D(uDay,   vUv).rgb;
          vec3 nightCol = texture2D(uNight, vUv).rgb;
          float bump    = texture2D(uBump,  vUv).r;

          // Diffuse + ambient
          dayCol *= (max(0.0, NdotL) + 0.08);

          vec3 nightLit = nightCol * 2.2 * (1.0 - day);
          vec3 finalDay = dayCol * day;
          gl_FragColor  = vec4(finalDay + nightLit, 1.0);
        }
      `
    });

    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), mat); // reduced from 128×128
    earthRef.current = earth;
    scene.add(earth);

    // Cloud layer
    const cloudTex = loader.load('assets/earth-clouds.png');
    cloudTex.anisotropy = 8;
    const cloudMat = new THREE.MeshLambertMaterial({
      map: cloudTex, transparent: true, opacity: 0.6, depthWrite: false
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.007, 48, 48), cloudMat); // reduced from 64×64
    cloudsRef.current = clouds;
    scene.add(clouds);

    // Atmosphere (Fresnel rim — BackSide)
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = clamp(1.-dot(vNormal,vec3(0.,0.,1.)),0.,1.);
          gl_FragColor = vec4(0.80,0.72,0.68, pow(rim,3.0)*0.75);
        }
      `,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
      transparent: true, depthWrite: false
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.022, 32, 32), atmMat)); // reduced from 64×64

    // Outer Fresnel glow (FrontSide)
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position,1.);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - abs(dot(vN,vV)), 3.0);
          gl_FragColor = vec4(0.80,0.72,0.68, f*0.6);
        }
      `,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      transparent: true, depthWrite: false
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.032, 32, 32), glowMat)); // reduced from 64×64
  }, []);

  // ─── SATELLITES ──────────────────────────────────────────────────────────────
  const EARTH_R = 6371;
  const MU      = 398600.4418;

  const orbitalPos = useCallback((alt, inc, raan, aop, ma) => {
    const r    = (EARTH_R + alt) / EARTH_R;
    const incR = inc  * Math.PI / 180;
    const raanR= raan * Math.PI / 180;
    const aopR = aop  * Math.PI / 180;
    const maR  = ma   * Math.PI / 180;

    const x0 = r * Math.cos(maR), y0 = r * Math.sin(maR);
    const x1 = x0*Math.cos(aopR) - y0*Math.sin(aopR);
    const y1 = x0*Math.sin(aopR) + y0*Math.cos(aopR);
    const x2 = x1;
    const y2 = y1*Math.cos(incR);
    const z2 = y1*Math.sin(incR);
    return new THREE.Vector3(
      x2*Math.cos(raanR) - y2*Math.sin(raanR),
      x2*Math.sin(raanR) + y2*Math.cos(raanR),
      z2
    );
  }, []);

  const buildSatellites = useCallback(() => {
    if (!satellitesGroupRef.current) return;
    while (satellitesGroupRef.current.children.length)
      satellitesGroupRef.current.remove(satellitesGroupRef.current.children[0]);

    satellites.forEach((sat, idx) => {
      const alt  = sat.altitude    || 400 + Math.random()*800;
      const inc  = sat.inclination || Math.random()*90;
      const raan = sat.raan        || Math.random()*360;
      const aop  = sat.aop !== undefined ? sat.aop : Math.random()*360;
      const ma   = sat.ma !== undefined ? sat.ma : Math.random()*360;
      const pos  = orbitalPos(alt, inc, raan, aop, ma);

      const group = new THREE.Group();
      group.position.copy(pos);
      group.lookAt(0, 0, 0); // Orient to face Earth

      // 1. Satellite Bus (Main Body) - Gold MLI Foil
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xe2b13c,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0x221a00,
        emissiveIntensity: 0.2
      });
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.030, 0.030), goldMat);
      group.add(bus);

      // 2. Instrument Deck / Payload Box (Silver)
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xe5e7eb,
        metalness: 0.95,
        roughness: 0.1
      });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.010), silverMat);
      deck.position.z = 0.018; // facing Earth
      group.add(deck);

      // 3. High-Gain Parabolic Dish Antenna (facing Earth)
      const dishGeo = new THREE.ConeGeometry(0.018, 0.010, 12, 1, true);
      const dish = new THREE.Mesh(dishGeo, silverMat);
      dish.position.set(0, 0.006, 0.024);
      dish.rotation.x = Math.PI / 2;
      group.add(dish);

      // Antenna feed horn
      const hornGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.012, 6);
      const horn = new THREE.Mesh(hornGeo, silverMat);
      horn.position.set(0, 0.006, 0.030);
      horn.rotation.x = Math.PI / 2;
      group.add(horn);

      // 4. Solar Panels (Muted gray panels matching custom color palette)
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x706677,
        emissive: 0x565264,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.1
      });
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0xCCB7AE,
        metalness: 0.8,
        roughness: 0.2
      });

      // Panel Support Trusses
      const trussGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 0.028, 6);
      const leftTruss = new THREE.Mesh(trussGeo, silverMat);
      leftTruss.position.set(-0.022, 0, 0);
      leftTruss.rotation.z = Math.PI / 2;
      group.add(leftTruss);

      const rightTruss = leftTruss.clone();
      rightTruss.position.x = 0.022;
      group.add(rightTruss);

      // Left Panel Array
      const leftWing = new THREE.Group();
      const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.002, 0.026), panelMat);
      const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.003, 0.028), frameMat);
      leftFrame.position.z = -0.0005;
      leftWing.add(leftFrame, leftPanel);
      leftWing.position.set(-0.065, 0, 0);
      group.add(leftWing);

      // Right Panel Array
      const rightWing = new THREE.Group();
      const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.002, 0.026), panelMat);
      const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.003, 0.028), frameMat);
      rightFrame.position.z = -0.0005;
      rightWing.add(rightFrame, rightPanel);
      rightWing.position.set(0.065, 0, 0);
      group.add(rightWing);

      // 5. Thruster nozzles
      const nozzleGeo = new THREE.ConeGeometry(0.003, 0.006, 6);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.4 });
      const nozzle1 = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle1.position.set(-0.010, -0.010, -0.015);
      nozzle1.rotation.x = Math.PI;
      group.add(nozzle1);

      const nozzle2 = nozzle1.clone();
      nozzle2.position.x = 0.010;
      group.add(nozzle2);

      // 6. Glowing Operational Tracking Beacon (Matching custom palette)
      const beaconGeo = new THREE.SphereGeometry(0.010, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xCCB7AE });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, -0.008, 0.020);
      group.add(beacon);

      const period    = 2 * Math.PI * Math.sqrt(Math.pow(EARTH_R + alt, 3) / MU);
      const meanMotion = (2 * Math.PI) / period;

      group.userData = {
        type: 'satellite', data: sat,
        ma: ma * Math.PI / 180,
        meanMotion,
        alt, inc, raan, aop
      };

      // Invisible hit-sphere for clicking
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      group.add(hit);

      satellitesGroupRef.current.add(group);
    });
  }, [satellites, orbitalPos]);

  const buildDebris = useCallback(() => {
    if (!debrisGroupRef.current) return;
    while (debrisGroupRef.current.children.length)
      debrisGroupRef.current.remove(debrisGroupRef.current.children[0]);

    debris.forEach((d, idx) => {
      const alt = d.altitude || 400 + Math.random() * 800;
      const inc = d.inclination !== undefined ? d.inclination : 97.5;
      const raan = (idx * 29) % 360;
      const aop = (idx * 41) % 360;
      const ma = (idx * 53) % 360;

      const period = 2 * Math.PI * Math.sqrt(Math.pow(EARTH_R + alt, 3) / MU);
      const meanMotion = (2 * Math.PI) / period;

      const pos = orbitalPos(alt, inc, raan, aop, ma);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff4444 })
      );
      mesh.position.copy(pos);
      mesh.userData = {
        type: 'debris',
        data: d,
        alt, inc, raan, aop,
        ma: ma * Math.PI / 180,
        meanMotion
      };
      debrisGroupRef.current.add(mesh);
    });
  }, [debris, orbitalPos]);

  const buildOrbits = useCallback(() => {
    if (!orbitsGroupRef.current || !satellitesGroupRef.current) return;
    while (orbitsGroupRef.current.children.length)
      orbitsGroupRef.current.remove(orbitsGroupRef.current.children[0]);

    if (!settings.showOrbits) return;

    satellitesGroupRef.current.children.forEach((g) => {
      const u = g.userData;
      if (!u || u.type !== 'satellite') return;
      
      const orbitPoints = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 360;
        const p = orbitalPos(u.alt, u.inc, u.raan, u.aop, angle);
        orbitPoints.push(p);
      }
      
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: u.data?.status === 'active' ? 0xffffff : 0x706677,
        transparent: true,
        opacity: 0.55,
        linewidth: 1.5
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitsGroupRef.current.add(orbitLine);
    });
  }, [settings.showOrbits, orbitalPos]);

  // ─── SCENE INIT ──────────────────────────────────────────────────────────────
  const initScene = useCallback(() => {
    if (!mountRef.current) return;
    setIsLoading(true);

    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Scene — pure black
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera (Centered on India: 78° East longitude)
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 5000);
    camera.position.set(3.13, 0, 0.66);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // capped at 1.5 for perf (was 2)
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace   = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.05;
    controls.minDistance    = 1.4;
    controls.maxDistance    = 12;
    controls.enablePan      = false;
    controlsRef.current = controls;

    const sunDir = getRealTimeSunDir();

    // Lighting — real-time sun direction
    scene.add(new THREE.AmbientLight(0x111122, 0.08));
    const sun = new THREE.DirectionalLight(0xffffff, 2.8);
    sun.position.copy(sunDir).multiplyScalar(5);
    sun.castShadow = false;
    scene.add(sun);
    const fillLight = new THREE.DirectionalLight(0x1a2a4a, 0.12);
    fillLight.position.copy(sunDir).multiplyScalar(-5);
    scene.add(fillLight);


    // Build scene objects
    buildStarfield(scene);
    buildEarth(scene, sunDir);

    // Satellite / debris groups
    satellitesGroupRef.current = new THREE.Group();
    debrisGroupRef.current     = new THREE.Group();
    orbitsGroupRef.current     = new THREE.Group();
    scene.add(satellitesGroupRef.current);
    scene.add(debrisGroupRef.current);
    scene.add(orbitsGroupRef.current);

    setGlobeReady(true);
    setIsLoading(false);

    // Resize handler
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Click handler — attach to the canvas element so it works in fullscreen too
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const mouse     = new THREE.Vector2();
    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(
        [...(satellitesGroupRef.current?.children || []),
         ...(debrisGroupRef.current?.children || [])], true
      );
      if (hits.length && onObjectSelectRef.current) {
        let obj = hits[0].object;
        while (obj && !obj.userData.data && obj.parent) obj = obj.parent;
        if (obj?.userData?.data) onObjectSelectRef.current(obj.userData.data);
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      if (animIdRef.current)    cancelAnimationFrame(animIdRef.current);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current)
        mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [buildStarfield, buildEarth]);

  // ─── ANIMATION LOOP ──────────────────────────────────────────────────────────
  const frameCountRef = useRef(0);

  const animate = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    animIdRef.current = requestAnimationFrame(animate);

    frameCountRef.current++;
    const t = Date.now() * 0.001;
    const isEvenFrame = frameCountRef.current % 2 === 0;

    if (isPlaying) {
      if (earthRef.current)  earthRef.current.rotation.y  += 0.00005;
      if (cloudsRef.current) cloudsRef.current.rotation.y += 0.000075;
      // Only update star shader every 2nd frame (twinkling is slow anyway)
      if (isEvenFrame && starsRef.current && starsRef.current.material.uniforms)
        starsRef.current.material.uniforms.uTime.value = t;

      // Animate satellites every frame (few objects)
      if (satellitesGroupRef.current) {
        satellitesGroupRef.current.children.forEach((g) => {
          if (!g.userData.meanMotion) return;
          g.userData.ma += g.userData.meanMotion * 0.016 * 8;
          const p = orbitalPos(g.userData.alt, g.userData.inc, g.userData.raan, g.userData.aop, g.userData.ma * 180/Math.PI);
          g.position.copy(p);
          g.lookAt(0, 0, 0);
          g.rotation.z += 0.004;
        });
      }

      // Animate debris only every 2nd frame — positions change slowly
      if (isEvenFrame && debrisGroupRef.current) {
        debrisGroupRef.current.children.forEach((d) => {
          if (!d.userData.meanMotion) return;
          d.userData.ma += d.userData.meanMotion * 0.032 * 12; // compensate for 2x delta
          const p = orbitalPos(d.userData.alt, d.userData.inc, d.userData.raan, d.userData.aop, d.userData.ma * 180/Math.PI);
          d.position.copy(p);
        });
      }
    }

    controlsRef.current?.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [isPlaying, orbitalPos]);

  const outerContainerRef = useRef(null);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      outerContainerRef.current?.requestFullscreen?.().then(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
      });
    } else {
      document.exitFullscreen?.();
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Fallback resize trigger on any state transition
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (globeReady) { animate(); }
    return () => { if (animIdRef.current) cancelAnimationFrame(animIdRef.current); };
  }, [globeReady, animate]);

  // Play/pause
  useEffect(() => {
    if (!isPlaying && animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    } else if (isPlaying && globeReady && !animIdRef.current) {
      animate();
    }
  }, [isPlaying, globeReady, animate]);

  useEffect(() => {
    if (globeReady) {
      buildSatellites();
      buildOrbits();
    }
  }, [satellites, globeReady, buildSatellites, buildOrbits, settings.showOrbits]);

  useEffect(() => { if (globeReady) buildDebris(); },    [debris,     globeReady, buildDebris]);

  return (
    <div
      ref={outerContainerRef}
      className={`relative w-full h-full ${className}`}
      style={{ background: '#000', ...(isFullscreen ? { width: '100vw', height: '100vh' } : {}) }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading hyperrealistic globe…</p>
          </div>
        </div>
      )}

      <div ref={mountRef} className="w-full h-full" style={{ cursor: 'crosshair' }} />

      {showControls && globeReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 z-50 flex flex-col gap-2"
        >
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="flex items-center gap-2 px-3 py-2 bg-black/70 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            {isPlaying
              ? <><PauseIcon className="w-4 h-4" /> Pause</>
              : <><PlayIcon  className="w-4 h-4" /> Play</>}
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-black/70 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            {isFullscreen
              ? <><ArrowsPointingInIcon  className="w-4 h-4" /> Exit Fullscreen</>
              : <><ArrowsPointingOutIcon className="w-4 h-4" /> Fullscreen</>}
          </button>
          <div className="px-3 py-2 bg-black/70 border border-white/20 rounded-lg text-xs text-gray-400 space-y-0.5 backdrop-blur-sm">
            <div>Satellites: <span className="text-green-400 font-normal">{satellites.length}</span></div>
            <div>Debris: <span className="text-red-400 font-normal">{debris.length}</span></div>
            <div>Total: <span className="text-white font-normal">{satellites.length + debris.length}</span></div>
            <div>Status: <span className={isPlaying ? 'text-green-400' : 'text-gray-400'}>{isPlaying ? '● Live' : '⏸ Paused'}</span></div>
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-4 left-4 z-40">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-white/20 rounded-lg text-xs text-gray-400">
          <SunIcon className="w-4 h-4 text-blue-400" />
          <span>Hyperrealistic 3D Globe</span>
          <div className={`w-2 h-2 rounded-full ${globeReady ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
        </div>
      </div>
    </div>
  );
};

export default HyperrealisticGlobe;
