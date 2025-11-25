const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mapWidth = 15000;
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
let items = [];

const updateMonster = (monster, deltaTime) => {
  const dt = deltaTime || 1/60;
  if (monster.knockbackX) {
    monster.x += monster.knockbackX * dt * 60;
    monster.knockbackX *= Math.pow(0.95, dt * 60);
    if (Math.abs(monster.knockbackX) < 0.1) monster.knockbackX = 0;
    monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
  }
  
  if (monster.id === 'crux') {
    const now = Date.now();
    const canJump = now - monster.lastJumpTime >= monster.jumpCooldown;
    const shouldChase = Math.abs(monster.x - player.x) <= 3000 && !isCrawling();
    
    if (shouldChase) {
      monster.wasChasing = true;
      const dir = monster.x < player.x ? 1 : -1;
      monster.x += monster.speed * dir * dt * 60;
      monster.facingRight = dir > 0;
      monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
      
      if (canJump && Math.abs(monster.x - player.x) < 500) {
        const {w: pW, h: pH} = getHitbox();
        const pBottom = player.y + pH;
        let isPlayerOnPlatform = false;
        
        platforms.forEach(p => {
          const isTop = pBottom >= p.y && pBottom <= p.y + 5;
          if (isTop && player.x + pW > p.x && player.x < p.x + p.width) {
            isPlayerOnPlatform = true;
          }
        });
        
        if (isPlayerOnPlatform) {
          const targetY = player.y;
          const distY = targetY - monster.y;
          if (distY < 0) {
            const jumpHeight = Math.abs(distY);
            monster.ySpeed = -Math.sqrt(2 * monster.gravity * jumpHeight * 60);
            monster.lastJumpTime = now;
          }
        }
      }
    } else {
      const wasChasing = monster.wasChasing || false;
      const needNewTarget = wasChasing && !shouldChase || !monster.targetX || !monster.nextDirectionChange || now >= monster.nextDirectionChange;
      if (needNewTarget) {
        monster.targetX = Math.random() * (mapWidth - monster.width);
        monster.facingRight = monster.x < monster.targetX;
        monster.nextDirectionChange = now + (8000 + Math.random() * 12000);
      }
      monster.wasChasing = false;
      const dir = monster.x < monster.targetX ? 1 : -1;
      monster.x += monster.speed * dir * dt * 60;
      monster.facingRight = dir > 0;
      monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
    }
    
    monster.ySpeed += monster.gravity * dt * 60;
    if (monster.ySpeed > 8) monster.ySpeed = 8;
    monster.y += monster.ySpeed * dt * 60;
    
    const groundLevel = (groundY + 30) - monster.height;
    if (monster.y > groundLevel) {
      monster.y = groundLevel;
      monster.ySpeed = 0;
    }
  } else {
    monster.y = (groundY + 30) - monster.height + Math.sin(animFrame * 3) * 2;
    
    const shouldChase = Math.abs(monster.x - player.x) <= 3000 && !isCrawling();
    
    if (shouldChase) {
      monster.wasChasing = true;
      const dir = monster.x < player.x ? 1 : -1;
      monster.x += monster.speed * dir * dt * 60;
      monster.facingRight = dir > 0;
      monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
    } else {
      const now = Date.now();
      const wasChasing = monster.wasChasing || false;
      const needNewTarget = wasChasing && !shouldChase || !monster.targetX || !monster.nextDirectionChange || now >= monster.nextDirectionChange;
      if (needNewTarget) {
        monster.targetX = Math.random() * (mapWidth - monster.width);
        monster.facingRight = monster.x < monster.targetX;
        monster.nextDirectionChange = now + (8000 + Math.random() * 12000);
      }
      monster.wasChasing = false;
      const dir = monster.x < monster.targetX ? 1 : -1;
      monster.x += monster.speed * dir * dt * 60;
      monster.facingRight = dir > 0;
      monster.x = Math.max(0, Math.min(mapWidth - monster.width, monster.x));
    }
  }
};

