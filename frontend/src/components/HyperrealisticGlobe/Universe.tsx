// @ts-nocheck
import * as THREE from 'three';

export class Universe {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.brightStars = null;
    this.init();
  }

  init() {
    this.scene.background = new THREE.Color(0x000000); // Pitch black
    this.createStarfield();
    this.createBrightStars();
  }

  createStarfield() {
    const starCount = 120000;
    const positions = new Float32Array(starCount * 3);
    const colors    = new Float32Array(starCount * 3);
    const sizes     = new Float32Array(starCount);

    // Realistic stellar spectral classes
    const starTypes = [
      { color: [1.0, 0.35, 0.05], weight: 0.08 }, // M — red dwarfs
      { color: [1.0, 0.55, 0.20], weight: 0.14 }, // K — orange
      { color: [1.0, 0.85, 0.60], weight: 0.12 }, // K — warm
      { color: [1.0, 1.0, 0.90], weight: 0.28 }, // G — sun-like
      { color: [0.95, 0.98, 1.0], weight: 0.18 }, // F — yellow-white
      { color: [0.88, 0.93, 1.0], weight: 0.12 }, // A — white
      { color: [0.75, 0.82, 1.0], weight: 0.06 }, // B — blue-white
      { color: [0.55, 0.65, 1.0], weight: 0.02 }, // O — blue giants
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Distribute on a large sphere
      const radius = 500 + Math.random() * 1500;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);

      // Slight Milky Way density band
      const galLat = Math.abs(phi - Math.PI / 2);
      if (galLat > 0.6 && Math.random() > 0.35) {
        sizes[i] = 0; // skip — thins out off-band stars
        continue;
      }

      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Pick spectral type
      let rand = Math.random(), cum = 0, type = starTypes[0];
      for (const t of starTypes) {
        cum += t.weight;
        if (rand <= cum) { type = t; break; }
      }

      const jitter = 0.07;
      colors[i3]     = Math.min(1, type.color[0] + (Math.random() - 0.5) * jitter);
      colors[i3 + 1] = Math.min(1, type.color[1] + (Math.random() - 0.5) * jitter);
      colors[i3 + 2] = Math.min(1, type.color[2] + (Math.random() - 0.5) * jitter);

      // Size: most small, a few big
      const mag = Math.random();
      if      (mag < 0.003) sizes[i] = 4.5 + Math.random() * 3;
      else if (mag < 0.015) sizes[i] = 3.0 + Math.random() * 1.5;
      else if (mag < 0.06)  sizes[i] = 2.0 + Math.random() * 1.0;
      else if (mag < 0.2)   sizes[i] = 1.4 + Math.random() * 0.6;
      else                  sizes[i] = 0.8 + Math.random() * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying vec3  vColor;
        varying float vSize;
        uniform float time;
        void main() {
          vColor = color;
          vSize  = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 2.5 + position.x * 73.0) * 0.07 + 0.93;
          gl_PointSize  = size * twinkle * (280.0 / -mvPosition.z);
          gl_Position   = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vSize;
        void main() {
          vec2  c    = gl_PointCoord - 0.5;
          float dist = length(c);
          if (dist > 0.5) discard;

          float core = 1.0 - smoothstep(0.0, 0.22, dist);
          float halo = 0.55 * (1.0 - smoothstep(0.22, 0.5, dist));
          float intensity = core + halo;

          // Diffraction spikes for bright stars
          if (vSize > 3.0) {
            float s1 = max(0.0, 1.0 - abs(c.x) / 0.016) * (1.0 - dist * 1.9);
            float s2 = max(0.0, 1.0 - abs(c.y) / 0.016) * (1.0 - dist * 1.9);
            intensity += (max(0.0,s1) + max(0.0,s2)) * 0.65;
          }

          float boost = 2.0 + vSize * 0.25;
          vec3 col = vSize > 4.0 ? mix(vColor, vec3(1.0), 0.25 * core) : vColor;
          gl_FragColor = vec4(col * intensity * boost, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  // A handful of very prominent named bright stars
  createBrightStars() {
    const named = [
      { pos: [420, -45, 335],  size: 22, color: [0.90, 0.95, 1.0] }, // Sirius
      { pos: [-335, 52, 390],  size: 18, color: [1.0, 0.60, 0.28] }, // Arcturus
      { pos: [250, 105, 445],  size: 18, color: [0.90, 0.95, 1.0] }, // Vega
      { pos: [335, -22, 365],  size: 16, color: [0.68, 0.78, 1.0] }, // Rigel
      { pos: [350, 20, 350],   size: 14, color: [1.0, 0.38, 0.18] }, // Betelgeuse
      { pos: [-265, -80, 500], size: 16, color: [0.78, 0.88, 1.0] }, // Achernar
      { pos: [237, 22, 403],   size: 13, color: [1.0, 0.95, 0.80] }, // Procyon
      { pos: [195, 45, 470],   size: 13, color: [1.0, 0.90, 0.70] }, // Capella
      { pos: [-280, -168, 335],size: 15, color: [0.80, 0.88, 1.0] }, // Acrux
      { pos: [-265, -68, 445], size: 12, color: [1.0, 0.28, 0.10] }, // Antares
    ];

    const positions = new Float32Array(named.length * 3);
    const colors    = new Float32Array(named.length * 3);
    const sizes     = new Float32Array(named.length);

    named.forEach((s, i) => {
      positions[i*3]   = s.pos[0];
      positions[i*3+1] = s.pos[1];
      positions[i*3+2] = s.pos[2];
      colors[i*3]      = s.color[0];
      colors[i*3+1]    = s.color[1];
      colors[i*3+2]    = s.color[2];
      sizes[i]         = s.size;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying vec3  vColor;
        varying float vSize;
        uniform float time;
        void main() {
          vColor = color;
          vSize  = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 3.5 + position.x * 41.0) * 0.12 +
                          cos(time * 2.2 + position.y * 27.0) * 0.08 + 0.9;
          gl_PointSize  = size * twinkle * (380.0 / -mvPosition.z);
          gl_Position   = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vSize;
        void main() {
          vec2  c    = gl_PointCoord - 0.5;
          float dist = length(c);
          if (dist > 0.5) discard;

          float core = 1.0 - smoothstep(0.0, 0.18, dist);
          float halo = 0.9 * (1.0 - smoothstep(0.18, 0.5, dist));
          float intensity = core + halo;

          // Bold cross + diagonal spikes
          float s1 = max(0.0, 1.0 - abs(c.x) / 0.020) * (1.0 - dist * 1.7);
          float s2 = max(0.0, 1.0 - abs(c.y) / 0.020) * (1.0 - dist * 1.7);
          float d1 = max(0.0, 1.0 - abs(c.x-c.y) / 0.015) * (1.0 - dist * 1.9);
          float d2 = max(0.0, 1.0 - abs(c.x+c.y) / 0.015) * (1.0 - dist * 1.9);
          intensity += (max(0.0,s1)+max(0.0,s2)) * 0.80
                     + (max(0.0,d1)+max(0.0,d2)) * 0.55;

          float boost = 2.8 + vSize * 0.15;
          vec3 col = mix(vColor, vec3(1.0), 0.30 * core);
          gl_FragColor = vec4(col * intensity * boost, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.brightStars = new THREE.Points(geometry, material);
    this.scene.add(this.brightStars);
  }

  update(time) {
    if (this.stars && this.stars.material.uniforms) {
      this.stars.material.uniforms.time.value = time;
      this.stars.rotation.y = time * 0.00015; // very slow drift
    }
    if (this.brightStars && this.brightStars.material.uniforms) {
      this.brightStars.material.uniforms.time.value = time;
    }
  }

  dispose() {
    [this.stars, this.brightStars].forEach(obj => {
      if (obj) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
  }
}
