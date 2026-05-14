// fare hareketleri
function updateMousePos(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
}

window.addEventListener("mousedown", e => {
    if (e.button === 0) {
        updateMousePos(e);
        if (!isGameStarted) handleMenuClick(); 
        else mouse.down = true;
    }
});

window.addEventListener("mouseup", e => { 
    if (e.button === 0) mouse.down = false; 
});

canvas.addEventListener("mouseup", e => { if (e.button === 0) mouse.down = false; });

window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (isGameOver && key === "enter") location.reload();
    if (isGameOver || !isGameStarted) return;
    if (key === "z") { wIndex = (wIndex + 1) % weapons.length; reloading = false; }
    if (key === "r" && !reloading) startReload();
});
// menü tıklama fonksiyonları - zorluk seçimi
function handleMenuClick() {
    if (mouse.y >= canvas.height / 2 && mouse.y <= canvas.height / 2 + 60) {
        if (mouse.x >= canvas.width / 2 - 160 && mouse.x <= canvas.width / 2 - 10) {
            selectedDifficulty = 'easy'; 
            isGameStarted = true;
            bgMusic.play().catch(e => console.log(e)); // <-- EKLENDİ
        } else if (mouse.x >= canvas.width / 2 + 10 && mouse.x <= canvas.width / 2 + 160) {
            selectedDifficulty = 'hard'; 
            isGameStarted = true;
            bgMusic.play().catch(e => console.log(e)); // <-- EKLENDİ
        }
    }
}
// reload sistemi
function startReload() {
    let w = weapons[wIndex];
    if (w.ammo === w.max) return;
    reloading = true; reloadProgress = 0;
    let start = Date.now();
    let int = setInterval(() => {
        let elapsed = Date.now() - start;
        reloadProgress = Math.min(100, (elapsed / w.reloadTime) * 100);
        if (elapsed >= w.reloadTime) { w.ammo = w.max; reloading = false; clearInterval(int); }
    }, 30);
}
class Bullet {
    constructor(x, y, a, s, c) {
        this.x = x; this.y = y; this.radius = 4; this.angle = a;
        this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s; this.color = c;
    }
    update() { this.x += this.vx; this.y += this.vy; }
    draw() {
        if (bulletImg.complete  && bulletImg.naturalWidth > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Merminin gidiş yönüne göre resmi döndür
            ctx.rotate(this.angle);

            // Mermi görselinin boyutu (Görseline göre ayarla)
            const bW = 20; 
            const bH = 10;

            // resmi tam mermi koordinatına ortalıyoruz
            ctx.drawImage(bulletImg, -bW / 2, -bH / 2, bW, bH);
            
            ctx.restore();
        } else {
            // Görsel yüklenene kadar veya hata verirse eski daire sistemini koru
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; 
            ctx.fill();
        }
    }
}