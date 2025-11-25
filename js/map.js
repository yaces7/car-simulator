/**
 * map.js
 * Gelişmiş chunk-based harita sistemi
 */

class GameMap {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Chunk sistemi
        this.chunkSize = 150;
        this.renderDistance = 2;
        this.loadedChunks = new Map();
        this.lastPlayerChunk = { x: null, z: null };
        
        // Trafik arabaları
        this.trafficCars = [];
        
        // Trafik ışıkları
        this.trafficLights = [];
        this.trafficLightTimer = 0;
        this.trafficLightState = 'green';
        
        // Gün/Gece döngüsü - çok daha hızlı
        this.gameTime = 8;
        this.timeSpeed = 15; // 1 dakika = 15 oyun dakikası
        this.sunLight = null;
        this.ambientLight = null;
        
        this.weather = 'clear';
        this.rainParticles = null;
        
        this.createGround();
        this.createSkybox();
        this.setupLighting();
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a6b1f });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.physicsWorld.addBody(groundBody);
    }
    
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(2000, 32, 32);
        this.skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
        this.sky = new THREE.Mesh(skyGeometry, this.skyMaterial);
        this.scene.add(this.sky);
    }
    
    setupLighting() {
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.scene.add(this.sunLight);
        
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
    }
    
    update(playerPosition, deltaTime) {
        this.updateTime(deltaTime);
        this.updateTraffic(deltaTime);
        this.updateTrafficLights(deltaTime);
        this.updateGasStations(deltaTime);
        
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        if (playerChunkX !== this.lastPlayerChunk.x || playerChunkZ !== this.lastPlayerChunk.z) {
            this.lastPlayerChunk = { x: playerChunkX, z: playerChunkZ };
            this.updateChunks(playerChunkX, playerChunkZ);
        }
    }
    
    updateTrafficLights(deltaTime) {
        this.trafficLightTimer += deltaTime;
        
        if (this.trafficLightState === 'green' && this.trafficLightTimer > 8) {
            this.trafficLightState = 'yellow';
            this.trafficLightTimer = 0;
        } else if (this.trafficLightState === 'yellow' && this.trafficLightTimer > 2) {
            this.trafficLightState = 'red';
            this.trafficLightTimer = 0;
        } else if (this.trafficLightState === 'red' && this.trafficLightTimer > 8) {
            this.trafficLightState = 'green';
            this.trafficLightTimer = 0;
        }
        
        this.trafficLights.forEach(light => {
            if (light.greenLight) light.greenLight.material.emissiveIntensity = this.trafficLightState === 'green' ? 1 : 0.1;
            if (light.yellowLight) light.yellowLight.material.emissiveIntensity = this.trafficLightState === 'yellow' ? 1 : 0.1;
            if (light.redLight) light.redLight.material.emissiveIntensity = this.trafficLightState === 'red' ? 1 : 0.1;
        });
    }
    
    setWeather(weather) {
        this.weather = weather;
        if (weather === 'fog') {
            this.scene.fog = new THREE.Fog(0x888888, 10, 150);
        } else if (weather === 'rain') {
            this.scene.fog = new THREE.Fog(0x666666, 50, 300);
        } else {
            this.scene.fog = new THREE.Fog(0x87CEEB, 100, 800);
        }
    }
    
    updateChunks(centerX, centerZ) {
        const chunksToKeep = new Set();
        
        for (let x = centerX - this.renderDistance; x <= centerX + this.renderDistance; x++) {
            for (let z = centerZ - this.renderDistance; z <= centerZ + this.renderDistance; z++) {
                const key = `${x},${z}`;
                chunksToKeep.add(key);
                if (!this.loadedChunks.has(key)) {
                    this.loadChunk(x, z);
                }
            }
        }
        
        for (const [key, chunk] of this.loadedChunks) {
            if (!chunksToKeep.has(key)) {
                this.unloadChunk(key, chunk);
            }
        }
    }
    
    loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = { objects: [], bodies: [], cars: [] };
        
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        const seed = chunkX * 10000 + chunkZ;
        const random = this.seededRandom(seed);
        
        const isMainRoadX = (chunkZ === 0);
        const isMainRoadZ = (chunkX === 0);
        const isIntersection = isMainRoadX && isMainRoadZ;
        
        // Benzin istasyonu kontrolü için önce random'u çağır
        let gasStationSideX = null;
        let gasStationSideZ = null;
        
        // Benzin istasyonu olacak mı kontrol et
        if ((isMainRoadX || isMainRoadZ) && !isIntersection && random() < 0.25) {
            const side = random() > 0.5 ? 1 : -1;
            
            if (isMainRoadX && !isMainRoadZ) {
                gasStationSideX = side;
                this.createGasStation(worldX + 50, worldZ + this.chunkSize/2 + side * 18, chunk, false, side);
            } else if (isMainRoadZ && !isMainRoadX) {
                gasStationSideZ = side;
                this.createGasStation(worldX + this.chunkSize/2 + side * 18, worldZ + 50, chunk, true, side);
            }
        }
        
        // Ana yollar - benzin istasyonu tarafında bariyer yok
        if (isMainRoadX) {
            this.createMainRoad(worldX, worldZ, chunk, false);
            this.createRoadBarriers(worldX, worldZ, chunk, false, gasStationSideX);
        }
        if (isMainRoadZ) {
            this.createMainRoad(worldX, worldZ, chunk, true);
            this.createRoadBarriers(worldX, worldZ, chunk, true, gasStationSideZ);
        }
        
        // Kavşakta trafik ışıkları
        if (isIntersection) {
            this.createTrafficLight(worldX + this.chunkSize/2 + 14, worldZ + this.chunkSize/2 + 14, chunk, Math.PI * 0.75);
            this.createTrafficLight(worldX + this.chunkSize/2 - 14, worldZ + this.chunkSize/2 - 14, chunk, -Math.PI * 0.25);
            this.createTrafficLight(worldX + this.chunkSize/2 + 14, worldZ + this.chunkSize/2 - 14, chunk, Math.PI * 0.25);
            this.createTrafficLight(worldX + this.chunkSize/2 - 14, worldZ + this.chunkSize/2 + 14, chunk, -Math.PI * 0.75);
        }
        
        // Binalar - sadece yoldan uzakta
        if (!isMainRoadX && !isMainRoadZ) {
            const buildingCount = Math.floor(random() * 3) + 1;
            for (let i = 0; i < buildingCount; i++) {
                const bx = worldX + 25 + random() * (this.chunkSize - 50);
                const bz = worldZ + 25 + random() * (this.chunkSize - 50);
                this.createBuilding(bx, bz, chunk, random);
            }
            
            // Ağaçlar
            const treeCount = Math.floor(random() * 5) + 2;
            for (let i = 0; i < treeCount; i++) {
                const tx = worldX + 10 + random() * (this.chunkSize - 20);
                const tz = worldZ + 10 + random() * (this.chunkSize - 20);
                this.createTree(tx, tz, chunk, random);
            }
        }
        
        // Trafik arabaları
        if (isMainRoadX || isMainRoadZ) {
            const carCount = Math.floor(random() * 2) + 1;
            for (let i = 0; i < carCount; i++) {
                this.createTrafficCar(worldX, worldZ, chunk, random, isMainRoadZ);
            }
        }
        
        this.loadedChunks.set(key, chunk);
    }
    
    createRoadBarriers(worldX, worldZ, chunk, vertical, skipSide = null) {
        // Kavşak chunk'ında bariyer koyma
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkZ = Math.floor(worldZ / this.chunkSize);
        const isIntersection = (chunkX === 0 && chunkZ === 0);
        
        if (isIntersection) return;
        
        const barrierMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const barrierHeight = 0.7;
        const barrierWidth = 0.25;
        const roadHalfWidth = 12;
        const edgeOffset = roadHalfWidth + 1;
        
        [-edgeOffset, edgeOffset].forEach(offset => {
            // Benzin istasyonu tarafında bariyer koyma
            if (skipSide !== null) {
                if ((skipSide > 0 && offset > 0) || (skipSide < 0 && offset < 0)) {
                    return; // Bu tarafta bariyer yok
                }
            }
            
            const barrier = new THREE.Mesh(
                new THREE.BoxGeometry(
                    vertical ? barrierWidth : this.chunkSize,
                    barrierHeight,
                    vertical ? this.chunkSize : barrierWidth
                ),
                barrierMat
            );
            
            if (vertical) {
                barrier.position.set(worldX + this.chunkSize/2 + offset, barrierHeight/2, worldZ + this.chunkSize/2);
            } else {
                barrier.position.set(worldX + this.chunkSize/2, barrierHeight/2, worldZ + this.chunkSize/2 + offset);
            }
            barrier.castShadow = true;
            this.scene.add(barrier);
            chunk.objects.push(barrier);
            
            const shape = new CANNON.Box(new CANNON.Vec3(
                vertical ? barrierWidth/2 : this.chunkSize/2,
                barrierHeight/2,
                vertical ? this.chunkSize/2 : barrierWidth/2
            ));
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape);
            body.position.copy(barrier.position);
            this.physicsWorld.addBody(body);
            chunk.bodies.push(body);
        });
    }
    
    createTrafficLight(x, z, chunk, rotation = 0) {
        const group = new THREE.Group();
        
        // Direk
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 8), poleMat);
        pole.position.y = 2.5;
        pole.castShadow = true;
        group.add(pole);
        
        // Işık kutusu
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.35), boxMat);
        box.position.y = 5.5;
        group.add(box);
        
        // Işıklar
        const lightGeom = new THREE.SphereGeometry(0.12, 8, 8);
        
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.1 });
        const redLight = new THREE.Mesh(lightGeom, redMat);
        redLight.position.set(0, 5.85, 0.18);
        group.add(redLight);
        
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.1 });
        const yellowLight = new THREE.Mesh(lightGeom, yellowMat);
        yellowLight.position.set(0, 5.5, 0.18);
        group.add(yellowLight);
        
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 });
        const greenLight = new THREE.Mesh(lightGeom, greenMat);
        greenLight.position.set(0, 5.15, 0.18);
        group.add(greenLight);
        
        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        this.scene.add(group);
        chunk.objects.push(group);
        
        this.trafficLights.push({ mesh: group, redLight, yellowLight, greenLight });
    }
    
    createGasStation(x, z, chunk, rotated = false, side = 1) {
        const group = new THREE.Group();
        
        // Ana bina
        const buildingMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        const building = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 5), buildingMat);
        building.position.set(0, 1.75, -4);
        building.castShadow = true;
        group.add(building);
        
        // Tente
        const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 8), canopyMat);
        canopy.position.set(0, 4, 2);
        canopy.castShadow = true;
        group.add(canopy);
        
        // Direkler
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        [[-5, -1], [5, -1], [-5, 5], [5, 5]].forEach(([px, pz]) => {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 8), pillarMat);
            pillar.position.set(px, 2, pz);
            group.add(pillar);
        });
        
        // Pompalar
        const pumpMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
        [-2.5, 2.5].forEach(px => {
            const pump = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.5), pumpMat);
            pump.position.set(px, 0.8, 2);
            group.add(pump);
        });
        
        // Dönen yeşil simge (yakıt ikonu) - pompaların yanında, alçakta
        const iconGroup = new THREE.Group();
        
        // Dış halka
        const ringGeom = new THREE.TorusGeometry(1.2, 0.12, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        iconGroup.add(ring);
        
        // İç benzin damlası şekli
        const dropGeom = new THREE.SphereGeometry(0.6, 8, 8);
        const dropMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
        const drop = new THREE.Mesh(dropGeom, dropMat);
        iconGroup.add(drop);
        
        // Parıltı efekti
        const glowGeom = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.15 });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        iconGroup.add(glow);
        
        // Pompaların önünde, arabanın geçeceği yerde, alçakta
        iconGroup.position.set(0, 2.5, 6);
        iconGroup.userData.isGasIcon = true;
        group.add(iconGroup);
        
        group.position.set(x, 0, z);
        if (rotated) group.rotation.y = Math.PI / 2;
        this.scene.add(group);
        chunk.objects.push(group);
        
        // Benzin istasyonu verisi
        if (!this.gasStations) this.gasStations = [];
        this.gasStations.push({
            position: new THREE.Vector3(x, 0, z),
            icon: iconGroup,
            group: group
        });
        
        // Fizik - sadece bina için
        const shape = new CANNON.Box(new CANNON.Vec3(5, 1.75, 2.5));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(x, 1.75, z - 4);
        if (rotated) body.quaternion.setFromEuler(0, Math.PI/2, 0);
        this.physicsWorld.addBody(body);
        chunk.bodies.push(body);
    }
    
    updateGasStations(delta) {
        if (!this.gasStations) return;
        
        this.gasStations.forEach(station => {
            if (station.icon) {
                station.icon.rotation.y += delta * 2;
                station.icon.position.y = 7 + Math.sin(Date.now() * 0.003) * 0.3;
            }
        });
    }
    
    checkGasStationProximity(playerPosition) {
        if (!this.gasStations) return null;
        
        for (const station of this.gasStations) {
            const dx = playerPosition.x - station.position.x;
            const dz = playerPosition.z - station.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 15) {
                return station;
            }
        }
        return null;
    }
    
    createMainRoad(x, z, chunk, vertical) {
        const roadWidth = 24;
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        
        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(vertical ? roadWidth : this.chunkSize, vertical ? this.chunkSize : roadWidth),
            roadMaterial
        );
        road.rotation.x = -Math.PI / 2;
        road.position.set(x + this.chunkSize/2, 0.05, z + this.chunkSize/2);
        road.receiveShadow = true;
        this.scene.add(road);
        chunk.objects.push(road);
        
        // Şerit çizgileri
        const yellowLine = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const whiteLine = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        for (let i = 0; i < this.chunkSize; i += 4) {
            // Orta sarı çizgi
            const center = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? 0.2 : 2.5, vertical ? 2.5 : 0.2), yellowLine);
            center.rotation.x = -Math.PI / 2;
            center.position.set(vertical ? x + this.chunkSize/2 : x + i, 0.06, vertical ? z + i : z + this.chunkSize/2);
            this.scene.add(center);
            chunk.objects.push(center);
        }
        
        // Kenar çizgileri
        [-10, 10].forEach(offset => {
            for (let i = 0; i < this.chunkSize; i += 8) {
                const line = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? 0.15 : 4, vertical ? 4 : 0.15), whiteLine);
                line.rotation.x = -Math.PI / 2;
                if (vertical) {
                    line.position.set(x + this.chunkSize/2 + offset, 0.06, z + i);
                } else {
                    line.position.set(x + i, 0.06, z + this.chunkSize/2 + offset);
                }
                this.scene.add(line);
                chunk.objects.push(line);
            }
        });
    }

    
    createBuilding(x, z, chunk, random) {
        const height = 15 + random() * 40;
        const width = 10 + random() * 10;
        const depth = 10 + random() * 10;
        
        const colors = [0x718096, 0x4a5568, 0xd69e6d, 0xc9a87c, 0x2d3748];
        const color = colors[Math.floor(random() * colors.length)];
        
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshLambertMaterial({ color });
        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
        body.position.y = height/2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Pencereler
        const windowMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
        for (let floor = 3; floor < height - 2; floor += 4) {
            const windowStrip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 1.5, depth + 0.1), windowMat);
            windowStrip.position.y = floor;
            group.add(windowStrip);
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        chunk.objects.push(group);
        
        // Fizik
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const body2 = new CANNON.Body({ mass: 0 });
        body2.addShape(shape);
        body2.position.set(x, height/2, z);
        this.physicsWorld.addBody(body2);
        chunk.bodies.push(body2);
    }
    
    createTree(x, z, chunk, random) {
        const group = new THREE.Group();
        
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2511 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.5, 6), trunkMat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        group.add(trunk);
        
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        if (random() < 0.4) {
            // Çam
            for (let i = 0; i < 3; i++) {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8 - i * 0.4, 2, 6), leafMat);
                cone.position.y = 3 + i * 1.3;
                cone.castShadow = true;
                group.add(cone);
            }
        } else {
            // Yapraklı
            const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), leafMat);
            leaves.position.y = 4;
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        chunk.objects.push(group);
        
        // Fizik
        const shape = new CANNON.Cylinder(0.4, 0.4, 2.5, 6);
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(x, 1.25, z);
        this.physicsWorld.addBody(body);
        chunk.bodies.push(body);
    }
    
    createTrafficCar(worldX, worldZ, chunk, random, vertical) {
        const carColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6];
        const color = carColors[Math.floor(random() * carColors.length)];
        
        const car = createCarMesh({ color });
        
        const laneOffset = (random() > 0.5 ? 5 : -5);
        const posOffset = random() * this.chunkSize;
        
        if (vertical) {
            car.position.set(worldX + this.chunkSize/2 + laneOffset, 0.5, worldZ + posOffset);
            car.rotation.y = laneOffset > 0 ? 0 : Math.PI;
        } else {
            car.position.set(worldX + posOffset, 0.5, worldZ + this.chunkSize/2 + laneOffset);
            car.rotation.y = laneOffset > 0 ? Math.PI/2 : -Math.PI/2;
        }
        
        this.scene.add(car);
        chunk.objects.push(car);
        
        // Trafik arabası için fizik
        const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        const carBody = new CANNON.Body({ mass: 0 });
        carBody.addShape(carShape);
        carBody.position.copy(car.position);
        carBody.quaternion.setFromEuler(0, car.rotation.y, 0);
        this.physicsWorld.addBody(carBody);
        chunk.bodies.push(carBody);
        
        const trafficCar = {
            mesh: car,
            body: carBody,
            speed: 8 + random() * 8,
            direction: vertical ? (laneOffset > 0 ? 1 : -1) : 0,
            directionX: vertical ? 0 : (laneOffset > 0 ? 1 : -1),
            vertical
        };
        
        this.trafficCars.push(trafficCar);
        chunk.cars.push(trafficCar);
    }
    
    updateTraffic(delta) {
        this.trafficCars.forEach(car => {
            if (car.vertical) {
                car.mesh.position.z += car.direction * car.speed * delta;
                if (car.body) car.body.position.z = car.mesh.position.z;
            } else {
                car.mesh.position.x += car.directionX * car.speed * delta;
                if (car.body) car.body.position.x = car.mesh.position.x;
            }
        });
    }
    
    unloadChunk(key, chunk) {
        chunk.objects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        
        chunk.bodies.forEach(body => {
            this.physicsWorld.removeBody(body);
        });
        
        chunk.cars.forEach(car => {
            const idx = this.trafficCars.indexOf(car);
            if (idx > -1) this.trafficCars.splice(idx, 1);
        });
        
        // Trafik ışıklarını temizle
        this.trafficLights = this.trafficLights.filter(light => {
            return !chunk.objects.includes(light.mesh);
        });
        
        this.loadedChunks.delete(key);
    }
    
    updateTime(deltaTime) {
        this.gameTime += (deltaTime * this.timeSpeed) / 60;
        if (this.gameTime >= 24) this.gameTime -= 24;
        
        const hour = this.gameTime;
        const sunAngle = ((hour - 6) / 12) * Math.PI;
        const sunHeight = Math.sin(sunAngle);
        
        this.sunLight.position.set(Math.cos(sunAngle) * 200, Math.max(sunHeight * 200, 10), 100);
        
        if (hour >= 6 && hour <= 18) {
            const intensity = 0.5 + Math.sin(sunAngle) * 0.5;
            this.sunLight.intensity = intensity;
            this.ambientLight.intensity = 0.3 + intensity * 0.2;
            
            if (hour < 8 || hour > 16) {
                this.sunLight.color.setHex(0xffaa55);
                this.skyMaterial.color.setHex(0xff9966);
            } else {
                this.sunLight.color.setHex(0xffffff);
                this.skyMaterial.color.setHex(0x87CEEB);
            }
        } else {
            this.sunLight.intensity = 0.1;
            this.ambientLight.intensity = 0.15;
            this.sunLight.color.setHex(0x4444ff);
            this.skyMaterial.color.setHex(0x0a0a2e);
        }
    }
    
    getTimeString() {
        const hours = Math.floor(this.gameTime);
        const minutes = Math.floor((this.gameTime % 1) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    getWeatherString() {
        const hour = this.gameTime;
        if (hour >= 6 && hour < 8) return '🌅 Gün Doğumu';
        if (hour >= 8 && hour < 16) return '☀️ Güneşli';
        if (hour >= 16 && hour < 18) return '🌇 Gün Batımı';
        return '🌙 Gece';
    }
    
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    getSpawnPoints() {
        return [{ x: 0, y: 2, z: 20 }];
    }
}
