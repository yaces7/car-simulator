/**
 * mobileControls.js
 * Mobil dokunmatik kontroller
 */

class MobileControls {
    constructor(player) {
        this.player = player;
        this.active = false;
        
        // Joystick
        this.joystickBase = null;
        this.joystickStick = null;
        this.joystickActive = false;
        this.joystickStartPos = { x: 0, y: 0 };
        this.joystickCurrentPos = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Kontrol modu kontrolü
        const controlMode = localStorage.getItem('controlMode') || 'auto';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Mobil kontrolleri göster/gizle
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            // Önceki class'ları temizle
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
                // Auto mod - cihaza göre karar ver
                if (isMobile || isTouchDevice) {
                    mobileControls.style.display = 'block';
                    this.active = true;
                } else {
                    mobileControls.style.display = 'none';
                    this.active = false;
                }
            }
            console.log('Kontrol modu:', controlMode, 'Mobil aktif:', this.active);
        }
        
        // Mobil mod seçiliyse her zaman aktif et
        if (controlMode === 'mobile') {
            this.active = true;
        }
        
        if (!this.active) return;
        
        // Joystick
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickStick = document.getElementById('leftStick');
        
        if (this.joystickBase && this.joystickStick) {
            this.setupJoystick();
        }
        
        // Butonlar
        this.setupButton('forwardBtn', 'forward');
        this.setupButton('reverseBtn', 'backward');
        this.setupButton('brakeBtn', 'brake');
        this.setupButton('nitroBtn', 'nitro');
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
            
            // Maksimum mesafe - BÜYÜTÜLDÜ
            const maxDist = 65;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * maxDist;
                dy = Math.sin(angle) * maxDist;
            }
            
            // Stick'i hareket ettir
            this.joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            
            // Kontrolleri güncelle - daha hassas
            const normalizedX = dx / maxDist;
            if (this.player && this.player.controls) {
                this.player.controls.left = normalizedX < -0.25;
                this.player.controls.right = normalizedX > 0.25;
            }
        };
        
        const onEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickStick.style.transform = 'translate(-50%, -50%)';
            
            if (this.player && this.player.controls) {
                this.player.controls.left = false;
                this.player.controls.right = false;
            }
        };
        
        // Touch events
        this.joystickBase.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd, { passive: false });
        document.addEventListener('touchcancel', onEnd, { passive: false });
        
        // Mouse events (test için)
        this.joystickBase.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', (e) => { if (this.joystickActive) onMove(e); });
        document.addEventListener('mouseup', onEnd);
    }
    
    setupButton(buttonId, controlName) {
        const btn = document.getElementById(buttonId);
        if (!btn) {
            console.warn(`Buton bulunamadı: ${buttonId}`);
            return;
        }
        
        const activate = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.player && this.player.controls) {
                this.player.controls[controlName] = true;
                console.log(`${controlName} aktif`);
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
        
        // Touch events
        btn.addEventListener('touchstart', activate, { passive: false });
        btn.addEventListener('touchend', deactivate, { passive: false });
        btn.addEventListener('touchcancel', deactivate, { passive: false });
        
        // Mouse events (test için)
        btn.addEventListener('mousedown', activate);
        btn.addEventListener('mouseup', deactivate);
        btn.addEventListener('mouseleave', deactivate);
    }
}