const drawMonster = (monster) => {
  const x = monster.x - cameraX + (Math.random() - 0.5) * 2;
  const y = monster.y + (Math.random() - 0.5) * 2;
  ctx.save();
  if (!monster.facingRight) {
    ctx.translate(x + monster.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(monster.image, 0, y, monster.width, monster.height);
  } else {
    ctx.drawImage(monster.image, x, y, monster.width, monster.height);
  }
  ctx.restore();
};

const onCollide = (monster) => {
  const now = Date.now();
  if (now - lastHit >= hitCD) {
    HP = Math.max(0, HP - monster.damage);
    lastHit = now;
    mpDecTime = now;
    hpDecTime = now;
    monster.lastHit = true;
    hpHideTime = 0;
    
    if (monster.id === 'crux') {
      if (!player.knockbackX) {
        const dir = monster.x < player.x ? -1 : 1;
        player.knockbackX = dir * 15;
      }
    }
  }
};

const createMonster = (id, x) => {
  const base = {
    id,
    x,
    y: 0,
    image: null,
    lastHit: false,
    facingRight: true,
    targetX: null,
    nextDirectionChange: null,
    wasChasing: false,
    despawnTimer: null
  };
  
  if (id === 'lacera') {
    return {
      ...base,
      initX: x,
      width: 170,
      height: 170,
      speed: 0.5,
      damage: 100,
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
    };
  } else if (id === 'walker') {
    return {
      ...base,
      initX: x,
      width: 150,
      height: 150,
      speed: 0.9,
      damage: 30
    };
  } else if (id === 'crux') {
    return {
      ...base,
      initX: x,
      width: 120,
      height: 120,
      speed: 1.5,
      damage: 0,
      ySpeed: 0,
      jumpCooldown: 3000,
      lastJumpTime: 0,
      gravity: 0.4
    };
  }
  return base;
};

let monsters = [
  createMonster('lacera', 600)
];

let start = Date.now(), elapsed = 0, lastFrameTime = performance.now();
let animFrame = 0;
let gameStarted = false, canPass = false;
let lastMove = Date.now(), lastHit = 0, handsX = null;
const hitCD = 3000;
const MAX_MP = 80, MAX_HP = 100;
let MP = MAX_MP, HP = MAX_HP;
let prevMP = MAX_MP, prevHP = MAX_HP;
let mpHideTime = 1, hpHideTime = 1;
let mpDecTime = 0, hpDecTime = 0;
let groggyEndTime = 0;
let bgMusic = null, handsSound = null, gameoverSound = null, attackSound = null, clickSound = null;
let handsSoundPlayed = false;
let itemCount = 0;
let laceraActive = false;
let messageStartTime = 0;
let lastItemCount = 0;
let collectedItemTypes = {};
let walkerNextSpawn = 0;
let cruxNextSpawn = 0;
let altarMessage = '';
let altarMessageTime = 0;
let gameCleared = false;
let fadeStartTime = 0;
let fadeDuration = 1000;

let resLoaded = 0;
let imageResLoaded = 0;
let audioResLoaded = 0;
let totalImageRes = 0;
let totalAudioRes = 0;
const imgPaths = {
  player: 'images/player/player.png',
  jump: 'images/player/jump.png',
  knifing: 'images/player/knifing.png',
  groggy: 'images/player/groggy.png',
  crawling: 'images/player/crawling.png',
  background: 'images/background/bg_sky.png',
  grass: 'images/background/bg_grass.png',
  trees: 'images/background/bg_trees.png',
  hands: 'images/creature/hands.png',
  platform: 'images/basement/platform.png',
  altar: 'images/basement/alter.png'
};
const monsterImgPaths = {
  lacera: 'images/creature/Lacera.png',
  walker: 'images/creature/walker.png',
  crux: 'images/creature/crux.png'
};
const itemImgPaths = {
  animal_bones: 'images/item/animal_bones.png',
  herb: 'images/item/herb.png',
  ritual_dagger: 'images/item/ritual_dagger.png',
  skull_fragment: 'images/item/skull_fracment.png',
  voodoo_doll: 'images/item/voodoo_doll.png',
  mirror: 'images/item/mirror.png'
};
const totalRes = Object.keys(imgPaths).length + Object.keys(monsterImgPaths).length + Object.keys(itemImgPaths).length + 5;
totalImageRes = Object.keys(imgPaths).length + Object.keys(monsterImgPaths).length + Object.keys(itemImgPaths).length;
totalAudioRes = 5;

document.getElementById('loadingText').textContent = '이미지 로딩 중...';

const checkResLoaded = (isImage = false) => {
  resLoaded++;
  if (isImage) {
    imageResLoaded++;
  } else {
    audioResLoaded++;
  }
  
  const loadingText = document.getElementById('loadingText');
  if (imageResLoaded < totalImageRes) {
    loadingText.textContent = '이미지 로딩 중...';
  } else if (audioResLoaded < totalAudioRes) {
    loadingText.textContent = '오디오 로딩 중...';
  }
  
  if (resLoaded >= totalRes) {
    const btn = document.getElementById('startButton');
    btn.disabled = false;
    btn.textContent = '게임 시작';
    loadingText.style.display = 'none';
  }
};

const loadAudio = (src) => {
  const audio = new Audio(src);
  audio.loop = true;
  audio.oncanplaythrough = () => checkResLoaded(false);
  audio.onerror = () => checkResLoaded(false);
  audio.load();
  return audio;
};

const loadImg = (src, onload) => {
  const img = new Image();
  img.onload = () => { if (onload) onload(img); checkResLoaded(true); };
  img.onerror = () => checkResLoaded(true);
  img.src = src;
  return img;
};

const playerImg = loadImg(imgPaths.player, img => {
  player.height = player.width * (img.naturalHeight / img.naturalWidth);
  player.y = (groundY + 30) - player.height;
});
const jumpImg = loadImg(imgPaths.jump);
const knifingImg = loadImg(imgPaths.knifing);
const groggyImg = loadImg(imgPaths.groggy);
const crawlingImg = loadImg(imgPaths.crawling);
const bgImg = loadImg(imgPaths.background);
const grassImg = loadImg(imgPaths.grass);
const treesImg = loadImg(imgPaths.trees);
const handsImg = loadImg(imgPaths.hands);
const platformImg = loadImg(imgPaths.platform);
const altarImg = loadImg(imgPaths.altar);

bgMusic = loadAudio('audio/bg.mp3');
handsSound = loadAudio('audio/hands.mp3');
handsSound.loop = false;
gameoverSound = loadAudio('audio/gameover.mp3');
gameoverSound.loop = false;
attackSound = loadAudio('audio/attack.mp3');
attackSound.loop = false;
clickSound = loadAudio('audio/click.mp3');
clickSound.loop = false;
const monsterImages = {};
Object.keys(monsterImgPaths).forEach(id => {
  loadImg(monsterImgPaths[id], img => {
    monsterImages[id] = img;
    const monster = monsters.find(m => m.id === id);
    if (monster) {
      monster.height = monster.width * (img.naturalHeight / img.naturalWidth);
      monster.y = (groundY + 30) - monster.height;
      monster.image = img;
    }
  });
});

const itemImages = {};
Object.keys(itemImgPaths).forEach(id => {
  loadImg(itemImgPaths[id], img => {
    itemImages[id] = img;
    items.forEach(item => {
      if (item.id === id) item.image = img;
    });
  });
});

let keys = {}, lastKey = null;
let atk = false, atkStart = 0;
const atkDur = 300;

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
const isCrawling = () => gameStarted && isKeyDown("KeyS", ["s", "S"]);
const isShift = () => keys["Shift"] && !isCrawling();
const isJump = () => isKeyDown("Space", [" "]);
const isDown = () => !isCrawling() && isKeyDown("KeyS", ["s", "S"]);

document.addEventListener("keydown", e => {
  if (e.code) keys[e.code] = true;
  if (e.key) {
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
  }
  if ((e.code === "KeyA" || e.code === "KeyD") || (e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D")) {
    lastKey = e.code || e.key;
  }
  if (isCrawling()) {
    delete keys["Shift"];
    atk = false;
  }
  if (e.code === "KeyS" || e.code === "Space" || e.key === "s" || e.key === "S" || e.key === " ") {
    e.preventDefault();
  }
});

document.addEventListener("keyup", e => {
  if (e.code) delete keys[e.code];
  if (e.key) {
    delete keys[e.key];
    delete keys[e.key.toLowerCase()];
  }
  e.preventDefault();
});

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
      if (gameStarted && attackSound) attackSound.play();
      else if (!gameStarted && clickSound) clickSound.play();
    }
  }
});

