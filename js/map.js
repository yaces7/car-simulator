/**
 * map.js
 * 3D dünya, harita, yollar ve çevre objeleri
 */

class GameMap {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        this.createGround();
        this.createRoads();
        this.createEnvironment();
        this.createSkybox();
    }
    
    createGround() {
        // Büyük yeşil zemin
        const groundSize = 2000;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a6b1f });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Fizik zemini
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.physicsWorld.addBody(groundBody);
    }
    
    createRoads() {
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Ana yol - Kuzey-Güney
        const road1 = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 1500),
            roadMaterial
        );
        road1.rotation.x = -Math.PI / 2;
        road1.position.y = 0.1;
        this.scene.add(road1);
        
        // Çapraz yol - Doğu-Batı
        const road2 = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 1500),
            roadMaterial
        );
        road2.rotation.x = -Math.PI / 2;
        road2.rotation.z = Math.PI / 2;
        road2.position.y = 0.1;
        this.scene.add(road2);
        
        // Çapraz yol 2
        const road3 = new THREE.Mesh(
            new THREE.PlaneGeometry(15, 800),
            roadMaterial
        );
        road3.rotation.x = -Math.PI / 2;
        road3.rotation.z = Math.PI / 4;
        road3.position.set(200, 0.1, 200);
        this.scene.add(road3);
        
        // Dairesel kavşak
        const circleRoad = new THREE.Mesh(
            new THREE.RingGeometry(30, 50, 32),
            roadMaterial
        );
        circleRoad.rotation.x = -Math.PI / 2;
        circleRoad.position.y = 0.1;
        this.scene.add(circleRoad);
        
        // Yol çizgileri
        for (let i = -700; i < 700; i += 15) {
            // Kuzey-Güney çizgiler
            const line1 = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, 6),
                lineMaterial
            );
            line1.rotation.x = -Math.PI / 2;
            line1.position.set(0, 0.15, i);
            this.scene.add(line1);
            
            // Doğu-Batı çizgiler
            const line2 = new THREE.Mesh(
                new THREE.PlaneGeometry(6, 0.4),
                lineMaterial
            );
            line2.rotation.x = -Math.PI / 2;
            line2.position.set(i, 0.15, 0);
            this.scene.add(line2);
        }
        
        // Rampa
        this.createRamp(100, 0, 150);
        this.createRamp(-150, 0, -200);
        
        // Köprü
        this.createBridge(300, 0, 0);
    }
    
    createRamp(x, y, z) {
        const rampGeometry = new THREE.BoxGeometry(15, 0.5, 25);
        const rampMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        ramp.position.set(x, y + 2, z);
        ramp.rotation.x = Math.PI / 10;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        this.scene.add(ramp);
        
        // Fizik
        const rampShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.25, 12.5));
        const rampBody = new CANNON.Body({ mass: 0 });
        rampBody.addShape(rampShape);
        rampBody.position.set(x, y + 2, z);
        rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 10);
        this.physicsWorld.addBody(rampBody);
    }
    
    createBridge(x, y, z) {
        // Köprü platformu
        const bridgeGeometry = new THREE.BoxGeometry(20, 1, 50);
        const bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        
        bridge.position.set(x, y + 5, z);
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        
        // Fizik
        const bridgeShape = new CANNON.Box(new CANNON.Vec3(10, 0.5, 25));
        const bridgeBody = new CANNON.Body({ mass: 0 });
        bridgeBody.addShape(bridgeShape);
        bridgeBody.position.set(x, y + 5, z);
        this.physicsWorld.addBody(bridgeBody);
        
        // Köprü direkleri
        const pillarGeometry = new THREE.CylinderGeometry(1, 1, 10, 8);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        [-8, 8].forEach(offset => {
            const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar1.position.set(x + offset, y, z - 20);
            pillar1.castShadow = true;
            this.scene.add(pillar1);
            
            const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar2.position.set(x + offset, y, z + 20);
            pillar2.castShadow = true;
            this.scene.add(pillar2);
        });
        
        // Rampa yukarı
        const rampUp = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.5, 20),
            bridgeMaterial
        );
        rampUp.position.set(x, y + 2.5, z - 35);
        rampUp.rotation.x = -Math.PI / 12;
        this.scene.add(rampUp);
        
        // Rampa aşağı
        const rampDown = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.5, 20),
            bridgeMaterial
        );
        rampDown.position.set(x, y + 2.5, z + 35);
        rampDown.rotation.x = Math.PI / 12;
        this.scene.add(rampDown);
    }
    
    createEnvironment() {
        // Ağaçlar - daha fazla
        for (let i = 0; i < 150; i++) {
            const x = (Math.random() - 0.5) * 1600;
            const z = (Math.random() - 0.5) * 1600;
            
            // Yoldan uzak olsun
            if (Math.abs(x) < 35 && Math.abs(z) < 800) continue;
            if (Math.abs(z) < 35 && Math.abs(x) < 800) continue;
            
            this.createTree(x, z);
        }
        
        // Binalar - şehir merkezi
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 1200;
            const z = (Math.random() - 0.5) * 1200;
            
            if (Math.abs(x) < 60 && Math.abs(z) < 800) continue;
            if (Math.abs(z) < 60 && Math.abs(x) < 800) continue;
            
            this.createBuilding(x, z);
        }
        
        // Işık direkleri
        for (let i = -600; i <= 600; i += 80) {
            if (Math.abs(i) > 50) {
                this.createStreetLight(25, i);
                this.createStreetLight(-25, i);
                this.createStreetLight(i, 25);
                this.createStreetLight(i, -25);
            }
        }
        
        // Bariyerler
        this.createBarriers();
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        const treeType = Math.random();
        
        if (treeType < 0.5) {
            // Çam ağacı
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.6, 4, 6),
                new THREE.MeshLambertMaterial({ color: 0x4a2511 })
            );
            trunk.position.y = 2;
            trunk.castShadow = true;
            group.add(trunk);
            
            // Yapraklar - 3 katman
            for (let i = 0; i < 3; i++) {
                const leaves = new THREE.Mesh(
                    new THREE.ConeGeometry(3 - i * 0.7, 4, 8),
                    new THREE.MeshLambertMaterial({ color: 0x1a4d1a })
                );
                leaves.position.y = 5 + i * 2;
                leaves.castShadow = true;
                group.add(leaves);
            }
        } else {
            // Normal ağaç
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.7, 5, 6),
                new THREE.MeshLambertMaterial({ color: 0x4a2511 })
            );
            trunk.position.y = 2.5;
            trunk.castShadow = true;
            group.add(trunk);
            
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 6),
                new THREE.MeshLambertMaterial({ color: 0x2d5016 })
            );
            leaves.position.y = 6;
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        
        // Fizik
        const treeShape = new CANNON.Cylinder(0.7, 0.7, 5, 6);
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(x, 2.5, z);
        this.physicsWorld.addBody(treeBody);
    }
    
    createBuilding(x, z) {
        const height = 15 + Math.random() * 35;
        const width = 8 + Math.random() * 12;
        const depth = 8 + Math.random() * 12;
        
        const colors = [0x607d8b, 0x795548, 0x9e9e9e, 0x5d4037, 0x455a64];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshLambertMaterial({ color: color })
        );
        
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
        // Pencereler
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const windowSize = 1.5;
        
        for (let floor = 0; floor < Math.floor(height / 4); floor++) {
            for (let w = 0; w < Math.floor(width / 3); w++) {
                // Ön pencereler
                const window1 = new THREE.Mesh(
                    new THREE.PlaneGeometry(windowSize, windowSize),
                    windowMaterial
                );
                window1.position.set(
                    x - width/2 + 2 + w * 3,
                    3 + floor * 4,
                    z + depth/2 + 0.1
                );
                this.scene.add(window1);
            }
        }
        
        // Fizik
        const buildingShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const buildingBody = new CANNON.Body({ mass: 0 });
        buildingBody.addShape(buildingShape);
        buildingBody.position.set(x, height / 2, z);
        this.physicsWorld.addBody(buildingBody);
    }
    
    createStreetLight(x, z) {
        const group = new THREE.Group();
        
        // Direk
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 7, 6),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        pole.position.y = 3.5;
        pole.castShadow = true;
        group.add(pole);
        
        // Lamba kutusu
        const lampBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.4, 0.8),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        lampBox.position.y = 7;
        group.add(lampBox);
        
        // Lamba ışığı (sadece mesh, PointLight yok - performans için)
        const lamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffffaa })
        );
        lamp.position.y = 6.7;
        group.add(lamp);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    
    createBarriers() {
        const barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        
        // Yol kenarı bariyerleri
        for (let i = -700; i <= 700; i += 30) {
            // Kuzey-Güney yolu
            if (Math.abs(i) > 60) {
                const barrier1 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1, 10),
                    barrierMaterial
                );
                barrier1.position.set(12, 0.5, i);
                this.scene.add(barrier1);
                
                const barrier2 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 1, 10),
                    barrierMaterial
                );
                barrier2.position.set(-12, 0.5, i);
                this.scene.add(barrier2);
            }
        }
    }
    
    createSkybox() {
        // Gökyüzü küresi
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    getSpawnPoints() {
        return [
            { x: 0, y: 2, z: 50 },
            { x: 10, y: 2, z: 50 },
            { x: -10, y: 2, z: 50 },
            { x: 50, y: 2, z: 0 },
            { x: -50, y: 2, z: 0 }
        ];
    }
}
