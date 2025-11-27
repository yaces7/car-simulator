// Ana oyun yöneticisi
let scene, camera, renderer;
let player, gameMap, ui, physicsWorld;
let gameRunning = false;
let selectedCarId = 0;
let lastTime = 0;

// Ekran geçişleri
function showScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Garaj canvas kontrolü
    if (screenId === 'garage') {
        initGarage();
    } else {
        // Garaj değilse canvas'ı gizle
        if (garagePreview) garagePreview.hide();
    }
    
    if (screenId === 'stats') {
        updateStatsScreen();
    }
}

// İstatistik ekranını güncelle
function updateStatsScreen() {
    const money = parseInt(localStorage.getItem('playerMoney')) || 1000;
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
        score: 0,
        topSpeed: 0,
        totalDistance: 0,
        driftScore: 0
    };
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];
    
    document.getElementById('statMoney').textContent = money.toLocaleString();
    document.getElementById('statScore').textContent = stats.score?.toLocaleString() || '0';
    document.getElementById('statTopSpeed').textContent = `${stats.topSpeed || 0} km/h`;
    document.getElementById('statDistance').textContent = `${((stats.totalDistance || 0) / 1000).toFixed(1)} km`;
    document.getElementById('statDrift').textContent = (stats.driftScore || 0).toLocaleString();
    document.getElementById('statAchievements').textContent = `${achievements.length}/8`;
}

// Garaj başlatma
function initGarage() {
    console.log('Garaj başlatılıyor...');
    
    // Sahip olunan araçları yükle
    ownedCars = JSON.parse(localStorage.getItem('ownedCars')) || [0];
    
    // Para göster
    const money = parseInt(localStorage.getItem('playerMoney')) || 1000;
    const garageMoney = document.getElementById('garageMoney');
    if (garageMoney) garageMoney.textContent = money.toLocaleString();
    
    // Garaj önizleme oluştur veya yeniden başlat
    if (!garagePreview) {
        garagePreview = new GaragePreview();
    }
    
    // Sahneyi başlat
    garagePreview.init('carPreview');
    
    // Canvas'ı göster ve arabayı yükle
    setTimeout(() => {
        if (garagePreview) {
            garagePreview.show();
            console.log('Garaj canvas gösterildi');
            
            // İndikatörleri güncelle
            updateCarIndicators();
            
            // Seçili arabayı göster
            selectCar(selectedCarId);
        }
    }, 100);
}

// Önceki araba
function prevCar() {
    const totalCars = CAR_MODELS.length;
    selectedCarId = (selectedCarId - 1 + totalCars) % totalCars;
    selectCar(selectedCarId);
}

// Sonraki araba
function nextCar() {
    const totalCars = CAR_MODELS.length;
    selectedCarId = (selectedCarId + 1) % totalCars;
    selectCar(selectedCarId);
}

// İndikatörleri güncelle
function updateCarIndicators() {
    const indicator = document.getElementById('carIndicator');
    if (!indicator) return;
    
    const dots = indicator.querySelectorAll('.indicator-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === selectedCarId);
        dot.onclick = () => selectCar(index);
    });
}

// Araç seçimini onayla
function confirmCarSelection() {
    const isOwned = ownedCars.includes(selectedCarId);
    if (isOwned) {
        localStorage.setItem('selectedCarId', selectedCarId);
        if (typeof gameManager !== 'undefined' && gameManager) {
            gameManager.showNotification(`🚗 ${CAR_MODELS[selectedCarId].name} seçildi!`, 'achievement');
        }
    }
}

// Araç fiyatları
const CAR_PRICES = [0, 2000, 5000, 8000, 15000, 12000, 50000];

// Sahip olunan araçlar
let ownedCars = JSON.parse(localStorage.getItem('ownedCars')) || [0]; // Sedan varsayılan