const platformData = [
  {x: 0, y: groundY + 30, w: mapWidth, h: 30, type: 'floor'} // 바닥 플랫폼
];

platforms = platformData.map(p => ({
  x: p.x, y: p.y, width: p.w, height: p.h, type: p.type || 'normal'
}));

const generatePlatforms = () => {
  const newPlatforms = [];
  const platformWidth = 150;
  const platformHeight = 50;
  const minSpacing = 500;
  const maxSpacing = 1000;
  const startX = 2000;
  const allPlatforms = [...platforms];
  
  const isOverlapping = (x, y, width, height) => {
    return allPlatforms.filter(p => p.type !== 'floor').some(p => {
      const overlapX = !(x + width < p.x || x > p.x + p.width);
      const overlapY = !(y + height < p.y || y > p.y + p.height);
      return overlapX && overlapY;
    }) || newPlatforms.some(p => {
      const overlapX = !(x + width < p.x || x > p.x + p.width);
      const overlapY = !(y + height < p.y || y > p.y + p.height);
      return overlapX && overlapY;
    });
  };
  
  let currentX = startX;
  
  while (currentX < mapWidth - platformWidth) {
    const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
    const x300 = currentX;
    
    if (!isOverlapping(x300, groundY - 300, platformWidth, platformHeight)) {
      newPlatforms.push({
        x: x300,
        y: groundY - 300,
        width: platformWidth,
        height: platformHeight,
        type: 'normal'
      });
      allPlatforms.push({x: x300, y: groundY - 300, width: platformWidth, height: platformHeight});
      
      const offset200 = (Math.random() > 0.5 ? 150 : -150);
      const x200 = Math.max(startX, Math.min(mapWidth - platformWidth, x300 + offset200));
      if (!isOverlapping(x200, groundY - 200, platformWidth, platformHeight)) {
        newPlatforms.push({
          x: x200,
          y: groundY - 200,
          width: platformWidth,
          height: platformHeight,
          type: 'normal'
        });
        allPlatforms.push({x: x200, y: groundY - 200, width: platformWidth, height: platformHeight});
        
        const offset100 = (Math.random() > 0.5 ? 150 : -150);
        const x100 = Math.max(startX, Math.min(mapWidth - platformWidth, x200 + offset100));
        if (!isOverlapping(x100, groundY - 100, platformWidth, platformHeight)) {
          newPlatforms.push({
            x: x100,
            y: groundY - 100,
            width: platformWidth,
            height: platformHeight,
            type: 'normal'
          });
          allPlatforms.push({x: x100, y: groundY - 100, width: platformWidth, height: platformHeight});
        }
      }
    }
    
    currentX += spacing;
  }
  
  platforms.push(...newPlatforms);
};

const itemTypes = Object.keys(itemImgPaths);
const itemSpacing = 300;
const itemCountPerType = 1;

const generateItemData = () => {
  const data = [];
  const usedX = [];
  const usedIds = [];
  const validPlatforms = platforms.filter(p => p.type !== 'floor');
  const totalItems = itemTypes.length;
  
  if (validPlatforms.length === 0) return data;
  
  for (let i = 0; i < totalItems; i++) {
    let x, platformY, attempts = 0;
    let randomId;
    
    do {
      randomId = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    } while (usedIds.includes(randomId));
    
    usedIds.push(randomId);
    
    do {
      const p = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
      x = p.x + Math.random() * Math.max(0, p.width - 80);
      platformY = p.y;
      attempts++;
    } while (attempts < 50 && usedX.some(ux => Math.abs(x - ux) < itemSpacing));
    
    if (attempts < 50) {
      usedX.push(x);
      data.push({id: randomId, x, platformY});
    }
  }
  
  return data;
};

