/**
 * camera.js
 * Üçüncü şahıs kamera sistemi
 */

class ThirdPersonCamera {
    constructor(target, domElement) {
        // Kamera oluştur
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.domElement = domElement;
        this.target = target;
        
        // Kamera ayarları
        this.distance = 10;
        this.height = 4;
        this.angle = 0;
        this.smoothness = 0.1;
        
        // Mouse kontrolü
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupMouseControls();
    }
    
    setupMouseControls() {
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Sağ tık
                this.mouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.mouseDown = false;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.angle -= deltaX * 0.01;
                this.height = Math.max(2, Math.min(8, this.height - deltaY * 0.02));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Zoom
        document.addEventListener('wheel', (e) => {
            this.distance = Math.max(5, Math.min(20, this.distance + e.deltaY * 0.01));
        });
    }
    
    update() {
        if (!this.target || !this.target.mesh) return;
        
        const targetPos = this.target.mesh.position;
        const targetRot = this.target.mesh.rotation;
        
        // Hedef kamera pozisyonu
        const cameraAngle = targetRot.y + this.angle;
        const targetX = targetPos.x - Math.sin(cameraAngle) * this.distance;
        const targetY = targetPos.y + this.height;
        const targetZ = targetPos.z - Math.cos(cameraAngle) * this.distance;
        
        // Yumuşak geçiş
        this.camera.position.x += (targetX - this.camera.position.x) * this.smoothness;
        this.camera.position.y += (targetY - this.camera.position.y) * this.smoothness;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.smoothness;
        
        // Arabaya bak
        this.camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z);
    }
    
    setTarget(target) {
        this.target = target;
    }
}

console.log('camera.js yüklendi - ThirdPersonCamera:', typeof ThirdPersonCamera);
