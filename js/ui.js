/**
 * ui.js
 * Gerçekçi araba gösterge paneli - Fotoğraftaki gibi
 */

class UI {
    constructor() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.maxSpeed = 280;
        this.maxRPM = 8;
        
        this.createDashboard();
    }
    
    createDashboard() {
        // Eski elementleri kaldır
        const oldSpeedometer = document.querySelector('.speedometer');
        if (oldSpeedometer) oldSpeedometer.remove();
        const oldNitro = document.querySelector('.nitro-bar');
        if (oldNitro) oldNitro.remove();
        
        // Ana dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'dashboard';
        dashboard.innerHTML = `
            <div class="gauge-cluster">
                <!-- RPM Göstergesi (Sol) -->
                <div class="gauge rpm-gauge">
                    <canvas id="rpmCanvas" width="200" height="200"></canvas>
                    <div class="gauge-center">
                        <div class="gear-display" id="gearDisplay">1</div>
                        <div class="odometer" id="odometer">0</div>
                    </div>
                </div>
                
                <!-- Hız Göstergesi (Sağ) -->
                <div class="gauge speed-gauge">
                    <canvas id="speedCanvas" width="200" height="200"></canvas>
                    <div class="gauge-center">
                        <div class="speed-digital" id="speedDigital">0</div>
                        <div class="speed-unit">km/h</div>
                    </div>
                </div>
            </div>
            
            <!-- Alt göstergeler -->
            <div class="sub-gauges">
                <!-- Yakıt (Sol alt) -->
                <div class="mini-gauge fuel-gauge">
                    <canvas id="fuelCanvas" width="80" height="50"></canvas>
                    <div class="mini-label">⛽</div>
                </div>
                
                <!-- Sıcaklık (Sağ alt) -->
                <div class="mini-gauge temp-gauge">
                    <canvas id="tempCanvas" width="80" height="50"></canvas>
                    <div class="mini-label">🌡️</div>
                </div>
            </div>
        `;
        document.getElementById('hud').appendChild(dashboard);
        
        this.rpmCanvas = document.getElementById('rpmCanvas');
        this.speedCanvas = document.getElementById('speedCanvas');
        this.fuelCanvas = document.getElementById('fuelCanvas');
        this.gearDisplay = document.getElementById('gearDisplay');
        this.speedDigital = document.getElementById('speedDigital');
        
        this.addDashboardStyles();
        this.drawRPMGauge(1000);
        this.drawSpeedGauge(0);
        this.drawFuelGauge(100);
    }
    
    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #dashboard {
                position: fixed;
                bottom: 10px;
                right: 10px;
                z-index: 100;
            }
            .gauge-cluster {
                display: flex;
                gap: 5px;
            }
            .gauge {
                position: relative;
                width: 200px;
                height: 200px;
            }
            .gauge canvas {
                position: absolute;
                top: 0;
                left: 0;
            }
            .gauge-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                margin-top: 20px;
            }
            .gear-display {
                font-size: 42px;
                font-weight: bold;
                color: #00ff88;
                font-family: 'Arial Black', sans-serif;
                text-shadow: 0 0 15px #00ff88;
            }
            .odometer {
                font-size: 14px;
                color: #4af;
                font-family: 'Courier New', monospace;
                background: rgba(0,50,100,0.8);
                padding: 3px 10px;
                border-radius: 3px;
                margin-top: 5px;
            }
            .speed-digital {
                font-size: 36px;
                font-weight: bold;
                color: #fff;
                font-family: 'Arial Black', sans-serif;
            }
            .speed-unit {
                font-size: 12px;
                color: #888;
            }
            .sub-gauges {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
                padding: 0 30px;
            }
            .mini-gauge {
                position: relative;
                width: 80px;
                height: 50px;
            }
            .mini-label {
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 16px;
            }
            /* Eski elementleri gizle */
            .speedometer, .nitro-bar { display: none !important; }
        `;
        document.head.appendChild(style);
    }
    
    drawRPMGauge(rpm) {
        if (!this.rpmCanvas) return;
        
        const ctx = this.rpmCanvas.getContext('2d');
        const w = this.rpmCanvas.width;
        const h = this.rpmCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = 85;
        
        ctx.clearRect(0, 0, w, h);
        
        // Dış kırmızı halka
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Arka plan
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        bgGrad.addColorStop(0, '#1a1a1a');
        bgGrad.addColorStop(1, '#0a0a0a');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = bgGrad;
        ctx.fill();
        
        // RPM işaretleri (0-8) - Sol alttan başlayıp saat yönünde sağ alta
        // 135° (sol alt) -> 45° (sağ alt) saat yönünde = 270° toplam açı
        const startAngle = Math.PI * 0.75;  // 135° - sol alt (0 değeri)
        const endAngle = Math.PI * 2.25;    // 405° (45°) - sağ alt (max değer)
        const totalAngle = endAngle - startAngle; // 270° = 1.5π
        
        for (let j = 0; j <= 8; j++) {
            const angle = startAngle + (j / 8) * totalAngle;
            const innerR = j % 2 === 0 ? r - 20 : r - 12;
            const outerR = r - 5;
            
            const x1 = cx + Math.cos(angle) * innerR;
            const y1 = cy + Math.sin(angle) * innerR;
            const x2 = cx + Math.cos(angle) * outerR;
            const y2 = cy + Math.sin(angle) * outerR;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = j >= 7 ? '#ff4444' : '#888';
            ctx.lineWidth = j % 2 === 0 ? 3 : 1;
            ctx.stroke();
            
            // Sayılar
            if (j % 2 === 0 || j === 7) {
                const textR = r - 32;
                const tx = cx + Math.cos(angle) * textR;
                const ty = cy + Math.sin(angle) * textR;
                ctx.fillStyle = j >= 7 ? '#ff6666' : '#ccc';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(j.toString(), tx, ty);
            }
        }
        
        // x100 r/min yazısı
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('x100r/min', cx, cy + 35);
        
        // İbre - saat yönünde dönüş
        const rpmValue = Math.min(Math.max(rpm / 1000, 0), 8);
        const needleAngle = startAngle + (rpmValue / 8) * totalAngle;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle + Math.PI / 2); // +90° düzeltme (ibre yukarı bakacak şekilde)
        
        // İbre gölge
        ctx.beginPath();
        ctx.moveTo(-3, 15);
        ctx.lineTo(0, -r + 25);
        ctx.lineTo(3, 15);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        
        // İbre
        const needleGrad = ctx.createLinearGradient(0, -r + 25, 0, 15);
        needleGrad.addColorStop(0, '#ff4444');
        needleGrad.addColorStop(1, '#aa2222');
        ctx.beginPath();
        ctx.moveTo(-2, 12);
        ctx.lineTo(0, -r + 28);
        ctx.lineTo(2, 12);
        ctx.closePath();
        ctx.fillStyle = needleGrad;
        ctx.fill();
        
        ctx.restore();
        
        // Merkez kapak
        const capGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
        capGrad.addColorStop(0, '#444');
        capGrad.addColorStop(1, '#222');
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = capGrad;
        ctx.fill();
    }
    
    drawSpeedGauge(speed) {
        if (!this.speedCanvas) return;
        
        const ctx = this.speedCanvas.getContext('2d');
        const w = this.speedCanvas.width;
        const h = this.speedCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = 85;
        
        ctx.clearRect(0, 0, w, h);
        
        // Dış kırmızı halka
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Arka plan
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        bgGrad.addColorStop(0, '#1a1a1a');
        bgGrad.addColorStop(1, '#0a0a0a');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = bgGrad;
        ctx.fill();
        
        // Hız işaretleri (0-280) - Sol alttan başlayıp saat yönünde sağ alta
        const startAngle = Math.PI * 0.75;  // 135° - sol alt (0 değeri)
        const endAngle = Math.PI * 2.25;    // 405° (45°) - sağ alt (max değer)
        const totalAngle = endAngle - startAngle;
        const speedMarks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
        
        speedMarks.forEach((mark) => {
            const angle = startAngle + (mark / 280) * totalAngle;
            const innerR = mark % 40 === 0 ? r - 20 : r - 12;
            const outerR = r - 5;
            
            const x1 = cx + Math.cos(angle) * innerR;
            const y1 = cy + Math.sin(angle) * innerR;
            const x2 = cx + Math.cos(angle) * outerR;
            const y2 = cy + Math.sin(angle) * outerR;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = mark >= 220 ? '#ff4444' : '#888';
            ctx.lineWidth = mark % 40 === 0 ? 3 : 1;
            ctx.stroke();
            
            // Sayılar (her 40'ta bir)
            if (mark % 40 === 0) {
                const textR = r - 32;
                const tx = cx + Math.cos(angle) * textR;
                const ty = cy + Math.sin(angle) * textR;
                ctx.fillStyle = mark >= 220 ? '#ff6666' : '#ccc';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(mark.toString(), tx, ty);
            }
        });
        
        // km/h yazısı
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('km/h', cx, cy + 35);
        
        // İbre - saat yönünde dönüş
        const clampedSpeed = Math.min(Math.max(speed, 0), 280);
        const needleAngle = startAngle + (clampedSpeed / 280) * totalAngle;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle + Math.PI / 2); // +90° düzeltme
        
        // İbre gölge
        ctx.beginPath();
        ctx.moveTo(-3, 15);
        ctx.lineTo(0, -r + 25);
        ctx.lineTo(3, 15);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        
        // İbre
        const needleGrad = ctx.createLinearGradient(0, -r + 25, 0, 15);
        needleGrad.addColorStop(0, '#ff4444');
        needleGrad.addColorStop(1, '#aa2222');
        ctx.beginPath();
        ctx.moveTo(-2, 12);
        ctx.lineTo(0, -r + 28);
        ctx.lineTo(2, 12);
        ctx.closePath();
        ctx.fillStyle = needleGrad;
        ctx.fill();
        
        ctx.restore();
        
        // Merkez kapak
        const capGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
        capGrad.addColorStop(0, '#444');
        capGrad.addColorStop(1, '#222');
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = capGrad;
        ctx.fill();
        
        // Dijital hız
        if (this.speedDigital) {
            this.speedDigital.textContent = Math.round(speed);
        }
    }
    
    drawFuelGauge(fuel) {
        if (!this.fuelCanvas) return;
        
        const ctx = this.fuelCanvas.getContext('2d');
        const w = this.fuelCanvas.width;
        const h = this.fuelCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Arka plan
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);
        
        // E ve F harfleri
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('E', 5, h - 8);
        
        ctx.fillStyle = '#44ff44';
        ctx.textAlign = 'right';
        ctx.fillText('F', w - 5, h - 8);
        
        // İşaretler
        const startX = 15;
        const endX = w - 15;
        const markY = 15;
        
        for (let i = 0; i <= 4; i++) {
            const x = startX + (i / 4) * (endX - startX);
            ctx.beginPath();
            ctx.moveTo(x, markY);
            ctx.lineTo(x, markY + 8);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = i % 2 === 0 ? 2 : 1;
            ctx.stroke();
        }
        
        // İbre (soldan sağa - E'den F'ye)
        const fuelPercent = Math.max(0, Math.min(100, fuel));
        const needleX = startX + (fuelPercent / 100) * (endX - startX);
        
        ctx.beginPath();
        ctx.moveTo(needleX, markY + 2);
        ctx.lineTo(needleX - 4, markY + 15);
        ctx.lineTo(needleX + 4, markY + 15);
        ctx.closePath();
        ctx.fillStyle = fuelPercent < 20 ? '#ff4444' : '#ff8844';
        ctx.fill();
    }
    
    updateSpeed(speed) {
        this.drawSpeedGauge(speed);
    }
    
    updateGear(gear) {
        if (this.gearDisplay) {
            if (gear === 0) {
                this.gearDisplay.textContent = 'N';
                this.gearDisplay.style.color = '#ffff00';
            } else if (gear === -1) {
                this.gearDisplay.textContent = 'R';
                this.gearDisplay.style.color = '#ff4444';
            } else {
                this.gearDisplay.textContent = gear;
                this.gearDisplay.style.color = '#00ff88';
            }
        }
    }
    
    updateRPM(rpm, maxRPM = 8000) {
        this.drawRPMGauge(rpm);
    }
    
    updateFuel(fuel) {
        this.drawFuelGauge(fuel);
    }
    
    updateWantedLevel(level) {
        let wantedUI = document.getElementById('wantedLevelUI');
        if (!wantedUI) {
            wantedUI = document.createElement('div');
            wantedUI.id = 'wantedLevelUI';
            wantedUI.style.cssText = `
                position: fixed;
                top: 180px;
                left: 20px;
                z-index: 100;
                background: rgba(0,0,0,0.8);
                padding: 10px 15px;
                border-radius: 8px;
                border: 2px solid #ff0000;
                display: none;
            `;
            document.body.appendChild(wantedUI);
        }
        
        if (level > 0) {
            wantedUI.style.display = 'block';
            let stars = '🚨 ARANIYOR: ';
            for (let i = 0; i < Math.min(level, 5); i++) {
                stars += '⭐';
            }
            wantedUI.innerHTML = `<div style="color: #ff4444; font-weight: bold;">${stars}</div>`;
        } else {
            wantedUI.style.display = 'none';
        }
    }
    
    updateHealth(health) {
        // Hasar göstergesi - ekranın sol üstünde
        let healthBar = document.getElementById('healthBarUI');
        if (!healthBar) {
            healthBar = document.createElement('div');
            healthBar.id = 'healthBarUI';
            healthBar.innerHTML = `
                <div class="health-label">❤️ HEALTH</div>
                <div class="health-bar-bg">
                    <div class="health-bar-fill" id="healthFill"></div>
                </div>
            `;
            healthBar.style.cssText = `
                position: fixed;
                top: 240px;
                left: 20px;
                z-index: 100;
                background: rgba(0,0,0,0.7);
                padding: 10px 15px;
                border-radius: 8px;
                border: 2px solid #ff4444;
            `;
            document.body.appendChild(healthBar);
            
            const style = document.createElement('style');
            style.textContent = `
                .health-label { color: #ff6666; font-size: 12px; font-weight: bold; margin-bottom: 5px; }
                .health-bar-bg { width: 150px; height: 15px; background: #333; border-radius: 8px; overflow: hidden; }
                .health-bar-fill { height: 100%; background: linear-gradient(90deg, #ff4444, #44ff44); transition: width 0.3s; border-radius: 8px; }
            `;
            document.head.appendChild(style);
        }
        
        const fill = document.getElementById('healthFill');
        if (fill) {
            fill.style.width = `${health}%`;
            fill.style.background = health > 50 ? 'linear-gradient(90deg, #44ff44, #88ff88)' : 
                                    health > 25 ? 'linear-gradient(90deg, #ffaa00, #ffcc00)' : 
                                    'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }

    updateMinimap(playerPosition, playerRotation, mapSize = 500) {
        if (!this.minimapCanvas) return;
        
        const ctx = this.minimapCanvas.getContext('2d');
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        ctx.fillStyle = 'rgba(20, 25, 30, 0.95)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = 'rgba(60, 70, 80, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const pos = (i * w) / 4;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(w, pos);
            ctx.stroke();
        }
        
        const scale = w / mapSize;
        const centerX = w / 2;
        const centerY = h / 2;
        const offsetX = -playerPosition.x * scale;
        const offsetZ = -playerPosition.z * scale;
        
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX, 0);
        ctx.lineTo(centerX + offsetX, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, centerY + offsetZ);
        ctx.lineTo(w, centerY + offsetZ);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-playerRotation);
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-6, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', w/2, 12);
    }
}
