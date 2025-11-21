// Platformer Jump 게임
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mapWidth = 5000;
const groundY = canvas.height - 100;
let player = {
  x: 100,
  y: 10,
  width: 60,
  height: 160,
  ySpeed: 0,
  jumpPower: -10,
  gravity: 0.4,
  grounded: false,
  facingRight: true
};

let cameraX = 0;
let platforms = [];

function updateMonster(monster, deltaTime) {
  const dt = deltaTime || 1/60;
  if (monster.knockbackX !== undefined && monster.knockbackX !== 0) {
    monster.x += monster.knockbackX * dt * 60;
    monster.knockbackX *= Math.pow(0.95, dt * 60);
    if (Math.abs(monster.knockbackX) < 0.1) monster.knockbackX = 0;
    monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
  }
  
  monster.y = (groundY + 30) - monster.height + Math.sin(animFrame * 3) * 2;
  
  if (monster.x > player.x) monster.x -= monster.speed * dt * 60;
  else if (monster.x < player.x) monster.x += monster.speed * dt * 60;
}

function drawMonster(monster) {
  if (!monster.image || !monster.image.complete || monster.image.width === 0) return;
  
  const facingRight = monster.x < player.x;
  const x = monster.x - cameraX + (Math.random() - 0.5) * 2;
  const y = monster.y + (Math.random() - 0.5) * 2;
  
  ctx.save();
  if (!facingRight) {
    ctx.translate(x + monster.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(monster.image, 0, y, monster.width, monster.height);
  } else {
    ctx.drawImage(monster.image, x, y, monster.width, monster.height);
  }
  ctx.restore();
}

function onCollide(monster) {
  const now = Date.now();
  if (now - lastHit >= hitCD) {
    HP = Math.max(0, HP - monster.damage);
    lastHit = now;
    lastMPDec = now;
    monster.lastHit = true;
  }
}

let monsters = [
  {
    id: 'lacera',
    x: 600,
    initX: 600,
    y: 0,
    width: 170,
    height: 170,
    speed: 0.5,
    image: null,
    lastHit: false,
    damage: 50,
    
    getEffects(monster) {
      const pC = {x: player.x + player.width / 2, y: player.y + player.height / 2};
      const mC = {x: monster.x + monster.width / 2, y: monster.y + monster.height / 2};
      const dist = Math.sqrt((pC.x - mC.x) ** 2 + (pC.y - mC.y) ** 2);
      const intensity = Math.max(0, Math.min(1, (800 - dist) / 700));
      return {
        zoom: 1.0 + intensity * 1.0,
        shake: {
          x: (Math.random() - 0.5) * intensity * 15,
          y: (Math.random() - 0.5) * intensity * 15
        }
      };
    }
  },
  {
    id: 'walker',
    x: 1000,
    initX: 1000,
    y: 0,
    width: 150,
    height: 150,
    speed: 0.9,
    image: null,
    lastHit: false,
    damage: 30
  }
];

// 게임 시간 관리
let start = Date.now();
let elapsed = 0;
let lastFrameTime = performance.now();

// 애니메이션 프레임
let animFrame = 0;

// 게임 상태
let gameStarted = false;
let canPass = false;
let shiftOnJump = false;
let lastMove = Date.now();
let lastHit = 0;
const hitCD = 3000;
let handsX = null;
let wasGrounded = false;
let MP = 100;
let HP = 100;
let lastMPUp = Date.now();
let lastMPDec = 0;
let lastShiftDec = 0;
let groggyEndTime = 0;
let bgMusic = null;
let handsSound = null;
let handsSoundPlayed = false;
let gameoverSound = null;

let resLoaded = 0;
const imgPaths = {
  player: 'images/player/player.png',
  jump: 'images/player/jump.png',
  knifing: 'images/player/knifing.png',
  groggy: 'images/player/groggy.png',
  background: 'images/background/bg_sky.png',
  grass: 'images/background/bg_grass.png',
  trees: 'images/background/bg_trees.png',
  hands: 'images/creature/hands.png'
};
const monsterImgPaths = {
  lacera: 'images/creature/Lacera.png',
  walker: 'images/creature/walker.png'
};
const totalRes = Object.keys(imgPaths).length + Object.keys(monsterImgPaths).length + 3;

function checkResLoaded() {
  resLoaded++;
  if (resLoaded >= totalRes) {
    document.getElementById('startButton').disabled = false;
    document.getElementById('startButton').textContent = '게임 시작';
    document.getElementById('loadingText').style.display = 'none';
  }
}

function loadAudio(src) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.oncanplaythrough = () => checkResLoaded();
  audio.onerror = () => { console.error('Failed to load audio:', src); checkResLoaded(); };
  audio.load();
  return audio;
}

