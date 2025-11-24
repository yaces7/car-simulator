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
        
        // Butonlar
        this.forwardPressed = false;
        this.reversePressed = false;
        this.brakePressed = false;
        this.nitroPressed = false;
        
        this.init();
    }
    
    init() {
        // Mobil cihaz kontrolü
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (!isMobile && !isTouchDevice) {
            return; // Mobil değilse kontrolleri gösterme
        }
        
        this.active = true;
        
        // Joystick elementleri
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickStick = document.getElementById('leftStick');
        
        if (this.joystickBase && this.joystickStick) {
            this.setupJoystick();
        }
        
        // Buton elementleri
        this.setupButtons();
    }
    
    setupJoystick() {
        const handleStart = (e) => {
            e.preventDefault();
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
            const maxDistance = 40;
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
            this.joystickStick.style.transform = 
                `translate(calc(-50% + ${this.joystickCurrentPos.x}px), calc(-50% + ${this.joystickCurrentPos.y}px))`;
            
            // Oyuncu kontrollerini güncelle
            if (this.player && this.player.controls) {
                const normalizedX = this.joystickCurrentPos.x / maxDistance;
                this.player.controls.left = normalizedX < -0.2;
                this.player.controls.right = normalizedX > 0.2;
            }
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickCurrentPos = { x: 0, y: 0 };
            this.joystickStick.style.transform = 'translate(-50%, -50%)';
            
            if (this.player && this.player.controls) {
                this.player.controls.left = false;
                this.player.controls.right = false;
            }
        };
        
        // Touch events
        this.joystickBase.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
        
        // Mouse events (test için)
        this.joystickBase.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    setupButtons() {
        // İleri butonu
        const forwardBtn = document.getElementById('forwardBtn');
        if (forwardBtn) {
            forwardBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.forwardPressed = true;
                if (this.player && this.player.controls) {
                    this.player.controls.forward = true;
                }
            });
            forwardBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.forwardPressed = false;
                if (this.player && this.player.controls) {
                    this.player.controls.forward = false;
                }
            });
        }
        
        // Geri butonu
        const reverseBtn = document.getElementById('reverseBtn');
        if (reverseBtn) {
            reverseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.reversePressed = true;
                if (this.player && this.player.controls) {
                    this.player.controls.backward = true;
                }
            });
            reverseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.reversePressed = false;
                if (this.player && this.player.controls) {
                    this.player.controls.backward = false;
                }
            });
        }
        
        // Fren butonu
        const brakeBtn = document.getElementById('brakeBtn');
        if (brakeBtn) {
            brakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.brakePressed = true;
                if (this.player && this.player.controls) {
                    this.player.controls.brake = true;
                }
            });
            brakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.brakePressed = false;
                if (this.player && this.player.controls) {
                    this.player.controls.brake = false;
                }
            });
        }
        
        // Nitro butonu
        const nitroBtn = document.getElementById('nitroBtn');
        if (nitroBtn) {
            nitroBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.nitroPressed = true;
                if (this.player && this.player.controls) {
                    this.player.controls.nitro = true;
                }
            });
            nitroBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.nitroPressed = false;
                if (this.player && this.player.controls) {
                    this.player.controls.nitro = false;
                }
            });
        }
    }
    
    update() {
        // Her frame'de çağrılabilir
    }
}
