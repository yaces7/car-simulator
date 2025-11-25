/**
 * checkpoint.js
 * Checkpoint ve yarış sistemi
 */

class CheckpointSystem {
    constructor(scene) {
        this.scene = scene;
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.raceActive = false;
        this.raceTime = 0;
        this.bestTime = parseFloat(localStorage.getItem('bestRaceTime')) || Infinity;
        
        this.checkpointMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        this.passedMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.nextMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
    }
    
    createRace(type = 'circuit') {
        this.clearCheckpoints();
        
        if (type === 'circuit') {
            // Dairesel yarış parkuru
            const checkpointPositions = [
                { x: 0, z: 50 },
                { x: 50, z: 100 },
                { x: 100, z: 50 },
                { x: 100, z: -50 },
                { x: 50, z: -100 },
                { x: 0, z: -50 },
                { x: -50, z: -100 },
                { x: -100, z: -50 },
                { x: -100, z: 50 },
                { x: -50, z: 100 }
            ];
            
            checkpointPositions.forEach((pos, index) => {
                this.createCheckpoint(pos.x, pos.z, index);
            });
        } else if (type === 'sprint') {
            // Düz yarış
            for (let i = 0; i < 10; i++) {
                this.createCheckpoint(0, i * 100, i);
            }
        }
        
        this.updateCheckpointVisuals();
    }
    
    createCheckpoint(x, z, index) {
        const group = new THREE.Group();
        
        // Checkpoint kapısı
        const gateGeometry = new THREE.TorusGeometry(8, 0.5, 8, 32);
        const gate = new THREE.Mesh(gateGeometry, this.checkpointMaterial.clone());
        gate.rotation.x = Math.PI / 2;
        gate.position.y = 5;
        group.add(gate);
        
        // Numara göstergesi
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const numberMaterial = new THREE.SpriteMaterial({ map: texture });
        const numberSprite = new THREE.Sprite(numberMaterial);
        numberSprite.scale.set(4, 4, 1);
        numberSprite.position.y = 12;
        group.add(numberSprite);
        
        // Zemin işareti
        const groundGeometry = new THREE.RingGeometry(6, 8, 32);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.1;
        group.add(ground);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        
        this.checkpoints.push({
            mesh: group,
            gate: gate,
            ground: ground,
            position: { x, z },
            passed: false,
            index: index
        });
    }
    
    clearCheckpoints() {
        this.checkpoints.forEach(cp => {
            this.scene.remove(cp.mesh);
        });
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.raceActive = false;
        this.raceTime = 0;
    }
    
    startRace() {
        this.raceActive = true;
        this.raceTime = 0;
        this.currentCheckpoint = 0;
        
        this.checkpoints.forEach(cp => {
            cp.passed = false;
        });
        
        this.updateCheckpointVisuals();
        
        if (gameManager) {
            gameManager.showNotification('🏁 YARIŞ BAŞLADI!', 'mission');
        }
    }
    
    update(playerPosition, deltaTime) {
        if (!this.raceActive) return;
        
        this.raceTime += deltaTime;
        
        // Checkpoint kontrolü
        const currentCP = this.checkpoints[this.currentCheckpoint];
        if (currentCP) {
            const dx = playerPosition.x - currentCP.position.x;
            const dz = playerPosition.z - currentCP.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 10) {
                this.passCheckpoint();
            }
        }
        
        // Checkpoint animasyonu
        this.checkpoints.forEach((cp, index) => {
            if (index === this.currentCheckpoint) {
                cp.gate.rotation.z += deltaTime * 2;
                cp.mesh.position.y = Math.sin(Date.now() * 0.003) * 0.5;
            }
        });
    }
    
    passCheckpoint() {
        const cp = this.checkpoints[this.currentCheckpoint];
        cp.passed = true;
        
        if (audioManager) {
            audioManager.playSound('coin');
        }
        
        this.currentCheckpoint++;
        
        if (this.currentCheckpoint >= this.checkpoints.length) {
            this.finishRace();
        } else {
            if (gameManager) {
                gameManager.showNotification(`✅ Checkpoint ${this.currentCheckpoint}/${this.checkpoints.length}`, '');
                gameManager.addScore(100);
            }
            this.updateCheckpointVisuals();
        }
    }
    
    finishRace() {
        this.raceActive = false;
        
        const timeStr = this.formatTime(this.raceTime);
        let message = `🏁 YARIŞ BİTTİ!\nSüre: ${timeStr}`;
        
        if (this.raceTime < this.bestTime) {
            this.bestTime = this.raceTime;
            localStorage.setItem('bestRaceTime', this.bestTime);
            message += '\n🏆 YENİ REKOR!';
        }
        
        if (gameManager) {
            gameManager.showNotification(message, 'achievement');
            gameManager.addMoney(500);
            gameManager.addScore(1000);
        }
        
        if (audioManager) {
            audioManager.playSound('achievement');
        }
    }
    
    updateCheckpointVisuals() {
        this.checkpoints.forEach((cp, index) => {
            if (cp.passed) {
                cp.gate.material = this.passedMaterial;
            } else if (index === this.currentCheckpoint) {
                cp.gate.material = this.nextMaterial;
            } else {
                cp.gate.material = this.checkpointMaterial;
            }
        });
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    getRaceInfo() {
        if (!this.raceActive) return null;
        
        return {
            time: this.formatTime(this.raceTime),
            checkpoint: `${this.currentCheckpoint}/${this.checkpoints.length}`,
            bestTime: this.bestTime < Infinity ? this.formatTime(this.bestTime) : '--:--'
        };
    }
}

// Global instance
let checkpointSystem = null;
