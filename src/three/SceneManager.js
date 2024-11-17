import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });
    
    this.setupRenderer();
    this.setupLighting();
    this.setupCamera();
    this.handleResize();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.sortObjects = true;
    this.renderer.autoClear = true;

    // Set canvas style for proper compositing
    const canvas = this.renderer.domElement;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    document.body.appendChild(canvas);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-1, -1, -1);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(0, -1, 2);
    
    this.scene.add(ambientLight, directionalLight, backLight, fillLight);
  }

  setupCamera() {
    this.camera.position.set(0, 0, 5);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
  }

  handleResize() {
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}