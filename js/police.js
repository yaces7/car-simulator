/**
 * police.js
 * Polis takip sistemi
 */

class PoliceSystem {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        this.policeCars = [];
        this.chaseActive = false;
        this.wantedLevel = 0; // 0-5 arası
        this.lastSpeedCheck = 0;
        this.speedLimit = 80; // km/h
        this.chaseTimer = 0;
        this.escapeTimer = 0;
        
        // Siren sesi
        this.sirenOscillator = null;
        this.sirenGain = null;
        this.sirenInterval = null;
    }
    
    update(player, deltaTime) {
        if (!player || !player.mesh) return;
        
        const playerSpeed = player.getSpeed();
        const playerPos = player.mesh.position;
        
        // Hız kontrolü
        this.checkSpeedViolation(playerSpeed, deltaTime);
        
        // Aktif takip varsa
        if (this.chaseActive) {
            this.updateChase(player, deltaTime);
            this.chaseTimer += deltaTime;
            
            // Kaçış kontrolü
            if (this.checkEscape(playerPos)) {
                this.escapeTimer += deltaTime;
                if (this.escapeTimer > 10) {
                    this.endChase();
                }
            } else {
                this.escapeTimer = 0;
            }
        }
        
        // Polis arabalarını güncelle
        this.updatePoliceCars(player, deltaTime);
    }
    
    checkSpeedViolation(speed, deltaTime) {
        const now = Date.now();
        if (now - this.lastSpeedCheck < 1000) return;
        
        this.lastSpeedCheck = now;
        
        if (speed > this.speedLimit + 20) {
            this.wantedLevel = Math.min(this.wantedLevel + 0.1, 5);
            
            if (this.wantedLevel >= 1 && !this.chaseActive) {
                this.startChase();
            }
        } else {
            this.wantedLevel = Math.max(this.wantedLevel - 0.05, 0);
        }
    }
    
    startChase() {
        if (this.chaseActive) return;
        
        this.chaseActive = true;
        this.chaseTimer = 0;
        this.escapeTimer = 0;
        
        if (typeof gameManager !== 'undefined' && gameManager) {
            gameManager.showNotification('🚨 POLİS TAKİBİ!\nHız limitini aştınız!', 'mission');
        }
        
        this.spawnPoliceCar();
        this.startSiren();
    }
    
    endChase() {
        this.chaseActive = false;
        this.wantedLevel = 0;
        this.chaseTimer = 0;
        this.escapeTimer = 0;
        
        this.policeCars.forEach(car => {
            this.scene.remove(car.mesh);
            if (this.physicsWorld && car.body) {
                this.physicsWorld.removeBody(car.body);
            }
        });
        this.policeCars = [];
        
        this.stopSiren();
        
        if (typeof gameManager !== 'undefined' && gameManager) {
            gameManager.showNotification('✅ POLİSTEN KAÇTINIZ!', 'achievement');
            gameManager.addScore(500);
        }
    }

    
    spawnPoliceCar() {
        // Polis arabası mesh
        const carGroup = new THREE.Group();
        
        // Ana gövde
        const bodyGeom = new THREE.BoxGeometry(2, 0.8, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x000080 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.5;
        carGroup.add(body);
        
        // Kabin
        const cabinGeom = new THREE.BoxGeometry(1.8, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(0, 1.1, -0.3);
        carGroup.add(cabin);
        
        // Polis ışıkları
        const lightBar = new THREE.Group();
        
        const redLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.2, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        redLight.position.set(-0.5, 0, 0);
        lightBar.add(redLight);
        
        const blueLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.2, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x0000ff })
        );
        blueLight.position.set(0.5, 0, 0);
        lightBar.add(blueLight);
        
        lightBar.position.set(0, 1.5, -0.3);
        carGroup.add(lightBar);
        
        // Tekerlekler
        const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            [-0.9, 0.35, 1.3], [0.9, 0.35, 1.3],
            [-0.9, 0.35, -1.3], [0.9, 0.35, -1.3]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            carGroup.add(wheel);
        });
        
        carGroup.position.set(0, 1, -50);
        this.scene.add(carGroup);
        
        // Fizik body
        let carBody = null;
        if (this.physicsWorld && typeof CANNON !== 'undefined') {
            const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2.2));
            carBody = new CANNON.Body({
                mass: 150,
                shape: shape,
                position: new CANNON.Vec3(0, 1, -50)
            });
            this.physicsWorld.addBody(carBody);
        }
        
        const policeCar = {
            mesh: carGroup,
            body: carBody,
            speed: 0,
            rotationY: 0,
            redLight: redLight,
            blueLight: blueLight,
            lightTimer: 0
        };
        
        this.policeCars.push(policeCar);
    }
    
    updatePoliceCars(player, deltaTime) {
        this.policeCars.forEach(car => {
            // Işık animasyonu
            car.lightTimer += deltaTime * 8;
            const lightOn = Math.sin(car.lightTimer) > 0;
            car.redLight.material.color.setHex(lightOn ? 0xff0000 : 0x330000);
            car.blueLight.material.color.setHex(!lightOn ? 0x0000ff : 0x000033);
            
            if (this.chaseActive && player && player.mesh) {
                const playerPos = player.mesh.position;
                const carPos = car.mesh.position;
                
                const dx = playerPos.x - carPos.x;
                const dz = playerPos.z - carPos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance > 5) {
                    const targetAngle = Math.atan2(dx, dz);
                    car.rotationY = this.lerpAngle(car.rotationY, targetAngle, deltaTime * 2);
                    
                    car.speed = Math.min(distance * 2, 50);
                    
                    const forwardX = Math.sin(car.rotationY);
                    const forwardZ = Math.cos(car.rotationY);
                    
                    car.mesh.position.x += forwardX * car.speed * deltaTime;
                    car.mesh.position.z += forwardZ * car.speed * deltaTime;
                    
                    if (car.body) {
                        car.body.position.copy(car.mesh.position);
                    }
                }
                
                car.mesh.rotation.y = car.rotationY;
            }
        });
    }
    
    checkEscape(playerPos) {
        for (const car of this.policeCars) {
            const dx = playerPos.x - car.mesh.position.x;
            const dz = playerPos.z - car.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 100) return false;
        }
        return true;
    }
    
    updateChase(player, deltaTime) {
        if (this.chaseTimer > 30 && this.policeCars.length < 3) {
            this.spawnPoliceCar();
        }
    }
    
    startSiren() {
        if (typeof audioManager !== 'undefined' && audioManager && audioManager.context) {
            try {
                this.sirenOscillator = audioManager.context.createOscillator();
                this.sirenGain = audioManager.context.createGain();
                
                this.sirenOscillator.type = 'sine';
                this.sirenOscillator.frequency.value = 800;
                this.sirenGain.gain.value = 0.08;
                
                this.sirenOscillator.connect(this.sirenGain);
                this.sirenGain.connect(audioManager.masterGain);
                
                this.sirenOscillator.start();
                
                this.sirenInterval = setInterval(() => {
                    if (this.sirenOscillator) {
                        const freq = 800 + Math.sin(Date.now() * 0.01) * 400;
                        this.sirenOscillator.frequency.value = freq;
                    }
                }, 50);
            } catch (e) {
                console.log('Siren error:', e);
            }
        }
    }
    
    stopSiren() {
        if (this.sirenOscillator) {
            try { this.sirenOscillator.stop(); } catch(e) {}
            this.sirenOscillator = null;
        }
        if (this.sirenInterval) {
            clearInterval(this.sirenInterval);
            this.sirenInterval = null;
        }
    }
    
    lerpAngle(from, to, t) {
        let diff = to - from;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return from + diff * t;
    }
    
    getWantedLevel() {
        return Math.floor(this.wantedLevel);
    }
    
    isChaseActive() {
        return this.chaseActive;
    }
}

let policeSystem = null;