const createItem = (data) => ({
  id: data.id,
  x: data.x,
  baseY: data.platformY - 50,
  width: 80,
  height: 80,
  image: itemImages[data.id] || null
});

let itemData = generateItemData();
items = itemData.map(createItem);

const getAspect = () => playerImg.naturalHeight / playerImg.naturalWidth;
const getHitbox = () => ({w: player.width, h: player.width * getAspect()});
const getPlayerSize = (img = playerImg) => {
  const ratio = img.naturalWidth / playerImg.naturalWidth;
  return {w: player.width * ratio, h: player.width * ratio * (img.naturalHeight / img.naturalWidth)};
};

const drawBackground = () => {
  const w = bgImg.width, h = bgImg.height;
  const offset = cameraX % w;
  for (let x = -offset; x < canvas.width + w; x += w) {
    ctx.drawImage(bgImg, x, 0, w, canvas.height + 100);
  }
};

const drawRepeat = (img, heightRatio, yPos) => {
  const h = canvas.height * heightRatio;
  const w = img.width * h / img.height;
  const offset = (cameraX * 0.6) % w;
  for (let x = -offset; x < canvas.width + w; x += w) {
    ctx.drawImage(img, x, yPos, w, h);
  }
};

const drawGrass = () => drawRepeat(grassImg, 0.3, canvas.height * 0.75);
const drawTrees = () => drawRepeat(treesImg, 0.25, 0);

const drawAltar = () => {
  const altarX = mapWidth - 700;
  const altarY = groundY - 300;
  const altarWidth = 500;
  const altarHeight = 500;
  
  ctx.drawImage(altarImg, altarX - cameraX, altarY, altarWidth, altarHeight);
  
  const {w: pW, h: pH} = getHitbox();
  const distX = Math.abs(player.x - altarX);
  const distY = Math.abs(player.y - altarY);
  
  if (distX < 300 && distY < 400) {
    const requiredItems = Object.keys(itemImgPaths).filter(id => id !== 'mirror');
    const hasAllItems = requiredItems.every(id => collectedItemTypes[id]);
    
    const textX = altarX - cameraX + altarWidth / 2;
    const textY = altarY - 50;
    const textWidth = 400;
    
    if (altarMessageTime > 0) {
      const now = Date.now();
      if (now - altarMessageTime < 2000) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(textX - textWidth / 2, textY - 20, textWidth, 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px GameFont';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(altarMessage, textX, textY);
        ctx.restore();
      } else {
        altarMessageTime = 0;
      }
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(textX - textWidth / 2, textY - 20, textWidth, 40);
      ctx.fillStyle = 'white';
      ctx.font = '20px GameFont';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E를 눌러 활성화 하세요.', textX, textY);
      ctx.restore();
    }
  }
};

const checkAltar = () => {
  if (gameCleared) return;
  
  const altarX = mapWidth - 700;
  const {w: pW, h: pH} = getHitbox();
  const distX = Math.abs(player.x - altarX);
  const distY = Math.abs(player.y - (groundY - 300));
  
  if (distX < 300 && distY < 400) {
    const requiredItems = Object.keys(itemImgPaths).filter(id => id !== 'mirror');
    const hasAllItems = requiredItems.every(id => collectedItemTypes[id]);
    
    if (isKeyDown("KeyE", ["e", "E"])) {
      if (hasAllItems) {
        gameCleared = true;
        showGameClear();
      } else {
        altarMessage = '제단을 활성화 시킬 재료가 부족합니다.';
        altarMessageTime = Date.now();
      }
    }
  }
};

const drawFade = () => {
  if (fadeStartTime === 0) return;
  
  const now = Date.now();
  const elapsed = now - fadeStartTime;
  
  if (elapsed >= fadeDuration) {
    fadeStartTime = 0;
    return;
  }
  
  const alpha = 1 - (elapsed / fadeDuration);
  
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
};

const showGameClear = () => {
  gameStarted = false;
  if (bgMusic) bgMusic.pause();
  document.getElementById('gameClearTime').textContent = "클리어 시간: " + elapsed + "초";
  document.getElementById('gameClearScreen').style.display = 'flex';
};

const drawPlayer = () => {
  let img;
  const now = Date.now();
  const isGroggy = now < groggyEndTime;
  const isAtk = atk && (now - atkStart) < atkDur;
  
  if (isCrawling()) {
    img = crawlingImg;
  } else if (isGroggy) {
    img = groggyImg;
  } else if (isAtk) {
    img = knifingImg;
  } else {
    atk = false;
    img = player.grounded ? playerImg : jumpImg;
  }
  
  const {w, h} = getPlayerSize(img);
  const {w: hbW, h: hbH} = getHitbox();
  
  let x, y;
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
    y = player.y;
  } else {
    const hbCenterX = player.x + hbW / 2;
    x = hbCenterX - w / 2 - cameraX;
    y = isCrawling() ? player.y + hbH - h : player.y;
  }
  
  const dir = getDir();
  const yOffset = (player.grounded && (dir.left || dir.right)) || isGroggy ? Math.sin(animFrame * 0.3) * 1.5 : 0;
  
  ctx.save();
  if (!player.facingRight) {
    ctx.translate(x + w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, y + yOffset, w, h);
  } else {
    ctx.drawImage(img, x, y + yOffset, w, h);
  }
  ctx.restore();
}

