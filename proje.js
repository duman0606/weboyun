function resolveCircleRectCollision(circle, rect) {
    let testX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    let testY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    
    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));
    
    if (distance < circle.radius) {
        if (distance === 0) {
            distX = 1; distY = 0; distance = 1; 
        }
        let overlap = circle.radius - distance;
        circle.x += (distX / distance) * overlap;
        circle.y += (distY / distance) * overlap;
        return true;
    }
    return false;
}
//benim
function checkCircleCollision(a, b) {
    let dx = b.x - a.x; let dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}class Zombie {
    constructor(x, y, waveNumber) {
    this.x = x; this.y = y; this.radius = 20; this.size = 60;
    let diff = difficultySettings[selectedDifficulty];
    this.speed = (1 + waveNumber * 0.15) * diff.zombieSpeedMult;
    this.hp = diff.zombieHealthBase + Math.floor(waveNumber / 2);
    
    this.state = 'move'; 
    this.isDead = false; 
    this.deathTime = 0;
    this.attackRange = 45; //Zombie Saldırı Uzaklığı
}
    
    update() {
        if (this.isDead) return;

    
    if (Math.random() < 0.001) {
        playZombieSoundAtLocation('moan', this.x, this.y);
    }

        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        //Saldırı mı, Hareket mi?
        if (distance < this.attackRange) {
            this.state = 'attack';
        } else {
            this.state = 'move';
            let a = Math.atan2(dy, dx);
            this.x += Math.cos(a) * this.speed;
            this.y += Math.sin(a) * this.speed;
        }

        //Engel Çarpışmaları
        for (let obs of obstacles) resolveCircleRectCollision(this, obs);
    }
    
    draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (player.x > this.x) ctx.scale(-1, 1);

    let currentImg = zombieImages.move;
    let frameCount = 4;
    let sw = 35; 
    const sh = 39;
    let frameIndex = 0;

    if (this.isDead) {
        currentImg = zombieImages.dead;
        frameCount = 6;

        let elapsed = Math.floor((Date.now() - this.deathTime) / 100);
        frameIndex = Math.min(elapsed, frameCount - 1);

        let totalElapsed = Date.now() - this.deathTime;
        if (totalElapsed > 1500) {
            ctx.globalAlpha = Math.max(0, 1 - (totalElapsed - 1500) / 500);
        }
    } else {
        currentImg = (this.state === 'attack') ? zombieImages.attack : zombieImages.move;
        frameCount = (this.state === 'attack') ? 7 : 4;
        frameIndex = Math.floor(Date.now() / 120) % frameCount;
    }

    if (currentImg.complete && currentImg.naturalWidth > 0) {
        ctx.drawImage(
            currentImg,
            frameIndex * sw, 0,
            sw, sh,
            -this.size / 2,
            -this.size / 2,
            this.size,
            this.size
        );
    }

    ctx.restore();
}
}
//benim
class WaveManager {
    constructor() {
        this.wave = 0; this.toSpawn = 0; this.active = false;
        this.last = Date.now(); this.wait = 3000;
    }
    update() {
        let now = Date.now();
        if (!this.active) {
            if (now - this.last > this.wait) {
                this.wave++; this.toSpawn = this.wave * 5; this.active = true; this.last = now;
            }
            return;
        }
        if (this.toSpawn > 0 && now - this.last > difficultySettings[selectedDifficulty].spawnInterval) {
            zombies.push(new Zombie(
                player.x + (Math.random() < 0.5 ? -800 : 800), player.y + (Math.random() * 800 - 400), this.wave
            ));
            this.toSpawn--; this.last = now;
        }
        if (this.toSpawn === 0 && zombies.filter(r => !r.isDead).length === 0) {
            this.active = false; this.last = now;
        }
    }
}
const player = new Player();
const bullets = [];
const zombies = [];
const wave = new WaveManager();