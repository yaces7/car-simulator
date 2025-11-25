/**
 * tuning.js
 * Araç tuning ve yükseltme sistemi
 */

class TuningSystem {
    constructor() {
        this.upgrades = {
            engine: { level: 0, maxLevel: 5, baseCost: 1000 },
            turbo: { level: 0, maxLevel: 3, baseCost: 2000 },
            suspension: { level: 0, maxLevel: 4, baseCost: 800 },
            brakes: { level: 0, maxLevel: 4, baseCost: 600 },
            tires: { level: 0, maxLevel: 3, baseCost: 400 },
            nitro: { level: 0, maxLevel: 5, baseCost: 1500 }
        };
        
        this.loadUpgrades();
    }
    
    loadUpgrades() {
        const saved = localStorage.getItem('carUpgrades');
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(this.upgrades).forEach(key => {
                if (data[key]) {
                    this.upgrades[key].level = data[key].level || 0;
                }
            });
        }
    }
    
    saveUpgrades() {
        const data = {};
        Object.keys(this.upgrades).forEach(key => {
            data[key] = { level: this.upgrades[key].level };
        });
        localStorage.setItem('carUpgrades', JSON.stringify(data));
    }
    
    getUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        if (!upgrade || upgrade.level >= upgrade.maxLevel) return null;
        return Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.level));
    }
    
    canUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return upgrade && upgrade.level < upgrade.maxLevel;
    }
    
    purchaseUpgrade(upgradeType) {
        if (!this.canUpgrade(upgradeType)) return false;
        
        const cost = this.getUpgradeCost(upgradeType);
        let money = parseInt(localStorage.getItem('playerMoney')) || 0;
        
        if (money >= cost) {
            money -= cost;
            localStorage.setItem('playerMoney', money);
            this.upgrades[upgradeType].level++;
            this.saveUpgrades();
            return true;
        }
        return false;
    }
    
    applyUpgrades(carStats) {
        const modified = { ...carStats };
        
        // Motor - max hız ve ivme
        const engineBonus = this.upgrades.engine.level * 0.15;
        modified.maxSpeed *= (1 + engineBonus);
        modified.acceleration *= (1 + engineBonus * 0.8);
        
        // Turbo - ivme
        const turboBonus = this.upgrades.turbo.level * 0.25;
        modified.acceleration *= (1 + turboBonus);
        
        // Süspansiyon - yol tutuş
        const suspensionBonus = this.upgrades.suspension.level * 0.2;
        modified.handling *= (1 + suspensionBonus);
        
        // Frenler
        const brakeBonus = this.upgrades.brakes.level * 0.2;
        modified.braking *= (1 + brakeBonus);
        
        // Lastikler
        const tireBonus = this.upgrades.tires.level * 0.15;
        modified.handling *= (1 + tireBonus);
        modified.braking *= (1 + tireBonus * 0.5);
        
        return modified;
    }
    
    getNitroCapacity() {
        return 100 + (this.upgrades.nitro.level * 20);
    }
    
    getNitroRegenRate() {
        return 5 + (this.upgrades.nitro.level * 2);
    }
    
    getUpgradeInfo(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        const cost = this.getUpgradeCost(upgradeType);
        
        const descriptions = {
            engine: '🔧 Motor',
            turbo: '💨 Turbo',
            suspension: '🏎️ Süspansiyon',
            brakes: '🛑 Frenler',
            tires: '🛞 Lastikler',
            nitro: '🚀 Nitro'
        };
        
        return {
            name: descriptions[upgradeType] || upgradeType,
            level: upgrade.level,
            maxLevel: upgrade.maxLevel,
            cost: cost,
            canUpgrade: this.canUpgrade(upgradeType)
        };
    }
    
    showTuningUI() {
        let tuningUI = document.getElementById('tuningUI');
        if (!tuningUI) {
            tuningUI = document.createElement('div');
            tuningUI.id = 'tuningUI';
            tuningUI.style.cssText = `
                display: none;
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.85);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            `;
            document.body.appendChild(tuningUI);
        }
        
        const money = parseInt(localStorage.getItem('playerMoney')) || 0;
        
        let html = `
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); border: 3px solid #3498db; border-radius: 20px; padding: 30px; max-width: 500px; color: white;">
                <h2 style="text-align: center; color: #3498db; margin-bottom: 20px;">🔧 ARAÇ TUNİNG</h2>
                <div style="text-align: center; font-size: 20px; color: #f1c40f; margin-bottom: 20px;">💰 ${money.toLocaleString()}</div>
                <div id="upgradesList">
        `;
        
        Object.keys(this.upgrades).forEach(type => {
            const info = this.getUpgradeInfo(type);
            const canBuy = info.canUpgrade && money >= info.cost;
            
            html += `
                <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold;">${info.name}</div>
                        <div style="font-size: 12px; color: #bdc3c7;">Seviye: ${info.level}/${info.maxLevel}</div>
                    </div>
                    <button onclick="purchaseUpgrade('${type}')" 
                            style="background: ${canBuy ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : '#7f8c8d'}; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-weight: bold;"
                            ${!canBuy ? 'disabled' : ''}>
                        ${info.canUpgrade ? `${info.cost?.toLocaleString() || 'MAX'} 💰` : 'MAX'}
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
                <button onclick="closeTuning()" style="background: #e74c3c; border: none; color: white; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 20px;">❌ Kapat</button>
            </div>
        `;
        
        tuningUI.innerHTML = html;
        tuningUI.style.display = 'flex';
    }
}

let tuningSystem = null;

function openTuning() {
    if (!tuningSystem) {
        tuningSystem = new TuningSystem();
    }
    tuningSystem.showTuningUI();
}

function closeTuning() {
    const tuningUI = document.getElementById('tuningUI');
    if (tuningUI) tuningUI.style.display = 'none';
}

function purchaseUpgrade(upgradeType) {
    if (tuningSystem && tuningSystem.purchaseUpgrade(upgradeType)) {
        tuningSystem.showTuningUI();
        if (typeof gameManager !== 'undefined' && gameManager) {
            gameManager.showNotification('🔧 Yükseltme alındı!', 'achievement');
        }
        if (typeof audioManager !== 'undefined' && audioManager) {
            audioManager.playSound('coin');
        }
    }
}