const drawPlatforms = () => platforms.forEach(p => {
  ctx.drawImage(platformImg, p.x - cameraX, p.y, p.width, p.height);
});


const drawItem = (item) => {
  if (!item.image) return;
  const x = item.x - cameraX;
  const y = item.baseY + Math.sin(animFrame * 0.3 + item.x * 0.01) * 1;
  
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(item.image, x, y, item.width, item.height);
  ctx.restore();
};

const checkItemCollision = () => {
  const {w: pW, h: pH} = getHitbox();
  const beforeCount = items.length;
  const collectedItems = [];
  items = items.filter(item => {
    const itemY = item.baseY + Math.sin(animFrame * 0.3 + item.x * 0.01) * 1;
    const isCol = player.x + pW > item.x && player.x < item.x + item.width &&
                  player.y + pH > itemY && player.y < itemY + item.height;
    if (isCol) collectedItems.push(item);
    return !isCol;
  });
  const collected = beforeCount - items.length;
  if (collected > 0) {
    collectedItems.forEach(item => {
      if (item.id === 'mirror') {
        handsX = null;
        fadeStartTime = Date.now();
      } else {
        collectedItemTypes[item.id] = true;
      }
    });
    itemCount += collected;
    if (itemCount >= 3 && !laceraActive) {
      laceraActive = true;
      messageStartTime = Date.now();
      const lacera = monsters.find(m => m.id === 'lacera');
      if (lacera) lacera.x = player.x + 100;
    }
    if (laceraActive && itemCount > lastItemCount) {
      const lacera = monsters.find(m => m.id === 'lacera');
      if (lacera) lacera.x = Math.max(0, Math.min(mapWidth - lacera.width, player.x + (Math.random() > 0.5 ? 1500 : -1500)));
    }
    lastItemCount = itemCount;
  }
};

const drawItemUI = () => {
  const itemTypesToShow = Object.keys(itemImgPaths).filter(id => id !== 'mirror');
  const itemSize = 50;
  const spacing = 10;
  const totalWidth = itemTypesToShow.length * (itemSize + spacing) - spacing;
  const startX = (canvas.width - totalWidth) / 2;
  const y = 20;
  
  itemTypesToShow.forEach((id, index) => {
    const x = startX + index * (itemSize + spacing);
    const hasItem = collectedItemTypes[id];
    
    if (hasItem && itemImages[id]) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(itemImages[id], x, y, itemSize, itemSize);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('획득', x + itemSize / 2, y + itemSize + 15);
      ctx.restore();
    }
  });
};

const drawMessage = () => {
  if (messageStartTime === 0) return;
  const now = Date.now();
  const elapsed = (now - messageStartTime) / 1000;
  if (elapsed > 3) {
    messageStartTime = 0;
    return;
  }
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('누군가 당신을 쫓고 있습니다.', canvas.width / 2, canvas.height / 2);
  ctx.restore();
};

const drawTime = () => {
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText("Time: " + elapsed + "초", 10, 20);
};

const drawGauge = (value, y, colors, maxValue = MAX_HP) => {
  const pScreenX = player.x - cameraX;
  const radius = 10, lw = 5;
  const cx = pScreenX - radius, cy = player.y + y;
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
  ctx.lineWidth = lw;
  ctx.stroke();
  
  const start = -Math.PI / 2;
  const end = start - (Math.PI * 2 * pct / 100);
  const [r1, g1, b1, r2, g2, b2] = colors;
  const ratio = pct > 50 ? (pct - 50) / 50 : pct / 50;
  const r = r1 + (r2 - r1) * ratio;
  const g = g1 + (g2 - g1) * ratio;
  const b = b1 + (b2 - b1) * ratio;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end, true);
  ctx.strokeStyle = `rgb(${r|0}, ${g|0}, ${b|0})`;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.stroke();
};

const drawMPBar = () => {
  if (MP >= MAX_MP && mpHideTime > 0) return;
  drawGauge(MP, 50, [0, 0, 255, 0, 255, 255], MAX_MP);
};
const drawHPBar = () => {
  if (HP >= MAX_HP && hpHideTime > 0) return;
  drawGauge(HP, 20, [255, 0, 0, 255, 255, 0], MAX_HP);
};

const drawInvBar = () => {
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
};

const updateHands = (deltaTime) => {
  const dt = deltaTime || 1/60;
  const h = canvas.height, w = handsImg.width * h / handsImg.height;
  if (handsX === null) handsX = cameraX - w;
  const handsSpeed = HP <= 0 ? 22 : 0.5;
  if (handsX < mapWidth) handsX += handsSpeed * dt * 60;
};

const getHandsPos = () => {
  if (handsX === null) return null;
  
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
};

const drawHands = () => {
  const pos = getHandsPos();
  if (pos) ctx.drawImage(handsImg, pos.x, pos.y, pos.w, pos.h);
};

const drawFlashlight = () => {
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
};

const handleKnockback = () => {
  const isAtk = atk && (Date.now() - atkStart) < atkDur;
  if (!isAtk) return;
  const {w: pW, h: pH} = getHitbox();
  const atkRange = 150, pCX = player.x + pW / 2;
  monsters.forEach(monster => {
    const mCX = monster.x + monster.width / 2;
    const distX = Math.abs(mCX - pCX);
    const distY = Math.abs((monster.y + monster.height / 2) - (player.y + pH / 2));
    const inDir = player.facingRight ? mCX > pCX : mCX < pCX;
    if (distX <= atkRange && distY <= pH / 2 + monster.height / 2 && inDir) {
      if (!monster.knockbackX) monster.knockbackX = player.facingRight ? 15 : -15;
    }
  });
};