// Araba seçimi
function selectCar(carId) {
    selectedCarId = carId;
    const carData = CAR_MODELS[carId];
    const isOwned = ownedCars.includes(carId);
    const price = CAR_PRICES[carId];
    const playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
    
    // İndikatörleri güncelle
    updateCarIndicators();
    
    // 3D önizleme
    if (garagePreview) {
        garagePreview.showCar(carId);
    }
    
    // Araç adı
    const carNameDisplay = document.getElementById('carNameDisplay');
    if (carNameDisplay) {
        carNameDisplay.textContent = carData.name;
    }
    
    // Fiyat etiketi
    const priceTag = document.getElementById('carPriceTag');
    if (priceTag) {
        if (isOwned) {
            priceTag.textContent = '✅ SAHİP';
            priceTag.className = 'car-price-tag owned';
        } else {
            priceTag.textContent = `🔒 ${price.toLocaleString()} 💰`;
            priceTag.className = 'car-price-tag locked';
        }
    }
    
    // İstatistik barları
    const statsDiv = document.getElementById('carStats');
    if (statsDiv) {
        const maxSpeed = 300; // Referans max hız
        const speedPercent = (carData.stats.maxSpeed / maxSpeed) * 100;
        const accelPercent = carData.stats.acceleration * 100;
        const handlingPercent = carData.stats.handling * 100;
        const brakingPercent = carData.stats.braking * 100;
        
        statsDiv.innerHTML = `
            <div class="stat-bar-item">
                <div class="stat-bar-label">
                    <span>🏎️ Hız</span>
                    <span>${carData.stats.maxSpeed} km/h</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill speed" style="width: ${speedPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar-item">
                <div class="stat-bar-label">
                    <span>⚡ İvme</span>
                    <span>${accelPercent.toFixed(0)}%</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill accel" style="width: ${accelPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar-item">
                <div class="stat-bar-label">
                    <span>🎯 Yol Tutuş</span>
                    <span>${handlingPercent.toFixed(0)}%</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill handling" style="width: ${handlingPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar-item">
                <div class="stat-bar-label">
                    <span>🛑 Fren</span>
                    <span>${brakingPercent.toFixed(0)}%</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill braking" style="width: ${brakingPercent}%"></div>
                </div>
            </div>
            <div class="stat-bar-item">
                <div class="stat-bar-label">
                    <span>⚖️ Ağırlık</span>
                    <span>${carData.stats.weight} kg</span>
                </div>
            </div>
        `;
    }
    
    // Satın al butonu
    const buyBtn = document.getElementById('buyCarBtn');
    const selectBtn = document.getElementById('selectCarBtn');
    
    if (buyBtn) {
        if (isOwned) {
            buyBtn.style.display = 'none';
        } else {
            buyBtn.style.display = 'block';
            buyBtn.innerHTML = playerMoney >= price ? 
                `🛒 SATIN AL (${price.toLocaleString()} 💰)` : 
                `❌ YETERSİZ PARA`;
            buyBtn.disabled = playerMoney < price;
            buyBtn.dataset.carId = carId;
            buyBtn.dataset.price = price;
        }
    }
    
    // Seç butonu
    if (selectBtn) {
        if (isOwned) {
            selectBtn.style.display = 'block';
            selectBtn.disabled = false;
        } else {
            selectBtn.style.display = 'none';
        }
    }
    
    // Para göster
    const garageMoney = document.getElementById('garageMoney');
    if (garageMoney) {
        garageMoney.textContent = playerMoney.toLocaleString();
    }
}

// Araç satın al
function buyCar() {
    const buyBtn = document.getElementById('buyCarBtn');
    if (!buyBtn) return;
    
    const carId = parseInt(buyBtn.dataset.carId);
    const price = parseInt(buyBtn.dataset.price);
    let playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
    
    if (playerMoney >= price && !ownedCars.includes(carId)) {
        playerMoney -= price;
        localStorage.setItem('playerMoney', playerMoney);
        
        ownedCars.push(carId);
        localStorage.setItem('ownedCars', JSON.stringify(ownedCars));
        
        // UI güncelle
        selectCar(carId);
        selectedCarId = carId;
        localStorage.setItem('selectedCarId', carId);
        
        // Modern bildirim
        showPurchaseNotification(CAR_MODELS[carId].name);
    }
}

