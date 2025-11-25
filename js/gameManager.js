/**
 * gameManager.js
 * Oyun yönetimi, skor, para ve görev sistemi
 */

class GameManager {
    constructor() {
        this.score = 0;
        this.money = parseInt(localStorage.getItem('playerMoney')) || 1000;
        this.totalDistance = 0;
        this.topSpeed = 0;
        this.driftScore = 0;
        this.nearMissCount = 0;
        
        // Görevler
        this.missions = [];
        this.activeMission = null;
        this.completedMissions = JSON.parse(localStorage.getItem('completedMissions')) || [];
        
        // Başarımlar
        this.achievements = [];
        this.unlockedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
        
        // Combo sistemi
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        
        this.initMissions();
        this.initAchievements();
        this.createUI();
    }
    
    initMissions() {
        this.missions = [
            {
                id: 'speed_demon',
                name: '🏎️ Hız Canavarı',
                description: '200 km/h hıza ulaş',
                type: 'speed',
                target: 200,
                reward: 500,
                progress: 0
            },
            {
                id: 'distance_runner',
                name: '🛣️ Uzun Yol',
                description: '5 km sür',
                type: 'distance',
                target: 5000,
                reward: 300,
                progress: 0
            },
            {
                id: 'drift_king',
                name: '👑 Drift Kralı',
                description: '1000 drift puanı topla',
                type: 'drift',
                target: 1000,
                reward: 750,
                progress: 0
            },
            {
                id: 'near_miss',
                name: '😱 Kıl Payı',
                description: '10 yakın geçiş yap',
                type: 'nearMiss',
                target: 10,
                reward: 400,
                progress: 0
            },
            {
                id: 'night_rider',
                name: '🌙 Gece Sürücüsü',
                description: 'Gece 2 km sür',
                type: 'nightDistance',
                target: 2000,
                reward: 600,
                progress: 0
            }
        ];
    }
    
    initAchievements() {
        this.achievements = [
            { id: 'first_drive', name: '🚗 İlk Sürüş', description: 'İlk kez araba sür', unlocked: false },
            { id: 'speed_100', name: '💨 Hızlı Başlangıç', description: '100 km/h hıza ulaş', unlocked: false },
            { id: 'speed_200', name: '🚀 Süper Hız', description: '200 km/h hıza ulaş', unlocked: false },
            { id: 'speed_250', name: '⚡ Işık Hızı', description: '250 km/h hıza ulaş', unlocked: false },
            { id: 'drift_master', name: '🎯 Drift Ustası', description: '5000 drift puanı topla', unlocked: false },
            { id: 'rich', name: '💰 Zengin', description: '10000 para biriktir', unlocked: false },
            { id: 'explorer', name: '🗺️ Kaşif', description: '20 km sür', unlocked: false },
            { id: 'combo_king', name: '🔥 Combo Kralı', description: '10x combo yap', unlocked: false }
        ];
        
        // Kaydedilmiş başarımları yükle
        this.unlockedAchievements.forEach(id => {
            const achievement = this.achievements.find(a => a.id === id);
            if (achievement) achievement.unlocked = true;
        });
    }
    