const spawnMonster = (id) => {
  const dir = player.facingRight ? 1 : -1;
  const offset = dir * 1500;
  const spawnX = Math.max(0, Math.min(mapWidth - 200, player.x + offset));
  const monster = createMonster(id, spawnX);
  
  if (monsterImages[id]) {
    monster.image = monsterImages[id];
    monster.height = monster.width * (monsterImages[id].naturalHeight / monsterImages[id].naturalWidth);
    monster.y = (groundY + 30) - monster.height;
  }
  
  monsters.push(monster);
};

const updateSpawns = () => {
  const now = Date.now();
  const gameTime = (now - start) / 1000;
  
  if (gameTime >= 5) {
    const walkerCount = monsters.filter(m => m.id === 'walker').length;
    if (walkerCount < 10 && now >= walkerNextSpawn) {
      spawnMonster('walker');
      walkerNextSpawn = now + (6000 + Math.random() * 4000);
    }
    
    const cruxCount = monsters.filter(m => m.id === 'crux').length;
    if (cruxCount < 2 && now >= cruxNextSpawn) {
      spawnMonster('crux');
      cruxNextSpawn = now + (10000 + Math.random() * 5000);
    }
  }
};

const updateMonsters = (deltaTime) => {
  const now = Date.now();
  const despawnDistance = 2000;
  
  monsters = monsters.filter(monster => {
    if (monster.id === 'lacera' && !laceraActive) return true;
    
    const distX = Math.abs(monster.x - player.x);
    
    if (distX > despawnDistance) {
      if (monster.despawnTimer === null) {
        monster.despawnTimer = now;
      } else if (now - monster.despawnTimer >= 5000) {
        return false;
      }
    } else {
      monster.despawnTimer = null;
    }
    
    updateMonster(monster, deltaTime);
    if (!isCrawling()) {
      const {w: pW, h: pH} = getHitbox();
      const isCol = player.x + pW > monster.x && player.x < monster.x + monster.width &&
                    player.y + pH > monster.y && player.y < monster.y + monster.height;
      if (isCol) onCollide(monster);
      else monster.lastHit = false;
    }
    return true;
  });
  if (!isCrawling()) handleKnockback();
};

const getEffects = () => {
  const m = monsters.find(m => m.getEffects && (m.id !== 'lacera' || laceraActive));
  return m ? m.getEffects(m) : { zoom: 1.0, shake: { x: 0, y: 0 } };
};

const drawMonsters = () => monsters.forEach(monster => {
  if (monster.id === 'lacera' && !laceraActive) return;
  drawMonster(monster);
});

const updateMP = (deltaTime) => {
  const dt = deltaTime || 1/60;
  const now = Date.now();
  const isGroggy = now < groggyEndTime;
  const shiftPressed = isShift() && !isGroggy;
  
  if (now >= groggyEndTime && groggyEndTime > 0) groggyEndTime = 0;
  
  if (shiftPressed) {
    MP = Math.max(0, MP - 10 * dt);
    if (MP > 0) mpDecTime = now;
    if (MP <= 0) {
      if (groggyEndTime === 0) {
        groggyEndTime = now + 1600;
        mpDecTime = now;
        delete keys["Shift"];
        atk = false;
      }
    }
  }
  
  if (MP <= 0) {
    if (now >= groggyEndTime) MP = Math.min(MAX_MP, MP + 20 * dt);
  } else if (now - mpDecTime >= 1600) {
    MP = Math.min(MAX_MP, MP + 10 * dt);
  }
  
  if (MP >= MAX_MP && prevMP < MAX_MP) mpHideTime = 1;
  else if (MP !== prevMP && MP < MAX_MP) mpHideTime = 0;
  prevMP = MP;
};

const updateHP = (deltaTime) => {
  const dt = deltaTime || 1/60;
  const now = Date.now();
  
  if (now - hpDecTime >= 2000) {
    HP = Math.min(MAX_HP, HP + 1 * dt);
  }
};

const updatePlayerMovement = (deltaTime) => {
  const dt = deltaTime || 1/60;
  const now = Date.now();
  const isGroggy = now < groggyEndTime;
  const isAtk = atk && (now - atkStart) < atkDur;
  const crawling = isCrawling();
  
  if (player.knockbackX) {
    player.x += player.knockbackX * dt * 60;
    player.knockbackX *= Math.pow(0.95, dt * 60);
    if (Math.abs(player.knockbackX) < 0.1) player.knockbackX = 0;
    player.x = Math.max(0, Math.min(mapWidth - player.width, player.x));
  }
  
  if (isGroggy || isAtk) {
    player.ySpeed += player.gravity * dt * 60;
    if (player.ySpeed > 8) player.ySpeed = 8;
    player.y += player.ySpeed * dt * 60;
    return;
  }
  
  const shift = isShift() && !isGroggy;
  const baseSpeed = shift ? 7 : 3;
  const speed = crawling ? baseSpeed * 0.5 : baseSpeed;
  const { left, right } = getDir();
  const jump = isJump();
  const down = isDown();
  
  if (left || right || jump) lastMove = Date.now();
  if (left) { player.x -= speed * dt * 60; player.facingRight = false; }
  if (right) { player.x += speed * dt * 60; player.facingRight = true; }
  player.x = Math.max(0, Math.min(mapWidth - player.width, player.x));
  
  if (!crawling && player.grounded && jump && !down) {
    player.ySpeed = player.jumpPower;
    player.grounded = false;
  }
  
  player.ySpeed += player.gravity * dt * 60;
  if (player.ySpeed > 8) player.ySpeed = 8;
  player.y += player.ySpeed * dt * 60;
  
  const px = player.x - cameraX;
  const minX = canvas.width * 0.3;
  const maxX = canvas.width * 0.35;
  if (px < minX) cameraX = player.x - minX;
  else if (px > maxX) cameraX = player.x - maxX;
  cameraX = Math.max(0, Math.min(mapWidth - canvas.width, cameraX));
};