// Satın alma bildirimi
function showPurchaseNotification(carName) {
    let notification = document.getElementById('purchaseNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'purchaseNotification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.innerHTML = `🎉 SATIN ALINDI!<br><span style="font-size: 20px;">${carName}</span>`;
    notification.style.transform = 'translate(-50%, -50%) scale(1)';
    
    setTimeout(() => {
        notification.style.transform = 'translate(-50%, -50%) scale(0)';
    }, 2000);
}

// Araç butonlarını güncelle (eski sistem için uyumluluk)
function updateCarButtons() {
    // Eski buton sistemi kaldırıldı, indikatörleri güncelle
    updateCarIndicators();
}

// Oyun modu
let gameMode = 'free';

// Tek oyunculu başlat
function startSinglePlayer(mode = 'free') {
    gameMode = mode;
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
    
    // Three.js sahne - background yok, skybox kullanılacak
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 100, 800);
    
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
    physicsWorld = new PhysicsWorld();
    
    // Harita oluştur
    gameMap = new GameMap(scene, physicsWorld);
    
    // Tuning sistemi - oyuncu oluşturulmadan önce
    if (!tuningSystem) {
        tuningSystem = new TuningSystem();
    }
    
    // Oyuncu oluştur
    const carData = CAR_MODELS[selectedCarId];
    player = new Player(scene, physicsWorld, carData);
    
    // Kamera
    camera = new ThirdPersonCamera(player, renderer.domElement);
    
    // UI
    ui = new UI();
    
    // Mobil kontroller
    mobileControlsInstance = new MobileControls(player);
    
    // Oyun yöneticisi (skor, görevler)
    gameManager = new GameManager();
    
    // Ses sistemi
    audioManager = new AudioManager();
    
    // Yükleme ekranını kapat
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Kontak düğmesini göster ve bildirim
        const ignitionBtn = document.getElementById('ignitionBtn');
        if (ignitionBtn) {
            ignitionBtn.classList.remove('engine-on');
        }
        
        if (gameManager) {
            gameManager.showNotification('🔑 Motoru çalıştırmak için KONTAK düğmesine basın', '');
        }
    }, 500);
    
    // Checkpoint sistemi
    checkpointSystem = new CheckpointSystem(scene);
    
    // Polis sistemi
    policeSystem = new PoliceSystem(scene, physicsWorld.world);
    
    // Karakter sistemi (GTA tarzı)
    character = new Character(scene, physicsWorld.world);
    
    // Tuning sistemi
    if (!tuningSystem) {
        tuningSystem = new TuningSystem();
    }
    
    // F tuşu ile arabadan in/bin
    setupVehicleControls();
    
    // Yarış modu ise checkpoint'leri oluştur
    if (gameMode === 'circuit' || gameMode === 'sprint') {
        checkpointSystem.createRace(gameMode);
        setTimeout(() => {
            checkpointSystem.startRace();
        }, 2000);
    }
    
    // İlk sürüş başarımı
    if (gameManager) {
        gameManager.unlockAchievement('first_drive');
    }
    
    gameRunning = true;
    lastTime = performance.now();
    animate();
}

