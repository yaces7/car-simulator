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
 * Garaj önizleme sahnesi
 */
class GaragePreview {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.carMesh = null;
        this.animationId = null;
        this.initialized = false;
    }
    
    init(containerId) {
        this.containerId = containerId;
        
        // Biraz bekle - container görünür olsun
        setTimeout(() => this.setupScene(), 100);
    }
    
    setupScene() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Garaj container bulunamadı:', this.containerId);
            return;
        }
        
        // Container'ı temizle
        container.innerHTML = '';
        
        // Sabit boyutlar kullan
        const width = 800;
        const height = 600;
        
        // Sahne
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Kamera - daha yakın
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.set(6, 3, 6);
        this.camera.lookAt(0, 0.5, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Canvas %100 genişlik/yükseklik
        const canvas = this.renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        
        container.appendChild(canvas);
        
        // Işıklar - daha güçlü
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const backLight = new THREE.DirectionalLight(0x6699ff, 0.5);
        backLight.position.set(-10, 10, -10);
        this.scene.add(backLight);
        
        // Zemin
        const groundGeometry = new THREE.CircleGeometry(15, 64);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a3a5a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Grid
        const gridHelper = new THREE.GridHelper(12, 12, 0x4a6a9a, 0x3a4a6a);
        this.scene.add(gridHelper);
        
        this.initialized = true;
        console.log('Garaj sahnesi hazır');
        
        this.animate();
    }
    
    showCar(carId) {
        if (!this.initialized || !this.scene) {
            console.log('Sahne henüz hazır değil, bekleniyor...');
            setTimeout(() => this.showCar(carId), 200);
            return;
        }
        
        // Eski arabayı kaldır
        if (this.carMesh) {
            this.scene.remove(this.carMesh);
            this.carMesh = null;
        }
        
        const carData = CAR_MODELS[carId];
        if (!carData) {
            console.error('Araç bulunamadı:', carId);
            return;
        }
        
        console.log('Araç yükleniyor:', carData.name);
        
        // Her zaman önce prosedürel model göster (hızlı)
        this.carMesh = createCarMesh(carData);
        this.carMesh.position.set(0, 0, 0);
        this.scene.add(this.carMesh);
        
        // GLB varsa sonra yükle ve değiştir
        if (carData.modelUrl) {
            loadGLBModel(carData.modelUrl, carData, (model) => {
                if (this.carMesh) {
                    this.scene.remove(this.carMesh);
                }
                this.carMesh = model;
                this.carMesh.position.set(0, 0, 0);
                this.scene.add(this.carMesh);
                console.log('GLB model yüklendi:', carData.name);
            });
        }
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.carMesh) {
            this.carMesh.rotation.y += 0.008;
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    onWindowResize() {
        // Artık sabit boyut kullanıyoruz, resize gerekmiyor
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.initialized = false;
    }
}

// Global garaj önizleme instance
let garagePreview = null;

// Pencere yeniden boyutlandırma
window.addEventListener('resize', () => {
    if (garagePreview) {
        garagePreview.onWindowResize();
    }
});