function loadImg(src, onload) {
  const img = new Image();
  img.onload = () => { if (onload) onload(img); checkResLoaded(); };
  img.onerror = () => { console.error('Failed to load image:', src); checkResLoaded(); };
  img.src = src;
  return img;
}

const playerImg = loadImg(imgPaths.player, img => {
  player.height = player.width * (img.naturalHeight / img.naturalWidth);
  player.y = (groundY + 30) - player.height;
});
const jumpImg = loadImg(imgPaths.jump);
const knifingImg = loadImg(imgPaths.knifing);
const groggyImg = loadImg(imgPaths.groggy);
const bgImg = loadImg(imgPaths.background);
const grassImg = loadImg(imgPaths.grass);
const treesImg = loadImg(imgPaths.trees);
const handsImg = loadImg(imgPaths.hands);

bgMusic = loadAudio('audio/bg.mp3');
handsSound = new Audio('audio/hands.mp3');
handsSound.loop = false;
handsSound.oncanplaythrough = () => checkResLoaded();
handsSound.onerror = () => { console.error('Failed to load audio: audio/hands.mp3'); checkResLoaded(); };
handsSound.load();
gameoverSound = new Audio('audio/gameover.mp3');
gameoverSound.loop = false;
gameoverSound.oncanplaythrough = () => checkResLoaded();
gameoverSound.onerror = () => { console.error('Failed to load audio: audio/gameover.mp3'); checkResLoaded(); };
gameoverSound.load();
Object.keys(monsterImgPaths).forEach(id => {
  loadImg(monsterImgPaths[id], img => {
    const monster = monsters.find(m => m.id === id);
    if (monster) {
      monster.height = monster.width * (img.naturalHeight / img.naturalWidth);
      monster.y = (groundY + 30) - monster.height;
      monster.image = img;
    }
  });
});

let keys = {};
let lastKey = null;
let atk = false;
let atkStart = 0;
const atkDur = 300;

// 키 체크 헬퍼
const isKeyDown = (code, variants = []) => keys[code] || variants.some(k => keys[k]);
const getDir = () => {
  const left = isKeyDown("KeyA", ["a", "A"]);
  const right = isKeyDown("KeyD", ["d", "D"]);
  
  if (left && right) {
    if (lastKey === "KeyA" || lastKey === "a" || lastKey === "A") {
      return { left: true, right: false };
    } else if (lastKey === "KeyD" || lastKey === "d" || lastKey === "D") {
      return { left: false, right: true };
    }
  }
  
  return { left, right };
};
const isShift = () => keys["Shift"];
const isJump = () => isKeyDown("Space", [" "]);
const isDown = () => isKeyDown("KeyS", ["s", "S"]);

// 키 입력 처리
document.addEventListener("keydown", e => {
  if (e.code === "KeyS" || e.code === "Space" || e.key === "s" || e.key === "S" || e.key === " ") {
    e.preventDefault();
  }
  
  if (e.code) {
    keys[e.code] = true;
    if (e.code === "KeyA" || e.code === "KeyD") {
      lastKey = e.code;
    }
  }
  if (e.key) {
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
    if (e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
      lastKey = e.key;
    }
  }
  e.preventDefault();
});

document.addEventListener("keyup", e => {
  if (e.code) {
    keys[e.code] = false;
    delete keys[e.code];
  }
  if (e.key) {
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
    delete keys[e.key];
    delete keys[e.key.toLowerCase()];
  }
  e.preventDefault();
});

// 포커스 손실 및 키 상태 정리
window.addEventListener("blur", () => { keys = {}; lastKey = null; });
window.addEventListener("visibilitychange", () => {
  if (document.hidden) { keys = {}; lastKey = null; }
});
document.addEventListener("mousedown", e => {
  if (e.button === 0) {
    const now = Date.now();
    const isGroggy = now < groggyEndTime;
    const isAtk = atk && (now - atkStart) < atkDur;
    if (!isAtk && !isGroggy) {
      atk = true;
      atkStart = now;
    }
  }
});