// Oyun döngüsü
function animate() {
    if (!gameRunning) return;
    
    requestAnimationFrame(animate);
    
    // Delta time hesapla
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1); // Max 100ms
    lastTime = now;
    
    // Fizik güncelle
    if (physicsWorld) {
        physicsWorld.update(delta);
    }
    
    // Karakter güncelle (arabadan inmişse)
    if (character && !isInVehicle) {
        character.update(delta);
    }
    
    // Oyuncu güncelle (arabadaysa)
    if (player && isInVehicle) {
        player.update(delta);
    }
    
    // Aktif hedefin pozisyonunu al
    const activeTarget = isInVehicle ? player : character;
    const activePosition = activeTarget ? 
        (activeTarget.mesh ? activeTarget.mesh.position : activeTarget.getPosition()) : 
        { x: 0, y: 0, z: 0 };
    
    // Harita güncelle (chunk loading + gün/gece)
    if (gameMap && activePosition) {
        gameMap.update(activePosition, delta);
        
        // Saat ve hava durumu güncelle
        const timeInfo = document.getElementById('timeInfo');
        const weatherInfo = document.getElementById('weatherInfo');
        if (timeInfo) timeInfo.textContent = gameMap.getTimeString();
        if (weatherInfo) weatherInfo.textContent = gameMap.getWeatherString();
    }
    
    // UI güncelle (sadece arabadayken)
    if (ui && player && isInVehicle) {
        const speed = player.getSpeed();
        ui.updateSpeed(speed);
        ui.updateGear(player.currentGear || 1);
        ui.updateRPM(player.rpm || 1000, 8000);
        ui.updateFuel(player.fuel || 100);
        ui.updateHealth(player.health || 100);
        ui.updateMinimap(
            player.mesh.position,
            player.rotationY || 0
        );
    }
    
    // Benzin istasyonu kontrolü
    if (gameMap && player && player.mesh && isInVehicle) {
        const nearStation = gameMap.checkGasStationProximity(player.mesh.position);
        handleGasStation(nearStation);
    }
    
    // Oyun yöneticisi güncelle
    if (gameManager && player) {
        gameManager.update(player, gameMap, delta);
    }
    
    // Motor sesi güncelle
    if (audioManager && audioManager.engineRunning && isInVehicle) {
        const speed = player.getSpeed();
        const throttle = player.controls && player.controls.forward;
        audioManager.updateEngine(speed, throttle, speed * 30);
        
        // Drift sesi
        if (player.isDrifting && speed > 30) {
            if (Math.random() < 0.1) {
                audioManager.playSound('drift');
            }
        }
        
        // Nitro sesi
        if (player.controls && player.controls.nitro && player.nitro > 0) {
            if (Math.random() < 0.05) {
                audioManager.playSound('nitro');
            }
        }
    }
    
    // Checkpoint sistemi güncelle
    if (checkpointSystem && isInVehicle) {
        if (checkpointSystem.raceActive) {
            checkpointSystem.update(player.mesh.position, delta);
            
            // Yarış bilgisini göster
            const raceInfo = checkpointSystem.getRaceInfo();
            if (raceInfo) {
                const raceInfoPanel = document.getElementById('raceInfo');
                if (raceInfoPanel) {
                    raceInfoPanel.style.display = 'block';
                    document.getElementById('raceTime').textContent = raceInfo.time;
                    document.getElementById('raceCheckpoint').textContent = raceInfo.checkpoint;
                    document.getElementById('raceBest').textContent = raceInfo.bestTime;
                }
            }
        } else {
            const raceInfoPanel = document.getElementById('raceInfo');
            if (raceInfoPanel) {
                raceInfoPanel.style.display = 'none';
            }
        }
    }
    
    // Polis sistemi güncelle
    if (policeSystem && isInVehicle) {
        policeSystem.update(player, delta);
        
        // Wanted level UI güncelle
        if (ui && ui.updateWantedLevel) {
            ui.updateWantedLevel(policeSystem.getWantedLevel());
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

// Yardım panelini aç/kapa
function toggleHelp() {
    const helpPanel = document.getElementById('helpPanel');
    if (helpPanel) {
        helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
    }
}

// Korna çal
function playHorn() {
    if (audioManager && audioManager.isEngineRunning()) {
        audioManager.playSound('horn');
    }
}

// Kontak aç/kapa
function toggleIgnition() {
    if (!audioManager) return;
    
    const ignitionBtn = document.getElementById('ignitionBtn');
    
    if (audioManager.isEngineRunning()) {
        // Motoru kapat
        audioManager.stopEngine();
        if (ignitionBtn) {
            ignitionBtn.classList.remove('engine-on', 'starting');
        }
        
        // Araba hareket edemez
        if (player) {
            player.engineOn = false;
        }
        
        if (gameManager) {
            gameManager.showNotification('🔑 Motor kapatıldı', '');
        }
    } else {
        // Motoru çalıştır
        if (ignitionBtn) {
            ignitionBtn.classList.add('starting');
        }
        
        audioManager.startEngine(false); // false = marş sekansı ile
        
        setTimeout(() => {
            if (ignitionBtn) {
                ignitionBtn.classList.remove('starting');
                ignitionBtn.classList.add('engine-on');
            }
            
            // Araba hareket edebilir
            if (player) {
                player.engineOn = true;
            }
            
            if (gameManager) {
                gameManager.showNotification('🚗 Motor çalıştı!', '');
            }
        }, 1500);
    }
}

// Far aç/kapa
function toggleHeadlights() {
    if (!player) return;
    
    const headlightBtn = document.getElementById('headlightBtn');
    
    if (player.toggleHeadlights) {
        const isOn = player.toggleHeadlights();
        
        if (headlightBtn) {
            headlightBtn.classList.toggle('lights-on', isOn);
        }
        
        if (gameManager) {
            gameManager.showNotification(isOn ? '💡 Farlar açıldı' : '🌙 Farlar kapatıldı', '');
        }
    }
}

// Arabadan in/bin kontrolleri
let isInVehicle = true;

function setupVehicleControls() {
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'e') {
            toggleVehicle();
        }
    });
}

