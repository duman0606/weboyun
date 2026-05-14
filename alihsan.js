const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

const WORLD_WIDTH = 2048; 
const WORLD_HEIGHT = 2048;
const camera = { x: 0, y: 0 };



//-----------------------------------------------------------
//Görüntü Dosyalarını Yükleme
//-----------------------------------------------------------

const bgImage = new Image();
bgImage.src = "assets/bitismidirins.png"; 

const playerImages = {
    move: new Image(),
    dead: new Image()
};
playerImages.move.src = "assets/player-sprite.png"; 
playerImages.dead.src = "assets/player-death-sprite.png";

const weaponImages = {
    revolver: new Image(),
    shotgun: new Image(),
    smg: new Image()
};
weaponImages.revolver.src = "assets/revolver.png";
weaponImages.shotgun.src = "assets/shotgun.png";
weaponImages.smg.src="assets/SMG.png"

const bulletImg = new Image();
bulletImg.src = "assets/bullet.png"; 

const zombieImages = {
    move: new Image(),
    attack: new Image(),
    dead: new Image()
};
zombieImages.move.src = "assets/zombie_move-sprite.png"; 
zombieImages.attack.src = "assets/zombie_attack-sprite.png"; 
zombieImages.dead.src = "assets/zombie_death-sprite.png";

const Menu = {
    bgm: new Image(),
    easy: new Image(),
    hard: new Image()
}
Menu.bgm.src = "assets/bgm.png";
Menu.easy.src = "assets/easy.png";
Menu.hard.src = "assets/hard1.png";


const obstacles = [
    { x: 838, y: 0, w: 14, h: 462 }, 
    { x: 838, y: 582, w: 14, h: 736 }, 
    { x: 838, y: 1438, w: 14, h: 610 },

    { x: 838, y: 1064, w: 580, h: 14 },
    { x: 1410, y: 1064, w: 8, h: 184 },   
    { x: 838, y: 1238, w: 580, h: 10 }, 
    { x: 1594, y: 1064, w: 440, h: 14 }, 
    { x: 1594, y: 1064, w: 8, h: 184 },
    
    { x: 1594, y: 1064, w: 440, h: 14 },
    { x: 1594, y: 1064, w: 8, h: 184 },
    { x: 1594, y: 1238, w: 440, h: 10 },

    { x: 0, y: 1506, w: 240, h: 14 },
    { x: 232, y: 1506, w: 8, h: 176 },

    { x: 384, y: 1506, w: 468, h: 14 },
    { x: 384, y: 1506, w: 8, h: 176 },
    { x: 838, y: 1506, w: 14, h: 176 },

    { x: 0, y: 1680, w: 240, h: 10 },
    { x: 384, y: 1680, w: 468, h: 10 },

    {  x: 700, y: 64, w: 72, h: 159 },
    {  x: 1035, y: 64, w: 72, h: 159 },
    {  x: 1699, y: 1115, w: 72, h: 159 },

    {  x: 376, y: 366, w: 98, h: 117 },
    {  x: 376, y: 654, w: 98, h: 117 },
    {  x: 378, y: 957, w: 100, h: 117 },
    {  x: 382, y: 1254, w: 98, h: 117 },

    {  x: 1340, y: 356, w: 202, h: 535 },

    {  x: 70, y: 1645, w: 91, h: 56 },
    {  x: 480, y: 1639, w: 71, h: 62 },
    {  x: 590, y: 1639, w: 91, h: 62 },
    {  x: 700, y: 1639, w: 91, h: 62 },

    {  x: 1091, y: 1918, w: 177, h: 105 },
    {  x: 1649, y: 1918, w: 177, h: 106 },

    {  x: 1931, y: 1342, w: 77, h: 163 },
    {  x: 1931, y: 1733, w: 77, h: 161 }    
];
//----------------------------------------------------
//Ses dosyalarını import etme
//-----------------------------------------------------
const sounds = {
    revolver: new Audio("audio/sfx-revolver.wav"),
    shotgun: new Audio("audio/sfx_shotgun.wav"),
    smg: new Audio("audio/sfx_smg.wav"),
}
sounds.revolver.volume = 0.1;
sounds.shotgun.volume = 0.1;
sounds.smg.volume = 0.1;

const zombieSounds = {
    moan: new Audio("audio/sfx_zombie.wav"),
    hit: new Audio("audio/sfx-zombie-hit.wav"),
    death: new Audio("audio/sfx-zombie-death.wav")
}
zombieSounds.hit.volume = 0.1;
zombieSounds.death.volume = 0.1;
zombieSounds.moan.volume = 0.1;
// arkaplan müziği
const bgMusic = new Audio("audio/sfx-background.ogg");
bgMusic.loop = true;
bgMusic.volume = 0.50;

//Durum kontrol bayrakları
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let selectedDifficulty = 'easy';
//zorluk ayarı
const difficultySettings = {
    easy: { zombieSpeedMult: 1.0, zombieHealthBase: 2, spawnInterval: 1500 },
    hard: { zombieSpeedMult: 1.8, zombieHealthBase: 4, spawnInterval: 800 }
};
//Silah listesi
const weapons = [
    { name: "revolver", ammo: 6, max: 6, speed: 25, rate: 300, recoil: 12, pellets: 1, spread: 0.02, reloadTime: 1200, color: "#f1c40f" },
    { name: "shotgun", ammo: 5, max: 5, speed: 22, rate: 800, recoil: 30, pellets: 7, spread: 0.25, reloadTime: 2000, color: "#e67e22" },
    { name: "smg", ammo: 100, max: 100, speed: 20, rate: 100, recoil: 4, pellets: 1, spread: 0.1, reloadTime: 2500, color: "#3498db" }
];

let wIndex = 0;
let lastShot = 0;
let reloading = false;
let reloadProgress = 0;
const mouse = { x: 0, y: 0, down: false };

//mermi sesi döngüsünün belli bir süre bekleyerek kaos yaratmaması için.
function playSound(audio) {
    if (audio.currentTime > 0 && audio.currentTime < 0.05) return;

    audio.currentTime = 0;
    audio.play().catch(e => {});
}

let activeZombieSounds = 0;
//Zombie seslerinin aktifliği
function playZombieSound(audioName) {
    if (activeZombieSounds > 5) return;

    const sound = zombieSounds[audioName].cloneNode();
    sound.volume = zombieSounds[audioName].volume;
    
    activeZombieSounds++;
    sound.play().catch(e => {});

    sound.onended = () => {
        activeZombieSounds--;
        sound.remove();
    };
}
//Zombie seslerinin player'a uzaklığına bağlı olarak sesinin yüksekliği

function playZombieSoundAtLocation(audioName, zombieX, zombieY) {
    if (!zombieSounds[audioName]) return;

    const dx = player.x - zombieX;
    const dy = player.y - zombieY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxDist = 500;
    if (distance > maxDist) return;

    const sound = zombieSounds[audioName].cloneNode();
    
    const volumeMod = 1 - (distance / maxDist);
    sound.volume = zombieSounds[audioName].volume * volumeMod;

    sound.play().catch(e => console.error("Ses çalınamadı:", e));
    
    sound.onended = () => { sound = null; };
}