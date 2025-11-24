// UI Management
class UI {
    constructor() {
        this.speedElement = null;
        this.gearElement = null;
        this.rpmElement = null;
        this.minimap = null;
        this.init();
    }

    init() {
        this.createSpeedometer();
        this.createGearIndicator();
        this.createRPMGauge();
        this.createMinimap();
    }

    createSpeedometer() {
        const speedometer = document.createElement('div');
        speedometer.id = 'speedometer';
        speedometer.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            min-width: 150px;
        `;
        
        this.speedElement = document.createElement('div');
        this.speedElement.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            text-align: center;
        `;
        this.speedElement.textContent = '0';
        
        const kmhLabel = document.createElement('div');
        kmhLabel.textContent = 'km/h';
        kmhLabel.style.cssText = `
            font-size: 16px;
            text-align: center;
            margin-top: 5px;
        `;
        
        speedometer.appendChild(this.speedElement);
        speedometer.appendChild(kmhLabel);
        document.body.appendChild(speedometer);
    }

    createGearIndicator() {
        const gearBox = document.createElement('div');
        gearBox.id = 'gearbox';
        gearBox.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 210px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            min-width: 80px;
        `;
        
        const gearLabel = document.createElement('div');
        gearLabel.textContent = 'GEAR';
        gearLabel.style.cssText = `
            font-size: 14px;
            text-align: center;
            margin-bottom: 5px;
        `;
        
        this.gearElement = document.createElement('div');
        this.gearElement.style.cssText = `
            font-size: 36px;
            font-weight: bold;
            text-align: center;
        `;
        this.gearElement.textContent = 'N';
        
        gearBox.appendChild(gearLabel);
        gearBox.appendChild(this.gearElement);
        document.body.appendChild(gearBox);
    }

    createRPMGauge() {
        const rpmBox = document.createElement('div');
        rpmBox.id = 'rpm';
        rpmBox.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 320px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            min-width: 120px;
        `;
        
        const rpmLabel = document.createElement('div');
        rpmLabel.textContent = 'RPM';
        rpmLabel.style.cssText = `
            font-size: 14px;
            text-align: center;
            margin-bottom: 5px;
        `;
        
        this.rpmElement = document.createElement('div');
        this.rpmElement.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            text-align: center;
        `;
        this.rpmElement.textContent = '0';
        
        const rpmBar = document.createElement('div');
        rpmBar.id = 'rpm-bar';
        rpmBar.style.cssText = `
            width: 100%;
            height: 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            margin-top: 10px;
            overflow: hidden;
        `;
        
        this.rpmBarFill = document.createElement('div');
        this.rpmBarFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(to right, #00ff00, #ffff00, #ff0000);
            transition: width 0.1s;
        `;
        
        rpmBar.appendChild(this.rpmBarFill);
        rpmBox.appendChild(rpmLabel);
        rpmBox.appendChild(this.rpmElement);
        rpmBox.appendChild(rpmBar);
        document.body.appendChild(rpmBox);
    }

    createMinimap() {
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'minimap';
        minimapContainer.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            width: 200px;
            height: 200px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid white;
            border-radius: 10px;
        `;
        
        this.minimap = document.createElement('canvas');
        this.minimap.width = 200;
        this.minimap.height = 200;
        this.minimap.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 8px;
        `;
        
        minimapContainer.appendChild(this.minimap);
        document.body.appendChild(minimapContainer);
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
        if (this.rpmBarFill) {
            const percentage = (rpm / maxRPM) * 100;
            this.rpmBarFill.style.width = `${Math.min(percentage, 100)}%`;
            
            // Change color based on RPM
            if (percentage > 90) {
                this.rpmBarFill.style.background = '#ff0000';
            } else if (percentage > 70) {
                this.rpmBarFill.style.background = 'linear-gradient(to right, #ffff00, #ff0000)';
            } else {
                this.rpmBarFill.style.background = 'linear-gradient(to right, #00ff00, #ffff00, #ff0000)';
            }
        }
    }

    updateMinimap(playerPosition, playerRotation, mapSize = 1000) {
        if (!this.minimap) return;
        
        const ctx = this.minimap.getContext('2d');
        ctx.clearRect(0, 0, 200, 200);
        
        // Draw map background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(0, 0, 200, 200);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
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
        
        // Draw player position
        const scale = 200 / mapSize;
        const x = (playerPosition.x * scale) + 100;
        const y = (playerPosition.z * scale) + 100;
        
        // Draw player direction indicator
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-playerRotation);
        
        // Player triangle
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-6, 6);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}