function toggleVehicle() {
    if (!character || !player) return;
    
    if (isInVehicle) {
        // Arabadan in
        exitVehicle();
    } else {
        // Arabaya bin
        enterVehicle();
    }
}

function exitVehicle() {
    if (!isInVehicle || !player || !character) return;
    
    // Motor kapalıysa çık
    if (audioManager && audioManager.isEngineRunning()) {
        audioManager.stopEngine();
        const ignitionBtn = document.getElementById('ignitionBtn');
        if (ignitionBtn) ignitionBtn.classList.remove('engine-on');
    }
    
    // Karakteri arabadan çıkar
    character.exitVehicle(player.mesh.position, player.rotationY);
    
    // Araba kontrollerini devre dışı bırak
    player.controls = {
        forward: false, backward: false,
        left: false, right: false,
        brake: false, nitro: false
    };
    
    isInVehicle = false;
    
    // Kamerayı karaktere bağla
    if (camera) {
        camera.target = character;
        camera.distance = 5;
        camera.height = 2;
    }
    
    // Mobil kontrolleri karakter moduna geçir
    if (mobileControlsInstance) {
        mobileControlsInstance.setCharacter(character);
        mobileControlsInstance.setMode('character');
    }
    
    if (gameManager) {
        gameManager.showNotification('🚶 Arabadan indiniz (F ile bin)', '');
    }
}

function enterVehicle() {
    if (isInVehicle || !character || !player) return;
    
    // Yakında araba var mı?
    const nearbyVehicle = character.findNearbyVehicle([player]);
    
    if (nearbyVehicle) {
        character.enterVehicle();
        isInVehicle = true;
        
        // Kamerayı arabaya bağla
        if (camera) {
            camera.target = player;
            camera.distance = 8;
            camera.height = 3;
        }
        
        // Mobil kontrolleri araba moduna geçir
        if (mobileControlsInstance) {
            mobileControlsInstance.setMode('vehicle');
        }
        
        if (gameManager) {
            gameManager.showNotification('🚗 Arabaya bindiniz (F ile in)', '');
        }
    } else {
        if (gameManager) {
            gameManager.showNotification('❌ Yakında araba yok!', '');
        }
    }
}

// Hava durumu değiştir
let currentWeatherIndex = 0;
const weatherTypes = ['clear', 'rain', 'fog'];
const weatherNames = ['☀️ Güneşli', '🌧️ Yağmurlu', '🌫️ Sisli'];

function cycleWeather() {
    currentWeatherIndex = (currentWeatherIndex + 1) % weatherTypes.length;
    const weather = weatherTypes[currentWeatherIndex];
    
    if (gameMap) {
        gameMap.setWeather(weather);
    }
    
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.textContent = weatherNames[currentWeatherIndex];
    }
    
    // Bildirim göster
    if (gameManager) {
        gameManager.showNotification(`Hava: ${weatherNames[currentWeatherIndex]}`, '');
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

// Kontrol modunu ayarla
function setControlMode(mode) {
    localStorage.setItem('controlMode', mode);
    
    const mobileControls = document.getElementById('mobileControls');
    if (!mobileControls) return;
    
    // Tüm force class'larını kaldır
    mobileControls.classList.remove('force-show', 'force-hide');
    
    if (mode === 'mobile') {
        mobileControls.classList.add('force-show');
        mobileControls.style.display = 'block';
        console.log('Mobil kontroller aktif');
    } else if (mode === 'desktop') {
        mobileControls.classList.add('force-hide');
        mobileControls.style.display = 'none';
        console.log('Masaüstü kontroller aktif');
    } else {
        // Auto mod - cihaza göre
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isMobile || isTouchDevice) {
            mobileControls.style.display = 'block';
        } else {
            mobileControls.style.display = 'none';
        }
        console.log('Otomatik kontrol modu');
    }
    
    // Bildirim göster
    const modeNames = {
        'auto': '🔄 Otomatik',
        'mobile': '📱 Mobil',
        'desktop': '🖥️ Masaüstü'
    };
    
    if (typeof gameManager !== 'undefined' && gameManager) {
        gameManager.showNotification(`Kontrol: ${modeNames[mode]}`, '');
    }
}

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    console.log('Oyun hazır!');
    
    // Kaydedilmiş araba seçimini yükle
    const savedCarId = localStorage.getItem('selectedCarId');
    if (savedCarId !== null) {
        selectedCarId = parseInt(savedCarId);
    }
    
    // Kaydedilmiş kontrol modunu yükle
    const savedControlMode = localStorage.getItem('controlMode') || 'auto';
    const controlSelect = document.getElementById('controlModeSelect');
    if (controlSelect) {
        controlSelect.value = savedControlMode;
    }
});

