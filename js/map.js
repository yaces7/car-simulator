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
        this.setupLighting();
    }
    
    createGround() {
        // Zemin
        const groundSize = 2000;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
        
        // Doku oluşturma
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Çim dokusu
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 5000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#3a6b1f' : '#234010';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);
        
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.9
        });
        
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
        // Ana yol ağı - 3-4 km uzunluğunda
        const roadWidth = 20;
        const roadSegments = [
            { start: [-500, 0], end: [500, 0] },      // Düz yol
            { start: [500, 0], end: [500, 400] },     // Sağa dönüş
            { start: [500, 400], end: [200, 600] },   // Viraj
            { start: [200, 600], end: [-300, 600] },  // Düz
            { start: [-300, 600], end: [-500, 400] }, // Viraj
            { start: [-500, 400], end: [-500, 0] }    // Geri dönüş
        ];
        
        // Asfalt dokusu
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 512;
        roadCanvas.height = 512;
        const roadCtx = roadCanvas.getContext('2d');
        
        // Asfalt rengi
        roadCtx.fillStyle = '#2a2a2a';
        roadCtx.fillRect(0, 0, 512, 512);
        
        // Yol çizgileri ve detaylar
        for (let i = 0; i < 1000; i++) {
            roadCtx.fillStyle = Math.random() > 0.5 ? '#333333' : '#222222';
            roadCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
        }
        
        const roadTexture = new THREE.CanvasTexture(roadCanvas);
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            map: roadTexture,
            roughness: 0.7
        });
        
        // Yol segmentlerini oluştur
        roadSegments.forEach(segment => {
            const length = Math.sqrt(
                Math.pow(segment.end[0] - segment.start[0], 2) + 
                Math.pow(segment.end[1] - segment.start[1], 2)
            );
            
            const roadGeometry = new THREE.PlaneGeometry(roadWidth, length);
            const road = new THREE.Mesh(roadGeometry, roadMaterial);
            
            const centerX = (segment.start[0] + segment.end[0]) / 2;
            const centerZ = (segment.start[1] + segment.end[1]) / 2;
            
            road.position.set(centerX, 0.1, centerZ);
            road.rotation.x = -Math.PI / 2;
            
            const angle = Math.atan2(
                segment.end[0] - segment.start[0],
                segment.end[1] - segment.start[1]
            );
            road.rotation.z = -angle;
            
            road.receiveShadow = true;
            this.scene.add(road);
            
            // Yol kenarı çizgileri
            this.createRoadLines(segment, roadWidth);
        });
        
        // Rampa
        this.createRamp(100, 0, 200);
        
        // Köprü
        this.createBridge(-200, 0, 300);
    }
    
    createRoadLines(segment, roadWidth) {
        const lineGeometry = new THREE.BoxGeometry(0.3, 0.05, 5);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        
        const length = Math.sqrt(
            Math.pow(segment.end[0] - segment.start[0], 2) + 
            Math.pow(segment.end[1] - segment.start[1], 2)
        );
        
        const angle = Math.atan2(
            segment.end[0] - segment.start[0],
            segment.end[1] - segment.start[1]
        );
        
        // Orta çizgi
        for (let i = 0; i < length; i += 10) {
            const t = i / length;
            const x = segment.start[0] + (segment.end[0] - segment.start[0]) * t;
            const z = segment.start[1] + (segment.end[1] - segment.start[1]) * t;
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(x, 0.15, z);
            line.rotation.y = -angle;
            this.scene.add(line);
        }
    }
    
    createRamp(x, y, z) {
        const rampGeometry = new THREE.BoxGeometry(20, 1, 30);
        const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        
        ramp.position.set(x, y + 2, z);
        ramp.rotation.x = Math.PI / 8;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        this.scene.add(ramp);
        
        // Fizik
        const rampShape = new CANNON.Box(new CANNON.Vec3(10, 0.5, 15));
        const rampBody = new CANNON.Body({ mass: 0 });
        rampBody.addShape(rampShape);
        rampBody.position.set(x, y + 2, z);
        rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 8);
        this.physicsWorld.addBody(rampBody);
    }
    
    createBridge(x, y, z) {
        // Köprü platformu
        const bridgeGeometry = new THREE.BoxGeometry(20, 1, 60);
        const bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        
        bridge.position.set(x, y + 5, z);
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        
        // Fizik
        const bridgeShape = new CANNON.Box(new CANNON.Vec3(10, 0.5, 30));
        const bridgeBody = new CANNON.Body({ mass: 0 });
        bridgeBody.addShape(bridgeShape);
        bridgeBody.position.set(x, y + 5, z);
        this.physicsWorld.addBody(bridgeBody);
        
        // Köprü direkleri
        const pillarGeometry = new THREE.CylinderGeometry(1, 1, 10, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        [-8, 8].forEach(offset => {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(x + offset, y, z - 20);
            pillar.castShadow = true;
            this.scene.add(pillar);
            
            const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar2.position.set(x + offset, y, z + 20);
            pillar2.castShadow = true;
            this.scene.add(pillar2);
        });
    }
    
    createEnvironment() {
        // Ağaçlar
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 1800;
            const z = (Math.random() - 0.5) * 1800;
            
            // Yoldan uzak olsun
            if (Math.abs(x) < 50 && Math.abs(z) < 700) continue;
            
            this.createTree(x, z);
        }
        
        // Binalar
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 1500;
            const z = (Math.random() - 0.5) * 1500;
            
            if (Math.abs(x) < 100 && Math.abs(z) < 700) continue;
            
            this.createBuilding(x, z);
        }
        
        // Işık direkleri
        for (let i = -500; i < 500; i += 50) {
            this.createStreetLight(25, i);
            this.createStreetLight(-25, i);
        }
        
        // Tabelalar
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 1000;
            const z = (Math.random() - 0.5) * 1000;
            this.createSign(x, z);
        }
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Gövde
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Yapraklar
        const leavesGeometry = new THREE.SphereGeometry(3, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 6;
        leaves.castShadow = true;
        group.add(leaves);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        
        // Fizik (basit silindir)
        const treeShape = new CANNON.Cylinder(0.7, 0.7, 5, 8);
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(x, 2.5, z);
        this.physicsWorld.addBody(treeBody);
    }
    
    createBuilding(x, z) {
        const height = 20 + Math.random() * 40;
        const width = 10 + Math.random() * 10;
        const depth = 10 + Math.random() * 10;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.3, 0.5)
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
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
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 4;
        pole.castShadow = true;
        group.add(pole);
        
        // Lamba
        const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.y = 8;
        group.add(light);
        
        // Işık kaynağı
        const pointLight = new THREE.PointLight(0xffffaa, 0.5, 30);
        pointLight.position.y = 8;
        pointLight.castShadow = true;
        group.add(pointLight);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    
    createSign(x, z) {
        const group = new THREE.Group();
        
        // Direk
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 1.5;
        group.add(pole);
        
        // Tabela
        const signGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
        const signMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.y = 3.5;
        sign.castShadow = true;
        group.add(sign);
        
        group.position.set(x, 0, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(group);
    }
    
    createSkybox() {
        // Gökyüzü küresi
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        
        // Gradient gökyüzü
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#87CEEB');  // Açık mavi
        gradient.addColorStop(0.5, '#B0E0E6'); // Orta mavi
        gradient.addColorStop(1, '#F0F8FF');   // Beyazımsı
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Bulutlar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 256;
            ctx.beginPath();
            ctx.ellipse(x, y, 40 + Math.random() * 40, 20 + Math.random() * 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const skyTexture = new THREE.CanvasTexture(canvas);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            map: skyTexture,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    setupLighting() {
        // Güneş ışığı
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        
        // Gölge ayarları
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        
        this.scene.add(sunLight);
        this.sunLight = sunLight;
        
        // Ortam ışığı
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Hemisfer ışığı (gökyüzü-zemin)
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x2d5016, 0.3);
        this.scene.add(hemiLight);
    }
    
    updateDayNightCycle(time) {
        // time: 0-24 saat
        const hour = time % 24;
        
        // Güneş pozisyonu
        const sunAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
        const sunDistance = 200;
        
        this.sunLight.position.x = Math.cos(sunAngle) * sunDistance;
        this.sunLight.position.y = Math.sin(sunAngle) * sunDistance;
        
        // Işık yoğunluğu
        if (hour >= 6 && hour <= 18) {
            // Gündüz
            const intensity = Math.sin((hour - 6) / 12 * Math.PI);
            this.sunLight.intensity = 0.5 + intensity * 0.5;
        } else {
            // Gece
            this.sunLight.intensity = 0.1;
        }
    }
    
    getSpawnPoints() {
        return [
            { x: 0, y: 2, z: 0 },
            { x: 10, y: 2, z: 0 },
            { x: -10, y: 2, z: 0 },
            { x: 0, y: 2, z: 10 },
            { x: 0, y: 2, z: -10 },
            { x: 20, y: 2, z: 0 },
            { x: -20, y: 2, z: 0 },
            { x: 0, y: 2, z: 20 }
        ];
    }
}

