/**
 * mobileControls.js
 * Mobil dokunmatik kontroller - Araba ve Karakter modu
 */

class MobileControls {
    constructor(player) {
        this.player = player;
        this.character = null;
        this.active = false;
        this.mode = 'vehicle'; // 'vehicle' veya 'character'
        
        // Joystick
        this.joystickBase = null;
        this.joystickStick = null;
        this.joystickActive = false;
        
        this.init();
    }
    
    init() {
        const controlMode = localStorage.getItem('controlMode') || 'auto';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('force-show', 'force-hide');
            
            if (controlMode === 'mobile') {
                mobileControls.classList.add('force-show');
                mobileControls.style.display = 'block';
                this.active = true;
            } else if (controlMode === 'desktop') {
                mobileControls.classList.add('force-hide');
                mobileControls.style.display = 'none';
                this.active = false;
            } else {
                if (isMobile || isTouchDevice) {
                    mobileControls.style.display = 'block';
                    this.active = true;
                } else {
                    mobileControls.style.display = 'none';
                    this.active = false;
                }
            }
        }
        
        if (!this.active) return;
        
        // Joystick
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickStick = document.getElementById('leftStick');
        
        if (this.joystickBase && this.joystickStick) {
            this.setupJoystick();
        }
        
        // Araba butonları
        this.setupButton('forwardBtn', 'forward');
        this.setupButton('reverseBtn', 'backward');
        this.setupButton('brakeBtn', 'brake');
        this.setupButton('nitroBtn', 'nitro');
        
        // Varsayılan olarak araba modunda başla
        this.setMode('vehicle');
    }
    
    setCharacter(char) {
        this.character = char;
    }
    
    // Mod değiştir - araba veya karakter
    setMode(mode) {
        this.mode = mode;
        
        // Araba butonları
        const vehicleButtons = ['forwardBtn', 'reverseBtn', 'brakeBtn', 'nitroBtn'];
        // Karakter butonları (sadece in/bin)
        const exitBtn = document.getElementById('exitVehicleBtn');
        
        if (mode === 'vehicle') {
            // Araba modu - tüm butonları göster
            vehicleButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'flex';
            });
            if (exitBtn) {
                exitBtn.querySelector('span').textContent = '🚶';
                exitBtn.querySelector('small').textContent = 'İN';
            }
        } else {
            // Karakter modu - sadece in/bin butonu
            vehicleButtons.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'none';
            });
            if (exitBtn) {
                exitBtn.querySelector('span').textContent = '🚗';
                exitBtn.querySelector('small').textContent = 'BİN';
            }
        }
        
        console.log('Mobil kontrol modu:', mode);
    }

    
    setupJoystick() {
        let startX = 0, startY = 0;
        
        const onStart = (e) => {
            e.preventDefault();
            this.joystickActive = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = this.joystickBase.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        };
        
        const onMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            
            const maxDist = 65;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * maxDist;
                dy = Math.sin(angle) * maxDist;
            }
            
            this.joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            
            const normalizedX = dx / maxDist;
            const normalizedY = dy / maxDist;
            
            if (this.mode === 'vehicle') {
                // Araba kontrolü - sadece sağ/sol
                if (this.player && this.player.controls) {
                    this.player.controls.left = normalizedX < -0.25;
                    this.player.controls.right = normalizedX > 0.25;
                }
            } else {
                // Karakter kontrolü - 4 yön
                if (this.character && this.character.controls) {
                    this.character.controls.forward = normalizedY < -0.25;
                    this.character.controls.backward = normalizedY > 0.25;
                    this.character.controls.left = normalizedX < -0.25;
                    this.character.controls.right = normalizedX > 0.25;
                    this.character.controls.run = dist > maxDist * 0.8; // Hızlı hareket = koşma
                }
            }
        };
        
        const onEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickStick.style.transform = 'translate(-50%, -50%)';
            
            if (this.mode === 'vehicle') {
                if (this.player && this.player.controls) {
                    this.player.controls.left = false;
                    this.player.controls.right = false;
                }
            } else {
                if (this.character && this.character.controls) {
                    this.character.controls.forward = false;
                    this.character.controls.backward = false;
                    this.character.controls.left = false;
                    this.character.controls.right = false;
                    this.character.controls.run = false;
                }
            }
        };
        
        this.joystickBase.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd, { passive: false });
        document.addEventListener('touchcancel', onEnd, { passive: false });
        
        this.joystickBase.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', (e) => { if (this.joystickActive) onMove(e); });
        document.addEventListener('mouseup', onEnd);
    }
    
    setupButton(buttonId, controlName) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        const activate = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.player && this.player.controls) {
                this.player.controls[controlName] = true;
            }
            btn.classList.add('active');
        };
        
        const deactivate = (e) => {
            e.preventDefault();
            if (this.player && this.player.controls) {
                this.player.controls[controlName] = false;
            }
            btn.classList.remove('active');
        };
        
        btn.addEventListener('touchstart', activate, { passive: false });
        btn.addEventListener('touchend', deactivate, { passive: false });
        btn.addEventListener('touchcancel', deactivate, { passive: false });
        btn.addEventListener('mousedown', activate);
        btn.addEventListener('mouseup', deactivate);
        btn.addEventListener('mouseleave', deactivate);
    }
}

// Global instance
let mobileControlsInstance = null;
