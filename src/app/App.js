import { SceneManager } from '../three/SceneManager.js';
import { SnowEffect } from '../three/SnowEffect.js';
import { FaceDetector } from '../face/FaceDetector.js';
import { ShareManager } from '../share/ShareManager.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class App {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.sceneManager = new SceneManager();
    this.faceDetector = new FaceDetector();
    this.shareManager = new ShareManager();
    this.models = {};
    this.faceModels = {};
    this.modelParams = {
      hat: { scale: 1.0, positionOffset: { x: 0, y: 0.1, z: 0 } },
      tonakai: { scale: 0.8, positionOffset: { x: 0, y: -0.2, z: 0 } }
    };
    this.modelsLoaded = false;
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    
    this.baseMovementScale = {
      x: 8,
      y: 6,
      z: 3
    };

    this.screenDimensions = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.movementScale = { ...this.baseMovementScale };

    this.updateScreenDimensions();
    window.addEventListener('resize', () => this.updateScreenDimensions());
  }

  updateScreenDimensions() {
    this.screenDimensions = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const aspectRatio = this.screenDimensions.width / this.screenDimensions.height;
    const baseScale = Math.min(1, aspectRatio);
    
    this.movementScale = {
      x: this.baseMovementScale.x * baseScale,
      y: this.baseMovementScale.y * baseScale,
      z: this.baseMovementScale.z * baseScale
    };
  }

  async initialize() {
    try {
      if (this.initializationAttempts >= this.maxInitializationAttempts) {
        console.error('Maximum initialization attempts reached');
        return;
      }

      this.initializationAttempts++;

      await this.setupWebcam();
      await this.faceDetector.initialize();
      await this.loadModels();
      
      if (!this.videoElement.srcObject || this.videoElement.readyState !== this.videoElement.HAVE_ENOUGH_DATA) {
        throw new Error('Video not properly initialized');
      }

      this.snowEffect = new SnowEffect(this.sceneManager.scene);
      this.setupCaptureButton();
      this.animate();
    } catch (error) {
      console.error('Initialization error:', error);
      setTimeout(() => this.initialize(), 1000);
    }
  }

  setupCaptureButton() {
    const captureButton = document.querySelector('.capture-button');
    captureButton.addEventListener('click', () => {
      requestAnimationFrame(() => this.captureImage());
    });
  }

  async captureImage() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create a canvas for compositing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw video (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.videoElement,
      -width, 0,
      width, height
    );
    ctx.restore();

    // Draw Three.js scene
    ctx.drawImage(
      this.sceneManager.renderer.domElement,
      0, 0,
      width, height
    );

    // Draw UI elements
    await this.drawUIElements(ctx, width, height);

    // Convert to image data and show share menu
    const imageData = canvas.toDataURL('image/png');
    this.shareManager.showShareMenu(imageData);
  }

  async drawUIElements(ctx, width, height) {
    // Draw SVG elements first
    await Promise.all([
      this.drawSVGElement(ctx, '.christmas-tree'),
      this.drawSVGElement(ctx, '.star-container')
    ]);

    // Draw text elements
    const title = document.querySelector('.title');
    const poweredBy = document.querySelector('.powered-by');

    // Draw title with Christmas style
    if (title) {
      const titleStyle = window.getComputedStyle(title);
      const fontSize = parseInt(titleStyle.fontSize);
      const fontFamily = titleStyle.fontFamily;
      
      ctx.save();
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const text = title.textContent;
      const x = width / 2;
      const y = parseInt(titleStyle.top) || 20;

      // Add Christmas-themed glow effect
      ctx.shadowColor = 'rgba(255,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'white';
      ctx.fillText(text, x, y);

      ctx.shadowColor = 'rgba(0,255,0,0.8)';
      ctx.shadowBlur = 20;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    // Draw "Powered by" text
    if (poweredBy) {
      const style = window.getComputedStyle(poweredBy);
      ctx.save();
      ctx.font = `${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(
        poweredBy.textContent,
        width - 20,
        height - 20
      );
      ctx.restore();
    }
  }

  async drawSVGElement(ctx, selector) {
    const element = document.querySelector(selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const svgData = new XMLSerializer().serializeToString(element);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      const img = await this.loadImage(url);
      ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async setupWebcam() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream || !stream.active) {
        throw new Error('Invalid stream');
      }

      this.videoElement.srcObject = stream;
      
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000);

        this.videoElement.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          this.videoElement.play()
            .then(resolve)
            .catch(error => {
              console.error('Error playing video:', error);
              reject(error);
            });
        };

        this.videoElement.onerror = (error) => {
          clearTimeout(timeoutId);
          reject(error);
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw error;
    }
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const loadModel = (url) => {
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 1.0;
                child.material.side = THREE.DoubleSide;
                child.material.depthTest = true;
                child.material.depthWrite = true;
                if (child.material.map) {
                  child.material.map.encoding = THREE.sRGBEncoding;
                }
              }
            });
            resolve(gltf);
          },
          undefined,
          reject
        );
      });
    };

    try {
      const [hatGltf, tonakaiGltf] = await Promise.all([
        loadModel('https://cdn.jsdelivr.net/gh/OzakiSatoshi/MediaPipe_Face@c91e2a2a16704610d72d8d4d81739855d869565a/hat.glb'),
        loadModel('https://cdn.jsdelivr.net/gh/OzakiSatoshi/MediaPipe_Face@c91e2a2a16704610d72d8d4d81739855d869565a/tonakai.glb')
      ]);

      this.models.hat = hatGltf.scene.clone();
      this.models.tonakai = tonakaiGltf.scene.clone();

      Object.entries(this.models).forEach(([key, model]) => {
        const scale = this.modelParams[key].scale;
        model.scale.set(scale, scale, scale);
        
        const rotation = { x: Math.PI / 2, y: Math.PI, z: 0 };
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.userData.initialRotation = rotation;
      });

      this.modelsLoaded = true;
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  }

  mapFacePositionToScene(landmarks) {
    const foreheadPoint = landmarks[10];
    const nosePoint = landmarks[4];
    
    const x = -(foreheadPoint.x - 0.5) * this.movementScale.x;
    const y = -(foreheadPoint.y - 0.5) * this.movementScale.y;
    const z = -(nosePoint.z * this.movementScale.z);

    return { x, y, z };
  }

  updateModelTransform(model, landmarks, params) {
    if (!model || !landmarks) return;

    const mappedPosition = this.mapFacePositionToScene(landmarks);
    
    model.position.set(
      mappedPosition.x + params.positionOffset.x,
      mappedPosition.y + params.positionOffset.y,
      mappedPosition.z + params.positionOffset.z
    );

    const rotation = this.faceDetector.calculateFaceRotation(landmarks);
    const initialRotation = model.userData.initialRotation;
    
    const rotationSpeed = 0.15;
    
    const targetRotation = {
      x: rotation.pitch + initialRotation.x,
      y: -rotation.yaw + initialRotation.y,
      z: -rotation.roll + initialRotation.z
    };

    model.rotation.x += (targetRotation.x - model.rotation.x) * rotationSpeed;
    model.rotation.y += (targetRotation.y - model.rotation.y) * rotationSpeed;
    model.rotation.z += (targetRotation.z - model.rotation.z) * rotationSpeed;
  }

  async handleFaceDetection() {
    if (!this.modelsLoaded) return;

    const results = await this.faceDetector.detectFace(this.videoElement);
    if (!results?.faceLandmarks?.length) return;

    results.faceLandmarks.forEach((landmarks, index) => {
      if (!this.faceModels[index]) {
        const modelType = Math.random() < 0.5 ? 'hat' : 'tonakai';
        const model = this.models[modelType].clone();
        
        const rotation = this.models[modelType].userData.initialRotation;
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.userData.initialRotation = { ...rotation };
        
        this.faceModels[index] = {
          model: model,
          params: this.modelParams[modelType]
        };
        this.sceneManager.scene.add(this.faceModels[index].model);
      }

      const { model, params } = this.faceModels[index];
      this.updateModelTransform(model, landmarks, params);
    });

    Object.keys(this.faceModels).forEach(key => {
      if (parseInt(key) >= results.faceLandmarks.length) {
        this.sceneManager.scene.remove(this.faceModels[key].model);
        delete this.faceModels[key];
      }
    });
  }

  animate = () => {
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.handleFaceDetection();
      if (this.snowEffect) this.snowEffect.animate();
      this.sceneManager.render();
    }
    requestAnimationFrame(this.animate);
  }
}