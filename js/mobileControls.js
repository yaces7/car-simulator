// Mobil Kontroller
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
        // Mobil cihaz kontrolü - daha geniş algılama
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 1024;
        
        // Mobil kontrolleri göster
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls && (isMobile || isTouchDevice || isSmallScreen)) {
            mobileControls.style.display = 'block';
            this.active = true;
        }
        
        if (!this.active) return;
        
        // Joystick elementleri
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickStick = document.getElementById('leftStick');
        
        if (this.joystickBase && this.joystickStick) {
            this.setupJoystick();
        }
        
        // Buton elementleri
        this.setupButtons();
        
        console.log('Mobil kontroller aktif');
    }
    
    setupJoystick() {
        const handleStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.joystickActive = true;
            const rect = this.joystickBase.getBoundingClientRect();
            this.joystickStartPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };
        
        const handleMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - this.joystickStartPos.x;
            const deltaY = touch.clientY - this.joystickStartPos.y;
            
            // Maksimum mesafe
            const maxDistance = 50;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                this.joystickCurrentPos.x = Math.cos(angle) * maxDistance;
                this.joystickCurrentPos.y = Math.sin(angle) * maxDistance;
            } else {
                this.joystickCurrentPos.x = deltaX;
                this.joystickCurrentPos.y = deltaY;
            }
            
            // Stick pozisyonunu güncelle
            if (this.joystickStick) {
                this.joystickStick.style.transform = 
                    `translate(calc(-50% + ${this.joystickCurrentPos.x}px), calc(-50% + ${this.joystickCurrentPos.y}px))`;
            }
            
            // Oyuncu kontrollerini güncelle
            this.updatePlayerControls();
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickCurrentPos = { x: 0, y: 0 };
            
            if (this.joystickStick) {
                this.joystickStick.style.transform = 'translate(-50%, -50%)';
            }
            
            if (this.player && this.player.controls) {
                this.player.controls.left = false;
                this.player.controls.right = false;
            }
        };
        
        // Touch events
        this.joystickBase.addEventListener('touchstart', handleStart, { passive: false });
        this.joystickBase.addEventListener('touchmove', handleMove, { passive: false });
        this.joystickBase.addEventListener('touchend', handleEnd, { passive: false });
        this.joystickBase.addEventListener('touchcancel', handleEnd, { passive: false });
    }
    
    updatePlayerControls() {
        if (!this.player || !this.player.controls) return;
        
        const maxDistance = 50;
        const normalizedX = this.joystickCurrentPos.x / maxDistance;
        
        // Sol/Sağ
        this.player.controls.left = normalizedX < -0.3;
        this.player.controls.right = normalizedX > 0.3;
    }
    
    setupButtons() {
        // İleri butonu
        this.setupButton('forwardBtn', 'forward');
        
        // Geri butonu
        this.setupButton('reverseBtn', 'backward');
        
        // Fren butonu
        this.setupButton('brakeBtn', 'brake');
        
        // Nitro butonu
        this.setupButton('nitroBtn', 'nitro');
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
        
        // Touch events
        btn.addEventListener('touchstart', activate, { passive: false });
        btn.addEventListener('touchend', deactivate, { passive: false });
        btn.addEventListener('touchcancel', deactivate, { passive: false });
        btn.addEventListener('touchleave', deactivate, { passive: false });
        
        // Mouse events (test için)
        btn.addEventListener('mousedown', activate);
        btn.addEventListener('mouseup', deactivate);
        btn.addEventListener('mouseleave', deactivate);
    }
}
