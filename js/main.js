// Ana oyun yöneticisi
let scene, camera, renderer;
let player, gameMap, ui;
let gameRunning = false;
let selectedCarId = 0;

// Ekran geçişleri
function showScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'garage') {
        initGarage();
    }
}

// Garaj başlatma
function initGarage() {
    if (!garagePreview) {
        garagePreview = new GaragePreview();
        garagePreview.init('carPreview');
        // İlk arabayı göster
        setTimeout(() => {
            selectCar(selectedCarId);
        }, 100);
    } else {
        selectCar(selectedCarId);
    }
}

// Araba seçimi
function selectCar(carId) {
    selectedCarId = carId;
    const carData = CAR_MODELS[carId];
    
    // Aktif butonu işaretle
    document.querySelectorAll('.car-btn').forEach((btn, index) => {
        if (index === carId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (garagePreview) {
        garagePreview.showCar(carId);
    }
    
    // İstatistikleri göster
    const statsDiv = document.getElementById('carStats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <h3>${carData.name}</h3>
            <div class="stat">Max Hız: ${carData.stats.maxSpeed} km/h</div>
            <div class="stat">İvme: ${(carData.stats.acceleration * 100).toFixed(0)}%</div>
            <div class="stat">Yol Tutuş: ${(carData.stats.handling * 100).toFixed(0)}%</div>
            <div class="stat">Ağırlık: ${carData.stats.weight} kg</div>
            <div class="stat">Fren: ${(carData.stats.braking * 100).toFixed(0)}%</div>
        `;
    }
    
    // Seçimi kaydet
    localStorage.setItem('selectedCarId', carId);
}

// Tek oyunculu başlat
function startSinglePlayer() {
    document.getElementById('singlePlayer').classList.remove('active');
    document.getElementById('loadingScreen').classList.add('active');
    
    setTimeout(() => {
        initGame();
    }, 500);
}

// Çok oyunculu başlat
function startMultiplayer() {
    alert('Multiplayer modu henüz aktif değil. Tek oyunculu modu deneyin!');
}

// Oyun başlatma
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    
    // Three.js sahne
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 0, 500);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Işıklar
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    
    // Fizik dünyası oluştur
    const physicsWorld = new PhysicsWorld();
    
    // Harita oluştur
    gameMap = new GameMap(scene, physicsWorld);
    
    // Oyuncu oluştur
    const carData = CAR_MODELS[selectedCarId];
    player = new Player(scene, physicsWorld, carData);
    
    // Kamera
    camera = new ThirdPersonCamera(player, renderer.domElement);
    
    // UI
    ui = new UI();
    
    // Mobil kontroller
    const mobileControls = new MobileControls(player);
    
    // Yükleme ekranını kapat
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
    }, 500);
    
    gameRunning = true;
    animate();
}

// Oyun döngüsü
function animate() {
    if (!gameRunning) return;
    
    requestAnimationFrame(animate);
    
    const delta = 0.016; // ~60 FPS
    
    // Oyuncu güncelle
    if (player) {
        player.update(delta);
        
        // UI güncelle
        if (ui) {
            const speed = player.getSpeed();
            ui.updateSpeed(speed);
            ui.updateGear(player.currentGear || 1);
            ui.updateRPM(speed * 30, 8000);
            ui.updateMinimap(
                player.mesh.position,
                player.mesh.rotation.y
            );
        }
    }
    
    // Kamera güncelle
    if (camera) {
        camera.update();
    }
    
    // Render
    renderer.render(scene, camera.camera);
}

// Oyunu duraklat
function pauseGame() {
    gameRunning = !gameRunning;
    if (gameRunning) {
        animate();
    }
}

// Ayarları güncelle
function updateSettings() {
    const quality = document.getElementById('graphicsQuality').value;
    const shadows = document.getElementById('shadowsEnabled').checked;
    const resScale = document.getElementById('resolutionScale').value;
    
    if (renderer) {
        renderer.shadowMap.enabled = shadows;
        renderer.setPixelRatio(window.devicePixelRatio * parseFloat(resScale));
    }
    
    document.getElementById('resScaleValue').textContent = 
        Math.round(resScale * 100) + '%';
    
    console.log('Ayarlar güncellendi:', { quality, shadows, resScale });
}

// Pencere yeniden boyutlandırma
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.camera.aspect = window.innerWidth / window.innerHeight;
        camera.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    console.log('Oyun hazır!');
    
    // Kaydedilmiş araba seçimini yükle
    const savedCarId = localStorage.getItem('selectedCarId');
    if (savedCarId !== null) {
        selectedCarId = parseInt(savedCarId);
    }
});
