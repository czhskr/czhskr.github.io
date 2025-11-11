// 🎮 우주 슈팅 게임 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ▶ 게임 설정 상수
const CONFIG = {
  // 플레이어 설정
  PLAYER: {
    INIT_X: 180,
    INIT_Y: 520,
    WIDTH: 45,  // 30 * 1.5
    HEIGHT: 60,  // 40 * 1.5
    SPEED: 5
  },
  // 드론 설정
  DRONE: {
    WIDTH: 25,  // 드론 가로 크기
    HEIGHT: 40  // 드론 세로 크기
  },
  // 총알 설정
  BULLET: {
    WIDTH: 12,  // 4 * 1.5
    HEIGHT: 45,  // 10 * 1.5
    SPEED: 7,
    SHOOT_INTERVAL: 300  // 발사 간격 (ms)
  },
  // 적 설정
  ENEMY: {
    WIDTH: 60,  // 40 * 1.5
    HEIGHT: 60,  // 40 * 1.5
    SPEED: 2,
    SPAWN_INTERVAL: 1000  // 적 생성 간격 (ms)
  },
  // 적 총알 설정
  ENEMY_BULLET: {
    WIDTH: 6,  // 4 * 1.5
    HEIGHT: 15,  // 10 * 1.5
    SPEED: 4,
    SHOOT_INTERVAL: 1500  // 적 총알 발사 간격 (ms)
  },
  // 아이템 설정
  ITEM: {
    WIDTH: 15,
    HEIGHT: 15,
    SPEED: 2,
    SPAWN_RATE: 0.1  // 아이템 생성 확률
  },
  // 게임 설정
  GAME: {
    INIT_LIFE: 3
  },
  // 골드 획득량 설정
  GOLD: {
    ENEMY: {
      MIN: 3,    // 적 처치 시 최소 골드
      MAX: 6     // 적 처치 시 최대 골드
    },
    BOSS: [50, 75, 100],  // 보스 스테이지별 처치 보수 (스테이지 1, 2, 3)
    STAGE_CLEAR: [100, 150, 200]   // 스테이지별 클리어 보수 (스테이지 1, 2, 3)
  },
  // 별 배경 설정
  STARS: {
    COUNT: 50
  },
  // 스테이지 설정
  STAGE: {
    CLEAR_ENEMIES: [20, 30, 35]  // 각 스테이지 보스 등장에 필요한 적 처치 수
  },
  // 보스 설정
  BOSS: {
    // 스테이지별 보스 설정
    STAGE_1: {
      maxHp: 30,  // 스테이지 1 보스 최대 체력
      image: "images/boss1.png",
      bgm: "audio/boss.mp3",
      WIDTH: 300,  // 보스 가로 크기 (200 * 1.5)
      HEIGHT: 225,  // 보스 세로 크기 (150 * 1.5)
      TARGET_X: null,  // 보스 목표 x 위치 (null이면 캔버스 중앙)
      TARGET_Y: 20,  // 보스 목표 y 위치
      SPEED: 2,  // 보스 이동 속도
      bulletImage: "images/boss1bullet.png",
      bulletWidth: 12,  // 보스 총알 가로 크기
      bulletHeight: 45  // 보스 총알 세로 크기
    },
    STAGE_2: {
      maxHp: 60,  // 스테이지 2 보스 최대 체력
      image: "images/boss2.png",
      bgm: "audio/boss.mp3",
      WIDTH: 150,  // 보스 가로 크기 (100 * 1.5)
      HEIGHT: 150,  // 보스 세로 크기 (100 * 1.5)
      TARGET_X: null,  // 보스 목표 x 위치 (null이면 캔버스 중앙)
      TARGET_Y: 100,  // 보스 목표 y 위치
      SPEED: 2,  // 보스 이동 속도
      bulletImage: "images/boss2bullet.png",
      bulletWidth: 22,  // 보스 총알 가로 크기
      bulletHeight: 45  // 보스 총알 세로 크기
    },
    STAGE_3: {
      maxHp: 100,  // 스테이지 3 보스 최대 체력
      image: "images/boss3.png",
      bgm: "audio/boss.mp3",
      WIDTH: 600,  // 보스 가로 크기 (400 * 1.5)
      HEIGHT: 750,  // 보스 세로 크기 (500 * 1.5)
      TARGET_X: null,  // 보스 목표 x 위치 (null이면 캔버스 중앙)
      TARGET_Y: -580,  // 보스 목표 y 위치
      SPEED: 1,  // 보스 이동 속도
      bulletImage: "images/boss3bullet.png",
      bulletWidth: 13,  // 보스 총알 가로 크기
      bulletHeight: 60  // 보스 총알 세로 크기
    }
  }
};

// ▶ 리소스 로딩 시스템
const resources = {
  images: {},
  audio: {}
};

// ▶ 이미지 로드 (통합)
const imageFiles = [
  { key: "player", src: "images/player.png" },
  { key: "atkdrone", src: "images/atkdrone.png" },
  { key: "alien", src: "images/enemy.png" },
  { key: "title", src: "images/title.png" },
  { key: "boss1", src: "images/boss1.png" },
  { key: "boss2", src: "images/boss2.png" },
  { key: "boss3", src: "images/boss3.png" },
  { key: "minion", src: "images/minion.png" },
  { key: "stage1", src: "images/stage1.png" },
  { key: "stage2", src: "images/stage2.png" },
  { key: "stage3", src: "images/stage3.png" },
  { key: "infinite", src: "images/infinite.png" },
  { key: "item", src: "images/item.png" },
  { key: "bullet", src: "images/bullet.png" }
];

imageFiles.forEach(img => {
  const image = new Image();
  image.src = img.src;
  resources.images[img.key] = image;
});

// ▶ 보스 총알 이미지 로드 (동적)
Object.keys(CONFIG.BOSS).forEach(stageKey => {
  const stageConfig = CONFIG.BOSS[stageKey];
  if (stageConfig.bulletImage) {
    const bulletImage = new Image();
    bulletImage.src = stageConfig.bulletImage;
    const imageName = stageConfig.bulletImage.replace("images/", "").replace(".png", "");
    resources.images[imageName] = bulletImage;
  }
});

// ▶ 오디오 파일 로드
const audioFiles = [
  { name: "title", src: "audio/title.mp3" },
  { name: "shoot", src: "audio/shoot.mp3" },
  { name: "hit", src: "audio/hit.mp3" },
  { name: "gameover", src: "audio/gameover.mp3" },
  { name: "item", src: "audio/item.mp3" },
  { name: "explosion", src: "audio/explosion.mp3" },
  { name: "warning", src: "audio/warning.mp3" },
  { name: "upgrade", src: "audio/upgrade.mp3" },
  { name: "boss", src: "audio/boss.mp3" }
];

audioFiles.forEach(audio => {
  const audioEl = new Audio(audio.src);
  audioEl.preload = "auto";
  resources.audio[audio.name] = audioEl;
});

// ▶ 리소스 로딩 완료 대기
let loadedCount = 0;
const totalResources = Object.keys(resources.images).length + audioFiles.length;

function checkResourceLoaded() {
  loadedCount++;
  if (loadedCount >= totalResources) {
    const loadingScreen = document.getElementById("loadingScreen");
    const titleScreen = document.getElementById("titleScreen");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (titleScreen) titleScreen.style.display = "flex";
    // 타이틀 배경음 재생
    const titleBgm = document.getElementById("titleBgm");
    if (titleBgm) {
      try {
        updateBgmVolume();
        titleBgm.play().catch(() => {});
      } catch {}
    }
  }
}

// 이미지 로드 완료 이벤트
Object.values(resources.images).forEach(img => {
  if (img.complete) {
    checkResourceLoaded();
  } else {
    img.onload = checkResourceLoaded;
    img.onerror = checkResourceLoaded;
  }
});

// 오디오 로드 완료 이벤트
Object.values(resources.audio).forEach(audio => {
  audio.addEventListener("canplaythrough", checkResourceLoaded, { once: true });
  audio.addEventListener("error", checkResourceLoaded, { once: true });
  audio.load();
});

// ▶ 플레이어 설정 
const player = {
  x: CONFIG.PLAYER.INIT_X,
  y: CONFIG.PLAYER.INIT_Y,
  width: CONFIG.PLAYER.WIDTH,
  height: CONFIG.PLAYER.HEIGHT,
  speed: CONFIG.PLAYER.SPEED,
  invincible: false,  // 무적 상태
  invincibleTime: 0  // 무적 남은 시간 (밀리초)
};

// ▶ 업그레이드 데이터
// ▶ 상점 카테고리 설정 (모듈화)
const upgradeCategoryConfig = [
  {
    key: "attack",
    image: "images/atk.png",
    alt: "Attack",
    title: "WEAPON",
    subItems: [
      { name: "총알 속도", id: "bulletSpeedLevel", upgradeKey: "bulletSpeed" },
      { name: "발사 속도", id: "shootIntervalLevel", upgradeKey: "shootInterval" },
      { name: "공격력", id: "bulletDamageLevel", upgradeKey: "bulletDamage" }
    ],
    nextItems: ["총알 속도", "발사 속도", "공격력"]
  },
  {
    key: "frame",
    image: "images/frame.png",
    alt: "Frame",
    title: "FRAME",
    subItems: [
      { name: "최대 체력", id: "maxLifeLevel", upgradeKey: "maxLife" },
      { name: "이동 속도", id: "playerSpeedLevel", upgradeKey: "playerSpeed" }
    ],
    nextItems: ["최대 체력", "이동 속도"]
  },
  {
    key: "drone",
    image: "images/drone.png",
    alt: "Drone",
    title: "DRONE",
    subItems: [
      { name: "드론 개발", id: "droneUnlock", upgradeKey: "droneUnlock" },
      { name: "공격력", id: "dronedmg", upgradeKey: "dronedmg" },
      { name: "공격속도", id: "droneIntervalLevel", upgradeKey: "droneInterval" }
    ],
    nextItems: ["드론 개발", "공격력", "공격속도"]
  }
];

const upgrades = {
  // 통합 업그레이드 항목 (maxLevel은 하위 항목에 따라 자동 계산)
  attack: { level: 0, maxLevel: 0, basePrice: 50, priceMultiplier: 1.3 },
  frame: { level: 0, maxLevel: 0, basePrice: 100, priceMultiplier: 1.3 },
  drone: { level: 0, maxLevel: 0, basePrice: 200, priceMultiplier: 1.2 },
  droneUnlock: { level: 0, maxLevel: 1 },
  // 하위 항목들 (자동 계산)
  bulletSpeed: { level: 0, maxLevel: 5 },
  shootInterval: { level: 0, maxLevel: 5 },
  bulletDamage: { level: 0, maxLevel: 3 },
  maxLife: { level: 0, maxLevel: 5 },
  playerSpeed: { level: 0, maxLevel: 5 },
  dronedmg: { level: 0, maxLevel: 1 },
  droneInterval: { level: 0, maxLevel: 3 }
};

// ▶ 통합 업그레이드의 maxLevel 계산 함수
function calculateMainUpgradeMaxLevel(categoryKey) {
  const config = upgradeCategoryConfig.find(c => c.key === categoryKey);
  if (!config) return 0;
  
  if (categoryKey === "attack") {
    // attack: 3개 항목 순환, 각 항목의 maxLevel을 합산
    const maxLevels = config.subItems.map(item => upgrades[item.upgradeKey].maxLevel);
    return maxLevels.reduce((sum, max) => sum + max, 0); // 5 + 5 + 3 = 13
  } else if (categoryKey === "frame") {
    // frame: 2개 항목 순환, maxLevel 도달 시 건너뛰기
    // 각 항목의 maxLevel을 합산
    const maxLevels = config.subItems.map(item => upgrades[item.upgradeKey].maxLevel);
    return maxLevels.reduce((sum, max) => sum + max, 0); // 5 + 5 = 10
  } else if (categoryKey === "drone") {
    // drone: 드론 개발(1회) + 공격력/공격속도 순환 (maxLevel 도달 시 건너뛰기)
    const droneUnlock = config.subItems.find(item => item.upgradeKey === "droneUnlock");
    const otherItems = config.subItems.filter(item => item.upgradeKey !== "droneUnlock");
    const unlockMaxLevel = droneUnlock ? upgrades[droneUnlock.upgradeKey].maxLevel : 0;
    // 각 항목의 maxLevel을 합산
    const maxOtherLevels = otherItems.map(item => upgrades[item.upgradeKey].maxLevel);
    const maxEffectiveLevel = maxOtherLevels.reduce((sum, max) => sum + max, 0);
    return unlockMaxLevel + maxEffectiveLevel; // 1 + (1 + 3) = 5
  }
  return 0;
}

// ▶ 통합 업그레이드 maxLevel 초기화
upgrades.attack.maxLevel = calculateMainUpgradeMaxLevel("attack");
upgrades.frame.maxLevel = calculateMainUpgradeMaxLevel("frame");
upgrades.drone.maxLevel = calculateMainUpgradeMaxLevel("drone");

// ▶ 보조 전투기 배열
let wingmen = [];

// ▶ 상태 변수
let bullets = [];              // 플레이어 총알 배열
let enemies = [];              // 적 배열
let enemyBullets = [];         // 적 총알 배열
let items = [];                // 아이템 배열
let effects = [];              // 폭발 이펙트 배열
let gold = 0;                  // 현재 스테이지에서 획득한 골드
let totalGold = 0;             // 누적 골드 (스테이지 간 유지)
let gameOver = false;          // 게임 오버 상태
let keys = {};                 // 키 입력 상태 저장 객체
let life = CONFIG.GAME.INIT_LIFE;  // 플레이어 생명력
let gameStarted = false;       // 게임 시작 여부
let isPaused = false;          // 일시정지 상태
let enemySpawnInterval, enemyShootInterval;  // 적 생성 및 총알 발사 타이머
let currentStage = 1;          // 현재 스테이지 (1, 2, 3)
let isInfiniteMode = false;    // 무한모드 여부
let isExtremeMode = false;     // 익스트림 모드 여부
let infiniteBossKillCount = 0;  // 무한모드 보스 등장을 위한 적 처치 수 카운터
let enemiesKilled = 0;         // 처치한 적 수
let infiniteBestScore = 0;     // 무한모드 최고기록
let extremeBestScore = 0;      // 익스트림 모드 최고기록
let extremeBossKillCount = 0;  // 익스트림 모드 보스 처치 수
let lastShootTime = 0;         // 마지막 총알 발사 시간
let boss = null;               // 보스 객체 (null이면 보스 없음)
let bossSpawned = false;        // 보스 등장 여부
let bossFlashTime = 0;         // 보스 등장 깜빡임 시작 시간
let bossVisible = false;       // 보스 표시 여부 (3초 후 true)
let warningShown = false;      // WARNING 텍스트 표시 여부

// ▶ 별 배경 (움직이는 우주 느낌)
const stars = Array.from({ length: CONFIG.STARS.COUNT }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 1 + 0.5
}));

// ▶ 키 입력 처리
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ▶ 볼륨 설정
let bgmVolume = 0.3;  // 배경음악 볼륨 (0~1)
let sfxVolume = 0.5;  // 효과음 볼륨 (0~1)

// ▶ 배경음악 볼륨 업데이트
function updateBgmVolume() {
  const titleBgm = document.getElementById("titleBgm");
  const gameBgm = document.getElementById("gameBgm");
  if (titleBgm) titleBgm.volume = bgmVolume;
  if (gameBgm) gameBgm.volume = bgmVolume;
}

// ▶ 효과음 시스템
// 오디오 파일 이름을 받아 재생하는 함수
const playSound = (name) => {
  if (!name || !resources.audio[name]) return;
  const audio = resources.audio[name].cloneNode();
  audio.volume = sfxVolume;
  audio.play().catch(() => {});
};

// ▶ 타이머 정리 함수
function clearEnemyTimers() {
  if (enemySpawnInterval) {
    clearInterval(enemySpawnInterval);
    enemySpawnInterval = null;
  }
  if (enemyShootInterval) {
    clearInterval(enemyShootInterval);
    enemyShootInterval = null;
  }
}

// ▶ 배경음악 정지 함수
function stopAllBgm() {
  const gameBgm = document.getElementById("gameBgm");
  if (gameBgm) {
    try { gameBgm.pause(); gameBgm.currentTime = 0; } catch {}
  }
  if (boss && boss.currentBgm) {
    try { boss.currentBgm.pause(); boss.currentBgm.currentTime = 0; } catch {}
  }
  Object.keys(resources.audio).forEach(key => {
    if (key.startsWith("boss")) {
      try { resources.audio[key].pause(); resources.audio[key].currentTime = 0; } catch {}
    }
  });
}


