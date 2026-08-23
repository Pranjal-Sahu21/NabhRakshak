// @ts-nocheck
import * as THREE from 'three';

/**
 * Hyperrealistic Earth — bobbyroe / NASA Blue Marble approach
 * Layers: day map · night lights · specular glint · bump relief · clouds · Fresnel atmosphere
 * No sun mesh — only a well-positioned directional light gives the day/night terminator.
 */
export class Earth {
  constructor(scene) {
    this.scene = scene;
    this.earth = null;
    this.lights = null;
    this.clouds = null;
    this.atmosphere = null;
    this.glowMesh = null;
    this.textures = [];

    // Sun direction: slightly above the equatorial plane, from the right
    this.sunDirection = new THREE.Vector3(1, 0.3, 0.5).normalize();

    this.init();
  }

  init() {
    this._setupLighting();
    this._createEarth();
    this._createClouds();
    this._createAtmosphere();
    this._createGlow();
  }

  _setupLighting() {
    // Very faint ambient — space is dark
    const ambient = new THREE.AmbientLight(0x111122, 0.08);
    this.scene.add(ambient);

    // Primary sun — warm white, from fixed position
    const sun = new THREE.DirectionalLight(0xffffff, 2.8);
    sun.position.set(5, 2, 3);
    sun.castShadow = false; // shadows add cost, not needed for globe
    this.scene.add(sun);

    // Soft fill from opposite side — simulates earthshine / starlight
    const fill = new THREE.DirectionalLight(0x1a2a4a, 0.15);
    fill.position.set(-5, -1, -3);
    this.scene.add(fill);

    this.lights = { ambient, sun, fill };
  }

  _createEarth() {
    const loader = new THREE.TextureLoader();

    // Day map
    const dayTex = loader.load('/assets/earth-blue-marble.jpg', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
    });

