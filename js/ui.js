// UI Management - HTML'deki HUD elementlerini kullanır
class UI {
    constructor() {
        this.speedElement = document.getElementById('speedValue');
        this.gearElement = document.querySelector('.gear-value') || this.createGearElement();
        this.rpmElement = document.querySelector('.rpm-value') || this.createRPMElement();
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.nitroFill = document.getElementById('nitroFill');
    }
    
    createGearElement() {
        // Gear göstergesi yoksa oluştur
        return null;
    }
    
    createRPMElement() {
        // RPM göstergesi yoksa oluştur
        return null;
    }

    updateSpeed(speed) {
        if (this.speedElement) {
            this.speedElement.textContent = Math.round(speed);
        }
    }

    updateGear(gear) {
        if (this.gearElement) {
            if (gear === 0) {
                this.gearElement.textContent = 'N';
            } else if (gear === -1) {
                this.gearElement.textContent = 'R';
            } else {
                this.gearElement.textContent = gear;
            }
        }
    }

    updateRPM(rpm, maxRPM = 8000) {
        if (this.rpmElement) {
            this.rpmElement.textContent = Math.round(rpm);
        }
        
        // Nitro bar'ı RPM olarak kullan
        if (this.nitroFill) {
            const percentage = Math.min((rpm / maxRPM) * 100, 100);
            this.nitroFill.style.width = `${percentage}%`;
        }
    }

    updateMinimap(playerPosition, playerRotation, mapSize = 1000) {
        if (!this.minimapCanvas) return;
        
        const ctx = this.minimapCanvas.getContext('2d');
        ctx.clearRect(0, 0, 200, 200);
        
        // Harita arka planı
        ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
        ctx.fillRect(0, 0, 200, 200);
        
        // Grid çiz
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const pos = (i * 200) / 4;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, 200);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(200, pos);
            ctx.stroke();
        }
        
        // Yolları çiz
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 4;
        // Kuzey-Güney yolu
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(100, 200);
        ctx.stroke();
        // Doğu-Batı yolu
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(200, 100);
        ctx.stroke();
        
        // Oyuncu pozisyonu
        const scale = 200 / mapSize;
        const x = (playerPosition.x * scale) + 100;
        const y = (playerPosition.z * scale) + 100;
        
        // Oyuncu yön göstergesi
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-playerRotation);
        
        // Oyuncu üçgeni
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-5, 5);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();
        
        // Kenar çizgisi
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    updateNitro(nitroAmount) {
        if (this.nitroFill) {
            this.nitroFill.style.width = `${nitroAmount}%`;
        }
    }
}