// ▶ 업그레이드 효과 적용 함수
function getUpgradedBulletSpeed() {
  return CONFIG.BULLET.SPEED + (upgrades.bulletSpeed.level * 1);
}

function getUpgradedShootInterval() {
  return Math.max(50, CONFIG.BULLET.SHOOT_INTERVAL - (upgrades.shootInterval.level * 25));
}

function getUpgradedPlayerSpeed() {
  return CONFIG.PLAYER.SPEED + (upgrades.playerSpeed.level * 1);
}

function getUpgradedMaxLife() {
  return CONFIG.GAME.INIT_LIFE + upgrades.maxLife.level;
}

// ▶ 플레이어 총알 발사
function shoot() {
  const currentTime = Date.now();
  const shootInterval = getUpgradedShootInterval();
  if (currentTime - lastShootTime < shootInterval) return;  // 발사 간격 제한
  lastShootTime = currentTime;
  playSound("shoot");  // 총알 발사음 재생
  // 플레이어 위치 중앙에서 총알 생성
  bullets.push({
    x: player.x + player.width / 2 - 2,  // 플레이어 중앙 x좌표
    y: player.y,                          // 플레이어 상단 y좌표
    width: CONFIG.BULLET.WIDTH,
    height: CONFIG.BULLET.HEIGHT,
    speed: getUpgradedBulletSpeed(),  // 업그레이드된 총알 속도
    damage: 1 + upgrades.bulletDamage.level  // 업그레이드된 공격력
  });
  
  // 보조 전투기 총알 발사
  wingmen.forEach(wingman => {
    bullets.push({
      x: wingman.x + wingman.width / 2 - 2,
      y: wingman.y,
      width: CONFIG.BULLET.WIDTH,
      height: CONFIG.BULLET.HEIGHT,
      speed: getUpgradedBulletSpeed(),
      damage: 1 + upgrades.bulletDamage.level
    });
  });
}

// ▶ 적 생성
// 화면 상단 랜덤 위치에 적 생성
function spawnEnemy() {
  const x = Math.random() * (canvas.width - CONFIG.ENEMY.WIDTH);  // 화면 너비 고려한 랜덤 x좌표
  enemies.push({ 
    x: x, 
    y: 0,           // 화면 상단에서 시작
    width: CONFIG.ENEMY.WIDTH, 
    height: CONFIG.ENEMY.HEIGHT, 
    speed: CONFIG.ENEMY.SPEED        // 아래로 이동 속도
  });
}


// ▶ 적 총알 발사
// 랜덤한 적이 플레이어를 향해 총알 발사
function enemyShoot() {
  if (enemies.length === 0) return;  // 적이 없으면 종료
  const shooter = enemies[Math.floor(Math.random() * enemies.length)];  // 랜덤 적 선택
  enemyBullets.push({
    x: shooter.x + shooter.width / 2 - 2,  // 적 중앙 x좌표
    y: shooter.y + shooter.height,          // 적 하단 y좌표
    width: CONFIG.ENEMY_BULLET.WIDTH,
    height: CONFIG.ENEMY_BULLET.HEIGHT,
    speed: CONFIG.ENEMY_BULLET.SPEED  // 아래로 이동 속도
  });
}

// ▶ 보스 생성
// 보스 등장 조건 달성 시 보스를 생성하는 함수
function spawnBoss(bossStage = null) {
  if (bossSpawned || boss !== null) return;  // 이미 보스가 등장했으면 리턴
  if (!isInfiniteMode && currentStage > 3) return;  // 무한모드가 아니고 스테이지가 3을 초과하면 리턴
  
  bossSpawned = true;
  bossFlashTime = Date.now();  // 깜빡임 시작 시간 기록
  bossVisible = false;  // 초기에는 보스 숨김
  warningShown = true;  // WARNING 표시
  playSound("warning");  // 보스 등장 경고음 재생
  
  // WARNING 표시는 updateGameUI에서 처리
  updateGameUI();  // UI 업데이트
  
  // 스테이지별 보스 설정 가져오기
  let bossConfig;
  let selectedStage;
  
  if ((isInfiniteMode || isExtremeMode) && bossStage !== null) {
    // 무한모드 또는 익스트림 모드: 무작위로 선택된 보스 사용
    selectedStage = bossStage;
  } else {
    // 일반 모드: 현재 스테이지에 맞는 보스 사용
    selectedStage = currentStage;
  }
  
  switch(selectedStage) {
    case 1:
      bossConfig = CONFIG.BOSS.STAGE_1;
      break;
    case 2:
      bossConfig = CONFIG.BOSS.STAGE_2;
      break;
    case 3:
      bossConfig = CONFIG.BOSS.STAGE_3;
      break;
    default:
      return;
  }
  
  // 보스 목표 x 위치 계산 (null이면 캔버스 중앙)
  const bossWidth = bossConfig.WIDTH;
  const targetX = bossConfig.TARGET_X !== null 
    ? bossConfig.TARGET_X 
    : (canvas.width - bossWidth) / 2;
  
  // 보스 데이터 설정 (모든 보스 공통: 등장 시 위에서 아래로 이동, 이동 완료까지 무적)
  const bossHeight = bossConfig.HEIGHT;
  // 보스3의 경우 minion 첫 등장을 2초 후로 설정 (5000 - 2000 = 3000)
  const initialWeaponSpawnTimer = (selectedStage === 3) ? 3000 : 0;
  // 익스트림 모드일 때 보스 체력을 5배로 설정
  const bossMaxHp = isExtremeMode ? bossConfig.maxHp * 5 : bossConfig.maxHp;
  boss = {
    stage: selectedStage,  // 선택된 스테이지 (무한모드에서는 무작위 보스)
    maxHp: bossMaxHp,
    hp: bossMaxHp,  // 현재 체력
    image: bossConfig.image,  // 보스 이미지 경로
    bgm: bossConfig.bgm,  // 보스 배경음악
    width: bossWidth,  // 보스 가로 크기
    height: bossHeight,  // 보스 세로 크기
    speed: bossConfig.SPEED,  // 보스 이동 속도
    targetX: targetX,  // 보스 목표 x 위치
    targetY: bossConfig.TARGET_Y,  // 보스 목표 y 위치
    invincible: true,  // 등장 시 무적 상태 (이동 완료까지) - 모든 보스 공통
    minions: [],  // 보스 미니언(적) 배열
    weaponSpawnTimer: initialWeaponSpawnTimer,  // 웨폰 스폰 타이머 (밀리초) - 보스3는 -3000으로 시작하여 2초 후 첫 등장
    bossShootTimer: 0,  // 보스 공격 타이머 (밀리초)
    reflectMode: selectedStage === 1 ? true : false,  // 반사 모드 여부 (보스 1 전용, 최초 등장 시 활성화)
    reflectTimer: 0,  // 반사 지속 시간 타이머 (밀리초)
    reflectCycleTimer: 0,  // 반사 사이클 타이머 (밀리초)
    reflectCycleDuration: selectedStage === 1 ? Math.random() * 2000 + 3000 : 0,  // 반사 발동 빈도 (3~5초 랜덤, 보스 1 전용)
    reflectDuration: selectedStage === 1 ? Math.random() * 1000 + 2000 : 0,  // 반사 지속 시간 (2~3초 랜덤, 보스 1 전용)
    isMoving: false,  // 이동 중 여부 (보스 2 전용)
    moveTimer: 0,  // 이동 타이머 (밀리초) - 보스 2 전용
    shootPhaseTimer: 0,  // 연사 단계 타이머 (밀리초) - 보스 2 전용
    isShooting: false,  // 연사 중 여부 (보스 2 전용)
    initialShootTimer: 0,  // 등장 후 첫 연사까지의 타이머 (보스 2 전용) - 1초 후 연사 시작
    // 충돌 체크를 위한 초기 속성 (안전한 위치로 설정)
    x: targetX,  // 목표 x 위치
    y: -bossHeight  // 화면 밖 (위쪽) - 모든 보스 공통
    // 공격 패턴 등은 추후 추가
  };
  
  // 3초 후 화면 번쩍임 효과 종료와 함께 WARNING 숨기기 및 보스 음악 재생
  setTimeout(() => {
    warningShown = false;
    bossVisible = true;
    
    // 보스 배경음악 재생
    if (boss.bgm) {
      const gameBgm = document.getElementById("gameBgm");
      if (gameBgm) {
        try { gameBgm.pause(); } catch {}
      }
      // 보스 음악 재생 (모든 보스 공통: boss.mp3)
      const bossBgm = resources.audio["boss"];
      if (bossBgm) {
        bossBgm.volume = bgmVolume;
        bossBgm.loop = true;
        bossBgm.currentTime = 0;  // 처음부터 재생
        bossBgm.play().catch(() => {});
        // 보스 음악 참조 저장
        boss.currentBgm = bossBgm;
      }
    }
    
    updateGameUI();  // UI 업데이트
  }, 3000);
}