    // Night city lights
    const nightTex = loader.load('/assets/earth-night.jpg', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
    });

    // Topology / bump
    const bumpTex = loader.load('/assets/earth-topology.png', (t) => {
      t.anisotropy = 8;
    });

    this.textures.push(dayTex, nightTex, bumpTex);

    const geo = new THREE.SphereGeometry(1, 128, 128);

    // ── Day/Night custom shader ──────────────────────────────────────────────
    // Based on the well-known "Earth shader" pattern used by bobbyroe & NASA visualisations.
    // Day side: blue-marble texture with Lambert shading + specular ocean glint
    // Night side: city-light texture, only visible in shadow
    // Terminator: smooth blend + warm orange sunset strip
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDayTex:    { value: dayTex },
        uNightTex:  { value: nightTex },
        uBumpTex:   { value: bumpTex },
        uSunDir:    { value: this.sunDirection.clone() },
        uTime:      { value: 0 }
      },
      vertexShader: /* glsl */`
        varying vec2  vUv;
        varying vec3  vNormal;
        varying vec3  vWorldPos;

        void main() {
          vUv      = uv;
          vNormal  = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;

        uniform sampler2D uDayTex;
        uniform sampler2D uNightTex;
        uniform sampler2D uBumpTex;
        uniform vec3  uSunDir;
        uniform float uTime;

        varying vec2  vUv;
        varying vec3  vNormal;
        varying vec3  vWorldPos;

        void main() {
          vec3  N       = normalize(vNormal);
          vec3  sunDir  = normalize(uSunDir);
          vec3  viewDir = normalize(cameraPosition - vWorldPos);

          // ── Lighting ─────────────────────────────────────────────
          float NdotL   = dot(N, sunDir);                   // -1 .. 1
          float dayMix  = smoothstep(-0.25, 0.25, NdotL);  // day/night blend

          // ── Textures ──────────────────────────────────────────────
          vec3 dayColor   = texture2D(uDayTex,   vUv).rgb;
          vec3 nightColor = texture2D(uNightTex, vUv).rgb;
          float bumpVal   = texture2D(uBumpTex,  vUv).r;   // 0=ocean, 1=mountain

          // ── Diffuse shading on day side ───────────────────────────
          float diffuse   = max(0.0, NdotL);
          // Slight self-shadow softening so polar regions aren't pitch black
          float ambient   = 0.04;
          dayColor       *= (diffuse + ambient);

          // ── Specular ocean glint (Phong) ──────────────────────────
          // Water = low bumpVal; land = high bumpVal
          float oceanMask = 1.0 - smoothstep(0.35, 0.60, bumpVal);
          vec3  halfDir   = normalize(sunDir + viewDir);
          float spec      = pow(max(0.0, dot(N, halfDir)), 120.0);
          vec3  specColor = vec3(1.0, 0.97, 0.92) * spec * oceanMask * max(0.0, NdotL) * 2.5;

          // ── Terminator sunset glow ────────────────────────────────
          float terminator = smoothstep(-0.3, 0.0, NdotL) * (1.0 - smoothstep(0.0, 0.35, NdotL));
          vec3  sunsetGlow = vec3(1.0, 0.45, 0.1) * terminator * 0.55;

          // ── Combine day + night ───────────────────────────────────
          // Night lights are boosted and only show in shadow
          vec3  nightLit  = nightColor * 2.8 * (1.0 - dayMix);
          vec3  finalDay  = (dayColor + specColor + sunsetGlow) * dayMix;
          vec3  color     = finalDay + nightLit;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    this.earth = new THREE.Mesh(geo, mat);
    this.earth.receiveShadow = false;
    this.scene.add(this.earth);
  }

  _createClouds() {
    const loader  = new THREE.TextureLoader();
    const cloudTex = loader.load('/assets/earth-clouds.png', (t) => {
      t.anisotropy = 8;
    });
    this.textures.push(cloudTex);

    const mat = new THREE.MeshLambertMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.006, 64, 64),
      mat
    );
    this.scene.add(this.clouds);
  }

  _createAtmosphere() {
    // Thin inner atmospheric haze (BackSide rim)
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        void main() {
          vNormal     = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vNormal;
        void main() {
          vec3  viewDir = vec3(0.0, 0.0, 1.0);
          float rim     = clamp(1.0 - dot(vNormal, viewDir), 0.0, 1.0);
          float alpha   = pow(rim, 3.5) * 0.7;
          gl_FragColor  = vec4(0.3, 0.6, 1.0, alpha);
        }
      `,
      blending:    THREE.AdditiveBlending,
      side:        THREE.BackSide,
      transparent: true,
      depthWrite:  false
    });

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.022, 64, 64),
      mat
    );
    this.scene.add(this.atmosphere);
  }

  _createGlow() {
    // Outer blue glow — Fresnel rim light (FrontSide)
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPos  = modelViewMatrix * vec4(position, 1.0);
          vNormal     = normalize(normalMatrix * normal);
          vViewDir    = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);
          gl_FragColor  = vec4(0.25, 0.55, 1.0, fresnel * 0.45);
        }
      `,
      blending:    THREE.AdditiveBlending,
      side:        THREE.FrontSide,
      transparent: true,
      depthWrite:  false
    });

    this.glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 64, 64),
      mat
    );
    this.scene.add(this.glowMesh);
  }

  update(time) {
    // Rotate earth
    if (this.earth)  this.earth.rotation.y  += 0.0008;
    // Clouds drift a tiny bit faster
    if (this.clouds) this.clouds.rotation.y += 0.0011;

    // Update shader time uniform
    if (this.earth?.material?.uniforms?.uTime) {
      this.earth.material.uniforms.uTime.value = time;
    }
  }

  updateSunPosition(sunPosition) {
    // Called by SceneManager — keep sun direction in sync
    if (this.earth?.material?.uniforms?.uSunDir) {
      this.earth.material.uniforms.uSunDir.value
        .copy(sunPosition).normalize();
    }
  }

  dispose() {
    this.textures.forEach(t => t.dispose());
    this.textures = [];
  }
}
