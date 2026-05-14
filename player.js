class Player {
    constructor() {
        // Oyuncuyu haritanın ortasından başlatıyorum
        this.x = WORLD_WIDTH / 2;
        this.y = WORLD_HEIGHT / 2;

        // Oyuncunun fizik ve boyut değerleri
        this.radius = 25;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.95;
        this.angle = 0;

        // Can sistemi
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.inv = false; // hasar aldıktan sonra kısa süre dokunulmaz olması için

        this.size = 80;

        // Animasyon durumları
        this.state = 'idle';
        this.attackTimer = 0;
    }

    shoot() {
        let w = weapons[wIndex];

        let now = Date.now();

        // Reload varsa, mermi yoksa veya ateş hızı dolmadıysa ateş etmesin
        if (reloading || w.ammo <= 0 || now - lastShot < w.rate) return;

        // Silaha göre ateş sesini çalıyorum
        if (sounds[w.name]) {
            playSound(sounds[w.name]);
        }

        lastShot = now;
        w.ammo--;

        // Mouse konumunu dünya koordinatına çeviriyorum
        let mx = mouse.x + camera.x;
        let my = mouse.y + camera.y;

        // Merminin karakterin elinden çıkması için el konumu
        let handOffsetRelX = -this.size / 2 + 7;
        let handOffsetRelY = -this.size / 2 + 16;

        let handX = this.x + handOffsetRelX;
        let handY = this.y + handOffsetRelY;

        // Silahın baktığı yön
        this.angle = Math.atan2(my - handY, mx - handX);

        // Mermi silahın ucundan çıksın diye biraz ileri alıyorum
        const gunLength = 30;
        let spawnX = handX + Math.cos(this.angle) * gunLength;
        let spawnY = handY + Math.sin(this.angle) * gunLength;

        // Geri tepme: ateş edilen yönün tersine oyuncuyu itiyorum
        this.vx -= Math.cos(this.angle) * w.recoil;
        this.vy -= Math.sin(this.angle) * w.recoil;

        this.state = 'attack';
        this.attackTimer = now;

        // Silaha göre mermi/pellet oluşturma
        for (let i = 0; i < w.pellets; i++) {
            let spread = (Math.random() - 0.5) * w.spread;

            bullets.push(new Bullet(
                spawnX,
                spawnY,
                this.angle + spread,
                w.speed,
                w.color
            ));
        }

        // Mermi bittiyse otomatik reload başlatıyorum
        if (w.ammo <= 0) startReload();
    }

    hit() {
        // Oyuncu zaten kısa süre dokunulmazsa tekrar hasar almasın
        if (this.inv) return;

        this.health--;
        this.inv = true;

        // Can biterse oyun bitsin
        if (this.health <= 0) {
            this.state = 'dead';
            isGameOver = true;

            // Oyun bitince arka plan müziğini durduruyorum
            bgMusic.pause();
        }

        // 1 saniye sonra tekrar hasar alabilir
        setTimeout(() => this.inv = false, 1000);
    }

    update() {
        // Ölü oyuncu hareket etmesin
        if (this.health <= 0) return;

        let mx = mouse.x + camera.x;
        let my = mouse.y + camera.y;

        // Oyuncunun baktığı yönü mouse'a göre ayarlıyorum
        this.angle = Math.atan2(my - this.y, mx - this.x);

        // Mouse basılıysa ateş etmeye devam eder
        if (mouse.down) this.shoot();

        // Hız değerlerine göre konumu güncelliyorum
        this.x += this.vx;
        this.y += this.vy;

        // Sürtünme ile oyuncunun yavaşlamasını sağlıyorum
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Oyuncu haritanın dışına çıkmasın
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        // Engellerle çarpışma kontrolü
        for (let obs of obstacles) {
            resolveCircleRectCollision(this, obs);
        }

        // Ateş animasyonu bittiyse idle/move durumuna dönsün
        if (this.state !== 'attack' || Date.now() - this.attackTimer > 300) {
            if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
                this.state = 'move';
            } else {
                this.state = 'idle';
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        let mx = mouse.x + camera.x;
        let my = mouse.y + camera.y;

        let isFlipped = false;

        // Mouse sağ taraftaysa karakteri ters çeviriyorum
        if (this.state !== 'dead' && mx > this.x) {
            ctx.scale(-1, 1);
            isFlipped = true;
        }

        // Hasar alınca karakter kısa süre yanıp sönsün
        if (this.inv && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        let currentImg = playerImages.move;
        let frameCount = 4;
        let frameIndex = 0;
        let sw = 35;
        const sh = 39;

        // Oyuncunun durumuna göre animasyon seçiyorum
        if (this.state === 'dead') {
            currentImg = playerImages.dead;
            frameCount = 16;
            sw = 37;

            if (!this.deathStart) this.deathStart = Date.now();

            let elapsed = Math.floor((Date.now() - this.deathStart) / 100);
            frameIndex = Math.min(elapsed, frameCount - 1);

            ctx.globalAlpha = 1.0;
        } else {
            let isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;

            if (isMoving) {
                // Hareket ediyorsa animasyon kareleri değişsin
                frameIndex = Math.floor(Date.now() / 120) % frameCount;
            } else {
                // Duruyorsa ilk karede beklesin
                frameIndex = 0;
            }

            this.deathStart = null;
        }

        // Oyuncu sprite'ını çiziyorum
        if (currentImg.complete && currentImg.naturalWidth > 0) {
            ctx.drawImage(
                currentImg,
                frameIndex * sw, 0,
                sw, sh,
                -this.size / 2, -this.size / 2,
                this.size, this.size
            );
        }

        // Oyuncu ölmediyse silahı da çiziyorum
        if (this.state !== 'dead') {
            ctx.save();

            // Silahın karakterin eline yakın durması için konum
            let handX = -this.size / 2 + 20;
            let handY = -this.size / 2 + 31;
            ctx.translate(handX, handY);

            let angle = Math.atan2(my - (this.y + handY), mx - (this.x + handX));

            // Karakter aynalandığında silahın yönünü de düzeltiyorum
            if (isFlipped) {
                ctx.rotate(-angle);
            } else {
                ctx.rotate(angle + Math.PI);
            }

            let weaponImg = weaponImages[weapons[wIndex].name];

            // Aktif silah görselini çiziyorum
            if (weaponImg && weaponImg.complete && weaponImg.naturalWidth > 0) {
                const scale = 2;
                const wW = 19 * scale;
                const wH = 12 * scale;

                let offsetX = -(17 * scale);
                let offsetY = -(10 * scale);

                ctx.drawImage(weaponImg, offsetX, offsetY, wW, wH);
            }

            ctx.restore();
        }

        ctx.restore();
    }
}