    createUI() {
        // Skor ve para göstergesi
        const scoreUI = document.createElement('div');
        scoreUI.id = 'scoreUI';
        scoreUI.innerHTML = `
            <div class="score-container">
                <div class="money-display">💰 <span id="moneyValue">${this.money}</span></div>
                <div class="score-display">⭐ <span id="scoreValue">0</span></div>
                <div class="combo-display" id="comboDisplay" style="display:none;">
                    <span id="comboValue">1</span>x COMBO!
                </div>
            </div>
            <div class="mission-tracker" id="missionTracker" style="display:none;">
                <div class="mission-name" id="missionName"></div>
                <div class="mission-progress">
                    <div class="mission-bar" id="missionBar"></div>
                </div>
                <div class="mission-text" id="missionText"></div>
            </div>
        `;
        document.body.appendChild(scoreUI);
        
        // Bildirim alanı
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notificationArea';
        document.body.appendChild(notificationArea);
        
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #scoreUI {
                position: fixed;
                top: 80px;
                left: 20px;
                z-index: 100;
                pointer-events: none;
            }
            .score-container {
                background: rgba(0,0,0,0.7);
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-family: 'Segoe UI', sans-serif;
            }
            .money-display, .score-display {
                font-size: 20px;
                font-weight: bold;
                margin: 5px 0;
            }
            .money-display { color: #ffd700; }
            .score-display { color: #00ff88; }
            .combo-display {
                font-size: 24px;
                font-weight: bold;
                color: #ff6b6b;
                animation: pulse 0.5s infinite;
                text-align: center;
                margin-top: 10px;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            .mission-tracker {
                background: rgba(0,0,0,0.8);
                padding: 15px;
                border-radius: 10px;
                margin-top: 10px;
                border: 2px solid #667eea;
            }
            .mission-name {
                color: #667eea;
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 8px;
            }
            .mission-progress {
                background: rgba(255,255,255,0.2);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
            }
            .mission-bar {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                width: 0%;
                transition: width 0.3s;
            }
            .mission-text {
                color: #aaa;
                font-size: 12px;
                margin-top: 5px;
            }
            #notificationArea {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 200;
                pointer-events: none;
            }
            .notification {
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 15px;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                animation: notifyIn 0.3s ease-out, notifyOut 0.3s ease-in 2.7s;
                margin-bottom: 10px;
            }
            .notification.achievement {
                border: 3px solid #ffd700;
                background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(0,0,0,0.9));
            }
            .notification.mission {
                border: 3px solid #00ff88;
                background: linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,0,0,0.9));
            }
            .notification.bonus {
                border: 3px solid #ff6b6b;
            }
            @keyframes notifyIn {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes notifyOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    
    update(player, gameMap, deltaTime) {
        if (!player || !player.body) return;
        
        const speed = player.getSpeed();
        const isDrifting = player.isDrifting;
        const isNight = gameMap && (gameMap.gameTime < 6 || gameMap.gameTime > 18);
        
        // Mesafe hesapla
        const velocity = player.body.velocity;
        const distance = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) * deltaTime;
        this.totalDistance += distance;
        
        // En yüksek hız
        if (speed > this.topSpeed) {
            this.topSpeed = speed;
            this.checkSpeedAchievements(speed);
        }
        
        // Drift puanı
        if (isDrifting && speed > 30) {
            const driftPoints = Math.floor(speed * 0.1 * this.comboMultiplier);
            this.driftScore += driftPoints;
            this.addScore(driftPoints);
            this.extendCombo();
        }
        
        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        // Görev ilerlemesi
        this.updateMissionProgress(speed, distance, isDrifting, isNight);
        
        // UI güncelle
        this.updateUI();
    }
    
    updateMissionProgress(speed, distance, isDrifting, isNight) {
        if (!this.activeMission) {
            // Rastgele görev seç
            const availableMissions = this.missions.filter(m => 
                !this.completedMissions.includes(m.id)
            );
            if (availableMissions.length > 0) {
                this.activeMission = availableMissions[Math.floor(Math.random() * availableMissions.length)];
                this.showMissionTracker();
            }
            return;
        }
        
        const mission = this.activeMission;
        
        switch (mission.type) {
            case 'speed':
                if (speed > mission.progress) {
                    mission.progress = speed;
                }
                break;
            case 'distance':
                mission.progress += distance;
                break;
            case 'drift':
                if (isDrifting) {
                    mission.progress += speed * 0.01;
                }
                break;
            case 'nearMiss':
                mission.progress = this.nearMissCount;
                break;
            case 'nightDistance':
                if (isNight) {
                    mission.progress += distance;
                }
                break;
        }
        
        // Görev tamamlandı mı?
        if (mission.progress >= mission.target) {
            this.completeMission(mission);
        }
    }
    
    completeMission(mission) {
        this.showNotification(`🎉 GÖREV TAMAMLANDI!\n${mission.name}\n+${mission.reward} 💰`, 'mission');
        this.addMoney(mission.reward);
        this.addScore(mission.reward * 2);
        
        this.completedMissions.push(mission.id);
        localStorage.setItem('completedMissions', JSON.stringify(this.completedMissions));
        
        this.activeMission = null;
        document.getElementById('missionTracker').style.display = 'none';
    }
    
    showMissionTracker() {
        const tracker = document.getElementById('missionTracker');
        const mission = this.activeMission;
        
        if (tracker && mission) {
            tracker.style.display = 'block';
            document.getElementById('missionName').textContent = mission.name;
            document.getElementById('missionText').textContent = mission.description;
        }
    }
    
    addScore(points) {
        this.score += Math.floor(points * this.comboMultiplier);
    }
    
    addMoney(amount) {
        this.money += amount;
        localStorage.setItem('playerMoney', this.money);
    }
    
    extendCombo() {
        this.combo++;
        this.comboTimer = 2; // 2 saniye
        this.comboMultiplier = Math.min(1 + this.combo * 0.1, 5); // Max 5x
        
        if (this.combo >= 10) {
            this.unlockAchievement('combo_king');
        }
        
        const comboDisplay = document.getElementById('comboDisplay');
        if (comboDisplay) {
            comboDisplay.style.display = 'block';
            document.getElementById('comboValue').textContent = this.comboMultiplier.toFixed(1);
        }
    }
    
    resetCombo() {
        this.combo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        const comboDisplay = document.getElementById('comboDisplay');
        if (comboDisplay) {
            comboDisplay.style.display = 'none';
        }
    }
    
    checkSpeedAchievements(speed) {
        if (speed >= 100) this.unlockAchievement('speed_100');
        if (speed >= 200) this.unlockAchievement('speed_200');
        if (speed >= 250) this.unlockAchievement('speed_250');
    }
    
    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.unlockedAchievements.push(id);
            localStorage.setItem('achievements', JSON.stringify(this.unlockedAchievements));
            
            this.showNotification(`🏆 BAŞARIM!\n${achievement.name}\n${achievement.description}`, 'achievement');
            this.addMoney(100);
        }
    }
    
    registerNearMiss() {
        this.nearMissCount++;
        this.addScore(50 * this.comboMultiplier);
        this.extendCombo();
        this.showNotification('😱 KIL PAYI! +50', 'bonus');
    }
    
    showNotification(text, type = '') {
        const area = document.getElementById('notificationArea');
        if (!area) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = text.replace(/\n/g, '<br>');
        area.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    updateUI() {
        const moneyEl = document.getElementById('moneyValue');
        const scoreEl = document.getElementById('scoreValue');
        const missionBar = document.getElementById('missionBar');
        
        if (moneyEl) moneyEl.textContent = this.money.toLocaleString();
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        
        if (missionBar && this.activeMission) {
            const progress = (this.activeMission.progress / this.activeMission.target) * 100;
            missionBar.style.width = `${Math.min(progress, 100)}%`;
        }
        
        // Para başarımı
        if (this.money >= 10000) {
            this.unlockAchievement('rich');
        }
        
        // Kaşif başarımı
        if (this.totalDistance >= 20000) {
            this.unlockAchievement('explorer');
        }
        
        // Drift ustası
        if (this.driftScore >= 5000) {
            this.unlockAchievement('drift_master');
        }
    }
    
    getStats() {
        return {
            score: this.score,
            money: this.money,
            topSpeed: Math.round(this.topSpeed),
            totalDistance: Math.round(this.totalDistance),
            driftScore: Math.round(this.driftScore),
            nearMissCount: this.nearMissCount,
            achievements: this.unlockedAchievements.length,
            missions: this.completedMissions.length
        };
    }
    
    saveStats() {
        const stats = {
            score: this.score,
            topSpeed: Math.round(this.topSpeed),
            totalDistance: Math.round(this.totalDistance),
            driftScore: Math.round(this.driftScore)
        };
        
        // Mevcut istatistiklerle birleştir
        const existingStats = JSON.parse(localStorage.getItem('gameStats')) || {};
        const mergedStats = {
            score: Math.max(existingStats.score || 0, stats.score),
            topSpeed: Math.max(existingStats.topSpeed || 0, stats.topSpeed),
            totalDistance: (existingStats.totalDistance || 0) + stats.totalDistance,
            driftScore: (existingStats.driftScore || 0) + stats.driftScore
        };
        
        localStorage.setItem('gameStats', JSON.stringify(mergedStats));
    }
}

// Global instance
let gameManager = null;

// Sayfa kapanırken istatistikleri kaydet
window.addEventListener('beforeunload', () => {
    if (gameManager) {
        gameManager.saveStats();
    }
});