const platformData = [
  {x: 0, y: groundY + 30, w: mapWidth, h: 10, type: 'floor'}, // 바닥 플랫폼
  {x: 2000, y: groundY - 200, w: 150, h: 10},
  {x: 2100, y: groundY - 100, w: 150, h: 10},
  {x: 2200, y: groundY, w: 0, h: 10},
  {x: 2400, y: groundY - 150, w: 150, h: 10},
  {x: 2500, y: groundY, w: 300, h: 10}
];

platforms = platformData.map(p => ({
  x: p.x, y: p.y, width: p.w, height: p.h, type: p.type || 'normal'
}));

const getAspect = () => playerImg.naturalHeight / playerImg.naturalWidth;
const getHitbox = () => ({w: player.width, h: player.width * getAspect()});

// 플레이어 표시 크기 계산
function getPlayerSize(img) {
  const currentImg = img || playerImg;
  const sizeRatio = currentImg.naturalWidth / playerImg.naturalWidth;
  return {w: player.width * sizeRatio, h: player.width * sizeRatio * (currentImg.naturalHeight / currentImg.naturalWidth)};
}

// 배경 - 하늘 그리기 (루프)
function drawBackground() {
  if (!bgImg.complete || bgImg.width === 0) return;
  const w = bgImg.width;
  const h = bgImg.height;
  const offset = cameraX % w;
  for (let x = -offset; x < canvas.width + w; x += w) {
    ctx.drawImage(bgImg, x, 0, w, canvas.height + 100);
  }
}

// 배경 - 반복 이미지 그리기
function drawRepeat(img, heightRatio, yPos) {
  if (!img.complete || img.width === 0) return;
  const h = canvas.height * heightRatio;
  const w = img.width * h / img.height;
  const offset = (cameraX * 0.6) % w;
  for (let x = -offset; x < canvas.width + w; x += w) {
    ctx.drawImage(img, x, yPos, w, h);
  }
}

function drawGrass() { drawRepeat(grassImg, 0.3, canvas.height * 0.75); }
function drawTrees() { drawRepeat(treesImg, 0.25, 0); }

// 플레이어 그리기
function drawPlayer() {
  let img;
  const now = Date.now();
  const isGroggy = now < groggyEndTime;
  const isAtk = atk && (now - atkStart) < atkDur;
  
  if (isGroggy) {
    img = groggyImg;
  } else if (isAtk) {
    img = knifingImg;
  } else {
    atk = false;
    img = player.grounded ? playerImg : jumpImg;
  }
  
  const {w, h} = getPlayerSize(img);
  const {w: hbW} = getHitbox();
  
  let x;
  if (isAtk) {
    const {w: pW} = getPlayerSize(playerImg);
    const hbCenterX = player.x + hbW / 2;
    const pImgLeftX = hbCenterX - pW / 2;
    if (player.facingRight) {
      x = pImgLeftX - cameraX;
    } else {
      const pImgRightX = pImgLeftX + pW;
      x = pImgRightX - w - cameraX;
    }
  } else {
    const hbCenterX = player.x + hbW / 2;
    x = hbCenterX - w / 2 - cameraX;
  }
  
  const dir = getDir();
  const yOffset = (player.grounded && (dir.left || dir.right)) ? Math.sin(animFrame * 0.3) * 1.5 : 0;
  
  ctx.save();
  if (!player.facingRight) {
    ctx.translate(x + w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, player.y + yOffset, w, h);
  } else {
    ctx.drawImage(img, x, player.y + yOffset, w, h);
  }
  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(p => {
    ctx.fillStyle = "brown";
    ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
  });
}

// 시간 표시
function drawTime() {
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText("Time: " + elapsed + "초", 10, 20);
}

