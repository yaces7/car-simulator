/**
 * ui.js
 * Gerçekçi araba gösterge paneli - İbreli hız göstergesi
 */

class UI {
    constructor() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.speedometerCanvas = null;
        this.maxSpeed = 280;
        
        this.createSpeedometer();
    }
    
    createSpeedometer() {
        // Eski speedometer'ı kaldır
        const oldSpeedometer = document.querySelector('.speedometer');
        if (oldSpeedometer) {
            oldSpeedometer.remove();
        }
        
        // Yeni canvas tabanlı speedometer
        const container = document.createElement('div');
        container.id = 'speedometerContainer';
        container.innerHTML = `
            <canvas id="speedometerCanvas" width="220" height="140"></canvas>
            <div id="digitalSpeed">0</div>
            <div id="gearIndicator">1</div>
            <div id="fuelGauge">
                <div id="fuelLabel">FUEL</div>
                <div id="fuelBar"><div id="fuelFill"></div></div>
            </div>
        `;
        document.getElementById('hud').appendChild(container);
        
        this.speedometerCanvas = document.getElementById('speedometerCanvas');
        this.digitalSpeed = document.getElementById('digitalSpeed');
        this.gearIndicator = document.getElementById('gearIndicator');
        this.fuelFill = document.getElementById('fuelFill');
        
        this.addSpeedometerStyles();
        this.drawSpeedometerBase();
    }
    
    addSpeedometerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #speedometerContainer {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 220px;
                height: 180px;
                z-index: 100;
            }
            #speedometerCanvas {
                position: absolute;
                bottom: 40px;
                right: 0;
            }
            #digitalSpeed {
                position: absolute;
                bottom: 55px;
                right: 85px;
                font-size: 32px;
                font-weight: bold;
                color: #00ff88;
                font-family: 'Courier New', monospace;
                text-shadow: 0 0 10px #00ff88;
            }
            #gearIndicator {
                position: absolute;
                bottom: 25px;
                right: 95px;
                font-size: 28px;
                font-weight: bold;
                color: #ff6b6b;
                font-family: 'Arial Black', sans-serif;
                text-shadow: 0 0 8px #ff6b6b;
            }
            #fuelGauge {
                position: absolute;
                bottom: 5px;
                right: 20px;
                width: 180px;
            }
            #fuelLabel {
                color: #ffd700;
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            #fuelBar {
                width: 100%;
                height: 12px;
                background: rgba(0,0,0,0.7);
                border-radius: 6px;
                border: 2px solid #444;
                overflow: hidden;
            }
            #fuelFill {
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, #ff4444 0%, #ffaa00 30%, #00ff88 60%, #00ff88 100%);
                transition: width 0.3s;
                border-radius: 4px;
            }
            /* Eski speedometer'ı gizle */
            .speedometer { display: none !important; }
            .nitro-bar { display: none !important; }
        `;
        document.head.appendChild(style);
    }
    
    drawSpeedometerBase() {
        if (!this.speedometerCanvas) return;
        
        const ctx = this.speedometerCanvas.getContext('2d');
        const w = this.speedometerCanvas.width;
        const h = this.speedometerCanvas.height;
        const centerX = w / 2;
        const centerY = h - 10;
        const radius = 95;
        
        // Arka plan
        ctx.clearRect(0, 0, w, h);
        
        // Dış halka
        const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius + 5);
        gradient.addColorStop(0, 'rgba(20, 25, 35, 0.95)');
        gradient.addColorStop(1, 'rgba(10, 15, 20, 0.98)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
        ctx.lineTo(centerX + radius, centerY);
        ctx.arc(centerX, centerY, radius - 25, 0, Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Kenar
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Hız işaretleri
        const startAngle = Math.PI;
        const endAngle = 0;
        const speedMarks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
        
        speedMarks.forEach(speed => {
            const angle = startAngle + (speed / this.maxSpeed) * (endAngle - startAngle);
            const innerR = radius - 22;
            const outerR = speed % 40 === 0 ? radius - 8 : radius - 14;
            
            const x1 = centerX + Math.cos(angle) * innerR;
            const y1 = centerY + Math.sin(angle) * innerR;
            const x2 = centerX + Math.cos(angle) * outerR;
            const y2 = centerY + Math.sin(angle) * outerR;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = speed >= 200 ? '#ff4444' : '#888';
            ctx.lineWidth = speed % 40 === 0 ? 3 : 1;
            ctx.stroke();
            
            // Sayılar (her 40'ta bir)
            if (speed % 40 === 0) {
                const textR = radius - 35;
                const tx = centerX + Math.cos(angle) * textR;
                const ty = centerY + Math.sin(angle) * textR;
                
                ctx.fillStyle = speed >= 200 ? '#ff6666' : '#aaa';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(speed.toString(), tx, ty);
            }
        });
        
        // KM/H yazısı
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('km/h', centerX, centerY - 25);
    }
    
    updateSpeed(speed) {
        if (!this.speedometerCanvas) return;
        
        const ctx = this.speedometerCanvas.getContext('2d');
        const w = this.speedometerCanvas.width;
        const h = this.speedometerCanvas.height;
        const centerX = w / 2;
        const centerY = h - 10;
        const radius = 95;
        
        // Tabanı yeniden çiz
        this.drawSpeedometerBase();
        
        // İbre açısı hesapla
        const clampedSpeed = Math.min(Math.max(speed, 0), this.maxSpeed);
        const startAngle = Math.PI;
        const endAngle = 0;
        const needleAngle = startAngle + (clampedSpeed / this.maxSpeed) * (endAngle - startAngle);
        
        // İbre gölgesi
        ctx.save();
        ctx.translate(centerX + 2, centerY + 2);
        ctx.rotate(needleAngle - Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(-3, 10);
        ctx.lineTo(0, -radius + 35);
        ctx.lineTo(3, 10);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.restore();
        
        // İbre
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(needleAngle - Math.PI / 2);
        
        // İbre gövdesi
        const needleGradient = ctx.createLinearGradient(0, -radius + 35, 0, 15);
        needleGradient.addColorStop(0, '#ff3333');
        needleGradient.addColorStop(0.7, '#ff6666');
        needleGradient.addColorStop(1, '#aa2222');
        
        ctx.beginPath();
        ctx.moveTo(-2.5, 12);
        ctx.lineTo(-1, -radius + 38);
        ctx.lineTo(1, -radius + 38);
        ctx.lineTo(2.5, 12);
        ctx.closePath();
        ctx.fillStyle = needleGradient;
        ctx.fill();
        ctx.strokeStyle = '#ff8888';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.restore();
        
        // Merkez kapak
        const capGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 12);
        capGradient.addColorStop(0, '#555');
        capGradient.addColorStop(0.5, '#333');
        capGradient.addColorStop(1, '#222');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fillStyle = capGradient;
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dijital hız
        if (this.digitalSpeed) {
            this.digitalSpeed.textContent = Math.round(speed);
        }
    }
    
    updateGear(gear) {
        if (this.gearIndicator) {
            if (gear === 0) {
                this.gearIndicator.textContent = 'N';
                this.gearIndicator.style.color = '#ffff00';
            } else if (gear === -1) {
                this.gearIndicator.textContent = 'R';
                this.gearIndicator.style.color = '#ff4444';
            } else {
                this.gearIndicator.textContent = gear;
                this.gearIndicator.style.color = '#00ff88';
            }
        }
    }
    
    updateFuel(fuelPercent) {
        if (this.fuelFill) {
            this.fuelFill.style.width = `${fuelPercent}%`;
            
            // Düşük yakıt uyarısı
            if (fuelPercent < 20) {
                this.fuelFill.style.animation = 'fuelBlink 0.5s infinite';
            } else {
                this.fuelFill.style.animation = 'none';
            }
        }
    }
    
    updateRPM(rpm, maxRPM = 8000) {
        // RPM göstergesi için ileride eklenebilir
    }

    updateMinimap(playerPosition, playerRotation, mapSize = 500) {
        if (!this.minimapCanvas) return;
        
        const ctx = this.minimapCanvas.getContext('2d');
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Arka plan
        ctx.fillStyle = 'rgba(20, 25, 30, 0.95)';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
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
        
        // Yollar
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
        
        // Oyuncu
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
        
        // Pusula
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', w/2, 12);
    }
}

// Yakıt uyarı animasyonu
const fuelBlinkStyle = document.createElement('style');
fuelBlinkStyle.textContent = `
    @keyframes fuelBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
`;
document.head.appendChild(fuelBlinkStyle);