// Ek klavye kısayolları
window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key.toLowerCase()) {
        case 'h':
            playHorn();
            break;
        case 'p':
            pauseGame();
            break;
        case 'c':
            // Kamera açısını sıfırla
            if (camera) {
                camera.angle = 0;
                camera.distance = 10;
                camera.height = 4;
            }
            break;
        case 'l':
            // Farları aç/kapa
            if (player) {
                const lightsOn = player.toggleHeadlights();
                if (gameManager) {
                    gameManager.showNotification(lightsOn ? '💡 Farlar Açık' : '🌑 Farlar Kapalı', '');
                }
            }
            break;
        case 'm':
            // Ses aç/kapa
            if (audioManager) {
                const enabled = audioManager.toggle();
                if (gameManager) {
                    gameManager.showNotification(enabled ? '🔊 Ses Açık' : '🔇 Ses Kapalı', '');
                }
            }
            break;
    }
});

// Ses başlatma için ilk tıklama
document.addEventListener('click', () => {
    if (audioManager) {
        audioManager.resume();
    }
}, { once: true });

// Benzin istasyonu UI
let gasStationUI = null;
let isAtGasStation = false;
let refuelingInProgress = false;

function createGasStationUI() {
    if (gasStationUI) return;
    
    gasStationUI = document.createElement('div');
    gasStationUI.id = 'gasStationUI';
    gasStationUI.innerHTML = `
        <div class="gas-station-panel">
            <h3>⛽ BENZİN İSTASYONU</h3>
            <div class="fuel-info">
                <div>Mevcut Yakıt: <span id="currentFuel">100</span>%</div>
                <div>Fiyat: <span id="fuelPrice">50</span> 💰</div>
            </div>
            <div class="fuel-progress" id="fuelProgress" style="display:none;">
                <div class="fuel-progress-bar" id="fuelProgressBar"></div>
            </div>
            <button id="refuelBtn" onclick="startRefueling()">🔋 Depoyu Doldur</button>
            <p class="gas-hint">E tuşuna bas veya butona tıkla</p>
        </div>
    `;
    document.body.appendChild(gasStationUI);
    
    // Stiller
    const style = document.createElement('style');
    style.textContent = `
        #gasStationUI {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 500;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .gas-station-panel {
            background: linear-gradient(135deg, rgba(0,50,0,0.95), rgba(0,30,0,0.98));
            border: 3px solid #00ff00;
            border-radius: 20px;
            padding: 30px 40px;
            text-align: center;
            color: white;
            box-shadow: 0 0 30px rgba(0,255,0,0.3);
        }
        .gas-station-panel h3 {
            color: #00ff00;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .fuel-info {
            font-size: 18px;
            margin: 15px 0;
        }
        .fuel-info div {
            margin: 8px 0;
        }
        .fuel-progress {
            width: 100%;
            height: 20px;
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            margin: 15px 0;
            overflow: hidden;
        }
        .fuel-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00ff00, #88ff88);
            transition: width 0.1s;
        }
        #refuelBtn {
            background: linear-gradient(135deg, #00aa00, #008800);
            border: none;
            color: white;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.2s;
        }
        #refuelBtn:hover {
            background: linear-gradient(135deg, #00cc00, #00aa00);
            transform: scale(1.05);
        }
        #refuelBtn:disabled {
            background: #444;
            cursor: not-allowed;
        }
        .gas-hint {
            color: #888;
            font-size: 12px;
            margin-top: 10px;
        }
    `;
    document.head.appendChild(style);
}

