/**
 * player.js
 * Oyuncu arabası kontrolü ve fiziği - Gerçekçi sürüş + Yakıt sistemi
 */

class Player {
    constructor(scene, physicsWorld, carData, spawnPosition = { x: 5, y: 1, z: 50 }) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.carData = carData;
        
        // Mesh oluştur
        this.mesh = createCarMesh(carData);
        this.mesh.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        scene.add(this.mesh);
        
        // GLB varsa yükle
        if (carData.modelUrl) {
            loadGLBModel(carData.modelUrl, carData, (model) => {
                scene.remove(this.mesh);
                this.mesh = model;
                this.mesh.position.copy(this.body.position);
                scene.add(this.mesh);
            });
        }
        
        // Fizik gövdesi
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2.2));
        this.body = new CANNON.Body({
            mass: carData.stats.weight / 10,
            shape: shape,
            position: new CANNON.Vec3(spawnPosition.x, spawnPosition.y, spawnPosition.z),
            linearDamping: 0.1,
            angularDamping: 0.9
        });
        physicsWorld.addBody(this.body, null);
        
        // Kontroller
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false,
            nitro: false
        };
        
        // Araba durumu
        this.rotationY = 0;
        this.currentSpeed = 0;
        this.nitro = 100;
        this.isDrifting = false;
        this.steerAngle = 0;
        this.currentTilt = 0;
        
        // Yakıt sistemi
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumption = 0.5;
        
        // Hasar sistemi
        this.health = 100;
        this.maxHealth = 100;
        this.lastCollisionTime = 0;
        this.invulnerable = false;
        
        // Far sistemi
        this.headlightsOn = false;
        this.headlights = [];
        this.setupHeadlights();
        
        // Vites sistemi
        this.currentGear = 1;
        this.rpm = 1000;
        this.clutch = false;
        this.gearRatios = [0, 3.2, 2.2, 1.6, 1.2, 0.9, 0.7];
        this.maxRPM = 8000;
        this.idleRPM = 1000;
        this.shiftRPM = 6800;
        this.lastShiftTime = 0;
        
        // Drift partikülleri
        this.driftParticles = [];
        this.setupDriftParticles();
        
        this.setupControls();
        this.setupCollisionDetection();
    }
    
    setupHeadlights() {
        // Sol far
        const leftLight = new THREE.SpotLight(0xffffcc, 0, 50, Math.PI / 6, 0.5);
        leftLight.position.set(-0.6, 0.6, 2.5);
        leftLight.target.position.set(-0.6, 0, 20);
        this.mesh.add(leftLight);
        this.mesh.add(leftLight.target);
        this.headlights.push(leftLight);
        
        // Sağ far
        const rightLight = new THREE.SpotLight(0xffffcc, 0, 50, Math.PI / 6, 0.5);
        rightLight.position.set(0.6, 0.6, 2.5);
        rightLight.target.position.set(0.6, 0, 20);
        this.mesh.add(rightLight);
        this.mesh.add(rightLight.target);
        this.headlights.push(rightLight);
    }
    
    toggleHeadlights() {
        this.headlightsOn = !this.headlightsOn;
        const intensity = this.headlightsOn ? 2 : 0;
        this.headlights.forEach(light => {
            light.intensity = intensity;
        });
        return this.headlightsOn;
    }
    
    setupCollisionDetection() {
        this.body.addEventListener('collide', (event) => {
            const now = Date.now();
            if (now - this.lastCollisionTime < 500) return; // 0.5 saniye bekleme
            
            const impactVelocity = event.contact.getImpactVelocityAlongNormal();
            const damage = Math.abs(impactVelocity) * 2;
            
            if (damage > 5 && !this.invulnerable) {
                this.takeDamage(damage);
                this.lastCollisionTime = now;
            }
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Hasar efekti - kırmızı flash (geçici)
        this.showDamageFlash();
        
        // Ses efekti
        if (typeof audioManager !== 'undefined' && audioManager) {
            audioManager.playSound('crash');
        }
    }
    
    showDamageFlash() {
        // Kırmızı overlay efekti
        let damageOverlay = document.getElementById('damageOverlay');
        if (!damageOverlay) {
            damageOverlay = document.createElement('div');
            damageOverlay.id = 'damageOverlay';
            damageOverlay.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.4) 100%);
                pointer-events: none;
                z-index: 999;
                opacity: 0;
                transition: opacity 0.1s;
            `;
            document.body.appendChild(damageOverlay);
        }
        damageOverlay.style.opacity = '1';
        setTimeout(() => {
            damageOverlay.style.opacity = '0';
        }, 150);
    }
    
    repair(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        // Tamir efekti
        this.showRepairEffect();
    }
    
    showRepairEffect() {
        let repairOverlay = document.getElementById('repairOverlay');
        if (!repairOverlay) {
            repairOverlay = document.createElement('div');
            repairOverlay.id = 'repairOverlay';
            repairOverlay.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0,255,100,0.3) 100%);
                pointer-events: none;
                z-index: 999;
                opacity: 0;
                transition: opacity 0.2s;
            `;
            document.body.appendChild(repairOverlay);
        }
        repairOverlay.style.opacity = '1';
        setTimeout(() => {
            repairOverlay.style.opacity = '0';
        }, 300);
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.controls.forward = true; break;
                case 's': case 'arrowdown': this.controls.backward = true; break;
                case 'a': case 'arrowleft': this.controls.left = true; break;
                case 'd': case 'arrowright': this.controls.right = true; break;
                case ' ': this.controls.brake = true; e.preventDefault(); break;
                case 'shift': this.controls.nitro = true; break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.controls.forward = false; break;
                case 's': case 'arrowdown': this.controls.backward = false; break;
                case 'a': case 'arrowleft': this.controls.left = false; break;
                case 'd': case 'arrowright': this.controls.right = false; break;
                case ' ': this.controls.brake = false; break;
                case 'shift': this.controls.nitro = false; break;
            }
        });
    }
    
    setupDriftParticles() {
        const particleGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x888888, transparent: true, opacity: 0.5
        });
        
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.visible = false;
            this.scene.add(particle);
            this.driftParticles.push({ mesh: particle, life: 0, velocity: new THREE.Vector3() });
        }
    }
    
    update(delta) {
        if (!this.body || !this.mesh) return;
        
        const stats = this.carData.stats;
        const maxSpeedKmh = stats.maxSpeed;
        const maxSpeedMs = maxSpeedKmh / 3.6;
        
        // Mevcut hız (m/s)
        const velX = this.body.velocity.x;
        const velZ = this.body.velocity.z;
        this.currentSpeed = Math.sqrt(velX * velX + velZ * velZ);
        const speedKmh = this.currentSpeed * 3.6;
        
        // Yön vektörleri
        const forwardX = Math.sin(this.rotationY);
        const forwardZ = Math.cos(this.rotationY);
        
        // Yakıt kontrolü - yakıt yoksa hareket etme
        const hasFuel = this.fuel > 0;
        
        // === VİTES SİSTEMİ ===
        this.updateGearbox(delta, speedKmh);
        
        // === HIZLANMA - Düzeltilmiş ===
        if (this.controls.forward && !this.clutch && hasFuel) {
            // Vites çarpanı - düşük viteste daha fazla tork
            const gearPower = this.gearRatios[Math.max(1, this.currentGear)] || 1;
            
            // Temel ivme
            const baseAccel = stats.acceleration * 50; // Artırıldı
            
            // RPM bazlı güç eğrisi
            const rpmRatio = this.rpm / this.maxRPM;
            const powerCurve = Math.sin(rpmRatio * Math.PI * 0.9); // Güç eğrisi
            
            // Toplam ivme
            let accelForce = baseAccel * gearPower * Math.max(0.3, powerCurve) * delta;
            
            // Nitro boost
            if (this.controls.nitro && this.nitro > 0) {
                accelForce *= 1.5;
                this.nitro -= delta * 15;
            }
            
            // Hız limitine yaklaştıkça direnç
            const speedRatio = speedKmh / maxSpeedKmh;
            const airResistance = 1 - (speedRatio * speedRatio * 0.8);
            
            this.body.velocity.x += forwardX * accelForce * Math.max(0.1, airResistance);
            this.body.velocity.z += forwardZ * accelForce * Math.max(0.1, airResistance);
            
            // RPM artır
            this.rpm = Math.min(this.rpm + 4000 * delta, this.maxRPM);
            
            // Yakıt tüket
            this.fuel -= this.fuelConsumption * delta;
            if (this.fuel < 0) this.fuel = 0;
        } else {
            // RPM düşür
            this.rpm = Math.max(this.rpm - 3000 * delta, this.idleRPM);
        }
        
        // Geri vites
        if (this.controls.backward && hasFuel) {
            const reverseAccel = stats.acceleration * 20 * delta;
            if (speedKmh < 30) {
                this.body.velocity.x -= forwardX * reverseAccel;
                this.body.velocity.z -= forwardZ * reverseAccel;
                this.fuel -= this.fuelConsumption * 0.5 * delta;
                this.currentGear = -1;
            }
        }
        
        // İleri giderken geri vitesten çık
        if (this.controls.forward && this.currentGear === -1) {
            this.currentGear = 1;
            this.rpm = this.idleRPM;
        }
        
        // Nitro yenileme
        if (!this.controls.nitro && this.nitro < 100) {
            this.nitro = Math.min(this.nitro + delta * 5, 100);
        }
        
        // === DİREKSİYON ===
        const baseTurnSpeed = 2.5 * stats.handling;
        const speedTurnFactor = Math.max(0.4, 1 - (speedKmh / maxSpeedKmh) * 0.5);
        const turnSpeed = baseTurnSpeed * speedTurnFactor;
        
        let targetTilt = 0;
        
        if (this.currentSpeed > 0.3) {
            if (this.controls.left) {
                this.rotationY += turnSpeed * delta;
                this.steerAngle = Math.min(this.steerAngle + 4 * delta, 0.5);
                targetTilt = 0.08;
            } else if (this.controls.right) {
                this.rotationY -= turnSpeed * delta;
                this.steerAngle = Math.max(this.steerAngle - 4 * delta, -0.5);
                targetTilt = -0.08;
            } else {
                this.steerAngle *= 0.9;
            }
        }
        
        this.currentTilt += (targetTilt - this.currentTilt) * 0.15;
        
        // === FREN ===
        if (this.controls.brake) {
            const brakePower = stats.braking * 0.06;
            this.body.velocity.x *= (1 - brakePower);
            this.body.velocity.z *= (1 - brakePower);
        }
        
        // === DOĞAL YAVAŞLAMA ===
        if (!this.controls.forward && !this.controls.backward) {
            this.body.velocity.x *= 0.998;
            this.body.velocity.z *= 0.998;
        }
        
        // === HIZ LİMİTİ ===
        const actualMaxSpeed = (this.controls.nitro && this.nitro > 0) ? maxSpeedMs * 1.15 : maxSpeedMs;
        if (this.currentSpeed > actualMaxSpeed) {
            const ratio = actualMaxSpeed / this.currentSpeed;
            this.body.velocity.x *= ratio;
            this.body.velocity.z *= ratio;
        }
        
        // === FİZİK GÜNCELLEME ===
        this.body.quaternion.setFromEuler(0, this.rotationY, 0);
        this.body.angularVelocity.set(0, 0, 0);
        
        if (this.body.position.y < 0.5) {
            this.body.position.y = 0.5;
            this.body.velocity.y = 0;
        }
        
        // === MESH GÜNCELLEME ===
        this.mesh.position.copy(this.body.position);
        this.mesh.rotation.set(0, this.rotationY, this.currentTilt);
        
        // === DRİFT ===
        this.isDrifting = Math.abs(this.steerAngle) > 0.3 && speedKmh > 50;
        this.updateDriftParticles(delta);
        
        // === TEKERLEK ANİMASYONU ===
        if (this.mesh.wheels) {
            const wheelSpeed = this.currentSpeed * 2;
            this.wheelRotation = (this.wheelRotation || 0) + wheelSpeed * delta;
            this.mesh.wheels.forEach((wheel, i) => {
                wheel.rotation.x = this.wheelRotation;
                if (i < 2) wheel.rotation.y = this.steerAngle;
            });
        }
    }
    
    updateGearbox(delta, speedKmh) {
        const now = Date.now();
        if (now - this.lastShiftTime < 250) return;
        
        if (this.controls.backward) {
            this.currentGear = -1;
            return;
        }
        
        // Her vites için hız aralıkları
        const gearMaxSpeeds = [0, 35, 60, 95, 130, 165, 220];
        
        // Vites yükselt
        if (this.rpm > this.shiftRPM && this.currentGear < 6 && this.currentGear > 0) {
            this.currentGear++;
            this.rpm = 4000;
            this.lastShiftTime = now;
            this.clutch = true;
            setTimeout(() => this.clutch = false, 80);
        }
        
        // Vites düşür
        if (this.currentGear > 1) {
            const lowerGearMax = gearMaxSpeeds[this.currentGear - 1];
            if (speedKmh < lowerGearMax * 0.6) {
                this.currentGear--;
                this.rpm = 5500;
                this.lastShiftTime = now;
            }
        }
        
        // Duruyorsa 1. vites
        if (speedKmh < 3 && this.currentGear !== 1 && this.currentGear !== -1) {
            this.currentGear = 1;
            this.rpm = this.idleRPM;
        }
    }
    
    refuel(amount) {
        this.fuel = Math.min(this.fuel + amount, this.maxFuel);
    }
    
    updateDriftParticles(delta) {
        this.driftParticles.forEach(p => {
            if (p.life > 0) {
                p.life -= delta;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                p.mesh.material.opacity = p.life * 0.8;
                p.mesh.visible = true;
            } else {
                p.mesh.visible = false;
            }
        });
        
        if (this.isDrifting && Math.random() > 0.6) {
            const available = this.driftParticles.find(p => p.life <= 0);
            if (available) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.1, -2);
                offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
                available.mesh.position.copy(this.mesh.position).add(offset);
                available.life = 0.6;
                available.velocity.set((Math.random() - 0.5), 0.3, (Math.random() - 0.5));
            }
        }
    }
    
    getSpeed() {
        return this.currentSpeed * 3.6;
    }
    
    getPosition() {
        return { x: this.body.position.x, y: this.body.position.y, z: this.body.position.z };
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        this.physicsWorld.removeBody(this.body);
        this.driftParticles.forEach(p => this.scene.remove(p.mesh));
    }
}
