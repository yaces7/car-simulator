/**
 * carModels.js
 * Araç modelleri, özellikleri ve 3D model yükleme sistemi
 */

const CAR_MODELS = [
    {
        id: 0,
        name: "Sedan",
        type: "sedan",
        stats: {
            maxSpeed: 180,
            acceleration: 0.8,
            handling: 0.7,
            weight: 1200,
            braking: 0.7
        },
        color: 0x3498db,
        modelUrl: 'models/sedan.glb'
    },
    {
        id: 1,
        name: "SUV",
        type: "suv",
        stats: {
            maxSpeed: 160,
            acceleration: 0.6,
            handling: 0.6,
            weight: 1800,
            braking: 0.8
        },
        color: 0x2ecc71,
        modelUrl: 'models/suv.glb'
    },
    {
        id: 2,
        name: "Sports",
        type: "sports",
        stats: {
            maxSpeed: 240,
            acceleration: 1.0,
            handling: 0.9,
            weight: 1000,
            braking: 0.9
        },
        color: 0xe74c3c,
        modelUrl: 'models/sports.glb'
    },
    {
        id: 3,
        name: "Muscle",
        type: "muscle",
        stats: {
            maxSpeed: 220,
            acceleration: 0.9,
            handling: 0.7,
            weight: 1400,
            braking: 0.7
        },
        color: 0xf39c12,
        modelUrl: 'models/muscle.glb'
    },
    {
        id: 4,
        name: "Supercar",
        type: "supercar",
        stats: {
            maxSpeed: 280,
            acceleration: 1.2,
            handling: 1.0,
            weight: 900,
            braking: 1.0
        },
        color: 0x9b59b6,
        modelUrl: 'models/supercar.glb'
    },
    {
        id: 5,
        name: "BMW 733i",
        type: "luxury",
        stats: {
            maxSpeed: 220,
            acceleration: 0.85,
            handling: 0.85,
            weight: 1500,
            braking: 0.85
        },
        color: 0x1a1a2e,
        modelUrl: 'models/bmw_733i.glb'
    },
    {
        id: 6,
        name: "Lamborghini",
        type: "hypercar",
        stats: {
            maxSpeed: 320,
            acceleration: 1.3,
            handling: 0.95,
            weight: 1100,
            braking: 1.1
        },
        color: 0xf1c40f,
        modelUrl: 'models/lamborghini.glb'
    }
];

/**
 * GLB/GLTF model yükleme
 */
function loadGLBModel(url, carData, callback) {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        url,
        (gltf) => {
            const model = gltf.scene;
            
            // Önce ölçekle
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Hedef boyut 4 birim
            const targetSize = 4;
            const scale = maxDim > 0 ? targetSize / maxDim : 1;
            model.scale.set(scale, scale, scale);
            
            // Ölçekledikten sonra tekrar bounding box hesapla
            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            
            // Wrapper group
            const wrapper = new THREE.Group();
            wrapper.add(model);
            
            // Modeli merkeze al ve zemine oturt
            model.position.x = -center.x;
            model.position.y = -box.min.y + 0.1; // Zeminin biraz üstünde
            model.position.z = -center.z;
            
            // Gölge ayarları
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            console.log('Model boyutu:', size, 'Scale:', scale);
            callback(wrapper);
        },
        (xhr) => {
            if (xhr.total > 0) {
                console.log((xhr.loaded / xhr.total * 100).toFixed(0) + '% yüklendi');
            }
        },
        (error) => {
            console.error('GLB yükleme hatası:', error);
            callback(createCarMesh(carData));
        }
    );
}

/**
 * Prosedürel araba modeli oluşturma
 */
function createCarMesh(carData) {
    const group = new THREE.Group();
    
    // Ana gövde
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: carData.color,
        metalness: 0.6,
        roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Kabin
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
        color: carData.color,
        metalness: 0.6,
        roughness: 0.4
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.1, -0.3);
    cabin.castShadow = true;
    group.add(cabin);
    
    // Camlar
    const windowGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.8);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.1,
        opacity: 0.5,
        transparent: true
    });
    const windows = new THREE.Mesh(windowGeometry, windowMaterial);
    windows.position.set(0, 1.15, -0.3);
    group.add(windows);
    
    // Tekerlekler
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.3
    });
    
    const wheelPositions = [
        { x: -0.9, z: 1.3 },  // Sol ön
        { x: 0.9, z: 1.3 },   // Sağ ön
        { x: -0.9, z: -1.3 }, // Sol arka
        { x: 0.9, z: -1.3 }   // Sağ arka
    ];
    
    group.wheels = [];
    wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, 0.4, pos.z);
        wheel.castShadow = true;
        group.add(wheel);
        group.wheels.push(wheel);
    });
    
    // Farlar
    const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffaa,
        emissive: 0xffffaa,
        emissiveIntensity: 0.5
    });
    
    [-0.6, 0.6].forEach(x => {
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(x, 0.6, 2.05);
        group.add(headlight);
    });
    
    // Stop lambaları
    const taillightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
    });
    
    [-0.6, 0.6].forEach(x => {
        const taillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
        taillight.position.set(x, 0.6, -2.05);
        group.add(taillight);
    });
    
    return group;
}

/**
 * Garaj önizleme sahnesi - Tam Çalışan 3D Sistem
 */
