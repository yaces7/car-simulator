/**
 * physics.js
 * Cannon.js tabanlı fizik motoru ve araç fiziği
 */

class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.friction = 0.4;
        
        this.bodies = [];
        this.meshes = [];
    }
    
    addBody(body, mesh) {
        this.world.addBody(body);
        this.bodies.push(body);
        if (mesh) {
            this.meshes.push({ body, mesh });
        }
    }
    
    update(deltaTime) {
        this.world.step(1/60, deltaTime, 3);
        
        // Mesh pozisyonlarını güncelle
        this.meshes.forEach(({ body, mesh }) => {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        });
    }
    
    removeBody(body) {
        this.world.removeBody(body);
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }
}
