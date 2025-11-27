/**
 * character.js
 * GTA tarzı karakter sistemi - Arabadan inip yürüme
 */

class Character {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        this.mesh = null;
        this.body = null;
        this.isActive = false;
        this.inVehicle = true;
        
        // Hareket
        this.moveSpeed = 5;
        this.runSpeed = 10;
        this.rotationY = 0;
        this.velocity = { x: 0, z: 0 };
        
        // Kontroller
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false,
            enterVehicle: false
        };
        
        // Animasyon
        this.animationState = 'idle';
        this.animationTime = 0;
        
        this.createCharacter();
        this.setupControls();
    }
    
    createCharacter() {
        // Basit karakter modeli
        const group = new THREE.Group();
        
        // Gövde
        const bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        group.add(body);
        
        // Kafa
        const headGeom = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cba7 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.45;
        head.castShadow = true;
        group.add(head);
        
        // Bacaklar
        const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a5276 });
        
        this.leftLeg = new THREE.Mesh(legGeom, legMat);
        this.leftLeg.position.set(-0.15, 0.25, 0);
        group.add(this.leftLeg);
        
        this.rightLeg = new THREE.Mesh(legGeom, legMat);
        this.rightLeg.position.set(0.15, 0.25, 0);
        group.add(this.rightLeg);
        
        // Kollar
        const armGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
        
        this.leftArm = new THREE.Mesh(armGeom, armMat);
        this.leftArm.position.set(-0.4, 0.9, 0);
        this.leftArm.rotation.z = 0.3;
        group.add(this.leftArm);
        
        this.rightArm = new THREE.Mesh(armGeom, armMat);
        this.rightArm.position.set(0.4, 0.9, 0);
        this.rightArm.rotation.z = -0.3;
        group.add(this.rightArm);
        
        this.mesh = group;
        this.mesh.visible = false;
        this.scene.add(this.mesh);
        
        // Fizik body
        if (this.physicsWorld && typeof CANNON !== 'undefined') {
            const shape = new CANNON.Cylinder(0.3, 0.3, 1.8, 8);
            this.body = new CANNON.Body({
                mass: 70,
                shape: shape,
                position: new CANNON.Vec3(0, 2, 0),
                fixedRotation: true
            });
            this.physicsWorld.addBody(this.body);
        }
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            switch(e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.controls.forward = true; break;
                case 's': case 'arrowdown': this.controls.backward = true; break;
                case 'a': case 'arrowleft': this.controls.left = true; break;
                case 'd': case 'arrowright': this.controls.right = true; break;
                case 'shift': this.controls.run = true; break;
                case 'f': case 'e': this.controls.enterVehicle = true; break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.controls.forward = false; break;
                case 's': case 'arrowdown': this.controls.backward = false; break;
                case 'a': case 'arrowleft': this.controls.left = false; break;
                case 'd': case 'arrowright': this.controls.right = false; break;
                case 'shift': this.controls.run = false; break;
                case 'f': case 'e': this.controls.enterVehicle = false; break;
            }
        });
    }

    
    // Arabadan in
    exitVehicle(vehiclePosition, vehicleRotation) {
        if (!this.inVehicle) return;
        
        this.inVehicle = false;
        this.isActive = true;
        this.mesh.visible = true;
        
        // Arabanın yanına spawn
        const exitOffset = 2.5;
        const exitX = vehiclePosition.x + Math.cos(vehicleRotation) * exitOffset;
        const exitZ = vehiclePosition.z - Math.sin(vehicleRotation) * exitOffset;
        
        this.mesh.position.set(exitX, 1, exitZ);
        this.rotationY = vehicleRotation;
        
        if (this.body) {
            this.body.position.set(exitX, 1.5, exitZ);
            this.body.velocity.set(0, 0, 0);
        }
        
        console.log('Arabadan inildi');
    }
    
    // Arabaya bin
    enterVehicle() {
        if (this.inVehicle) return false;
        
        this.inVehicle = true;
        this.isActive = false;
        this.mesh.visible = false;
        
        console.log('Arabaya binildi');
        return true;
    }
    
    // Yakındaki arabayı bul
    findNearbyVehicle(vehicles, maxDistance = 4) {
        if (!this.mesh) return null;
        
        const charPos = this.mesh.position;
        let nearest = null;
        let nearestDist = maxDistance;
        
        for (const vehicle of vehicles) {
            if (!vehicle.mesh) continue;
            
            const dx = vehicle.mesh.position.x - charPos.x;
            const dz = vehicle.mesh.position.z - charPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = vehicle;
            }
        }
        
        return nearest;
    }
    
    update(delta) {
        if (!this.isActive || this.inVehicle) return;
        
        const speed = this.controls.run ? this.runSpeed : this.moveSpeed;
        
        // Yön hesapla
        let moveX = 0, moveZ = 0;
        
        if (this.controls.forward) {
            moveX += Math.sin(this.rotationY);
            moveZ += Math.cos(this.rotationY);
        }
        if (this.controls.backward) {
            moveX -= Math.sin(this.rotationY) * 0.5;
            moveZ -= Math.cos(this.rotationY) * 0.5;
        }
        if (this.controls.left) {
            this.rotationY += 3 * delta;
        }
        if (this.controls.right) {
            this.rotationY -= 3 * delta;
        }
        
        // Hareket uygula
        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX = (moveX / length) * speed * delta;
            moveZ = (moveZ / length) * speed * delta;
            
            this.mesh.position.x += moveX;
            this.mesh.position.z += moveZ;
            
            this.animationState = this.controls.run ? 'run' : 'walk';
        } else {
            this.animationState = 'idle';
        }
        
        // Fizik body güncelle
        if (this.body) {
            this.body.position.x = this.mesh.position.x;
            this.body.position.z = this.mesh.position.z;
        }
        
        // Rotasyon
        this.mesh.rotation.y = this.rotationY;
        
        // Yürüme animasyonu
        this.updateAnimation(delta);
    }
    
    updateAnimation(delta) {
        this.animationTime += delta * (this.controls.run ? 15 : 10);
        
        if (this.animationState === 'walk' || this.animationState === 'run') {
            const swing = Math.sin(this.animationTime) * 0.5;
            
            // Bacak sallanması
            if (this.leftLeg) this.leftLeg.rotation.x = swing;
            if (this.rightLeg) this.rightLeg.rotation.x = -swing;
            
            // Kol sallanması
            if (this.leftArm) this.leftArm.rotation.x = -swing * 0.7;
            if (this.rightArm) this.rightArm.rotation.x = swing * 0.7;
        } else {
            // Idle - hafif nefes alma
            const breath = Math.sin(this.animationTime * 0.5) * 0.02;
            if (this.leftLeg) this.leftLeg.rotation.x = 0;
            if (this.rightLeg) this.rightLeg.rotation.x = 0;
            if (this.leftArm) this.leftArm.rotation.x = breath;
            if (this.rightArm) this.rightArm.rotation.x = breath;
        }
    }
    
    getPosition() {
        return this.mesh ? this.mesh.position : { x: 0, y: 0, z: 0 };
    }
    
    getRotation() {
        return this.rotationY;
    }
}

// Global karakter instance
let character = null;