// ▶ 보스 업데이트
// 보스의 이동, 공격, 충돌 등을 처리하는 함수
function updateBoss() {
  if (!boss || !bossVisible) return;  // 보스가 없거나 표시되지 않았으면 리턴
  
  // 보스가 처치된 경우
  if (boss.isDefeated) {
    // 무한모드: 보스 상태 즉시 초기화 및 적 스폰 재개
    if (isInfiniteMode) {
      // 보스 상태 즉시 초기화
      boss = null;
      bossSpawned = false;
      bossFlashTime = 0;
      bossVisible = false;
      warningShown = false;
      gameOver = false;
      return;
    }
    
    // 익스트림 모드: 보스 상태 즉시 초기화 및 다음 보스 즉시 등장
    if (isExtremeMode) {
      extremeBossKillCount++;  // 보스 처치 수 증가
      // 보스 상태 즉시 초기화
      boss = null;
      bossSpawned = false;
      bossFlashTime = 0;
      bossVisible = false;
      warningShown = false;
      gameOver = false;
      // 다음 보스 즉시 등장 (무작위 보스 1, 2, 3 중 하나)
      const randomBoss = Math.floor(Math.random() * 3) + 1;
      spawnBoss(randomBoss);
      return;
    }
    
    // 일반 모드: 기존 로직 유지
    // 보스 3의 경우 캔버스 아래로 떨어지는 애니메이션 (일반 모드만)
    if (boss.stage === 3 && boss.fallSpeed && !isInfiniteMode) {
      boss.y += boss.fallSpeed;  // 아래로 떨어짐
      
      // 보스 y좌표가 1000에 도달하면 클리어 화면 표시
      if (boss.y >= 1000) {
        if (!boss.clearShown) {
          boss.clearShown = true;
          showGameClear();
          boss = null;
        }
      }
      return;  // 떨어지는 동안은 다른 로직 실행 안 함
    }
    
    // 다른 보스는 기존대로 폭발 효과 후 제거
    if (!boss.clearShown) {
      boss.clearShown = true;
      // 폭발 효과가 사라질 때까지 대기 (약 1초)
      setTimeout(() => {
        showGameClear();
        boss = null;
      }, 1000);
    }
    return;
  }
  
  const currentTime = Date.now();
  const deltaTime = 16.67;  // 약 60fps 기준
  
  // 보스가 목표 위치로 이동
  if (boss.y < boss.targetY) {
    boss.y += boss.speed;
    // 목표 위치를 넘지 않도록 제한
    if (boss.y >= boss.targetY) {
      boss.y = boss.targetY;
      // 이동 완료 시 무적 해제
      boss.invincible = false;
    }
  } else if (boss.y >= boss.targetY && boss.invincible) {
    // 이미 목표 위치에 도달했지만 무적이 아직 해제되지 않은 경우
    boss.invincible = false;
  }
  
  // 이동 완료 후 공격 패턴 시작
  if (boss.y >= boss.targetY && !boss.invincible) {
    // 보스1 전용 패턴 (5초마다 3초간 반사, 플레이어 추적, 총알 발사)
    if (boss.stage === 1) {
      // 플레이어를 향한 목표 x 위치 업데이트 (보스 중심이 플레이어 중심을 향하도록)
      const playerCenterX = player.x + player.width / 2;
      const bossCenterX = boss.x + boss.width / 2;
      boss.targetX = playerCenterX - boss.width / 2;
      
      // 보스 x 위치를 목표 위치로 부드럽게 이동 (지연된 추적)
      const lerpSpeed = 0.05;  // 보간 속도 (작을수록 더 느리게 추적)
      boss.x += (boss.targetX - boss.x) * lerpSpeed;
      
      // 총알 발사 (1초마다)
      boss.bossShootTimer += deltaTime;
      if (boss.bossShootTimer >= 800) {
        const bossConfig = CONFIG.BOSS[`STAGE_${boss.stage}`];
        // 보스 중심에서 아래로 일직선 공격 발사
        enemyBullets.push({
          x: boss.x + boss.width / 2 - (bossConfig.bulletWidth / 2),
          y: boss.y + boss.height,
          width: bossConfig.bulletWidth,
          height: bossConfig.bulletHeight,
          speed: 6,  // 아래로 이동
          stage: boss.stage  // 보스 스테이지 정보 (총알 이미지 구분용)
        });
        boss.bossShootTimer = 0;
      }
      
      boss.reflectCycleTimer += deltaTime;
      
      // 3~5초마다 반사 모드 활성화 (랜덤)
      if (boss.reflectCycleTimer >= boss.reflectCycleDuration) {
        boss.reflectMode = true;
        boss.reflectTimer = 0;  // 반사 타이머 초기화
        boss.reflectCycleTimer = 0;  // 사이클 타이머 초기화
        // 다음 반사 발동 빈도 랜덤 설정 (3~5초)
        boss.reflectCycleDuration = Math.random() * 2000 + 3000;
        // 반사 지속 시간 랜덤 설정 (2~3초)
        boss.reflectDuration = Math.random() * 1000 + 2000;
      }
      
      // 반사 모드 지속 시간 관리 (2~3초 랜덤)
      if (boss.reflectMode) {
        boss.reflectTimer += deltaTime;
        if (boss.reflectTimer >= boss.reflectDuration) {
          boss.reflectMode = false;
          boss.reflectTimer = 0;
        }
      }
    }
    
    // 보스2 전용 패턴 (등장 1초 후 바로 연사 시작, 이후 랜덤 x좌표로 빠르게 이동 후 멈춤 상태에서 플레이어 방향으로 2초간 연사)
    if (boss.stage === 2) {
      // 등장 후 1초 대기 후 첫 연사 시작
      if (boss.initialShootTimer < 1000) {
        boss.initialShootTimer += deltaTime;
        if (boss.initialShootTimer >= 1000) {
          // 1초 후 바로 연사 시작
          boss.isShooting = true;
          boss.shootPhaseTimer = 0;
          boss.bossShootTimer = 0;
        }
        return;  // 첫 1초 동안은 다른 패턴 실행 안 함
      }
      
      if (boss.isMoving) {
        // 목표 x좌표로 빠르게 이동
        const moveSpeed = 12;  // 빠른 이동 속도
        const dx = boss.targetMoveX - boss.x;
        
        if (Math.abs(dx) > 1) {
          // 목표 위치에 도달하지 않았으면 이동
          if (dx > 0) {
            boss.x += Math.min(moveSpeed, dx);  // 오른쪽으로 이동
          } else {
            boss.x += Math.max(-moveSpeed, dx);  // 왼쪽으로 이동
          }
        } else {
          // 목표 위치에 도달했으면 멈춤하고 연사 시작
          boss.x = boss.targetMoveX;
          boss.isMoving = false;
          boss.isShooting = true;
          boss.shootPhaseTimer = 0;
          boss.bossShootTimer = 0;  // 연사 타이머 초기화
        }
      } else if (boss.isShooting) {
        // 플레이어 방향으로 2초간 연사
        boss.shootPhaseTimer += deltaTime;
        boss.bossShootTimer += deltaTime;
        
        // 0.1초마다 플레이어 방향으로 총알 발사 (연사)
        if (boss.bossShootTimer >= 100) {
          const dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
          const dy = player.y + player.height / 2 - (boss.y + boss.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const speed = 4;
          
          if (distance > 0) {
            const bossConfig = CONFIG.BOSS[`STAGE_${boss.stage}`];
            enemyBullets.push({
              x: boss.x + boss.width / 2 - (bossConfig.bulletWidth / 2),
              y: boss.y + boss.height,
              width: bossConfig.bulletWidth,
              height: bossConfig.bulletHeight,
              speed: speed,
              dx: (dx / distance) * speed,
              dy: (dy / distance) * speed,
              stage: boss.stage  // 보스 스테이지 정보 (총알 이미지 구분용)
            });
          }
          boss.bossShootTimer = 0;
        }
        
        // 2초 후 연사 종료, 3초 대기 시작
        if (boss.shootPhaseTimer >= 2000) {
          boss.isShooting = false;
          boss.moveTimer = 0;  // 대기 타이머 초기화
        }
      } else {
        // 연사 종료 후 3초 대기 (이동하지 않고 연사도 하지 않음)
        boss.moveTimer += deltaTime;
        if (boss.moveTimer >= 3000) {
          // 3초 후 이동 시작
          boss.isMoving = true;
          boss.moveTimer = 0;
          // 랜덤 x좌표 계산 (보스가 캔버스 안에 있도록, 최소 이동거리 50)
          const maxX = canvas.width - boss.width;
          let targetX;
          let attempts = 0;
          do {
            targetX = Math.random() * maxX;
            attempts++;
            // 최대 100번 시도 (무한 루프 방지)
            if (attempts > 100) break;
          } while (Math.abs(targetX - boss.x) < 50);
          boss.targetMoveX = targetX;
        }
      }
    }
    
    // 보스3 전용 패턴
    if (boss.stage === 3) {
      // 보스가 랜덤 x좌표에서 공격 (0.8초마다)
      boss.bossShootTimer += deltaTime;
      if (boss.bossShootTimer >= 800) {
        // 보스의 x 범위 내에서 랜덤 x좌표 선택
        const randomX = boss.x + Math.random() * boss.width;
        
        // 아래로 일직선 공격 발사
        const bossConfig = CONFIG.BOSS[`STAGE_${boss.stage}`];
        enemyBullets.push({
          x: randomX - (bossConfig.bulletWidth / 2),
          y: boss.y + boss.height,
          width: bossConfig.bulletWidth,
          height: bossConfig.bulletHeight,
          speed: 4,  // 아래로 이동
          stage: boss.stage  // 보스 스테이지 정보 (총알 이미지 구분용)
        });
        boss.bossShootTimer = 0;
      }
      
      // 웨폰(적) 스폰 타이머 (8초마다)
      boss.weaponSpawnTimer += deltaTime;
      if (boss.weaponSpawnTimer >= 5000) {
        // 위에서 아래로 내려오는 웨폰 생성
        const weaponX = Math.random() * (canvas.width - 50);
        const targetY = boss.y + boss.height + 10;  // 목표 y 위치 (보스 밑)
        
        boss.minions.push({
          x: weaponX,
          y: -50,  // 위에서 시작
          targetY: targetY,  // 목표 y 위치
          width: 50,
          height: 50,
          image: "images/minion.png",
          life: 8000,  // 5초간 유지
          spawnTime: Date.now(),
          shootTimer: 0,  // 공격 타이머
          hp: 5,  // 체력 5
          speed: 3,  // 아래로 내려오는 속도
          shakeTime: 0  // 피격 시 흔들림 효과 지속 시간
        });
        boss.weaponSpawnTimer = 0;
      }
      
      // 미니언 업데이트 및 공격
      boss.minions = boss.minions.filter(minion => {
        // 체력이 0 이하인 미니언은 제거
        if (minion.hp <= 0) {
          return false;
        }
        
        const elapsed = Date.now() - minion.spawnTime;
        
        // 5초가 지나지 않은 미니언만 유지
        if (elapsed < minion.life) {
          // 피격 시 흔들림 효과 타이머 감소
          if (minion.shakeTime > 0) {
            minion.shakeTime -= deltaTime;
            if (minion.shakeTime < 0) {
              minion.shakeTime = 0;
            }
          }
          
          // 미니언이 목표 위치로 내려오는 애니메이션 (부드러운 감속)
          if (minion.y < minion.targetY) {
            const distance = minion.targetY - minion.y;
            // 목표 위치에 가까워질수록 속도 감소 (최소 속도 0.5)
            const currentSpeed = Math.max(0.5, distance * 0.1);
            minion.y += currentSpeed;
            if (minion.y >= minion.targetY) {
              minion.y = minion.targetY;  // 목표 위치에 도달
            }
          }
          
          // 목표 위치에 도달한 후에만 공격
          if (minion.y >= minion.targetY) {
            // 미니언 공격 타이머 (0.8초마다 플레이어를 향해 공격)
            minion.shootTimer += deltaTime;
            if (minion.shootTimer >= 500) {
              // 플레이어를 향해 총알 발사
              const dx = player.x + player.width / 2 - (minion.x + minion.width / 2);
              const dy = player.y + player.height / 2 - (minion.y + minion.height / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              const speed = 4;
              
              if (distance > 0) {
                enemyBullets.push({
                  x: minion.x + minion.width / 2 - 2,
                  y: minion.y + minion.height,
                  width: 4,
                  height: 10,
                  speed: speed,
                  dx: (dx / distance) * speed,
                  dy: (dy / distance) * speed
                });
              }
              minion.shootTimer = 0;
            }
          }
          return true;
        }
        return false;  // 5초가 지나면 제거
      });
    }
  }
  
  // 보스 x 위치 설정 (보스 1과 보스 2가 아닌 경우에만 목표 x 위치로 고정)
  if (boss.stage !== 1 && boss.stage !== 2) {
    boss.x = boss.targetX;
  }
}

// ▶ 보스 그리기
// 보스를 화면에 그리는 함수
function drawBoss() {
  if (!boss || !bossVisible) return;  // 보스가 없거나 아직 표시되지 않았으면 리턴
  
  // 보스가 처치된 경우
  if (boss.isDefeated) {
    // 무한모드: 보스3 처치 시 즉시 그리지 않음 (파티클만 표시)
    if (isInfiniteMode && boss.stage === 3) {
      return;
    }
    
    // 일반 모드: 보스 3이 떨어지는 중이면 계속 그리기 (y좌표가 1000에 도달할 때까지)
    if (boss.stage === 3 && boss.fallSpeed && boss.y < 1000) {
      // 떨어지는 동안은 계속 그리기
    } else if (boss.stage === 3) {
      // 보스 3이 y좌표 1000에 도달했으면 그리지 않음
      return;
    } else {
      // 보스 1, 2 처치 시 이미지 그리지 않음 (파티클만 표시)
      return;
    }
  }
  
  // 보스 이미지 그리기
  if (boss.image) {
    const imageName = boss.image.replace("images/", "").replace(".png", "");
    const bossImage = resources.images[imageName];
    if (bossImage && bossImage.complete) {
      ctx.save();
      
      // 무적 상태일 때 반투명 효과
      if (boss.invincible) {
        ctx.globalAlpha = 0.5;
      }
      
      // 보스 x 위치 설정 (updateBoss에서 업데이트된 x 사용)
      ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
      
      // 보스 1 반사 모드일 때 "반사" 텍스트 표시
      if (boss.stage === 1 && boss.reflectMode) {
        ctx.save();
        ctx.fillStyle = "#ffff00";  // 노란색
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        const textX = boss.x + boss.width / 2;  // 보스 가로 중앙
        const textY = boss.y + boss.height / 2;  // 보스 세로 중앙
        ctx.strokeText("REFLECT", textX, textY);
        ctx.fillText("REFLECT", textX, textY);
        ctx.restore();
      }
      
      ctx.restore();
    }
  }
  
  // 보스 미니언(적) 그리기
  drawBossMinions();
}

// ▶ 보스 미니언(적) 그리기
function drawBossMinions() {
  if (!boss || !boss.minions) return;
  
  boss.minions.forEach(minion => {
    const imageName = minion.image.replace("images/", "").replace(".png", "");
    const minionImage = resources.images[imageName];
    if (minionImage && minionImage.complete) {
      // 피격 시 흔들림 효과 적용
      let drawX = minion.x;
      let drawY = minion.y;
      
      if (minion.shakeTime > 0) {
        // 흔들림 효과: 랜덤하게 위치를 약간 이동
        const shakeAmount = 3;  // 흔들림 강도
        drawX += (Math.random() - 0.5) * shakeAmount * 2;
        drawY += (Math.random() - 0.5) * shakeAmount * 2;
      }
      
      ctx.drawImage(minionImage, drawX, drawY, minion.width, minion.height);
    }
  });
}

// ▶ 보스 등장 깜빡임 효과
// 보스 등장 시 화면 깜빡임 효과를 그리는 함수
function drawBossFlash() {
  if (!boss || bossVisible) return;  // 보스가 없거나 이미 표시되었으면 리턴
  
  const elapsed = Date.now() - bossFlashTime;
  if (elapsed >= 3000) return;  // 3초 지나면 리턴
  
  // 깜빡임 효과 (0.1초마다 깜빡임)
  const flashInterval = 100;
  const flashState = Math.floor(elapsed / flashInterval) % 2;
  
  if (flashState === 0) {
    // 흰색 오버레이
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}


// ▶ 충돌 판정
// 두 객체의 사각형 충돌 여부를 판정하는 함수
function isColliding(a, b) {
  return a.x < b.x + b.width &&      // a의 왼쪽이 b의 오른쪽보다 왼쪽에 있는지
         a.x + a.width > b.x &&       // a의 오른쪽이 b의 왼쪽보다 오른쪽에 있는지
         a.y < b.y + b.height &&      // a의 위쪽이 b의 아래쪽보다 위에 있는지
         a.y + a.height > b.y;         // a의 아래쪽이 b의 위쪽보다 아래에 있는지
}

// ▶ 게임 오버 처리
// 플레이어가 피해를 받았을 때 호출되는 함수
function GameOver() {
  // 무적 상태면 피해를 받지 않음
  if (player.invincible) return;
  
  life--;                              // 생명력 감소
  playSound("hit");         // 피해음 재생
  
  // 무적 상태 활성화 (0.5초)
  player.invincible = true;
  player.invincibleTime = 500;  // 0.5초 = 500밀리초
  
  // 피격 시 화면 흔들림 효과
  const gameScreen = document.getElementById("gameScreen");
  if (gameScreen) {
    gameScreen.classList.add("shake");
    setTimeout(() => {
      gameScreen.classList.remove("shake");
    }, 500);
  }
  
  if (life <= 0) {                     // 생명력이 0 이하가 되면
    gameOver = true;                   // 게임 오버 상태로 변경
    // 배경음악 정지
    stopAllBgm();
    // 게임오버음 재생
    playSound("gameover");
    // 타이머 정지
    clearEnemyTimers();
    // 게임오버 메뉴 표시
    showGameOver();
  }
}

// ▶ 폭발 이펙트 생성
// 적이 파괴될 때 폭발 파티클 효과 생성
function spawnEffect(x, y) {
  for (let i = 0; i < 10; i++) {  // 10개의 파티클 생성
    const angle = Math.random() * Math.PI * 2;  // 랜덤 각도
    const speed = Math.random() * 2 + 1;         // 랜덤 속도
    effects.push({
      x, y,                                       // 시작 위치
      dx: Math.cos(angle) * speed,                // x 방향 속도
      dy: Math.sin(angle) * speed,                // y 방향 속도
      radius: 2 + Math.random() * 3,             // 랜덤 크기
      life: 30,                                   // 생명력 (프레임 수)
      color: `hsl(${Math.random() * 360}, 100%, 60%)`  // 랜덤 색상
    });
  }
}



// ▶ 별 아이템 생성
// 적이 파괴될 때 일정 확률로 아이템 생성
function spawnItem(x, y) {
  items.push({
    x, y,           // 생성 위치
    width: CONFIG.ITEM.WIDTH,
    height: CONFIG.ITEM.HEIGHT,
    speed: CONFIG.ITEM.SPEED        // 아래로 이동 속도
  });
}


// ▶ 별 배경 업데이트
// 배경 별들을 아래로 이동시켜 우주를 날아가는 느낌 연출
function updateStars() {
  for (let s of stars) {
    s.y += s.speed;                    // 별을 아래로 이동
    if (s.y > canvas.height) {          // 화면 밖으로 나가면
      s.y = 0;                          // 위로 재배치
      s.x = Math.random() * canvas.width;  // 랜덤 x좌표
    }
  }
}


// ▶ 이펙트 업데이트
// 폭발 파티클의 위치를 업데이트하고 생명력이 끝난 파티클 제거
function updateEffects() {
  effects.forEach(e => {
    e.x += e.dx;      // x 방향 이동
    e.y += e.dy;      // y 방향 이동
    e.life--;         // 생명력 감소
  });
  effects = effects.filter(e => e.life > 0);  // 생명력이 남은 파티클만 유지
}



// ▶ 아이템 업데이트
// 아이템을 아래로 이동시키고 플레이어와 충돌 시 획득 처리
function updateItems() {
  items.forEach(item => {
    item.y += item.speed;                    // 아이템을 아래로 이동
    if (isColliding(item, player)) {        // 플레이어와 충돌 시
      playSound("item");          // 아이템 획득음 재생
      // 아이템 획득 시 플레이어 체력 1 회복
      if (life < CONFIG.GAME.INIT_LIFE) {
        life++;
      updateGameUI();  // UI 업데이트
      }
      item.collected = true;                 // 획득 표시
    }
  });
  // 화면 밖으로 나가거나 획득된 아이템 제거
  items = items.filter(i => i.y < canvas.height && !i.collected);
}


// ▶ 배경 별 그리기
// 우주 배경과 별들을 화면에 그리기
function drawStars() {
  // 스테이지별 배경 이미지 그리기
  let bgImageName;
  if (isInfiniteMode) {
    bgImageName = "infinite";
  } else if (isExtremeMode) {
    bgImageName = "infinite";  // 익스트림 모드도 무한모드 배경 사용
  } else {
    bgImageName = `stage${currentStage}`;
  }
  
  const bgImage = resources.images[bgImageName];
  if (bgImage && bgImage.complete) {
    // 배경 이미지가 로드되었으면 세로 사이즈만 캔버스에 맞춰서 그리기
    ctx.save();
    ctx.globalAlpha = 0.3;  // 배경 밝기 조정 (30% 밝기)
    const scale = canvas.height / bgImage.height;  // 세로 비율 계산
    const scaledWidth = bgImage.width * scale;      // 가로 크기 조정
    const x = (canvas.width - scaledWidth) / 2;    // 중앙 정렬을 위한 x 좌표
    
    ctx.drawImage(bgImage, x, 0, scaledWidth, canvas.height);
    ctx.restore();
    
    // 배경 위에 반투명 검은색 레이어를 덮어서 더 어둡게 만들기
    ctx.save();
    ctx.globalAlpha = 0.3;  // 추가 어둡게 (30% 투명도)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  
  // 별 그리기
  ctx.fillStyle = "white";
  for (let s of stars) {
    ctx.beginPath();
    drawStarShape(s.x, s.y, s.size, 5, 0.5);  // 별 모양 그리기
    ctx.fill();
  }
}


// ▶ 이펙트 그리기
// 폭발 파티클을 화면에 그리기 (생명력에 따라 투명도 조절)
function drawEffects() {
  for (let e of effects) {
    ctx.save();  // 컨텍스트 상태 저장
    const alpha = e.life / 30;              // 생명력에 비례한 투명도
    ctx.globalAlpha = alpha;                // 투명도 설정
    ctx.fillStyle = e.color;                // 파티클 색상
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);  // 원형 파티클 그리기
    ctx.fill();
    ctx.restore();  // 컨텍스트 상태 복원
  }
}



// ⭐ 별 모양 아이템 그리기 함수
// 별 모양을 그리는 헬퍼 함수
function drawStarShape(x, y, radius, points, inset) {
  ctx.save();                              // 현재 상태 저장
  ctx.beginPath();
  ctx.translate(x, y);                      // 중심점으로 이동
  ctx.moveTo(0, 0 - radius);               // 별의 첫 꼭짓점
  for (let i = 0; i < points; i++) {       // 별의 각 점들을 그리기
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - (radius * inset));    // 안쪽 꼭짓점
    ctx.rotate(Math.PI / points);
    ctx.lineTo(0, 0 - radius);              // 바깥쪽 꼭짓점
  }
  ctx.closePath();
  ctx.restore();                           // 상태 복원
}

// ▶ 아이템 그리기
// 화면에 아이템 이미지를 그리기
function drawItems() {
  const itemImg = resources.images.item;
  if (itemImg && itemImg.complete) {
  for (let item of items) {
      ctx.drawImage(itemImg, item.x, item.y, item.width, item.height);
    }
  }
}


// ▶ 게임 결과 화면 표시 (게임 오버/클리어 통합)
function showGameResult(title, killReward, clearReward, showShake = false) {
  const gameScreen = document.getElementById("gameScreen");
  const flashEffect = document.getElementById("flashEffect");
  const gameResultMenu = document.getElementById("gameResultMenu");
  const gameResultTitle = document.getElementById("gameResultTitle");
  const gameResultKillReward = document.getElementById("gameResultKillReward");
  const gameResultClearReward = document.getElementById("gameResultClearReward");
  const gameResultTotalReward = document.getElementById("gameResultTotalReward");
  
  // 화면 흔들림 효과 (게임 오버 시에만)
  if (showShake && gameScreen) {
    gameScreen.classList.add("shake");
  }
  
  // 플래시 효과 (게임 오버 시에만, 0.3초 후)
  if (showShake) {
  setTimeout(() => {
    if (flashEffect) {
      flashEffect.classList.add("active");
    }
  }, 200);
  }
  
  // 결과 화면 페이드인 (0.5초 후)
  setTimeout(() => {
    if (gameResultMenu) {
      gameResultMenu.style.display = "block";
      gameResultMenu.style.animation = "fadeIn 0.5s forwards";
    }
    
    // 제목 설정
    if (gameResultTitle) {
      gameResultTitle.textContent = title;
      // 게임 오버는 빨간색, 클리어는 금색
      gameResultTitle.style.color = title === "GAME OVER" ? "#ff4444" : "#ffd700";
    }
    
    // 보수 표시
    const totalReward = killReward + clearReward;
    
    // 무한모드 게임오버: SCORE와 GOLD만 표시
    if (isInfiniteMode && title === "GAME OVER") {
      // 최고기록 업데이트
      if (enemiesKilled > infiniteBestScore) {
        infiniteBestScore = enemiesKilled;
      }
      // SCORE: 처치한 적 수
      if (gameResultKillReward) {
        const parentDiv = gameResultKillReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("SCORE: "));
        parentDiv.appendChild(document.createTextNode(enemiesKilled.toString()));
      }
      // GOLD: 획득한 골드
      if (gameResultClearReward) {
        const parentDiv = gameResultClearReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("GOLD: "));
        const goldSpan = document.createElement("span");
        goldSpan.textContent = Math.floor(killReward).toString();
        parentDiv.appendChild(goldSpan);
        parentDiv.appendChild(document.createTextNode("g"));
      }
      // 합계는 숨김
      if (gameResultTotalReward) {
        gameResultTotalReward.parentElement.style.display = "none";
      }
    // 익스트림 모드 게임오버: SCORE와 GOLD만 표시
    } else if (isExtremeMode && title === "GAME OVER") {
      // 최고기록 업데이트
      if (extremeBossKillCount > extremeBestScore) {
        extremeBestScore = extremeBossKillCount;
      }
      // SCORE: 처치한 보스 수
      if (gameResultKillReward) {
        const parentDiv = gameResultKillReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("SCORE: "));
        parentDiv.appendChild(document.createTextNode(extremeBossKillCount.toString()));
      }
      // GOLD: 획득한 골드
      if (gameResultClearReward) {
        const parentDiv = gameResultClearReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("GOLD: "));
        const goldSpan = document.createElement("span");
        goldSpan.textContent = Math.floor(killReward).toString();
        parentDiv.appendChild(goldSpan);
        parentDiv.appendChild(document.createTextNode("g"));
      }
      // 합계는 숨김
      if (gameResultTotalReward) {
        gameResultTotalReward.parentElement.style.display = "none";
      }
    } else {
      // 일반 모드: 기존 형식 유지
      if (gameResultKillReward) {
        const parentDiv = gameResultKillReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("처치 보수: "));
        gameResultKillReward.textContent = Math.floor(killReward);
        parentDiv.appendChild(gameResultKillReward);
        parentDiv.appendChild(document.createTextNode("g"));
      }
      if (gameResultClearReward) {
        const parentDiv = gameResultClearReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("클리어 보수: "));
        gameResultClearReward.textContent = clearReward;
        parentDiv.appendChild(gameResultClearReward);
        parentDiv.appendChild(document.createTextNode("g"));
      }
      if (gameResultTotalReward) {
        const parentDiv = gameResultTotalReward.parentElement;
        parentDiv.textContent = "";
        parentDiv.appendChild(document.createTextNode("합계: "));
        gameResultTotalReward.textContent = Math.floor(totalReward);
        parentDiv.appendChild(gameResultTotalReward);
        parentDiv.appendChild(document.createTextNode("g"));
        parentDiv.style.display = "block";
      }
    }
    
    // 효과 제거
    if (showShake) {
      if (gameScreen) gameScreen.classList.remove("shake");
      if (flashEffect) flashEffect.classList.remove("active");
    }
  }, showShake ? 500 : 0);
}

