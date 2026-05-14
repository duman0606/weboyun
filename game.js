function drawMenu() {
    if(Menu.bgm.complete){
        ctx.drawImage(Menu.bgm, 0, 0, canvas.width, canvas.height);
    }
    else{
        ctx.fillStyle = '#111111'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const btnW = 200;
    const btnH = 80;

    if(Menu.easy.complete){
        ctx.drawImage(Menu.easy, canvas.width / 2 -110, canvas.height / 2, btnW, btnH);
    }
    else{
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(canvas.width / 2 - 160, canvas.height / 2, 150, 60);
        ctx.fillStyle = 'white'; ctx.font = 'bold 24px Arial'; ctx.fillText("KOLAY", canvas.width / 2 - 85, canvas.height / 2 + 38);
    }

    if(Menu.hard.complete){
        ctx.drawImage(Menu.hard, canvas.width / 2 + 110, canvas.height / 2, btnW, btnH);
    }
    else{
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(canvas.width / 2 + 10, canvas.height / 2, 150, 60);
        ctx.fillStyle = 'white'; ctx.fillText("ZOR", canvas.width / 2 + 85, canvas.height / 2 + 38);
    }
    
}
function loop() {
    // 1. Menü Kontrolü
    if (!isGameStarted) { 
        drawMenu(); 
        requestAnimationFrame(loop); 
        return; 
    }

    // 2. Oyun Bitti (Game Over) Kontrolü
    if (isGameOver) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Karakterin son (ölü) halini ekrana çizdir
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        player.draw(); 
        ctx.restore();

        // OYUN BİTTİ YAZILARI
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 50px Arial";
        ctx.fillText("OYUN BİTTİ", canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = "24px Arial";
        ctx.fillText("Skor: " + score, canvas.width / 2, canvas.height / 2 + 40);
        ctx.font = "18px Arial";
        ctx.fillText("ENTER tuşuna basarak tekrar dene", canvas.width / 2, canvas.height / 2 + 80);
        
        requestAnimationFrame(loop);
        return; 
    }

    // 3. Kamera Ayarları (Kenarlardaki boşluk eklendi)
    const extraSpace = 200; 
    camera.x = Math.max(-extraSpace, Math.min(WORLD_WIDTH - canvas.width + extraSpace, player.x - canvas.width / 2));
    camera.y = Math.max(-extraSpace, Math.min(WORLD_HEIGHT - canvas.height + extraSpace, player.y - canvas.height / 2));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 4. Arka Planı Çizdirme (GÜVENLİKLİ)
    // typeof bgImage !== 'undefined' diyerek değişken yoksa çökmesini engelliyoruz
    if (bgImage.complete && bgImage.naturalWidth > 0) {
    const sx = Math.max(0, camera.x);
    const sy = Math.max(0, camera.y);

    const sw = Math.min(canvas.width, WORLD_WIDTH - sx);
    const sh = Math.min(canvas.height, WORLD_HEIGHT - sy);

    ctx.drawImage(
        bgImage,
        sx, sy, sw, sh,
        sx, sy, sw, sh
    );
} else {
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
}

    // 5. Engelleri (Masalar, Duvarlar) Çizdirme
    /*if (typeof obstacles !== 'undefined') {
        for (let obs of obstacles) {
            ctx.fillStyle = obs.color; 
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.fillStyle = "white"; 
            ctx.font = "14px Arial"; 
            ctx.fillText(obs.type || "", obs.x + 5, obs.y + 20);
        }
    }*/

    // 6. Sistem Güncellemeleri
    wave.update(); 
    player.update();

    // 7. Mermilerin Döngüsü ve Çizimi
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; 
        b.update(); 
        b.draw(); // Mermiler arkaplandan SONRA çizildiği için kesin görünür!

        // Harita dışına çıktıysa mermiyi sil
        if (b.x < 0 || b.x > WORLD_WIDTH || b.y < 0 || b.y > WORLD_HEIGHT) { 
            bullets.splice(i, 1); 
            continue; 
        }
        
        // Engellere (Duvarlara) çarpma kontrolü
        let hitWall = false;
        if (typeof obstacles !== 'undefined') {
            for (let obs of obstacles) {
                if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) { 
                    hitWall = true; 
                    break; 
                }
            }
        }
        if (hitWall) { bullets.splice(i, 1); continue; }
    }

    // 8. Zombilerin Döngüsü ve Çizimi
    for (let i = zombies.length - 1; i >= 0; i--) {
        let r = zombies[i];

        if (r.isDead) {
            r.draw(); 
            // 2.5 saniye sonra cesedi temizle
            if (Date.now() - r.deathTime > 2500) {
                zombies.splice(i, 1);
            }
            continue; 
        }

        r.update(); 
        r.draw();

        // Mermi - Zombi Çarpışma Kontrolü
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (checkCircleCollision(b, r)) {
                r.hp--;
                
                // Geri tepme (Knockback) efekti
                const kb = Math.atan2(r.y - b.y, r.x - b.x);
                r.x += Math.cos(kb) * 15; 
                r.y += Math.sin(kb) * 15;

                bullets.splice(j, 1); // Mermiyi yok et

                // Zombi Ölüm Tetikleyici
                if (r.hp <= 0) { 
                    r.isDead = true; 
                    r.state = 'dead';
                    r.deathTime = Date.now(); 
                    score += 10; 
                }
                break;
            }
        }

        // Zombi - Oyuncu Çarpışma Kontrolü (Hasar Alma)
        if (!r.isDead && checkCircleCollision(player, r)) {
            player.hit();
        }
    }

    // 9. Oyuncuyu Ekrana Çizdir
    player.draw(); 
    
    ctx.restore(); // Kameranın koordinat sistemini kapat

    // 10. UI (Arayüz) Çizimleri (En üst katman)
    ctx.textAlign = "left"; 
    ctx.fillStyle = "rgba(0,0,0,0.7)"; 
    ctx.fillRect(10, 10, 300, 120);
    
    ctx.fillStyle = "white"; 
    ctx.font = "bold 16px Arial"; 
    ctx.fillText("CAN:", 20, 35);
    
    // Can Barı
    ctx.fillStyle = "#e74c3c"; 
    ctx.fillRect(70, 20, 200, 20);
    ctx.fillStyle = "#2ecc71"; 
    ctx.fillRect(70, 20, (player.health / player.maxHealth) * 200, 20);
    ctx.strokeStyle = "white"; 
    ctx.strokeRect(70, 20, 200, 20);
    
    ctx.fillStyle = "white"; 
    ctx.fillText("Dalga: " + wave.wave + (wave.active ? "" : " (Hazırlan...)"), 20, 75);
    ctx.fillText("Skor: " + score, 20, 105);

    // Silah / Mermi UI
    let w = weapons[wIndex];
    ctx.fillStyle = "rgba(0,0,0,0.7)"; 
    ctx.fillRect(10, canvas.height - 100, 260, 80);
    ctx.fillStyle = "white"; 
    ctx.fillText("Z: " + w.name, 20, canvas.height - 70);

    if (reloading) {
        ctx.fillText("Reloading...", 20, canvas.height - 45);
        ctx.fillStyle = "#555"; 
        ctx.fillRect(20, canvas.height - 35, 100, 10);
        ctx.fillStyle = "#e74c3c"; 
        ctx.fillRect(20, canvas.height - 35, reloadProgress, 10);
    } else {
        ctx.fillText("Mermi: " + w.ammo + "/" + w.max, 20, canvas.height - 45);
    }

    requestAnimationFrame(loop);
}