function handleGasStation(station) {
    if (!gasStationUI) createGasStationUI();
    
    if (station && player.getSpeed() < 5) {
        isAtGasStation = true;
        gasStationUI.style.display = 'block';
        document.getElementById('currentFuel').textContent = Math.round(player.fuel);
        
        const fuelNeeded = 100 - player.fuel;
        const repairNeeded = 100 - (player.health || 100);
        const fuelPrice = Math.ceil(fuelNeeded * 0.5);
        const repairPrice = Math.ceil(repairNeeded * 1);
        const totalPrice = fuelPrice + repairPrice;
        
        // Fiyat bilgisini güncelle
        let priceText = '';
        if (fuelNeeded > 0) priceText += `⛽ ${fuelPrice} `;
        if (repairNeeded > 0) priceText += `🔧 ${repairPrice} `;
        priceText += `= ${totalPrice}`;
        document.getElementById('fuelPrice').textContent = priceText;
        
        const btn = document.getElementById('refuelBtn');
        const playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
        
        if (player.fuel >= 99 && (player.health || 100) >= 100) {
            btn.textContent = '✅ Her şey tamam!';
            btn.disabled = true;
        } else if (playerMoney < totalPrice) {
            btn.textContent = '❌ Yetersiz Para';
            btn.disabled = true;
        } else {
            btn.textContent = `🔧 Servis Al (${totalPrice} 💰)`;
            btn.disabled = refuelingInProgress;
        }
    } else {
        isAtGasStation = false;
        if (gasStationUI) {
            gasStationUI.style.display = 'none';
        }
        refuelingInProgress = false;
    }
}

function startRefueling() {
    if (!isAtGasStation || refuelingInProgress) return;
    
    // Yakıt veya tamir
    const needsFuel = player.fuel < 99;
    const needsRepair = player.health < 100;
    
    if (!needsFuel && !needsRepair) return;
    
    const fuelNeeded = 100 - player.fuel;
    const repairNeeded = 100 - player.health;
    const fuelPrice = Math.ceil(fuelNeeded * 0.5);
    const repairPrice = Math.ceil(repairNeeded * 1);
    const totalPrice = fuelPrice + repairPrice;
    
    let playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
    
    if (playerMoney < totalPrice) return;
    
    refuelingInProgress = true;
    playerMoney -= totalPrice;
    localStorage.setItem('playerMoney', playerMoney);
    
    // Animasyonlu dolum ve tamir
    const progressDiv = document.getElementById('fuelProgress');
    const progressBar = document.getElementById('fuelProgressBar');
    const btn = document.getElementById('refuelBtn');
    
    progressDiv.style.display = 'block';
    btn.disabled = true;
    btn.textContent = '⏳ İşlem yapılıyor...';
    
    const startFuel = player.fuel;
    const startHealth = player.health;
    const duration = 2500;
    const startTime = Date.now();
    
    function animateService() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        player.fuel = startFuel + (100 - startFuel) * progress;
        player.health = startHealth + (100 - startHealth) * progress;
        progressBar.style.width = `${progress * 100}%`;
        document.getElementById('currentFuel').textContent = Math.round(player.fuel);
        
        if (progress < 1) {
            requestAnimationFrame(animateService);
        } else {
            refuelingInProgress = false;
            progressDiv.style.display = 'none';
            btn.textContent = '✅ Tamamlandı';
            
            let message = '';
            if (fuelNeeded > 0) message += '⛽ Yakıt dolduruldu! ';
            if (repairNeeded > 0) message += '🔧 Tamir edildi!';
            
            if (gameManager) {
                gameManager.showNotification(message, '');
            }
            if (audioManager) {
                audioManager.playSound('coin');
            }
        }
    }
    
    animateService();
}

// E tuşu ile yakıt alma
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && isAtGasStation && !refuelingInProgress) {
        startRefueling();
    }
});

// Kontrol modu (mobil/masaüstü)
let controlMode = localStorage.getItem('controlMode') || 'auto';

function setControlMode(mode) {
    controlMode = mode;
    localStorage.setItem('controlMode', mode);
    
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        if (mode === 'mobile') {
            mobileControls.style.display = 'block';
        } else if (mode === 'desktop') {
            mobileControls.style.display = 'none';
        }
        // 'auto' modunda MobileControls sınıfı karar verir
    }
}