// ▶ 게임오버 화면 표시
function showGameOver() {
  const killReward = gold;  // 현재 스테이지에서 적 처치로 획득한 골드
  const clearReward = 0;  // 게임 오버 시에는 클리어 보수 없음
  showGameResult("GAME OVER", killReward, clearReward, true);
}

// ▶ 게임 클리어 화면 표시
function showGameClear() {
  let killReward, clearReward;
  
  // 보스 객체에서 저장된 정보 가져오기
  if (boss && boss.stageGold !== undefined) {
    killReward = boss.killReward;
    clearReward = boss.clearReward;
  } else {
    // 보스 객체가 없는 경우 기본값 계산
    killReward = enemiesKilled * ((CONFIG.GOLD.ENEMY.MIN + CONFIG.GOLD.ENEMY.MAX) / 2);
    // 현재 스테이지에 맞는 클리어 보수 가져오기 (스테이지 1, 2, 3)
    const stageIndex = Math.min(currentStage - 1, CONFIG.GOLD.STAGE_CLEAR.length - 1);
    clearReward = CONFIG.GOLD.STAGE_CLEAR[stageIndex] || CONFIG.GOLD.STAGE_CLEAR[0];
  }
  
  showGameResult("STAGE CLEAR!", killReward, clearReward, false);
}