class GaragePreview {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.carMesh = null;
        this.animationId = null;
        this.initialized = false;
        this.canvas = null;
        this.isVisible = false;
        this.rotationSpeed = 0.005;
        this.loadingIndicator = null;
    }
    
    init(containerId) {
        this.containerId = containerId;
        
        // Eğer zaten başlatılmışsa tekrar başlatma
        if (this.initialized && this.renderer) {
            return;
        }
        
        this.setupScene();
    }
    
    setupScene() {
        // Mevcut canvas varsa kaldır
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // Yeni canvas oluştur
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'garageCanvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 60vw;
            height: 100vh;
            z-index: 5;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(this.canvas);
        
        const width = window.innerWidth * 0.6;
        const height = window.innerHeight;
        
        // Sahne
        this.scene = new THREE.Scene();
        
        // Gradient arka plan
        const bgColor = new THREE.Color(0x0a0a1a);
        this.scene.background = bgColor;
        this.scene.fog = new THREE.Fog(bgColor, 15, 50);
        
        // Kamera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        this.camera.position.set(8, 4, 8);
        this.camera.lookAt(0, 0.5, 0);
        
        // Renderer
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.canvas,
                antialias: true,
                alpha: false
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
        } catch (e) {
            console.error('WebGL renderer oluşturulamadı:', e);
            return;
        }
        
        // Işıklar - Stüdyo aydınlatması
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambientLight);
        
        // Ana ışık (üstten)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 15, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        this.scene.add(mainLight);
        
        // Dolgu ışığı (önden)
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.6);
        fillLight.position.set(-5, 5, 10);
        this.scene.add(fillLight);
        
        // Arka ışık (rim light)
        const backLight = new THREE.DirectionalLight(0xff8844, 0.4);
        backLight.position.set(0, 5, -10);
        this.scene.add(backLight);
        
        // Spot ışıklar
        const spotLight1 = new THREE.SpotLight(0x4488ff, 0.8, 30, Math.PI / 6, 0.5);
        spotLight1.position.set(-8, 8, 0);
        spotLight1.target.position.set(0, 0, 0);
        this.scene.add(spotLight1);
        this.scene.add(spotLight1.target);
        
        const spotLight2 = new THREE.SpotLight(0xff4488, 0.8, 30, Math.PI / 6, 0.5);
        spotLight2.position.set(8, 8, 0);
        spotLight2.target.position.set(0, 0, 0);
        this.scene.add(spotLight2);
        this.scene.add(spotLight2.target);
        
        // Zemin - Yansıtıcı platform
        const platformGeometry = new THREE.CylinderGeometry(8, 8, 0.3, 64);
        const platformMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            metalness: 0.9,
            roughness: 0.1
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -0.15;
        platform.receiveShadow = true;
        this.scene.add(platform);
        
        // Platform kenar ışığı
        const ringGeometry = new THREE.TorusGeometry(8, 0.05, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x4488ff });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.01;
        this.scene.add(ring);
        
        // Grid
        const gridHelper = new THREE.GridHelper(16, 32, 0x2a3a5a, 0x1a2a3a);
        gridHelper.position.y = 0.02;
        this.scene.add(gridHelper);
        
        this.initialized = true;
        console.log('Garaj 3D sahnesi hazır');
        
        // Animasyon başlat
        this.animate();
    }
    
    showCar(carId) {
        if (!this.initialized || !this.scene) {
            console.log('Sahne hazır değil, bekleniyor...');
            setTimeout(() => this.showCar(carId), 200);
            return;
        }
        
        // Eski arabayı kaldır
        if (this.carMesh) {
            this.scene.remove(this.carMesh);
            if (this.carMesh.traverse) {
                this.carMesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
            this.carMesh = null;
        }
        
        const carData = CAR_MODELS[carId];
        if (!carData) {
            console.error('Araç verisi bulunamadı:', carId);
            return;
        }
        
        console.log('Araç yükleniyor:', carData.name, carData.modelUrl);
        
        // Önce prosedürel model göster (hızlı)
        this.carMesh = createCarMesh(carData);
        this.carMesh.position.set(0, 0, 0);
        this.carMesh.rotation.y = 0;
        this.scene.add(this.carMesh);
        
        // GLB model varsa yükle
        if (carData.modelUrl) {
            loadGLBModel(carData.modelUrl, carData, (model) => {
                // Eski modeli kaldır
                if (this.carMesh) {
                    this.scene.remove(this.carMesh);
                }
                
                this.carMesh = model;
                this.carMesh.position.set(0, 0, 0);
                this.carMesh.rotation.y = 0;
                this.scene.add(this.carMesh);
                
                console.log('GLB model yüklendi:', carData.name);
            });
        }
    }
    
    animate() {
        if (!this.initialized) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Araba döndür
        if (this.carMesh && this.isVisible) {
            this.carMesh.rotation.y += this.rotationSpeed;
        }
        
        // Render
        if (this.renderer && this.scene && this.camera && this.isVisible) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    show() {
        if (this.canvas) {
            this.canvas.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hide() {
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer || !this.canvas) return;
        
        const width = window.innerWidth * 0.6;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    destroy() {
        this.isVisible = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        this.initialized = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.carMesh = null;
        this.canvas = null;
    }
}

// Global garaj önizleme instance
let garagePreview = null;

// Pencere yeniden boyutlandırma
window.addEventListener('resize', () => {
    if (garagePreview && garagePreview.onWindowResize) {
        garagePreview.onWindowResize();
    }
});
