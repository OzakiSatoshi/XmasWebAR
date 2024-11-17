import * as THREE from 'three';

export class SnowEffect {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 250;
    this.createSnow();
  }

  createSnow() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    
    const snowTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/OzakiSatoshi/MediaPipe_Face@c91e2a2a16704610d72d8d4d81739855d869565a/snowflake.png', (texture) => {
      texture.encoding = THREE.sRGBEncoding;
    });

    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;

      velocities[i] = 0.02 + Math.random() * 0.02;
      sizes[i] = 0.1 + Math.random() * 0.15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.25,
      map: snowTexture,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      vertexColors: false,
      sizeAttenuation: true,
      fog: false
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  animate() {
    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.geometry.attributes.velocity.array;
    const time = Date.now() * 0.00002;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      positions[i3 + 1] -= velocities[i];
      positions[i3] += Math.sin(time * (velocities[i] * 100) + i) * 0.02;
      positions[i3 + 2] += Math.cos(time * (velocities[i] * 100) + i) * 0.02;

      if (positions[i3 + 1] < -7) {
        positions[i3] = (Math.random() - 0.5) * 15;
        positions[i3 + 1] = 7;
        positions[i3 + 2] = (Math.random() - 0.5) * 15 - 5;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y += 0.0001;
  }
}