// ▶ 메인 게임 루프
// 게임의 모든 로직과 렌더링을 처리하는 메인 함수
function update() {
  // 게임이 시작되지 않았으면 렌더링 스킵 (HTML 오버레이 사용)
  if (!gameStarted) return;
  
  // 일시정지 상태면 게임 로직 스킵
  if (isPaused) {
    requestAnimationFrame(update);
    return;
  }
  
  // 무적 시간 업데이트
  if (player.invincible) {
    player.invincibleTime -= 16.67;  // 약 60fps 기준 (1000ms / 60 = 16.67ms)
    if (player.invincibleTime <= 0) {
      player.invincible = false;
      player.invincibleTime = 0;
    }
  }
  
  // 폭발 이펙트는 항상 업데이트 (보스 처치 후에도 계속 보이도록)
  updateEffects();
  
  // 보스 업데이트는 항상 실행 (처치 후 떨어지는 애니메이션을 위해)
  updateBoss();
  
  // 게임 오버가 아닐 때만 게임 로직 실행
  if (!gameOver) {
    updateStars();           // 별 배경 업데이트
    updateItems();           // 아이템 업데이트

    // 플레이어 이동 처리 (좌우 방향키 또는 A/D키)
  const playerSpeed = getUpgradedPlayerSpeed();
  if ((keys["ArrowLeft"] || keys["a"]) && player.x > 0) player.x -= playerSpeed;
  if ((keys["ArrowRight"] || keys["d"]) && player.x + player.width < canvas.width) player.x += playerSpeed;
  
  // 보조 전투기 업데이트
  updateWingmen();
    if (keys[" "]) shoot();  // 스페이스바로 총알 발사

    // 플레이어 총알 이동 및 화면 밖으로 나간 총알 제거
  bullets.forEach(b => b.y -= b.speed);
  // 반사된 총알(음수 speed)은 아래로 이동하므로 화면 아래로 나간 총알 제거
  bullets = bullets.filter(b => {
    if (b.speed < 0) {
      // 반사된 총알은 아래로 이동하므로 y가 canvas.height보다 크면 제거
      return b.y < canvas.height;
    } else {
      // 일반 총알은 위로 이동하므로 y가 0보다 크면 유지
      return b.y > 0;
    }
  });
  }

  // ▶ 그리기 (게임 오버 여부와 관계없이 항상 그리기)
  drawStars();       // 배경 별
  drawEffects();     // 폭발 이펙트
  drawItems();       // 아이템
  drawBossFlash();   // 보스 등장 깜빡임 효과
  drawBoss();        // 보스 그리기 (처치 후 떨어지는 애니메이션을 위해)

  // 게임 오버가 아닐 때만 게임 오브젝트 그리기 및 충돌 처리
  if (!gameOver) {
    // 적 이동 및 플레이어와의 충돌 처리
  enemies.forEach(e => {
      e.y += e.speed;                    // 적을 아래로 이동
      if (isColliding(e, player)) {      // 플레이어와 충돌 시
        GameOver();                      // 피해 처리
        enemies = enemies.filter(enemy => enemy !== e);  // 충돌한 적 제거
      }
    });

    // 플레이어 총알과 적의 충돌 처리
  enemies = enemies.filter(e => {
    for (let b of bullets) {
        if (isColliding(e, b)) {         // 총알과 적 충돌 시
          const damage = b.damage || 1;  // 총알 데미지 (기본값 1)
          if (!e.hp) e.hp = 1;  // 적 체력 초기화 (없으면 1)
          e.hp -= damage;  // 적 체력 감소
          
          bullets = bullets.filter(bullet => bullet !== b);  // 총알 제거
          
          if (e.hp <= 0) {  // 적 처치
          playSound("explosion");  // 폭발음 재생
            // 적 처치 시 랜덤 골드 획득 (MIN ~ MAX 범위)
            const randomGold = Math.floor(Math.random() * (CONFIG.GOLD.ENEMY.MAX - CONFIG.GOLD.ENEMY.MIN + 1)) + CONFIG.GOLD.ENEMY.MIN;
            gold += randomGold;  // 골드 증가
          enemiesKilled++;                // 처치한 적 수 증가
            if (isInfiniteMode) {
              infiniteBossKillCount++;  // 무한모드 보스 등장 카운터 증가
            }
          updateGameUI();  // UI 업데이트
          spawnEffect(e.x + e.width / 2, e.y + e.height / 2);  // 폭발 이펙트 생성
          if (Math.random() < CONFIG.ITEM.SPAWN_RATE) spawnItem(e.x + e.width / 2 - 6, e.y);  // 확률로 아이템 생성
          return false;                   // 적 제거
          }
        }
      }
      return e.y < canvas.height;        // 화면 밖으로 나간 적 제거
    });

    // 보스 등장 조건 체크
    if (!bossSpawned) {
      if (isExtremeMode) {
        // 익스트림 모드: 게임 시작 시 즉시 첫 보스 등장
        const randomBoss = Math.floor(Math.random() * 3) + 1;
        spawnBoss(randomBoss);
      } else if (isInfiniteMode) {
        // 무한모드: 50개 처치마다 무작위 보스 등장
        if (infiniteBossKillCount >= 50) {
          // 적 스폰 정지
          clearEnemyTimers();
          // 무작위로 보스 1, 2, 3 중 하나 선택
          const randomBoss = Math.floor(Math.random() * 3) + 1;
          infiniteBossKillCount = 0;  // 카운터 리셋
          spawnBoss(randomBoss);
        }
      } else if (currentStage <= 3) {
        // 일반 모드: 스테이지별 처치 수에 따라 보스 등장
      const requiredKills = CONFIG.STAGE.CLEAR_ENEMIES[currentStage - 1];
      if (enemiesKilled >= requiredKills) {
        // 적 스폰 정지
        clearEnemyTimers();
        // 보스 등장
        spawnBoss();
        }
      }
    }

    // 플레이어 총알과 보스 미니언의 충돌 처리 (보스 3의 미니언)
    if (boss && boss.stage === 3 && boss.minions) {
      bullets = bullets.filter(b => {
        let hitMinion = false;
        for (let minion of boss.minions) {
          if (isColliding(b, minion)) {
            playSound("explosion");
            const damage = b.damage || 1;  // 총알 데미지 (기본값 1)
            minion.hp -= damage;
            // 피격 시 흔들림 효과 활성화 (200ms)
            minion.shakeTime = 200;
            if (minion.hp <= 0) {
              // 미니언 처치 시 폭발 효과
              spawnEffect(minion.x + minion.width / 2, minion.y + minion.height / 2);
            }
            hitMinion = true;
            break;
          }
        }
        return !hitMinion;  // 미니언에 맞은 총알은 제거
      });
    }
    
    // 플레이어 총알과 보스의 충돌 처리 (보스가 표시되고 처치되지 않았고 무적이 아닐 때만)
    if (boss && bossVisible && !boss.isDefeated && !boss.invincible) {
      bullets = bullets.filter(b => {
        // 보스3의 경우 히트박스 가로를 40% 축소하여 충돌 판정
        let hitbox = boss;
        if (boss.stage === 3) {
          const hitboxWidth = boss.width * 0.6;  // 가로 40% 축소 (원래 크기의 60%)
          const hitboxX = boss.x + (boss.width - hitboxWidth) / 2;  // 중앙 정렬
          hitbox = {
            x: hitboxX,
            y: boss.y,
            width: hitboxWidth,
            height: boss.height
          };
        }
        if (isColliding(b, hitbox)) {
          // 보스 1의 반사 모드 체크
          if (boss.stage === 1 && boss.reflectMode) {
            // 총알 반사: 방향을 반대로 변경 (위로 이동하던 총알을 아래로)
            b.speed = -b.speed;  // 속도 방향 반전
            // 총알을 보스 아래로 이동시켜서 보스와 겹치지 않게
            b.y = boss.y + boss.height;
            return true;  // 총알 유지 (반사됨)
          }
          
          playSound("explosion");  // 폭발음 재생
          // 보스 피해 처리 (총알 데미지 적용)
          const damage = b.damage || 1;  // 총알 데미지 (기본값 1)
          boss.hp -= damage;
          updateGameUI();  // 보스 게이지바 업데이트
          if (boss.hp <= 0 && !boss.isDefeated) {
            // 보스 처치 시 폭발 효과 시작
            boss.isDefeated = true;
            boss.clearShown = false;  // 클리어 화면 표시 플래그
            
            // 보스 3 처치 시 화면 흔들림 효과 및 떨어지는 애니메이션 (일반 모드만)
            if (boss.stage === 3 && !isInfiniteMode) {
              const gameScreen = document.getElementById("gameScreen");
              if (gameScreen) {
                gameScreen.classList.add("shake");
                // 3초 후 흔들림 효과 제거
                setTimeout(() => {
                  if (gameScreen) {
                    gameScreen.classList.remove("shake");
                  }
                }, 3000);
              }
              // 보스가 떨어지는 속도 설정
              boss.fallSpeed = 5;  // 아래로 떨어지는 속도
            }
            
            // 보스 중심에 대형 폭발 효과 생성 (한 번만 실행되도록 보장)
            if (!boss.explosionCreated) {
              boss.explosionCreated = true;
              const bossCenterX = boss.x + boss.width / 2;
              const bossCenterY = boss.y + boss.height / 2;
              // 파티클 수를 줄여서 성능 최적화
              for (let i = 0; i < 20; i++) {  // 파티클 수 감소
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;  // 속도 조정
                effects.push({
                  x: bossCenterX,
                  y: bossCenterY,
                  dx: Math.cos(angle) * speed,
                  dy: Math.sin(angle) * speed,
                  radius: 2 + Math.random() * 4,  // 파티클 크기 조정
                  life: 40,  // 지속 시간 조정
                  color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`  // 주황/빨강 계열
                });
              }
            }
            
            playSound("explosion");  // 폭발음 재생
            
            // 보스 음악 정지
            if (boss.currentBgm) {
              try { boss.currentBgm.pause(); boss.currentBgm.currentTime = 0; } catch {}
            }
            
            // 무한모드: gameclear 없이 즉시 처리 (클리어 보수 없음)
            if (isInfiniteMode) {
              // 골드 획득 (클리어 보수 제외, 적 처치로 획득한 골드만)
              totalGold += gold;
              gold = 0;
              updateGameUI();
              
              // 보스 상태 즉시 초기화 (updateBoss에서 처리하도록 플래그만 설정)
              // updateBoss에서 처리하도록 하여 같은 프레임에서 안전하게 처리
              gameOver = false;
              
              // 적 스폰 즉시 재개
              if (enemySpawnInterval) {
                clearInterval(enemySpawnInterval);
                enemySpawnInterval = null;
              }
              if (enemyShootInterval) {
                clearInterval(enemyShootInterval);
                enemyShootInterval = null;
              }
              // 익스트림 모드에서는 적 스폰하지 않음
              if (!isExtremeMode) {
                const spawnInterval = isInfiniteMode ? 700 : CONFIG.ENEMY.SPAWN_INTERVAL;
                enemySpawnInterval = setInterval(spawnEnemy, spawnInterval);
              }
              enemyShootInterval = setInterval(enemyShoot, CONFIG.ENEMY_BULLET.SHOOT_INTERVAL);
              
              // 게임 BGM 재생
              const gameBgm = document.getElementById("gameBgm");
              if (gameBgm) {
                try { gameBgm.play().catch(() => {}); } catch {}
              }
            } else if (isExtremeMode) {
              // 익스트림 모드: 보스 처치 시 골드 획득 (보스 처치 보수)
              const bossKillReward = CONFIG.GOLD.BOSS[boss.stage - 1] || 50;  // 보스 스테이지에 따른 보수
              gold += bossKillReward;
              totalGold += gold;
              gold = 0;
              updateGameUI();
              
              // 보스 상태 즉시 초기화 (updateBoss에서 처리하도록 플래그만 설정)
              gameOver = false;
              
              // 게임 BGM 재생
              const gameBgm = document.getElementById("gameBgm");
              if (gameBgm) {
                try { gameBgm.play().catch(() => {}); } catch {}
              }
            } else {
              // 일반 모드: 게임 로직 정지 및 클리어 화면 표시
            gameOver = true;
            if (enemySpawnInterval) clearInterval(enemySpawnInterval);
            if (enemyShootInterval) clearInterval(enemyShootInterval);
            const gameBgm = document.getElementById("gameBgm");
            if (gameBgm) {
              try { gameBgm.pause(); } catch {}
            }
              
                    // 골드 및 스테이지 클리어 처리
                    const killReward = gold;  // 현재 gold는 적 처치로 획득한 골드
                    // 현재 스테이지에 맞는 클리어 보수 가져오기 (스테이지 1, 2, 3)
                    const stageIndex = Math.min(currentStage - 1, CONFIG.GOLD.STAGE_CLEAR.length - 1);
                    const clearReward = CONFIG.GOLD.STAGE_CLEAR[stageIndex] || CONFIG.GOLD.STAGE_CLEAR[0];
                    const stageGold = killReward + clearReward;  // 스테이지 총 골드
                    
                    // 클리어 화면에 표시할 정보 저장
                    boss.stageGold = stageGold;
                    boss.killReward = killReward;
                    boss.clearReward = clearReward;
                    
                    gold += clearReward;  // 스테이지 클리어 골드 획득
              totalGold += gold;  // 현재 골드를 누적 골드에 추가
              gold = 0;  // 현재 골드 초기화
              setClearedStage(currentStage);
            updateGameUI();  // UI 업데이트
            }
          }
          return false;  // 총알 제거
        }
        return true;
      });
    }

    // 반사된 총알(플레이어 총알이지만 speed가 음수)과 플레이어의 충돌 처리
    const reflectedBullets = bullets.filter(b => b.speed < 0 && isColliding(b, player));
    if (reflectedBullets.length > 0) {
      GameOver();  // 플레이어 피해 처리
      bullets = bullets.filter(b => !reflectedBullets.includes(b));  // 반사된 총알 제거
    }

    // 적 총알 이동 및 플레이어와의 충돌 처리
  enemyBullets.forEach(b => {
      // 보스 총알은 방향 벡터 사용, 일반 적 총알은 아래로 이동
      if (b.dx !== undefined && b.dy !== undefined) {
        b.x += b.dx;
        b.y += b.dy;
      } else {
        b.y += b.speed;  // 적 총알을 아래로 이동
      }
      if (isColliding(b, player)) {      // 플레이어와 충돌 시
        GameOver();                      // 피해 처리
        enemyBullets = enemyBullets.filter(bullet => bullet !== b);  // 총알 제거
      }
    });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height && b.y > -10 && b.x > -10 && b.x < canvas.width + 10);  // 화면 밖으로 나간 총알 제거

    // 게임 오브젝트 그리기
    enemies.forEach(e => {
      const enemyImg = resources.images.alien;
      if (enemyImg && enemyImg.complete) {
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
      }
    });
    // 플레이어 총알 그리기 (bullet.png 이미지 사용)
    bullets.forEach(b => {
      const bulletImg = resources.images.bullet;
      const isReflected = b.speed < 0;  // 반사된 총알 (속도가 음수)
      
      if (bulletImg && bulletImg.complete) {
        if (isReflected) {
          // 반사된 총알은 180도 회전
          ctx.save();
          const centerX = b.x + b.width / 2;
          const centerY = b.y + b.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(Math.PI);  // 180도 회전
          ctx.drawImage(bulletImg, -b.width / 2, -b.height / 2, b.width, b.height);
          ctx.restore();
        } else {
          ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
        }
      }
    });
    // 적 총알 그리기 (보스 총알은 고유 이미지 사용)
    enemyBullets.forEach(b => {
      // 보스 총알인지 확인 (stage 속성이 있으면 보스 총알)
      if (b.stage) {
        const bossConfig = CONFIG.BOSS[`STAGE_${b.stage}`];
        if (bossConfig && bossConfig.bulletImage) {
          // 보스 총알 이미지 사용
          const bulletImageName = bossConfig.bulletImage.replace("images/", "").replace(".png", "");
          const bulletImg = resources.images[bulletImageName];
          if (bulletImg && bulletImg.complete) {
            ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
          }
        }
      } else {
        // 일반 적 총알 그리기 (기본 도형)
        ctx.fillStyle = "#ffffff";  // 하얀색
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }
    });
    // 플레이어 그리기 (무적 상태일 때 깜빡임 효과)
    if (player.invincible) {
      // 무적 상태일 때 깜빡임 효과 (약 10fps로 깜빡임)
      const blinkRate = Math.floor(player.invincibleTime / 50) % 2;
      if (blinkRate === 0) {
        ctx.save();
        ctx.globalAlpha = 0.5;  // 반투명하게
        const playerImg = resources.images.player;
        if (playerImg && playerImg.complete) {
          ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        }
        ctx.restore();
      }
    } else {
      const playerImg = resources.images.player;
      if (playerImg && playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
      }
    }
    
    // 보조 전투기 그리기
    drawWingmen();
  }

  // UI는 HTML 요소로 표시되므로 캔버스에 그리지 않음
  updateGameUI();  // UI 업데이트
  
  requestAnimationFrame(update);  // 다음 프레임 요청
}

// ▶ 게임 재시작
// 모든 게임 상태를 초기화하고 게임을 다시 시작
function restartGame() {
  // 모든 배열 초기화
  bullets = []; enemies = []; enemyBullets = []; items = []; effects = [];
  // 게임 상태 초기화
  gold = 0; gameOver = false; life = CONFIG.GAME.INIT_LIFE; lastShootTime = 0; isPaused = false;
  // 일시정지 메뉴 숨기기
  if (pauseMenu) pauseMenu.style.display = "none";
  // 플레이어 위치 및 무적 상태 초기화
  player.x = CONFIG.PLAYER.INIT_X; player.y = CONFIG.PLAYER.INIT_Y;
  player.invincible = false; player.invincibleTime = 0;
  // 기존 타이머 정리
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (enemyShootInterval) clearInterval(enemyShootInterval);
  // 게임 시작 및 타이머 재설정
  gameStarted = true;
  // 익스트림 모드에서는 적 스폰하지 않음
  if (!isExtremeMode) {
    const spawnInterval = isInfiniteMode ? 700 : CONFIG.ENEMY.SPAWN_INTERVAL;
    enemySpawnInterval = setInterval(spawnEnemy, spawnInterval);      // 적 생성 간격
  }
  enemyShootInterval = setInterval(enemyShoot, CONFIG.ENEMY_BULLET.SHOOT_INTERVAL);      // 적 총알 발사 간격
  update();
}

// ▶ 게임 UI 업데이트
// HTML 요소에 게임 정보를 표시하는 함수
function updateGameUI() {
  const goldValue = document.getElementById("goldValue");
  const lifeGaugeCells = document.getElementById("lifeGaugeCells");
  const stageValue = document.getElementById("stageValue");
  
  // 골드 표시
  if (goldValue) goldValue.textContent = totalGold + gold;  // 누적 골드 + 현재 골드
  
  // 체력 게이지바 표시
  if (lifeGaugeCells) {
    const maxLife = getUpgradedMaxLife();
    lifeGaugeCells.innerHTML = "";
    // 최대 체력만큼 칸 생성
    for (let i = 0; i < maxLife; i++) {
      const cell = document.createElement("div");
      cell.className = "lifeGaugeCell";
      if (i < life) {
        cell.classList.add("filled");
      }
      lifeGaugeCells.appendChild(cell);
    }
  }
  
  // 스테이지 표시
  if (stageValue) {
    if (isExtremeMode) {
      stageValue.textContent = "EXTREME";
    } else if (isInfiniteMode) {
      stageValue.textContent = "INFINITE";
    } else {
      stageValue.textContent = currentStage;
    }
  }
  
  // 통합 게이지바 표시
  const gaugeDisplay = document.getElementById("gaugeDisplay");
  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeValue = document.getElementById("gaugeValue");
  const gaugeMax = document.getElementById("gaugeMax");
  const gaugeSeparator = document.getElementById("gaugeSeparator");
  
  if (!gaugeDisplay) return;
  
  // 보스가 표시되었을 때 (보스 모드)
  if (boss && bossVisible) {
    gaugeDisplay.style.display = "block";
    gaugeDisplay.classList.remove("warning");
    gaugeDisplay.classList.add("boss");
    gaugeDisplay.style.transform = "translate(-50%, 0)";
    gaugeDisplay.style.top = "20px";
    gaugeDisplay.style.left = "50%";
    if (gaugeValue) gaugeValue.textContent = boss.hp;
    if (gaugeMax) gaugeMax.textContent = boss.maxHp;
    if (gaugeSeparator) gaugeSeparator.style.display = "inline";
    
    // 체력을 칸 단위로 표시
    const gaugeCells = document.getElementById("gaugeCells");
    if (gaugeCells) {
      // 기존 칸 제거
      gaugeCells.innerHTML = "";
      // 최대 체력만큼 칸 생성
      for (let i = 0; i < boss.maxHp; i++) {
        const cell = document.createElement("div");
        cell.className = "gaugeCell";
        if (i < boss.hp) {
          cell.classList.add("filled");
        }
        gaugeCells.appendChild(cell);
      }
    }
    
    // 기존 게이지바는 숨김 (칸 방식 사용)
    if (gaugeFill) {
      gaugeFill.style.display = "none";
    }
  }
  // 보스 등장 중 WARNING 표시
  else if (boss && warningShown) {
    gaugeDisplay.style.display = "block";
    gaugeDisplay.classList.add("warning");
    gaugeDisplay.classList.remove("boss");
    gaugeDisplay.style.transform = "translate(-50%, 0)";
    gaugeDisplay.style.top = "20px";
    gaugeDisplay.style.left = "50%";
    if (gaugeValue) gaugeValue.textContent = "WARNING!!!";
    if (gaugeMax) gaugeMax.textContent = "";
    if (gaugeSeparator) gaugeSeparator.style.display = "none";
    if (gaugeFill) {
      gaugeFill.style.display = "block";
      gaugeFill.style.width = "100%";
    }
    const gaugeCells = document.getElementById("gaugeCells");
    if (gaugeCells) gaugeCells.innerHTML = "";
  }
  // 처치수 표시 (일반 모드)
  else if (!isInfiniteMode && currentStage <= 3) {
    const requiredKills = CONFIG.STAGE.CLEAR_ENEMIES[currentStage - 1];
    gaugeDisplay.style.display = "block";
    gaugeDisplay.classList.remove("warning", "boss");
    gaugeDisplay.style.transform = "translate(-50%, 0)";
    gaugeDisplay.style.top = "20px";
    gaugeDisplay.style.left = "50%";
    if (gaugeValue) gaugeValue.textContent = enemiesKilled;
    if (gaugeMax) gaugeMax.textContent = requiredKills;
    if (gaugeSeparator) gaugeSeparator.style.display = "inline";
    if (gaugeFill) {
      gaugeFill.style.display = "block";
      const percentage = Math.min((enemiesKilled / requiredKills) * 100, 100);
      gaugeFill.style.width = percentage + "%";
    }
    const gaugeCells = document.getElementById("gaugeCells");
    if (gaugeCells) gaugeCells.innerHTML = "";
  }
    // 무한모드
  else {
    gaugeDisplay.style.display = "block";
    gaugeDisplay.classList.remove("warning", "boss");
    gaugeDisplay.style.transform = "translate(-50%, 0)";
    gaugeDisplay.style.top = "20px";
    gaugeDisplay.style.left = "50%";
    if (gaugeValue) gaugeValue.textContent = enemiesKilled;
    if (gaugeMax) gaugeMax.textContent = "∞";
    if (gaugeSeparator) gaugeSeparator.style.display = "inline";
    if (gaugeFill) {
      gaugeFill.style.display = "block";
      gaugeFill.style.width = "100%";
    }
    const gaugeCells = document.getElementById("gaugeCells");
    if (gaugeCells) gaugeCells.innerHTML = "";
  }
}


// ▶ 화면 전환 함수
function switchScreen(fromId, toId) {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  if (from) from.style.display = 'none';
  if (to) to.style.display = 'flex';
}

// ▶ 스테이지 클리어 상태 관리
function getClearedStages() {
  const saved = localStorage.getItem("galaxyDefender_clearedStages");
  return saved ? JSON.parse(saved) : [];
}

function setClearedStage(stage) {
  const cleared = getClearedStages();
  if (!cleared.includes(stage)) {
    cleared.push(stage);
    localStorage.setItem("galaxyDefender_clearedStages", JSON.stringify(cleared));
  }
}

// ▶ 게임 데이터 저장
function saveGameData() {
  const now = new Date();
  const saveDate = now.getFullYear() + "-" + 
                   String(now.getMonth() + 1).padStart(2, "0") + "-" + 
                   String(now.getDate()).padStart(2, "0");
  
  const saveData = {
    clearedStages: getClearedStages(),
    totalGold: totalGold,
    upgrades: {
      attack: upgrades.attack.level,
      frame: upgrades.frame.level,
      drone: upgrades.drone.level
    },
    infiniteBestScore: infiniteBestScore,
    extremeBestScore: extremeBestScore,
    saveDate: saveDate
  };
  localStorage.setItem("galaxyDefender_saveData", JSON.stringify(saveData));
  
  // 저장 패널 표시
  showSavePanel();
}

// ▶ 게임 데이터 로드
function loadGameData() {
  const saved = localStorage.getItem("galaxyDefender_saveData");
  if (!saved) return;
  
  try {
    const saveData = JSON.parse(saved);
    
    // 스테이지 진행사항은 이미 getClearedStages()로 로드됨
    // 골드 로드
    if (saveData.totalGold !== undefined) {
      totalGold = saveData.totalGold;
    }
    
    // 업그레이드 로드
    if (saveData.upgrades) {
      if (saveData.upgrades.attack !== undefined) upgrades.attack.level = saveData.upgrades.attack;
      if (saveData.upgrades.frame !== undefined) upgrades.frame.level = saveData.upgrades.frame;
      if (saveData.upgrades.drone !== undefined) upgrades.drone.level = saveData.upgrades.drone;
      calculateSubUpgrades();  // 하위 항목 레벨 재계산
    }
    
    // 무한모드 최고기록 로드
    if (saveData.infiniteBestScore !== undefined) {
      infiniteBestScore = saveData.infiniteBestScore;
    }
    
    // 익스트림 모드 최고기록 로드
    if (saveData.extremeBestScore !== undefined) {
      extremeBestScore = saveData.extremeBestScore;
    }
    
    // 저장 날짜 표시 업데이트
    if (saveData.saveDate) {
      const saveDateEl = document.getElementById("saveDate");
      if (saveDateEl) {
        saveDateEl.textContent = saveData.saveDate;
      }
    }
    
    // UI 업데이트
    updateUpgradeUI();
  } catch (e) {
    console.error("저장 데이터 로드 실패:", e);
  }
}

// ▶ 저장 패널 표시
function showSavePanel() {
  const savePanel = document.getElementById("savePanel");
  const saveDateEl = document.getElementById("saveDate");
  const saveItemsEl = document.getElementById("saveItems");
  const saveConfirmTextEl = document.getElementById("saveConfirmText");
  const saveInfoEl = document.getElementById("saveInfo");
  const saved = localStorage.getItem("galaxyDefender_saveData");
  
  // 확인 상태 초기화
  resetConfirmState = false;
  
  if (savePanel) {
    savePanel.style.display = "flex";
    savePanel.classList.remove("shake");
    if (saveConfirmTextEl) {
      saveConfirmTextEl.style.display = "none";
    }
    if (saveInfoEl) saveInfoEl.style.display = "flex";
    if (saveItemsEl) saveItemsEl.style.display = "block";
  }
  
  if (saveDateEl) {
    if (saved) {
      try {
        const saveData = JSON.parse(saved);
        if (saveData.saveDate) {
          saveDateEl.textContent = saveData.saveDate;
        } else {
          saveDateEl.textContent = "none";
        }
      
      // 저장 항목 표시 (익스트림 모드가 해금되었으면 익스트림 모드 스코어, 아니면 무한모드 스코어)
      if (saveItemsEl) {
        const isExtremeUnlocked = (saveData.infiniteBestScore !== undefined ? saveData.infiniteBestScore : infiniteBestScore) >= 200;
        if (isExtremeUnlocked) {
          const extremeScore = saveData.extremeBestScore !== undefined ? saveData.extremeBestScore : extremeBestScore;
          saveItemsEl.innerHTML = `익스트림모드 스코어: ${extremeScore}`;
        } else {
          const infiniteScore = saveData.infiniteBestScore !== undefined ? saveData.infiniteBestScore : infiniteBestScore;
          saveItemsEl.innerHTML = `무한모드 스코어: ${infiniteScore}`;
        }
      }
      } catch (e) {
        if (saveDateEl) saveDateEl.textContent = "none";
        // 익스트림 모드가 해금되었으면 익스트림 모드 스코어, 아니면 무한모드 스코어
        if (saveItemsEl) {
          const isExtremeUnlocked = infiniteBestScore >= 200;
          if (isExtremeUnlocked) {
            saveItemsEl.innerHTML = `익스트림모드 스코어: ${extremeBestScore}`;
          } else {
            saveItemsEl.innerHTML = `무한모드 스코어: ${infiniteBestScore}`;
          }
        }
      }
    } else {
      // 저장 데이터가 없을 때
      if (saveDateEl) saveDateEl.textContent = "none";
      // 익스트림 모드가 해금되었으면 익스트림 모드 스코어, 아니면 무한모드 스코어
      if (saveItemsEl) {
        const isExtremeUnlocked = infiniteBestScore >= 200;
        if (isExtremeUnlocked) {
          saveItemsEl.innerHTML = `익스트림모드 스코어: ${extremeBestScore}`;
        } else {
          saveItemsEl.innerHTML = `무한모드 스코어: ${infiniteBestScore}`;
        }
      }
    }
  }
}

// ▶ 저장 패널 숨기기
function hideSavePanel() {
  const savePanel = document.getElementById("savePanel");
  const saveConfirmTextEl = document.getElementById("saveConfirmText");
  const saveInfoEl = document.getElementById("saveInfo");
  const saveItemsEl = document.getElementById("saveItems");
  const resetBtn = document.getElementById("resetBtn");
  
  if (savePanel) {
    savePanel.style.display = "none";
    savePanel.classList.remove("shake");
  }
  
  // 확인 상태 초기화
  resetConfirmState = false;
  if (saveConfirmTextEl) {
    saveConfirmTextEl.style.display = "none";
    saveConfirmTextEl.textContent = "저장 데이터를 초기화 하시겠습니까?";
    saveConfirmTextEl.style.color = "#ff4444";  // 원래 색상으로 복원
  }
  if (saveInfoEl) saveInfoEl.style.display = "flex";
  if (saveItemsEl) saveItemsEl.style.display = "block";
  const savePanelSaveBtn = document.getElementById("savePanelSaveBtn");
  if (savePanelSaveBtn) savePanelSaveBtn.style.display = "block";  // SAVE 버튼 다시 표시
  if (resetBtn) resetBtn.style.display = "block";  // RESET 버튼 다시 표시
  
  // CLOSE 버튼 다시 표시
  const closeSavePanelBtn = document.getElementById("closeSavePanelBtn");
  if (closeSavePanelBtn) {
    closeSavePanelBtn.style.display = "block";
  }
}

// ▶ 게임 데이터 초기화 (확인 단계 포함)
let resetConfirmState = false;

function resetGameData() {
  const savePanel = document.getElementById("savePanel");
  const saveConfirmTextEl = document.getElementById("saveConfirmText");
  const saveInfoEl = document.getElementById("saveInfo");
  const saveItemsEl = document.getElementById("saveItems");
  
  if (!resetConfirmState) {
    // 첫 번째 클릭: 확인 상태로 전환
    resetConfirmState = true;
    
    // 흔들림 효과
    if (savePanel) {
      savePanel.classList.add("shake");
      setTimeout(() => {
        savePanel.classList.remove("shake");
      }, 500);
    }
    
    // 확인 텍스트 표시
    if (saveConfirmTextEl) {
      saveConfirmTextEl.style.display = "block";
    }
    
    // 저장 정보 숨기기
    if (saveInfoEl) saveInfoEl.style.display = "none";
    if (saveItemsEl) saveItemsEl.style.display = "none";
    
    // SAVE 버튼 숨기기
    const savePanelSaveBtn = document.getElementById("savePanelSaveBtn");
    if (savePanelSaveBtn) {
      savePanelSaveBtn.style.display = "none";
    }
    
    return;
  }
  
  // 두 번째 클릭: 실제 초기화
  resetConfirmState = false;
  
  // localStorage 초기화
  localStorage.removeItem("galaxyDefender_clearedStages");
  localStorage.removeItem("galaxyDefender_saveData");
  
  // 변수 초기화
  totalGold = 0;
  upgrades.attack.level = 0;
  upgrades.frame.level = 0;
  upgrades.drone.level = 0;
  calculateSubUpgrades();
  infiniteBestScore = 0;
  
  // UI 업데이트
  updateStageButtons();
  updateUpgradeUI();
  
  // 텍스트 변경
  if (saveConfirmTextEl) {
    saveConfirmTextEl.textContent = "저장데이터가 초기화되었습니다";
    saveConfirmTextEl.style.color = "#4CAF50";  // 초록색으로 변경
  }
  
  // SAVE, RESET 버튼 숨기기
  const savePanelSaveBtn = document.getElementById("savePanelSaveBtn");
  const resetBtn = document.getElementById("resetBtn");
  if (savePanelSaveBtn) {
    savePanelSaveBtn.style.display = "none";
  }
  if (resetBtn) {
    resetBtn.style.display = "none";
  }
  
  // CLOSE 버튼 숨기기
  const closeSavePanelBtn = document.getElementById("closeSavePanelBtn");
  if (closeSavePanelBtn) {
    closeSavePanelBtn.style.display = "none";
  }
  
  // 1.5초 후 패널 닫기
  setTimeout(() => {
    hideSavePanel();
  }, 1500);
}

function updateStageButtons() {
  const cleared = getClearedStages();
  const stage2Btn = document.getElementById("stage2Btn");
  const stage3Btn = document.getElementById("stage3Btn");
  const infiniteBtn = document.getElementById("infiniteBtn");
  const extremeBtn = document.getElementById("extremeBtn");
  
  // 스테이지 1 클리어 시 스테이지 2와 무한모드 해금
  if (cleared.includes(1)) {
    if (stage2Btn) {
      stage2Btn.disabled = false;
      stage2Btn.innerHTML = "STAGE 2";
    }
    if (infiniteBtn) {
      infiniteBtn.disabled = false;
      infiniteBtn.innerHTML = "INFINITE";
    }
  }
  
  // 무한모드 스코어 200 이상 시 익스트림 모드 해금
  if (infiniteBestScore >= 200) {
    if (extremeBtn) {
      extremeBtn.disabled = false;
      extremeBtn.innerHTML = "EXTREME";
    }
  }
  
  // 스테이지 2 클리어 시 스테이지 3 해금
  if (cleared.includes(2)) {
    if (stage3Btn) {
      stage3Btn.disabled = false;
      stage3Btn.innerHTML = "STAGE 3";
    }
  }
}

// ▶ 업그레이드 가격 계산
function getUpgradePrice(upgradeKey) {
  const upgrade = upgrades[upgradeKey];
  // 드론의 첫 번째 업그레이드(드론 개발)는 500g
  if (upgradeKey === "drone" && upgrade.level === 0) {
    return 500;
  }
  // 드론의 두 번째 업그레이드부터는 level - 1을 기준으로 200g부터 시작
  if (upgradeKey === "drone" && upgrade.level > 0) {
    return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level - 1));
  }
  return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
}

// ▶ 하위 항목 레벨 계산
function calculateSubUpgrades() {
  // 어택: 총알 속도, 발사 속도, 공격력 순환
  const attackLevel = upgrades.attack.level;
  upgrades.bulletSpeed.level = Math.floor(attackLevel / 3) + (attackLevel % 3 >= 1 ? 1 : 0);
  upgrades.shootInterval.level = Math.floor(attackLevel / 3) + (attackLevel % 3 >= 2 ? 1 : 0);
  upgrades.bulletDamage.level = Math.floor(attackLevel / 3);
  
  // 각각 최대 레벨 제한
  upgrades.bulletSpeed.level = Math.min(upgrades.bulletSpeed.level, upgrades.bulletSpeed.maxLevel);
  upgrades.shootInterval.level = Math.min(upgrades.shootInterval.level, upgrades.shootInterval.maxLevel);
  upgrades.bulletDamage.level = Math.min(upgrades.bulletDamage.level, upgrades.bulletDamage.maxLevel);
  
  // 프레임: 최대 체력, 이동 속도 순환 (maxLevel 도달 시 건너뛰기)
  const frameLevel = upgrades.frame.level;
  const frameConfig = upgradeCategoryConfig.find(c => c.key === "frame");
  if (frameConfig && frameConfig.subItems.length === 2) {
    const item1 = frameConfig.subItems[0]; // 최대 체력
    const item2 = frameConfig.subItems[1]; // 이동 속도
    const item1Max = upgrades[item1.upgradeKey].maxLevel;
    const item2Max = upgrades[item2.upgradeKey].maxLevel;
    
    let item1Level = 0;
    let item2Level = 0;
    
    // 순환하면서 각 항목의 maxLevel에 도달하면 건너뛰기
    for (let i = 0; i < frameLevel; i++) {
      const itemIndex = i % 2; // 0 또는 1 (순환)
      if (itemIndex === 0) {
        // 최대 체력
        if (item1Level < item1Max) {
          item1Level++;
        } else if (item2Level < item2Max) {
          // 최대 체력이 max에 도달했으면 이동 속도로
          item2Level++;
        } else {
          // 둘 다 maxLevel에 도달
          break;
        }
      } else {
        // 이동 속도
        if (item2Level < item2Max) {
          item2Level++;
        } else if (item1Level < item1Max) {
          // 이동 속도가 max에 도달했으면 최대 체력으로
          item1Level++;
        } else {
          // 둘 다 maxLevel에 도달
          break;
        }
      }
    }
    
    upgrades[item1.upgradeKey].level = item1Level;
    upgrades[item2.upgradeKey].level = item2Level;
  } else {
    // 기존 로직 (fallback)
    upgrades.maxLife.level = Math.floor(frameLevel / 2) + (frameLevel % 2 >= 1 ? 1 : 0);
    upgrades.playerSpeed.level = Math.floor(frameLevel / 2);
    upgrades.maxLife.level = Math.min(upgrades.maxLife.level, upgrades.maxLife.maxLevel);
    upgrades.playerSpeed.level = Math.min(upgrades.playerSpeed.level, upgrades.playerSpeed.maxLevel);
  }
  
  // 드론: 드론 개발 완료 후 공격력, 공격속도 순환 (maxLevel 도달 시 건너뛰기)
  const droneLevel = upgrades.drone.level;
  // 드론 개발이 완료되지 않으면 (level 0) 모든 드론 업그레이드는 0
  if (droneLevel === 0) {
    upgrades.droneUnlock.level = 0;
    upgrades.dronedmg.level = 0;
    upgrades.droneInterval.level = 0;
  } else {
    // 드론 개발 완료 (level 1 이상)
    upgrades.droneUnlock.level = 1;
    
    // level - 1을 기준으로 공격력, 공격속도 계산 (드론 개발 제외)
    const effectiveLevel = droneLevel - 1;
    const droneConfig = upgradeCategoryConfig.find(c => c.key === "drone");
    const otherItems = droneConfig ? droneConfig.subItems.filter(item => item.upgradeKey !== "droneUnlock") : [];
    
    if (otherItems.length === 2) {
      const item1 = otherItems[0]; // 공격력
      const item2 = otherItems[1]; // 공격속도
      const item1Max = upgrades[item1.upgradeKey].maxLevel;
      const item2Max = upgrades[item2.upgradeKey].maxLevel;
      
      let item1Level = 0;
      let item2Level = 0;
      let remainingLevel = effectiveLevel;
      
      // 순환하면서 각 항목의 maxLevel에 도달하면 건너뛰기
      while (remainingLevel > 0) {
        if (item1Level < item1Max) {
          item1Level++;
          remainingLevel--;
        } else if (item2Level < item2Max) {
          item2Level++;
          remainingLevel--;
        } else {
          // 둘 다 maxLevel에 도달
          break;
        }
      }
      
      upgrades[item1.upgradeKey].level = item1Level;
      upgrades[item2.upgradeKey].level = item2Level;
    } else {
      // 기존 로직 (fallback)
      upgrades.dronedmg.level = Math.floor(effectiveLevel / 2) + (effectiveLevel % 2 >= 1 ? 1 : 0);
      upgrades.droneInterval.level = Math.floor(effectiveLevel / 2);
      upgrades.dronedmg.level = Math.min(upgrades.dronedmg.level, upgrades.dronedmg.maxLevel);
      upgrades.droneInterval.level = Math.min(upgrades.droneInterval.level, upgrades.droneInterval.maxLevel);
    }
  }
}

// ▶ 업그레이드 구매
function buyUpgrade(upgradeKey) {
  const upgrade = upgrades[upgradeKey];
  if (!upgrade || upgrade.level >= upgrade.maxLevel) return false;  // 최대 레벨 도달
  
  const price = getUpgradePrice(upgradeKey);
  if (totalGold < price) return false;  // 골드 부족
  
  totalGold -= price;
  upgrade.level++;
  
  // 업그레이드 애니메이션 효과
  const priceEl = document.getElementById(upgradeKey + "Price");
  if (priceEl) {
    const categoryEl = priceEl.closest(".upgradeCategory");
    if (categoryEl) {
      categoryEl.classList.add("upgradeFlash");
      setTimeout(() => {
        categoryEl.classList.remove("upgradeFlash");
      }, 1000);
    }
  }
  
  // 업그레이드 사운드 재생 (중첩 방지)
  if (resources.audio["upgrade"]) {
    const upgradeSound = resources.audio["upgrade"];
    upgradeSound.pause();
    upgradeSound.currentTime = 0;
    upgradeSound.volume = sfxVolume;
    upgradeSound.play().catch(() => {});
  }
  
  // 하위 항목 레벨 재계산
  calculateSubUpgrades();
  
  // 보조 전투기 생성/제거
  // 드론 개발이 완료되면(droneUnlock.level > 0) 바로 드론 생성
  if (upgrades.droneUnlock.level > 0 && wingmen.length === 0) {
    wingmen.push({
      x: player.x - 40,
      y: player.y,
      width: CONFIG.DRONE.WIDTH,
      height: CONFIG.DRONE.HEIGHT,
      speed: 1 + (upgrades.droneInterval.level * 0.5),
      offsetX: -40,
      shootTimer: 0
    });
  } else if (upgrades.droneUnlock.level === 0) {
    wingmen = [];
  }
  
  // 최대 체력 업그레이드 시 현재 체력도 증가
  const maxLife = getUpgradedMaxLife();
  if (life < maxLife) {
    life = maxLife;
  }
  
  updateUpgradeUI();  // 업그레이드 UI 업데이트
  return true;
}

// ▶ 보조 전투기 업데이트
function updateWingmen() {
  if (upgrades.droneUnlock.level === 0) {
    wingmen = [];
    return;
  }
  
  wingmen.forEach(wingman => {
    const targetX = player.x + wingman.offsetX;
    const targetY = player.y;
    wingman.x += (targetX - wingman.x) * 0.1;
    wingman.y += (targetY - wingman.y) * 0.1;
    wingman.speed = 1 + (upgrades.droneInterval.level * 0.5);
  });
}

// ▶ 보조 전투기 그리기
function drawWingmen() {
  if (upgrades.droneUnlock.level === 0) return;
  
  const droneImg = resources.images.atkdrone;
  if (droneImg && droneImg.complete) {
    wingmen.forEach(wingman => {
      ctx.drawImage(droneImg, wingman.x, wingman.y, wingman.width, wingman.height);
    });
  }
}

// ▶ 업그레이드 증가값 가져오기
function getUpgradeIncrement(upgradeKey) {
  switch(upgradeKey) {
    case "bulletSpeed":
      return "속도 +1";
    case "shootInterval":
      return "간격 -50ms";
    case "bulletDamage":
      return "공격력 +1";
    case "maxLife":
      return "체력 +1";
    case "playerSpeed":
      return "속도 +1";
    case "dronedmg":
      return "공격력 +1";
    case "droneInterval":
      return "속도 +0.5";
    default:
      return null;
  }
}

// ▶ 상점 카테고리 HTML 생성
function createUpgradeCategories() {
  const upgradeItemsContainer = document.getElementById("upgradeItems");
  if (!upgradeItemsContainer) return;
  
  upgradeItemsContainer.innerHTML = ""; // 기존 내용 초기화
  
  upgradeCategoryConfig.forEach(config => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "upgradeCategory";
    categoryDiv.setAttribute("data-category", config.key);
    
    // 이미지
    const img = document.createElement("img");
    img.src = config.image;
    img.alt = config.alt;
    img.className = "upgradeCategoryImage";
    
    // 제목
    const titleDiv = document.createElement("div");
    titleDiv.className = "upgradeCategoryTitle";
    titleDiv.textContent = config.title;
    
    // 카테고리 아이템 컨테이너
    const itemsDiv = document.createElement("div");
    itemsDiv.className = "upgradeCategoryItems";
    
    // 레벨 표시
    const upgrade = upgrades[config.key];
    const levelDiv = document.createElement("div");
    levelDiv.className = "upgradeItemLevel";
    levelDiv.innerHTML = `Lv.<span id="${config.key}Level">0</span>/${upgrade ? upgrade.maxLevel : 0}`;
    
    // 다음 업그레이드 정보
    const nextInfoDiv = document.createElement("div");
    nextInfoDiv.className = "upgradeNextInfo";
    nextInfoDiv.id = `${config.key}NextInfo`;
    nextInfoDiv.textContent = `NEXT: ${config.nextItems[0]} +1`;
    
    // 하위 항목 정보
    const itemInfoDiv = document.createElement("div");
    itemInfoDiv.className = "upgradeItemInfo";
    config.subItems.forEach(subItem => {
      const subItemDiv = document.createElement("div");
      // 증가값 가져오기 (드론 개발 제외)
      let incrementText = "";
      if (subItem.upgradeKey !== "droneUnlock") {
        const increment = getUpgradeIncrement(subItem.upgradeKey);
        if (increment) {
          incrementText = ` <span style="color: rgba(255, 255, 0, 0.8);">(${increment})</span>`;
        }
      }
      subItemDiv.innerHTML = `${subItem.name}: Lv.<span id="${subItem.id}">0</span>${incrementText}`;
      itemInfoDiv.appendChild(subItemDiv);
    });
    
    // 골드 정보 (실제 가격 계산 함수 사용)
    const goldInfoDiv = document.createElement("div");
    goldInfoDiv.className = "upgradeGoldInfo";
    const initialPrice = upgrade ? getUpgradePrice(config.key) : 0;
    goldInfoDiv.innerHTML = `<span id="${config.key}Price">${initialPrice}</span><span id="${config.key}PriceUnit">g</span>`;
    
    // 조립
    itemsDiv.appendChild(levelDiv);
    itemsDiv.appendChild(nextInfoDiv);
    itemsDiv.appendChild(itemInfoDiv);
    
    categoryDiv.appendChild(img);
    categoryDiv.appendChild(titleDiv);
    categoryDiv.appendChild(itemsDiv);
    categoryDiv.appendChild(goldInfoDiv);
    
    upgradeItemsContainer.appendChild(categoryDiv);
  });
}

// ▶ 다음 업그레이드 항목 계산
function getNextUpgradeItem(categoryKey) {
  const config = upgradeCategoryConfig.find(c => c.key === categoryKey);
  if (!config) return null;
  
  const upgrade = upgrades[categoryKey];
  if (!upgrade || upgrade.level >= upgrade.maxLevel) return null;
  
  // 드론의 경우: 첫 번째는 "드론 개발", 이후는 "공격력", "공격속도" 순환 (maxLevel 도달 시 건너뛰기)
  if (categoryKey === "drone") {
    if (upgrade.level === 0) {
      return "드론 개발";
    } else {
      // level 1 이상일 때는 공격력, 공격속도만 순환 (드론 개발 제외)
      const otherItems = config.subItems.filter(item => item.upgradeKey !== "droneUnlock");
      if (otherItems.length === 2) {
        const item1 = otherItems[0];
        const item2 = otherItems[1];
        const item1Level = upgrades[item1.upgradeKey].level;
        const item2Level = upgrades[item2.upgradeKey].level;
        const item1Max = upgrades[item1.upgradeKey].maxLevel;
        const item2Max = upgrades[item2.upgradeKey].maxLevel;
        
        // 두 항목 모두 maxLevel에 도달한 경우
        if (item1Level >= item1Max && item2Level >= item2Max) {
          return null;
        }
        
        // 한 항목이 maxLevel에 도달한 경우, 다른 항목만 반환
        if (item1Level >= item1Max) {
          return item2.name;
        }
        if (item2Level >= item2Max) {
          return item1.name;
        }
        
        // 둘 다 maxLevel에 도달하지 않은 경우, 순환
        const effectiveLevel = upgrade.level - 1;
        const nextItems = [item1.name, item2.name];
        return nextItems[effectiveLevel % nextItems.length];
      }
    }
  }
  
  // frame의 경우: 2개 항목 순환 (maxLevel 도달 시 건너뛰기)
  if (categoryKey === "frame" && config.subItems.length === 2) {
    const item1 = config.subItems[0];
    const item2 = config.subItems[1];
    const item1Level = upgrades[item1.upgradeKey].level;
    const item2Level = upgrades[item2.upgradeKey].level;
    const item1Max = upgrades[item1.upgradeKey].maxLevel;
    const item2Max = upgrades[item2.upgradeKey].maxLevel;
    
    // 두 항목 모두 maxLevel에 도달한 경우
    if (item1Level >= item1Max && item2Level >= item2Max) {
      return null;
    }
    
    // 한 항목이 maxLevel에 도달한 경우, 다른 항목만 반환
    if (item1Level >= item1Max) {
      return item2.name;
    }
    if (item2Level >= item2Max) {
      return item1.name;
    }
    
    // 둘 다 maxLevel에 도달하지 않은 경우, 순환
    const nextIndex = upgrade.level % config.nextItems.length;
    return config.nextItems[nextIndex];
  }
  
  // attack의 경우: 기존 순환 로직 유지
  const nextIndex = upgrade.level % config.nextItems.length;
  return config.nextItems[nextIndex];
}

// ▶ 업그레이드 UI 업데이트
function updateUpgradeUI() {
  // 하위 항목 레벨 재계산
  calculateSubUpgrades();
  
  const upgradeGoldValue = document.getElementById("upgradeGoldValue");
  if (upgradeGoldValue) upgradeGoldValue.textContent = totalGold;
  
  // 모듈화된 구조로 업그레이드 항목 업데이트
  upgradeCategoryConfig.forEach(config => {
    const upgrade = upgrades[config.key];
    if (!upgrade) return;
    
    // 레벨 표시
    const levelEl = document.getElementById(`${config.key}Level`);
    if (levelEl) levelEl.textContent = upgrade.level;
    
    // 다음 업그레이드 항목 표시
    const nextEl = document.getElementById(`${config.key}NextInfo`);
    if (nextEl) {
      if (upgrade.level >= upgrade.maxLevel) {
        nextEl.textContent = "MAX";
      } else {
        const nextItem = getNextUpgradeItem(config.key);
        if (nextItem) {
          nextEl.textContent = `NEXT: ${nextItem} +1`;
        }
      }
    }
    
    // 골드 가격 표시
    const priceEl = document.getElementById(`${config.key}Price`);
    const priceUnitEl = document.getElementById(`${config.key}PriceUnit`);
    if (priceEl) {
      if (upgrade.level >= upgrade.maxLevel) {
        priceEl.textContent = ""; // maxLevel 도달 시 골드 가격 비표시
        if (priceUnitEl) priceUnitEl.textContent = ""; // "g"도 함께 비표시
      } else {
        const price = getUpgradePrice(config.key);
        priceEl.textContent = price;
        if (priceUnitEl) priceUnitEl.textContent = "g";
      }
    }
    
    // 하위 항목 레벨 표시 업데이트
    config.subItems.forEach(subItem => {
      const subItemEl = document.getElementById(subItem.id);
      if (subItemEl && upgrades[subItem.upgradeKey]) {
        const subUpgrade = upgrades[subItem.upgradeKey];
        const parentDiv = subItemEl.parentElement;
        if (subUpgrade.level >= subUpgrade.maxLevel) {
          subItemEl.textContent = "MAX";
          // MAX일 때 증가값 제거
          const existingIncrement = parentDiv.querySelector('span[style*="color: rgba(255, 255, 0, 0.8)"]');
          if (existingIncrement) {
            existingIncrement.remove();
          }
        } else {
          subItemEl.textContent = subUpgrade.level;
          // 증가값 업데이트 (드론 개발 제외)
          if (subItem.upgradeKey !== "droneUnlock") {
            const increment = getUpgradeIncrement(subItem.upgradeKey);
            // 기존 증가값 스팬 제거 후 다시 추가
            const existingIncrement = parentDiv.querySelector('span[style*="color: rgba(255, 255, 0, 0.8)"]');
            if (existingIncrement) {
              existingIncrement.remove();
            }
            if (increment) {
              const incrementSpan = document.createElement("span");
              incrementSpan.style.color = "rgba(255, 255, 0, 0.8)";
              incrementSpan.textContent = ` (${increment})`;
              parentDiv.appendChild(incrementSpan);
            }
          }
        }
      }
    });
  });
}

// ▶ 업그레이드 화면 표시
function showUpgrade() {
  switchScreen("titleScreen", "upgradeScreen");
  createUpgradeCategories(); // 상점 카테고리 생성
  setupUpgradeCategoryEvents(); // 클릭 이벤트 설정
  updateUpgradeUI();
  // 타이틀 배경음악 재생
  const titleBgm = document.getElementById("titleBgm");
  if (titleBgm && !gameStarted) {
    try {
      updateBgmVolume();
      titleBgm.play().catch(() => {});
    } catch {}
  }
}

// ▶ 업그레이드 카테고리 클릭 이벤트 설정
function setupUpgradeCategoryEvents() {
  upgradeCategoryConfig.forEach(config => {
    const priceEl = document.getElementById(`${config.key}Price`);
    if (priceEl) {
      // 부모 요소에 클릭 이벤트 추가
      const categoryEl = priceEl.closest(".upgradeCategory");
      if (categoryEl) {
        categoryEl.addEventListener("click", () => {
          buyUpgrade(config.key);  // buyUpgrade 함수 내부에서 upgrade.mp3 재생
        });
        categoryEl.style.cursor = "pointer";
      }
    }
  });
}

// ▶ 업그레이드에서 타이틀로 돌아가기
function backToTitleFromUpgrade() {
  switchScreen("upgradeScreen", "titleScreen");
  // 타이틀 배경음악 재생
  const titleBgm = document.getElementById("titleBgm");
  if (titleBgm && !gameStarted) {
    try {
      updateBgmVolume();
      titleBgm.play().catch(() => {});
    } catch {}
  }
}

// ▶ 스테이지 선택 화면 표시
function showStageSelect() {
  updateStageButtons();
  switchScreen("titleScreen", "stageSelectScreen");
}

// ▶ 게임 시작 함수 (스테이지 선택 후)
function startGame(stage, infinite = false, extreme = false) {
  currentStage = stage;
  isInfiniteMode = infinite;
  isExtremeMode = extreme;
  enemiesKilled = 0;
  infiniteBossKillCount = 0;  // 무한모드 보스 카운터 초기화
  extremeBossKillCount = 0;   // 익스트림 모드 보스 처치 수 초기화
  gold = 0;  // 현재 스테이지 골드 초기화 (누적 골드는 유지)
  // 플레이어 위치 및 무적 상태 초기화
  player.x = CONFIG.PLAYER.INIT_X; player.y = CONFIG.PLAYER.INIT_Y;
  player.invincible = false; player.invincibleTime = 0;
  
  // 하위 항목 레벨 계산
  calculateSubUpgrades();
  
  // 보조 전투기 초기화
  if (upgrades.droneUnlock.level > 0) {
    wingmen = [{
      x: player.x - 40,
      y: player.y,
      width: CONFIG.DRONE.WIDTH,
      height: CONFIG.DRONE.HEIGHT,
      speed: 1 + (upgrades.droneInterval.level * 0.5),
      offsetX: -40,
      shootTimer: 0
    }];
  } else {
    wingmen = [];
  }
  
  // 최대 체력 적용
  const maxLife = getUpgradedMaxLife();
  if (life < maxLife) {
    life = maxLife;
  }
  
  updateGameUI();  // UI 초기 업데이트
  
  // 타이틀 배경음 정지
  const titleBgm = document.getElementById("titleBgm");
  if (titleBgm) {
    try { 
      titleBgm.pause(); 
      titleBgm.currentTime = 0; 
      titleBgm.load(); // 오디오 리셋
    } catch {}
  }
  // 로딩 화면 표시
  switchScreen("stageSelectScreen", "loadingScreen");
  // 짧은 딜레이 후 게임 시작 (로딩 효과)
  setTimeout(() => {
    gameStarted = true;                    // 게임 시작 상태로 변경
    // 타이틀 배경음 다시 한번 정지 (확실하게)
    if (titleBgm) {
      try { 
        titleBgm.pause(); 
        titleBgm.currentTime = 0; 
      } catch {}
    }
    switchScreen("loadingScreen", "gameScreen");  // 로딩 화면 → 게임 화면 전환
    // 게임 배경음 재생
    const gameBgm = document.getElementById("gameBgm");
    if (gameBgm) {
      try {
        updateBgmVolume();
        gameBgm.play().catch(() => {});
      } catch {}
    }
    // 익스트림 모드에서는 적 스폰하지 않음
    if (!isExtremeMode) {
      const spawnInterval = isInfiniteMode ? 700 : CONFIG.ENEMY.SPAWN_INTERVAL;
      enemySpawnInterval = setInterval(spawnEnemy, spawnInterval);    // 적 생성 간격
    }
    enemyShootInterval = setInterval(enemyShoot, CONFIG.ENEMY_BULLET.SHOOT_INTERVAL);    // 적 총알 발사 간격
    update();                               // 게임 루프 시작
  }, 500);  // 0.5초 로딩
}

// ▶ 시작 버튼 이벤트 (HTML)
const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    showStageSelect();
  });
}

// ▶ 튜토리얼 데이터 모듈
// 튜토리얼 항목을 추가하거나 수정하려면 이 함수만 수정하면 됩니다
function getTutorialData() {
  return [
    {
      id: "basic",
      title: "기본 조작",
      description: `방향키 또는 A/D 키로 좌우 이동
                    SPACE BAR로 총알 발사
                    적을 처치하여 골드를 획득합니다`
    },
    {
      id: "upgrade",
      title: "업그레이드",
      description: `상점에서 골드를 사용하여 능력을 강화할 수 있습니다

                    WEAPON: 총알 속도, 발사 속도, 공격력
                    FRAME: 최대 체력, 이동 속도
                    DRONE: 보조 전투기`
    },
    {
      id: "enemy",
      title: "적",
      description: `적은 위에서 아래로 이동하며 공격합니다
                    적에게 닿거나 적의 총알에 맞으면 체력이 감소합니다
                    체력이 0이 되면 게임 오버됩니다`
    },
    {
      id: "boss",
      title: "보스",
      description: `각 스테이지의 마지막에 보스가 등장합니다
                    보스는 강력한 공격 패턴을 가지고 있습니다
                    보스를 처치하면 스테이지를 클리어합니다`
    },
    {
      id: "items",
      title: "아이템",
      description: `적을 처치하면 가끔 회복 아이템이 드롭됩니다
                    회복 아이템을 획득하면 체력이 1 회복됩니다
                    최대 체력까지만 회복됩니다`
    },
    {
      id: "bossinfo1",
      title: "기밀 정보 브리핑: 주요 보스 파일 1",
      description: `이번 정보는 
                    S.I.N (Secret Info Network)
                    채널에서 긁어온 따끈따끈한 데이터입니다
                    이걸로 놈들의 콧대를 납작하게 만들어 주세요!
                    
                    프로테우스
                    '카운터 실드'

                    주기적으로 방어막을 켜고 플레이어의 공격을 반사합니다
                    공격 타이밍을 놓치면 자폭하는 꼴이 되죠

                    놈이 방어막을 올리는 짧은 찰나에 공격을 멈추고
                    쉴드가 꺼지자마자 화력 집중중!
                    침착하게 템포를 조절하는 게 핵심입니다`
    },
    {
      id: "bossinfo2",
      title: "기밀 정보 브리핑: 주요 보스 파일 2",
      description: `이건 S.I.N의 '오늘의 히트 상품'
                    보스의 핵심 패턴이 고스란히 담겨 있죠
                    파일럿, 받은 정보는 즉시 써먹어야 제맛입니다
                    놈의 콧대를 밟아버리세요!
                    
                    제피로스
                    '고속 기동 및 연사 공격'

                    전장을 고속으로 이동하며 시야에서 벗어난 후,
                    불규칙적인 위치에서 나타나 집중적인 연사를 쏟아붓습니다

                    기동 경로를 예측하기보다, 놈이 멈춰서 공격을 준비하는
                    순간적인 정지 시간을 놓치지 말고 극딜하세요
                    정신 놓고 있으면 순삭당합니다`
    },
    {
      id: "bossinfo3",
      title: "기밀 정보 브리핑: 주요 보스 파일 3",
      description: `파일럿, 방금 S.I.N 데이터 마이닝 팀이
                    암호화된 최고 기밀 데이터를 해독했습니다
                    이 독점 정보를 활용해서 놈들에게 예상치 못한 일격을 가하세요!
                    
                    프록시마
                    '전투기 소환 및 지원'
                    
                    끊임없이 소형 전투기를 소환하여 보스를 엄호하고 
                    전방위 공격을 펼칩니다
                    전장 화면을 순식간에 복잡하게 만듭니다

                    소환된 드론들을 최우선으로 제거해서 시야를 확보하고 
                    전장을 클리어해야 합니다
                    보조기들이 사라진 틈을 타서 본체에 딜을 집중하세요`
    },
    {
      id: "infiniteMode",
      title: "infinite mode",
      description: `파일럿님, 실전에 투입되기 전에
                    무한 모드(Infinite Mode)에 대한
                    설명을 숙지해 주십시오

                    이 모드는 귀관의 함선이 파괴되는 순간까지 절대로 끝나지 않습니다
                    계속해서 밀려오는 적의 파상 공세를 막아내며 생존하십시오
      
                    일정 수의 적을 격추하고 나면, 전장에 강력한 보스가 출현합니다
                    보스를 격파하여 추가 보상과 다음 단계로 나아갈 기회를 획득하십시오

                    최대한 오래 생존하여 최고 점수를 달성하는 것이
                    임무의 궁극적인 목표입니다
                    
                    스테이지 1 클리어시 해금됩니다`
    },
    {
      id: "extremeMode",
      title: "extreme mode",
      description: `파일럿님, 극한의 도전을 원하십니까? 
                    익스트림 모드(Extreme Mode)는
                    오직 최고의 에이스만을 위한 전장입니다

                    이 모드에서는 오직 강화된 보스들만이 귀관의 앞을 가로막습니다
                    잡졸의 방해 없이, 숨 돌릴 틈 없는 보스전의 연속입니다

                    귀관의 기체가 파괴될 때까지 전투는 끝나지 않습니다
                    각 보스를 격파할 때마다 즉시 다음 보스가 출현합니다

                    이 모드는 귀관이 그동안 파악했던 모든 보스 패턴 지식과 순발력의 한계를 시험합니다
                    
                    무한 모드 스코어 200 이상 달성시 해금됩니다`
    }
  ];
}

// ▶ 튜토리얼 항목 선택 처리
function selectTutorialItem(itemId) {
  const tutorialData = getTutorialData();
  const item = tutorialData.find(t => t.id === itemId);
  if (!item) return;
  
  const tutorialTitle = document.getElementById("tutorialTitle");
  const tutorialDescription = document.getElementById("tutorialDescription");
  
  if (tutorialTitle) tutorialTitle.textContent = item.title;
  if (tutorialDescription) tutorialDescription.textContent = item.description;
  
  // 모든 항목에서 active 클래스 제거
  const tutorialList = document.getElementById("tutorialList");
  if (tutorialList) {
    tutorialList.querySelectorAll(".tutorialItem").forEach(el => {
      el.classList.remove("active");
      if (el.getAttribute("data-id") === itemId) {
        el.classList.add("active");
      }
    });
  }
}

// ▶ 튜토리얼 목록 생성
function createTutorialList() {
  const tutorialList = document.getElementById("tutorialList");
  if (!tutorialList) return;
  
  const tutorialData = getTutorialData();
  tutorialList.innerHTML = "";
  
  tutorialData.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "tutorialItem";
    itemDiv.textContent = item.title;
    itemDiv.setAttribute("data-id", item.id);
    
    // 첫 번째 항목을 기본 선택
    if (index === 0) {
      itemDiv.classList.add("active");
      selectTutorialItem(item.id);
    }
    
    // 클릭 이벤트
    itemDiv.addEventListener("click", () => {
      selectTutorialItem(item.id);
    });
    
    tutorialList.appendChild(itemDiv);
  });
}

// ▶ 튜토리얼 패널 표시
function showTutorialPanel() {
  const tutorialPanel = document.getElementById("tutorialPanel");
  if (!tutorialPanel) return;
  
  createTutorialList();
  tutorialPanel.style.display = "flex";
}

// ▶ 튜토리얼 패널 숨기기
function hideTutorialPanel() {
  const tutorialPanel = document.getElementById("tutorialPanel");
  if (tutorialPanel) {
    tutorialPanel.style.display = "none";
  }
}

// ▶ 튜토리얼 버튼 이벤트 (HTML)
const tutorialBtn = document.getElementById("tutorialBtn");
if (tutorialBtn) {
  tutorialBtn.addEventListener("click", () => {
    showTutorialPanel();
  });
}

// ▶ 스테이지 버튼 이벤트
const stage1Btn = document.getElementById("stage1Btn");
const stage2Btn = document.getElementById("stage2Btn");
const stage3Btn = document.getElementById("stage3Btn");
const infiniteBtn = document.getElementById("infiniteBtn");
const extremeBtn = document.getElementById("extremeBtn");
const backToTitleBtn2 = document.getElementById("backToTitleBtn2");

if (stage1Btn) {
  stage1Btn.addEventListener("click", () => {
    startGame(1, false);
  });
}

if (stage2Btn) {
  stage2Btn.addEventListener("click", () => {
    if (!stage2Btn.disabled) {
      startGame(2, false);
    }
  });
}

if (stage3Btn) {
  stage3Btn.addEventListener("click", () => {
    if (!stage3Btn.disabled) {
      startGame(3, false);
    }
  });
}

if (infiniteBtn) {
  infiniteBtn.addEventListener("click", () => {
    if (!infiniteBtn.disabled) {
      startGame(1, true, false);  // 무한모드는 스테이지 1 설정을 사용
    }
  });
}

if (extremeBtn) {
  extremeBtn.addEventListener("click", () => {
    if (!extremeBtn.disabled) {
      startGame(1, false, true);  // 익스트림 모드는 스테이지 1 설정을 사용
    }
  });
}

if (backToTitleBtn2) {
  backToTitleBtn2.addEventListener("click", () => {
    switchScreen("stageSelectScreen", "titleScreen");
  });
}

// 타이틀 화면에서 첫 상호작용 시 배경음 재생 (브라우저 자동재생 정책 대응)
const titleScreenEl = document.getElementById("titleScreen");
if (titleScreenEl) {
  let titleBgmStarted = false;
  titleScreenEl.addEventListener("click", () => {
    if (!titleBgmStarted && !gameStarted) {
      const titleBgm = document.getElementById("titleBgm");
      if (titleBgm) {
        try { updateBgmVolume(); titleBgm.play().catch(()=>{}); } catch {}
        titleBgmStarted = true;
      }
    }
  });
}

// ▶ 사운드 설정 버튼
const soundBtn = document.getElementById("soundBtn");
const soundPanel = document.getElementById("soundPanel");
const closeSoundBtn = document.getElementById("closeSoundBtn");

function showSoundPanel() {
  if (soundPanel) soundPanel.style.display = "flex";
  // save 패널이 열려있으면 닫기
  hideSavePanel();
}

function hideSoundPanel() {
  if (soundPanel) soundPanel.style.display = "none";
}

if (soundBtn) {
  soundBtn.addEventListener("click", showSoundPanel);
}

if (closeSoundBtn) {
  closeSoundBtn.addEventListener("click", hideSoundPanel);
}

// ▶ 볼륨 슬라이더 이벤트
const bgmVolumeSlider = document.getElementById("bgmVolume");
const sfxVolumeSlider = document.getElementById("sfxVolume");

if (bgmVolumeSlider) {
  bgmVolumeSlider.addEventListener("input", (e) => {
    bgmVolume = e.target.value / 100;
    updateBgmVolume();
    // 일시정지 메뉴의 슬라이더도 동기화
    if (pauseBgmVolumeSlider) pauseBgmVolumeSlider.value = e.target.value;
  });
}

if (sfxVolumeSlider) {
  sfxVolumeSlider.addEventListener("input", (e) => {
    sfxVolume = e.target.value / 100;
    // 일시정지 메뉴의 슬라이더도 동기화
    if (pauseSfxVolumeSlider) pauseSfxVolumeSlider.value = e.target.value;
  });
}

// ▶ 메뉴 버튼 및 일시정지 기능
const menuBtn = document.getElementById("menuBtn");
const pauseMenu = document.getElementById("pauseMenu");
const resumeBtn = document.getElementById("resumeBtn");
const backToTitleBtn = document.getElementById("backToTitleBtn");
const pauseSoundBtn = document.getElementById("pauseSoundBtn");
const pauseSoundPanel = document.getElementById("pauseSoundPanel");
const pauseCloseSoundBtn = document.getElementById("pauseCloseSoundBtn");

function pauseGame() {
  if (!gameStarted || gameOver) return;
  isPaused = true;
  if (pauseMenu) pauseMenu.style.display = "block";
  // 소리 패널 숨기기
  if (pauseSoundPanel) pauseSoundPanel.style.display = "none";
  // 타이머 정지
  if (enemySpawnInterval) clearInterval(enemySpawnInterval);
  if (enemyShootInterval) clearInterval(enemyShootInterval);
  // 배경음악은 계속 재생
}

function resumeGame() {
  isPaused = false;
  if (pauseMenu) pauseMenu.style.display = "none";
  // 소리 패널 숨기기
  if (pauseSoundPanel) pauseSoundPanel.style.display = "none";
  // 타이머 재시작 (보스가 등장하지 않았을 때만)
  if (!boss) {
  // 익스트림 모드에서는 적 스폰하지 않음
  if (!isExtremeMode) {
    const spawnInterval = isInfiniteMode ? 700 : CONFIG.ENEMY.SPAWN_INTERVAL;
    enemySpawnInterval = setInterval(spawnEnemy, spawnInterval);
  }
  enemyShootInterval = setInterval(enemyShoot, CONFIG.ENEMY_BULLET.SHOOT_INTERVAL);
  }
  // 배경음악은 이미 재생 중이므로 볼륨만 업데이트
  updateBgmVolume();
}

function showPauseSoundPanel() {
  if (pauseSoundPanel) pauseSoundPanel.style.display = "flex";
}

function hidePauseSoundPanel() {
  if (pauseSoundPanel) pauseSoundPanel.style.display = "none";
}

function resetGame() {
  // 스테이지 클리어 시 현재 골드를 누적 골드에 추가
  totalGold += gold;
  
  // 보스 배경음악 정지
  if (boss && boss.currentBgm) {
    try { boss.currentBgm.pause(); boss.currentBgm.currentTime = 0; } catch {}
  }
  // 모든 보스 배경음악 정지 (안전장치)
  Object.keys(resources.audio).forEach(key => {
    if (key.startsWith("boss")) {
      try { resources.audio[key].pause(); resources.audio[key].currentTime = 0; } catch {}
    }
  });
  
  // 모든 배열 초기화
  bullets = []; enemies = []; enemyBullets = []; items = []; effects = [];
  // 게임 상태 초기화
  gold = 0; gameOver = false; life = CONFIG.GAME.INIT_LIFE; lastShootTime = 0; isPaused = false;
  // 스테이지 관련 초기화
  currentStage = 1; isInfiniteMode = false; enemiesKilled = 0; infiniteBossKillCount = 0;
  // 보스 관련 초기화
  boss = null; bossSpawned = false; bossFlashTime = 0; bossVisible = false; warningShown = false;
  
  updateGameUI();  // UI 업데이트
  // 플레이어 위치 초기화
  player.x = CONFIG.PLAYER.INIT_X; player.y = CONFIG.PLAYER.INIT_Y;
  // 타이머 정리
  clearEnemyTimers();
  // 일시정지 메뉴 숨기기
  if (pauseMenu) pauseMenu.style.display = "none";
  // 게임오버 메뉴 숨기기
  const gameResultMenu = document.getElementById("gameResultMenu");
  if (gameResultMenu) gameResultMenu.style.display = "none";
}

function backToTitle() {
  // 게임 초기화
  resetGame();
  gameStarted = false;
  // 배경음악 정지
  stopAllBgm();
  // 화면 전환
  switchScreen("gameScreen", "titleScreen");
  // 타이틀 배경음 재생 (이미 사용자 상호작용이 있었으므로 재생 가능)
  const titleBgm = document.getElementById("titleBgm");
  if (titleBgm) {
    try {
      updateBgmVolume();
      titleBgm.play().catch(() => {});
      titleBgmStarted = true; // 재생 상태 업데이트
    } catch {}
  }
}

if (menuBtn) {
  menuBtn.addEventListener("click", pauseGame);
}

if (resumeBtn) {
  resumeBtn.addEventListener("click", resumeGame);
}

if (backToTitleBtn) {
  backToTitleBtn.addEventListener("click", backToTitle);
}

if (pauseSoundBtn) {
  pauseSoundBtn.addEventListener("click", showPauseSoundPanel);
}

if (pauseCloseSoundBtn) {
  pauseCloseSoundBtn.addEventListener("click", hidePauseSoundPanel);
}

// ▶ 일시정지 메뉴 볼륨 슬라이더 이벤트
const pauseBgmVolumeSlider = document.getElementById("pauseBgmVolume");
const pauseSfxVolumeSlider = document.getElementById("pauseSfxVolume");

if (pauseBgmVolumeSlider) {
  pauseBgmVolumeSlider.value = bgmVolume * 100;
  pauseBgmVolumeSlider.addEventListener("input", (e) => {
    bgmVolume = e.target.value / 100;
    updateBgmVolume();
    // 타이틀 화면의 슬라이더도 동기화
    if (bgmVolumeSlider) bgmVolumeSlider.value = e.target.value;
  });
}

// ▶ 튜토리얼 패널 닫기 버튼
const closeTutorialBtn = document.getElementById("closeTutorialBtn");
if (closeTutorialBtn) {
  closeTutorialBtn.addEventListener("click", () => {
    hideTutorialPanel();
  });
}

if (pauseSfxVolumeSlider) {
  pauseSfxVolumeSlider.value = sfxVolume * 100;
  pauseSfxVolumeSlider.addEventListener("input", (e) => {
    sfxVolume = e.target.value / 100;
    // 타이틀 화면의 슬라이더도 동기화
    if (sfxVolumeSlider) sfxVolumeSlider.value = e.target.value;
  });
}

// ▶ 게임 결과 TITLE 버튼
const gameResultTitleBtn = document.getElementById("gameResultTitleBtn");
if (gameResultTitleBtn) {
  gameResultTitleBtn.addEventListener("click", backToTitle);
}

// ▶ 업그레이드 버튼 이벤트
const upgradeBtn = document.getElementById("upgradeBtn");
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", showUpgrade);
}

// ▶ 업그레이드 뒤로가기 버튼
const upgradeBackBtn = document.getElementById("upgradeBackBtn");
if (upgradeBackBtn) {
  upgradeBackBtn.addEventListener("click", backToTitleFromUpgrade);
}

  // SAVE 버튼
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveGameData();
      // sound 패널이 열려있으면 닫기
      hideSoundPanel();
    });
  }
  
  // SAVE 패널의 SAVE 버튼
  const savePanelSaveBtn = document.getElementById("savePanelSaveBtn");
  if (savePanelSaveBtn) {
    savePanelSaveBtn.addEventListener("click", (e) => {
      e.stopPropagation();  // 이벤트 전파 방지
      
      // 저장 실행
      saveGameData();
    });
  }
  
  // RESET 버튼
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();  // 이벤트 전파 방지
      resetGameData();
    });
  }
  
  // CLOSE 버튼
  const closeSavePanelBtn = document.getElementById("closeSavePanelBtn");
  if (closeSavePanelBtn) {
    closeSavePanelBtn.addEventListener("click", (e) => {
      e.stopPropagation();  // 이벤트 전파 방지
      hideSavePanel();
    });
  }
  
  // 자동 저장 비활성화 (수동으로만 저장/로드)

// ▶ 탭 이동 감지하여 자동 일시정지
document.addEventListener("visibilitychange", () => {
  // 탭이 숨겨지고 게임이 실행 중이며 일시정지 상태가 아닐 때
  if (document.hidden && gameStarted && !isPaused && !gameOver) {
    pauseGame();  // 자동으로 일시정지
  }
});

// ▶ 게임 루프 시작 (초기에는 게임이 시작되지 않음)
update();