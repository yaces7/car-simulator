/**
 * player.js
 * Oyuncu arabası kontrolü ve fiziği
 */

class Player {
    constructor(scene, physicsWorld, carData, spawnPosition = { x: 0, y: 2, z: 0 }) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.carData = carData;
        
        // Önce basit mesh oluştur (placeholder)
        this.mesh = createCarMesh(carData);
        this.mesh.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        scene.add(this.mesh);
        
        // GLB varsa yükle ve değiştir
        if (carData.modelUrl) {
            loadGLBModel(carData.modelUrl, carData, (model) => {
                // Eski mesh'i kaldır
                scene.remove(this.mesh);
                // Yeni mesh'i ekle
                this.mesh = model;
                this.mesh.position.copy(this.body.position);
                this.mesh.quaternion.copy(this.body.quaternion);
                scene.add(this.mesh);
            });
        }
        
        // Fizik gövdesi
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({
            mass: carData.stats.weight,
            shape: shape,
            position: new CANNON.Vec3(spawnPosition.x, spawnPosition.y, spawnPosition.z),
            linearDamping: 0.3,
            angularDamping: 0.5
        });
        physicsWorld.addBody(this.body, this.mesh);
        
        // Kontroller
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false,
            nitro: false
        };
        
        // Durum
        this.speed = 0;
        this.nitro = 100;
        this.isDrifting = false;
        this.wheelRotation = 0;
        this.steerAngle = 0;
        
        // Drift partikülleri
        this.driftParticles = [];
        this.setupDriftParticles();
        
        this.setupControls();
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.controls.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.controls.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.controls.right = true;
                    break;
                case ' ':
                    this.controls.brake = true;
                    e.preventDefault();
                    break;
                case 'shift':
                    this.controls.nitro = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.controls.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.controls.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.controls.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.controls.right = false;
                    break;
                case ' ':
                    this.controls.brake = false;
                    break;
                case 'shift':
                    this.controls.nitro = false;
                    break;
            }
        });
    }
    
    setupDriftParticles() {
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            particle.visible = false;
            this.scene.add(particle);
            this.driftParticles.push({
                mesh: particle,
                life: 0,
                velocity: new THREE.Vector3()
            });
        }
    }
    
    update(deltaTime) {
        const stats = this.carData.stats;
        
        // Hız hesaplama
        const velocity = this.body.velocity;
        this.speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) * 3.6; // km/h
        
        // İleri/Geri hareket
        const forward = new CANNON.Vec3();
        this.body.quaternion.vmult(new CANNON.Vec3(0, 0, 1), forward);
        
        if (this.controls.forward) {
            const force = stats.acceleration * 5000;
            const nitroMultiplier = (this.controls.nitro && this.nitro > 0) ? 1.5 : 1;
            this.body.applyForce(
                new CANNON.Vec3(forward.x * force * nitroMultiplier, 0, forward.z * force * nitroMultiplier),
                this.body.position
            );
            
            if (this.controls.nitro && this.nitro > 0) {
                this.nitro -= deltaTime * 20;
                if (this.nitro < 0) this.nitro = 0;
            }
        }
        
        if (this.controls.backward) {
            const force = stats.acceleration * 3000;
            this.body.applyForce(
                new CANNON.Vec3(-forward.x * force, 0, -forward.z * force),
                this.body.position
            );
        }
        
        // Nitro yenileme
        if (!this.controls.nitro && this.nitro < 100) {
            this.nitro += deltaTime * 10;
            if (this.nitro > 100) this.nitro = 100;
        }
        
        // Direksiyon
        const maxSteerAngle = 0.5;
        const steerSpeed = 3;
        
        if (this.controls.left) {
            this.steerAngle = Math.min(this.steerAngle + steerSpeed * deltaTime, maxSteerAngle);
        } else if (this.controls.right) {
            this.steerAngle = Math.max(this.steerAngle - steerSpeed * deltaTime, -maxSteerAngle);
        } else {
            this.steerAngle *= 0.9;
        }
        
        // Dönüş kuvveti
        if (this.speed > 5) {
            const turnForce = this.steerAngle * stats.handling * 2000;
            const right = new CANNON.Vec3();
            this.body.quaternion.vmult(new CANNON.Vec3(1, 0, 0), right);
            this.body.applyForce(
                new CANNON.Vec3(right.x * turnForce, 0, right.z * turnForce),
                new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z + 1)
            );
        }
        
        // Fren
        if (this.controls.brake) {
            this.body.velocity.scale(0.95, this.body.velocity);
            this.body.angularVelocity.scale(0.9, this.body.angularVelocity);
        }
        
        // Hız limiti
        const maxSpeed = stats.maxSpeed / 3.6;
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            this.body.velocity.x *= scale;
            this.body.velocity.z *= scale;
        }
        
        // Devrilme önleme
        const upVector = new CANNON.Vec3(0, 1, 0);
        const bodyUp = new CANNON.Vec3();
        this.body.quaternion.vmult(upVector, bodyUp);
        const uprightTorque = 5000;
        
        this.body.angularVelocity.x *= 0.95;
        this.body.angularVelocity.z *= 0.95;
        
        if (bodyUp.y < 0.7) {
            const correctionTorque = new CANNON.Vec3(
                -this.body.quaternion.x * uprightTorque,
                0,
                -this.body.quaternion.z * uprightTorque
            );
            this.body.torque.vadd(correctionTorque, this.body.torque);
        }
        
        // Tekerlek animasyonu
        if (this.mesh.wheels) {
            const wheelSpeed = this.speed * 0.1;
            this.wheelRotation += wheelSpeed * deltaTime;
            
            this.mesh.wheels.forEach((wheel, index) => {
                wheel.rotation.x = this.wheelRotation;
                
                // Ön tekerlekler direksiyon
                if (index < 2) {
                    wheel.rotation.y = this.steerAngle;
                }
            });
        }
        
        // Drift partikülleri
        this.isDrifting = Math.abs(this.steerAngle) > 0.3 && this.speed > 30;
        this.updateDriftParticles(deltaTime);
    }
    
    updateDriftParticles(deltaTime) {
        this.driftParticles.forEach(particle => {
            if (particle.life > 0) {
                particle.life -= deltaTime;
                particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.mesh.material.opacity = particle.life / 0.5;
                particle.mesh.visible = true;
            } else {
                particle.mesh.visible = false;
            }
        });
        
        if (this.isDrifting && Math.random() > 0.7) {
            const availableParticle = this.driftParticles.find(p => p.life <= 0);
            if (availableParticle) {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    0.1,
                    -2
                );
                offset.applyQuaternion(this.mesh.quaternion);
                
                availableParticle.mesh.position.copy(this.mesh.position).add(offset);
                availableParticle.life = 0.5;
                availableParticle.velocity.set(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 0.5,
                    (Math.random() - 0.5) * 2
                );
            }
        }
    }
    
    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y,
            z: this.body.position.z
        };
    }
    
    getRotation() {
        return {
            x: this.body.quaternion.x,
            y: this.body.quaternion.y,
            z: this.body.quaternion.z,
            w: this.body.quaternion.w
        };
    }
    
    destroy() {
        this.scene.remove(this.mesh);
        this.physicsWorld.removeBody(this.body);
        this.driftParticles.forEach(p => this.scene.remove(p.mesh));
    }
    
    update(delta) {
        if (!this.body || !this.mesh) return;
        
        // Fizik güncelleme
        const force = 5000 * this.carData.stats.acceleration;
        const turnForce = 3;
        
        if (this.controls.forward) {
            this.body.applyForce(
                new CANNON.Vec3(0, 0, -force),
                this.body.position
            );
        }
        if (this.controls.backward) {
            this.body.applyForce(
                new CANNON.Vec3(0, 0, force * 0.5),
                this.body.position
            );
        }
        if (this.controls.left) {
            this.body.angularVelocity.y = turnForce;
        }
        if (this.controls.right) {
            this.body.angularVelocity.y = -turnForce;
        }
        if (this.controls.brake) {
            this.body.velocity.scale(0.95, this.body.velocity);
        }
        
        // Mesh pozisyonunu fizik gövdesine senkronize et
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    getSpeed() {
        if (!this.body) return 0;
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        return speed * 3.6; // m/s'den km/h'ye çevir
    }
}