const checkCollision = () => {
  const {w: pW, h: pH} = getHitbox();
  player.grounded = false;
  
  const pBottom = player.y + pH;
  const down = isDown();
  const jump = isJump();
  canPass = (down && jump);
  
  platforms.forEach(p => {
    const isFloor = p.type === 'floor';
    const shouldCol = isFloor || !canPass;
    const isColX = player.x + pW > p.x && player.x < p.x + p.width;
    
    if (!isColX) return;
    
    if (isFloor) {
      const isTop = pBottom >= p.y && pBottom <= p.y + 30;
      const isInside = player.y + pH > p.y && player.y < p.y + p.height;
      
      if (isInside || isTop) {
        player.y = p.y - pH;
        player.ySpeed = 0;
        player.grounded = true;
      }
    } else if (shouldCol) {
      const isTop = pBottom >= p.y && pBottom <= p.y + 20;
      const isAbove = player.y + pH <= p.y + p.height;
      if (isAbove && isTop) {
        player.y = p.y - pH;
      player.ySpeed = 0;
      player.grounded = true;
      }
    }
  });
};

const checkGameOver = () => {
  const pos = getHandsPos();
  if (pos) {
    const pScreenX = player.x - cameraX;
    const {w: pW, h: pH} = getHitbox();
    
    const isColliding = pScreenX + pW > pos.hitboxX && pScreenX < pos.hitboxX + pos.hitboxW &&
        player.y + pH > pos.y && player.y < pos.y + pos.h;
    
    if (isColliding && !handsSoundPlayed && handsSound) {
      handsSound.play();
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
};

const showGameOver = () => {
  gameStarted = false;
  if (gameoverSound) {
    gameoverSound.play();
  }
  document.getElementById('gameOverTime').textContent = "생존 시간: " + elapsed + "초";
  document.getElementById('gameOverScreen').style.display = 'flex';
};

const validateKeys = () => {
  if (Date.now() - lastMove > 1000) {
    const { left, right } = getDir();
    if (!left && !right && !isJump()) {
      const wasCrawling = isCrawling();
      keys = {};
      if (wasCrawling) {
        keys["KeyS"] = true;
        keys["s"] = true;
        keys["S"] = true;
      }
    }
  }
};

const update = () => {
  if (!gameStarted) return;
  
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  animFrame += deltaTime * 60;
  validateKeys();
  checkCollision();
  updatePlayerMovement(deltaTime);
  updateSpawns();
  updateMonsters(deltaTime);
  updateHands(deltaTime);
  checkItemCollision();
  checkAltar();
  elapsed = ((Date.now() - start) / 1000).toFixed(1);
  
  updateMP(deltaTime);
  updateHP(deltaTime);
  
  if (HP >= MAX_HP && prevHP < MAX_HP) hpHideTime = 1;
  else if (HP !== prevHP && HP < MAX_HP) hpHideTime = 0;
  prevHP = HP;
  
  const { zoom, shake } = getEffects();
  
  const pScreenX = player.x - cameraX;
  const pScreenY = player.y;
  canvas.style.transformOrigin = `${pScreenX}px ${pScreenY}px`;
  canvas.style.transform = `translate(${shake.x}px, ${shake.y}px) scale(${zoom})`;
  
  drawBackground();
  drawPlatforms();
  drawAltar();
  drawMonsters();
  items.forEach(drawItem);
  drawPlayer();
  drawTrees();
  drawGrass();
  drawHands();
  drawFlashlight();
  
  drawTime();
  drawMPBar();
  drawHPBar();
  drawInvBar();
  drawMessage();
  drawItemUI();
  drawFade();
  
  if (!checkGameOver()) requestAnimationFrame(update);
};

const startGame = () => {
  gameStarted = true;
  start = Date.now();
  lastMove = Date.now();
  lastHit = 0;
  handsX = null;
  handsSoundPlayed = false;
  canPass = false;
  animFrame = 0;
  atk = false;
  atkStart = 0;
  MP = MAX_MP;
  HP = MAX_HP;
  prevMP = MAX_MP;
  prevHP = MAX_HP;
  mpHideTime = 1;
  hpHideTime = 1;
  groggyEndTime = 0;
  itemCount = 0;
  laceraActive = false;
  messageStartTime = 0;
  lastItemCount = 0;
  collectedItemTypes = {};
  walkerNextSpawn = start + 5000;
  altarMessage = '';
  altarMessageTime = 0;
  gameCleared = false;
  cruxNextSpawn = start + 5000;
  fadeStartTime = 0;
  
  platforms = platformData.map(p => ({
    x: p.x, y: p.y, width: p.w, height: p.h, type: p.type || 'normal'
  }));
  generatePlatforms();
  
  bgMusic.play();
  mpDecTime = 0;
  hpDecTime = 0;
  lastKey = null;
  
  monsters = [createMonster('lacera', 600)];
  monsters.forEach(monster => {
    if (monsterImages[monster.id]) {
      monster.image = monsterImages[monster.id];
      monster.height = monster.width * (monsterImages[monster.id].naturalHeight / monsterImages[monster.id].naturalWidth);
      monster.y = (groundY + 30) - monster.height;
    }
    monster.x = monster.initX;
    monster.y = (groundY + 30) - monster.height;
    monster.lastHit = false;
    monster.facingRight = true;
    monster.targetX = null;
    monster.nextDirectionChange = null;
    monster.wasChasing = false;
    monster.despawnTimer = null;
    if (monster.id === 'crux') {
      monster.ySpeed = 0;
      monster.lastJumpTime = 0;
    }
  });
  
  itemData = generateItemData();
  items = itemData.map(createItem);
  
  const firstMonster = monsters[0];
  if (firstMonster) player.x = firstMonster.x + firstMonster.width + 100;
  player.y = (groundY + 30) - player.height;
  player.ySpeed = 0;
  player.grounded = false;
  player.facingRight = true;
  player.knockbackX = 0;
  cameraX = 0;
  
  canvas.style.transform = 'none';
  
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('gameClearScreen').style.display = 'none';
update();
};

const tutorialData = [
  { 
    id: 'movementAndAttack', 
    title: '이동과 공격', 
    description: `이동과 공격
[A, D] 키를 사용하여 좌우로 이동하고, 스페이스바를 눌러 점프할 수 있습니다.

[S] 키를 눌러 기어갈 수 있습니다.
이동속도가 줄어드는 대신, 몬스터의 추격을 회피할 수 있습니다.

[Shift] 키를 누르고 있으면 MP를 소모해 빠르게 달릴 수 있습니다.
MP를 모두 소모하면 그로기 상태에 빠져 행동이 불가능해집니다.

[마우스 좌클릭]으로 공격할 수 있습니다.
몬스터를 죽이진 못하지만 밀쳐낼 수 있습니다.` 
  },
  { 
    id: 'chase', 
    title: '끊임없는 추격', 
    description: `끊임없는 추격
    무수한 손들이 플레이어를 추격합니다.
    무수한 손들에 닿이면 즉시 게임오버가 되며, HP가 0이 되면 무수한 손들이 즉시 플레이어를 덮칩니다.
    
    [거울] 아이템을 획득하면 무수한 손들의 위협에서 잠시 벗어날 수 있습니다.` 
  },
  { 
    id: 'items', 
    title: '부두술 도구', 
    description: `부두술 도구
총 5가지의 부두술 도구가 존재합니다.

맵에 흩어진 부두술 도구를 수집해 제단을 활성화 시킬 수 있습니다.
모든 부두술 도구를 모아 제단을 활성화 시켜 게임을 클리어하십시오.` 
  },
  { 
    id: 'monsters', 
    title: '피조물', 
    description: `피조물
[WALKER] - 특별할 것 없는 몬스터입니다.
하지만 시간이 지날수록 플레이어를 추격하는 WALKER들이 늘어납니다.

[CRUX] - 플레이어에게 데미지를 입힐 수 없지만,
빠른 이동속도와 점프 능력으로 플레이어를 밀쳐낼 수 있습니다.

[LACERA] - 플레이어가 부두술 도구를 3개 수집시 등장합니다.
플레이어의 공격이 통하지 않으며, 닿는 즉시 무수한 손들을 불러옵니다.` 
  }
];

const initTutorial = () => {
  const tutorialScreen = document.getElementById('tutorialScreen');
  const tutorialItems = document.getElementById('tutorialItems');
  const tutorialDescription = document.getElementById('tutorialDescription');
  const tutorialButton = document.getElementById('tutorialButton');
  const closeButton = document.querySelector('.tutorial-close');
  
  tutorialData.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'tutorial-item';
    if (index === 0) div.classList.add('active');
    div.textContent = item.title;
    div.addEventListener('click', () => {
      document.querySelectorAll('.tutorial-item').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      const lines = item.description.split('\n');
      const title = lines[0];
      const content = lines.slice(1).join('\n');
      tutorialDescription.innerHTML = `<h3>${title}</h3><div class="tutorial-text">${content.replace(/\n/g, '<br>')}</div>`;
    });
    tutorialItems.appendChild(div);
  });
  
  if (tutorialData.length > 0) {
    const lines = tutorialData[0].description.split('\n');
    const title = lines[0];
    const content = lines.slice(1).join('\n');
    tutorialDescription.innerHTML = `<h3>${title}</h3><div class="tutorial-text">${content.replace(/\n/g, '<br>')}</div>`;
  }
  
  tutorialButton.addEventListener('click', () => {
    tutorialScreen.style.display = 'flex';
  });
  
  closeButton.addEventListener('click', () => {
    tutorialScreen.style.display = 'none';
  });
  
  tutorialScreen.addEventListener('click', (e) => {
    if (e.target === tutorialScreen) {
      tutorialScreen.style.display = 'none';
    }
  });
};

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('restartButton2').addEventListener('click', startGame);
initTutorial();