zombieImages.dead.src = "assets/zombie_death-sprite.png";

const allImages = [
    { name: "background", img: bgImage },
    { name: "player move", img: playerImages.move },
    { name: "player dead", img: playerImages.dead },
    { name: "revolver", img: weaponImages.revolver },
    { name: "shotgun", img: weaponImages.shotgun },
    { name: "smg", img: weaponImages.smg },
    { name: "bullet", img: bulletImg },
    { name: "zombie move", img: zombieImages.move },
    { name: "zombie attack", img: zombieImages.attack },
    { name: "zombie dead", img: zombieImages.dead }
];

function loadImageAsset(asset) {
    return new Promise((resolve, reject) => {
        const img = asset.img;

        if (img.complete && img.naturalWidth > 0) {
            resolve(asset);
            return;
        }

        img.onload = () => resolve(asset);
        img.onerror = () => reject("Görsel yüklenemedi: " + asset.name);
    });
}

Promise.all(allImages.map(loadImageAsset))
    .then(() => {
        console.table(allImages.map(asset => ({
            name: asset.name,
            width: asset.img.naturalWidth,
            height: asset.img.naturalHeight,
            memoryMB: ((asset.img.naturalWidth * asset.img.naturalHeight * 4) / 1024 / 1024).toFixed(2)
        })));

        ctx.imageSmoothingEnabled = false;
        loop();
    })
    .catch(err => {
        console.error(err);
    });