// 정신력 게이지바 그리기 (동그라미 형태, 반시계방향)
function drawMPBar() {
  if (MP >= 100) return;
  
  const {w: pW, h: pH} = getHitbox();
  const pScreenX = player.x - cameraX;
  const radius = 10;
  const centerX = pScreenX - radius;
  const centerY = player.y + 50;
  const lineWidth = 5;
  const mpPercent = Math.max(0, Math.min(100, (MP / 100) * 100));
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle - (Math.PI * 2 * mpPercent / 100);
  
  let r, g, b;
  if (mpPercent > 50) {
    r = 0;
    g = ((mpPercent - 50) / 50) * 255;
    b = 255;
  } else {
    r = 0;
    g = (mpPercent / 50) * 200;
    b = (mpPercent / 50) * 255;
  }
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

// 체력 게이지바 그리기 (동그라미 형태, 반시계방향)
function drawHPBar() {
  if (HP >= 100) return;
  
  const {w: pW, h: pH} = getHitbox();
  const pScreenX = player.x - cameraX;
  const radius = 10;
  const centerX = pScreenX - radius;
  const centerY = player.y + 20;
  const lineWidth = 5;
  const hpPercent = Math.max(0, Math.min(100, (HP / 100) * 100));
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle - (Math.PI * 2 * hpPercent / 100);
  
  let r, g, b;
  if (hpPercent > 50) {
    r = 255 - ((hpPercent - 50) / 50) * 255;
    g = 255;
    b = 0;
  } else {
    r = 255;
    g = (hpPercent / 50) * 255;
    b = 0;
  }
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

// 무적시간 게이지 그리기 (플레이어 히트박스 상단)
function drawInvBar() {
  const now = Date.now();
  const timeSinceHit = now - lastHit;
  if (timeSinceHit >= hitCD) return;
  
  const {w: hbW} = getHitbox();
  const pScreenX = player.x - cameraX;
  const barY = player.y - 15;
  const barHeight = 8;
  const barMaxWidth = hbW * 0.4;
  const remainingTime = hitCD - timeSinceHit;
  const invPct = remainingTime / hitCD;
  const barWidth = barMaxWidth * invPct;
  const barX = pScreenX + (hbW - barMaxWidth) / 2;
  
  ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
  ctx.fillRect(barX, barY, barMaxWidth, barHeight);
  
  ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
  ctx.fillRect(barX, barY, barWidth, barHeight);
}

// hands 이동 처리
function updateHands(deltaTime) {
  if (!handsImg.complete || handsImg.width === 0) return;
  
  const dt = deltaTime || 1/60;
  const h = canvas.height;
  const w = handsImg.width * h / handsImg.height;
  
  if (handsX === null) {
    handsX = cameraX - w;
  }
  
  const handsSpeed = HP <= 0 ? 22 : 0.5;
  if (handsX < mapWidth) handsX += handsSpeed * dt * 60;
}

// hands 이미지 위치 및 크기 계산
function getHandsPos() {
  if (!handsImg.complete || handsImg.width === 0 || handsX === null) return null;
  
  const h = canvas.height;
  const w = handsImg.width * h / handsImg.height;
  const screenX = handsX - cameraX;
  
  return {
    x: screenX,
    y: Math.sin((Date.now() - start) / 1000 * 30) * 2,
    w, h,
    hitboxX: screenX + (w * 0.05),
    hitboxW: w * 0.8
  };
}

// 손 이미지 표시
function drawHands() {
  const pos = getHandsPos();
  if (pos) ctx.drawImage(handsImg, pos.x, pos.y, pos.w, pos.h);
}

// 손전등 불빛 효과
function drawFlashlight() {
  const pCenterX = (player.x - cameraX) + player.width / 2;
  const pCenterY = player.y + player.height / 2;
  const maxRadius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  
  const gradient = ctx.createRadialGradient(pCenterX, pCenterY, 0, pCenterX, pCenterY, maxRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.15, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.25, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 5)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 공격 범위 내 몬스터 넉백 처리
function handleKnockback() {
  const isAtk = atk && (Date.now() - atkStart) < atkDur;
  if (!isAtk) return;
  
  const {w: pW, h: pH} = getHitbox();
  const atkRange = 100;
  const pCX = player.x + pW / 2;
  
  monsters.forEach(monster => {
    const mCX = monster.x + monster.width / 2;
    const distX = Math.abs(mCX - pCX);
    const distY = Math.abs((monster.y + monster.height / 2) - (player.y + pH / 2));
    
    const inDir = player.facingRight ? mCX > pCX : mCX < pCX;
    
    if (distX <= atkRange && distY <= pH / 2 + monster.height / 2 && inDir) {
      if (monster.knockbackX === undefined || monster.knockbackX === 0) {
        monster.knockbackX = player.facingRight ? 15 : -15;
      }
    }
  });
}

// 몬스터 이동 처리 및 충돌 검사
function updateMonsters(deltaTime) {
  monsters.forEach(monster => {
    updateMonster(monster, deltaTime);
    
    const {w: pW, h: pH} = getHitbox();
    const isCol = player.x + pW > monster.x && player.x < monster.x + monster.width &&
                  player.y + pH > monster.y && player.y < monster.y + monster.height;
    
    if (isCol) {
      onCollide(monster);
    } else {
      monster.lastHit = false;
    }
  });
  
  handleKnockback();
}

function getEffects() {
  const monster = monsters.find(m => m.getEffects);
  return monster ? monster.getEffects(monster) : { zoom: 1.0, shake: { x: 0, y: 0 } };
}

// 몬스터 그리기
function drawMonsters() {
  monsters.forEach(monster => {
    drawMonster(monster);
  });
}

function updateMP(deltaTime) {
  const dt = deltaTime || 1/60;
  const now = Date.now();
  const timeDec = now - lastMPDec;
  
  if (now >= groggyEndTime && groggyEndTime > 0) {
    groggyEndTime = 0;
  }
  
  const isGroggy = now < groggyEndTime;
  const isShiftPressed = isShift() && !isGroggy;
  
  if (isShiftPressed) {
    MP = Math.max(0, MP - 10 * dt);
    if (MP <= 0 && groggyEndTime === 0) {
      groggyEndTime = now + 5000;
      lastMPDec = now;
      delete keys["Shift"];
      atk = false;
    }
  }
  
  if (MP <= 0) {
    if (now >= groggyEndTime) {
      MP = Math.min(100, MP + 20 * dt);
      lastMPUp = now;
    } else {
      lastMPUp = now;
    }
  } else if (timeDec >= 3000) {
    MP = Math.min(100, MP + 20 * dt);
    lastMPUp = now;
  } else {
    lastMPUp = now;
  }
  
  if (isShiftPressed && MP > 0 && MP < 100) {
    lastMPDec = now;
  }
}

// 플레이어 이동 처리
function updatePlayerMovement(deltaTime) {
  const dt = deltaTime || 1/60;
  const now = Date.now();
  const isGroggy = now < groggyEndTime;
  const isAtk = atk && (now - atkStart) < atkDur;
  
  if (isGroggy || isAtk) {
    player.ySpeed += player.gravity * dt * 60;
    if (player.ySpeed > 8) player.ySpeed = 8;
    player.y += player.ySpeed * dt * 60;
    return;
  }
  
  if (player.grounded) shiftOnJump = false;
  
  const shift = isShift() && !isGroggy;
  const speed = (player.grounded ? shift : shiftOnJump) ? 7 : 3;
  const { left, right } = getDir();
  const jump = isJump();
  const down = isDown();
  
  if (left || right || jump) lastMove = Date.now();
  if (left) { player.x -= speed * dt * 60; player.facingRight = false; }
  if (right) { player.x += speed * dt * 60; player.facingRight = true; }
  player.x = Math.max(0, Math.min(mapWidth - player.width, player.x));
  
  if (player.grounded && jump && !down) {
    if (player.ySpeed === 0 && wasGrounded) {
      shiftOnJump = shift;
      player.ySpeed = player.jumpPower;
      player.grounded = false;
    } else if (player.ySpeed > 0) {
      shiftOnJump = shift;
      player.ySpeed = player.jumpPower;
      player.grounded = false;
    }
  }
  wasGrounded = player.grounded;
  
  player.ySpeed += player.gravity * dt * 60;
  if (player.ySpeed > 8) player.ySpeed = 8;
  player.y += player.ySpeed * dt * 60;
  
  const px = player.x - cameraX;
  const minX = canvas.width * 0.3;
  const maxX = canvas.width * 0.35;
  if (px < minX) cameraX = player.x - minX;
  else if (px > maxX) cameraX = player.x - maxX;
  cameraX = Math.max(0, Math.min(mapWidth - canvas.width, cameraX));
}

// 플랫폼 충돌 검사
function checkCollision() {
  const {w: pW, h: pH} = getHitbox();
  player.grounded = false;
  
  const pBottom = player.y + pH;
  const down = isDown();
  const jump = isJump();
  if (down && jump && !canPass) canPass = true;
  if (!down || !jump) canPass = false;
  
  platforms.forEach(p => {
    const isFloor = p.type === 'floor';
    const shouldCol = isFloor ? true : !canPass;
    const isColX = player.x + pW > p.x && player.x < p.x + p.width;
    
    if (!isColX) return;
    
    if (isFloor) {
      const isTop = pBottom >= p.y && pBottom <= p.y + 10;
      const isInside = player.y + pH > p.y && player.y < p.y + p.height;
      
      if (isInside) {
        player.y = p.y - pH;
        player.ySpeed = 0;
        player.grounded = true;
        canPass = false;
      } else if (isTop) {
        player.y = p.y - pH;
        player.ySpeed = 0;
        player.grounded = true;
        canPass = false;
      }
    } else if (shouldCol) {
      const isTop = pBottom >= p.y && pBottom <= p.y + 5;
      if (player.y < p.y + p.height && isTop) {
        player.y = p.y - pH;
        player.ySpeed = 0;
        player.grounded = true;
        canPass = false;
      }
    } else if (canPass && player.y + pH < p.y + p.height && player.y > p.y) {
      canPass = false;
    }
  });
}

function checkGameOver() {
  const pos = getHandsPos();
  if (pos) {
    const pScreenX = player.x - cameraX;
    const {w: pW, h: pH} = getHitbox();
    
    const isColliding = pScreenX + pW > pos.hitboxX && pScreenX < pos.hitboxX + pos.hitboxW &&
        player.y + pH > pos.y && player.y < pos.y + pos.h;
    
    if (isColliding && !handsSoundPlayed && handsSound) {
      handsSound.play().catch(err => console.log('hands 오디오 재생 실패:', err));
      handsSoundPlayed = true;
    }
    
    if (isColliding) {
      showGameOver();
      return true;
    }
  }
  
  if (player.y > canvas.height + 100) {
    showGameOver();
    return true;
  }
  
  return false;
}

// 게임오버 화면 표시
function showGameOver() {
  gameStarted = false;
  if (gameoverSound) {
    gameoverSound.play().catch(err => console.log('gameover 오디오 재생 실패:', err));
  }
  document.getElementById('gameOverTime').textContent = "생존 시간: " + elapsed + "초";
  document.getElementById('gameOverScreen').style.display = 'flex';
}

// 키 상태 검증 및 정리
function validateKeys() {
  const timeSinceMove = Date.now() - lastMove;
  if (timeSinceMove > 1000) {
    const { left, right } = getDir();
    if (!left && !right && !isJump()) keys = {};
  }
}

function update() {
  if (!gameStarted) return;
  
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  animFrame += deltaTime * 60;
  validateKeys();
  checkCollision();
  updatePlayerMovement(deltaTime);
  updateMonsters(deltaTime);
  updateHands(deltaTime);
  elapsed = ((Date.now() - start) / 1000).toFixed(1);
  
  updateMP(deltaTime);
  
  if (checkGameOver()) return;
  
  const { zoom, shake } = getEffects();
  
  const pScreenX = player.x - cameraX;
  const pScreenY = player.y;
  canvas.style.transformOrigin = `${pScreenX}px ${pScreenY}px`;
  canvas.style.transform = `translate(${shake.x}px, ${shake.y}px) scale(${zoom})`;
  
  drawBackground();
  drawPlatforms();
  drawMonsters();
  drawPlayer();
  drawTrees();
  drawGrass();
  drawHands();
  drawFlashlight();
  
  drawTime();
  drawMPBar();
  drawHPBar();
  drawInvBar();
  
  requestAnimationFrame(update);
}

// 게임 시작 함수
function startGame() {
  gameStarted = true;
  start = Date.now();
  lastMove = Date.now();
  lastHit = 0;
  handsX = null;
  handsSoundPlayed = false;
  canPass = false;
  shiftOnJump = false;
  animFrame = 0;
  atk = false;
  atkStart = 0;
  MP = 100;
  HP = 100;
  groggyEndTime = 0;
  
  bgMusic.play().catch(err => console.log('배경음악 재생 실패:', err));
  lastMPUp = Date.now();
  lastMPDec = 0;
  lastShiftDec = 0;
  lastKey = null;
  
  monsters.forEach(monster => {
    monster.x = monster.initX;
    if (monster.image && monster.image.complete) {
      monster.y = (groundY + 30) - monster.height;
    }
    monster.lastHit = false;
  });
  
  const firstMonster = monsters[0];
  if (firstMonster) {
    player.x = firstMonster.x + firstMonster.width + 100;
  }
  player.y = (groundY + 30) - player.height;
  player.ySpeed = 0;
  player.grounded = false;
  player.facingRight = true;
  cameraX = 0;
  
  canvas.style.transform = 'none';
  
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
update();
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);
