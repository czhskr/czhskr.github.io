const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const assistCheckbox = document.getElementById('assistCheckbox');
const assistStatus = document.getElementById('assistStatus');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton');
const lifeImage = document.getElementById('lifeImage');

// 게임 상태 변수
let circle = {
    x: Math.random() * 350 + 25,
    y: 0,
    r: 30,
    speed: 3
};

let score = 0;
let missCount = 0;
let MAX_MISSES = 3;
let gameOver = false;
let gameStarted = false;

// 어시스트 설정 상수
const ASSIST_WAIT_TIME = 8;        // 어시스트 대기 시간 (초)
const ASSIST_ACTIVE_TIME = 3;       // 어시스트 활성화 시간 (초)
const ASSIST_CLICK_INTERVAL = 1.2;  // 공을 없애는 주기 (초)

// 어시스트 변수
let assistActive = false;
let assistTimer = null;
let assistActiveTimer = null;
let assistCountdown = 0;
let assistActiveCountdown = 0;
let assistCountdownInterval = null;
let assistClickInterval = null;

// 이미지 변수
let circleImage = null;

// 마우스 위치 추적 변수
let mouseX = 0;
let mouseY = 0;
let isMouseInCanvas = false;

// 십자선 부드러운 이동을 위한 변수
let crosshairX = 0;
let crosshairY = 0;
const CROSSHAIR_SPEED = 0.2;

// 속도 증가 설정
const IncreaseSpeedInterval = 5;
const IncreaseSpeedAmount = 1;

// 목숨 이미지 업데이트 함수
function updateLifeImage() {
    const remainingLives = MAX_MISSES - missCount;
    
    const life3Url = getComputedStyle(document.documentElement).getPropertyValue('--life3-image').trim();
    const life2Url = getComputedStyle(document.documentElement).getPropertyValue('--life2-image').trim();
    const life1Url = getComputedStyle(document.documentElement).getPropertyValue('--life1-image').trim();
    
    if (remainingLives === 3) {
        const cleanUrl = life3Url.replace(/url\(['"]?([^'"]*)['"]?\)/, '$1');
        lifeImage.src = cleanUrl;
    } else if (remainingLives === 2) {
        const cleanUrl = life2Url.replace(/url\(['"]?([^'"]*)['"]?\)/, '$1');
        lifeImage.src = cleanUrl;
    } else if (remainingLives === 1) {
        const cleanUrl = life1Url.replace(/url\(['"]?([^'"]*)['"]?\)/, '$1');
        lifeImage.src = cleanUrl;
    } else if (remainingLives === 0) {
        // 목숨이 0일 때는 이미지 숨기기기
        lifeImage.style.display = 'none';
    }
}

// 원 리셋 함수
function resetCircle() {
    circle.x = Math.random() * (canvas.width - 50) + 25;
    circle.y = 0;
}

// 이미지 로딩 함수
function loadImages() {
    const circleImageUrl = getComputedStyle(document.documentElement).getPropertyValue('--image-url').trim();
    if (circleImageUrl && circleImageUrl !== 'url()' && circleImageUrl !== 'url("")' && circleImageUrl !== 'url(\'\')') {
        const cleanUrl = circleImageUrl.replace(/url\(['"]?([^'"]*)['"]?\)/, '$1');
        circleImage = new Image();
        circleImage.onload = function() {
            // 공 이미지 로드 완료
        };
        circleImage.onerror = function() {
            // 공 이미지 로드 실패, 기본 원 사용
            circleImage = null;
        };
        circleImage.src = cleanUrl;
    } else {
        // 공 이미지 URL이 설정되지 않음, 기본 원 사용
        circleImage = null;
    }
}

// 십자선 그리기 함수
function drawCrosshair() {
    if (isMouseInCanvas) {
        crosshairX += (mouseX - crosshairX) * CROSSHAIR_SPEED;
        crosshairY += (mouseY - crosshairY) * CROSSHAIR_SPEED;
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        
        const crosshairSize = 10;
        const centerDotSize = 1;
        
        // 수평선
        ctx.beginPath();
        ctx.moveTo(crosshairX - crosshairSize, crosshairY);
        ctx.lineTo(crosshairX + crosshairSize, crosshairY);
        ctx.stroke();
        
        // 수직선
        ctx.beginPath();
        ctx.moveTo(crosshairX, crosshairY - crosshairSize);
        ctx.lineTo(crosshairX, crosshairY + crosshairSize);
        ctx.stroke();
        
        // 중앙 점
        ctx.beginPath();
        ctx.arc(crosshairX, crosshairY, centerDotSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 원 그리기 함수
function drawCircle() {
    if (circleImage) {
        ctx.drawImage(circleImage, circle.x - circle.r, circle.y - circle.r, circle.r * 2, circle.r * 2);
    } else {
        ctx.fillStyle = 'red';
    ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    ctx.fill();
    }
}

// 어시스트 자동클릭 함수 (공을 자동으로 없애기)
function assistAutoClick() {
    if (gameStarted && !gameOver && assistActive) {
        // 공이 화면에 있으면 무조건 클릭 성공
        if (circle.y >= 0 && circle.y <= canvas.height + circle.r) {
            score++;
            scoreSpan.textContent = score;
            
            if (score % IncreaseSpeedInterval === 0) {
                circle.speed += IncreaseSpeedAmount;
            }
            resetCircle();
        }
    }
}

// 어시스트 카운트다운 업데이트
function updateAssistCountdown() {
    if (assistCountdown > 0) {
        assistCountdown--;
        assistStatus.textContent = `ASSIST WAITING... (${assistCountdown}s)`;
    } else if (assistActiveCountdown > 0) {
        assistActiveCountdown--;
        assistStatus.textContent = `ASSIST ACTIVE... (${assistActiveCountdown}s)`;
    }
}

// 어시스트 시작 함수
function startAssist() {
    if (assistCheckbox.checked) {
        assistStatus.style.display = 'block';
        
        // 어시스트 사이클 시작
        startAssistCycle();
    } else {
        stopAssist();
    }
}

// 어시스트 사이클 시작
function startAssistCycle() {
    // 대기 시간 시작
    assistCountdown = ASSIST_WAIT_TIME;
    assistStatus.textContent = `ASSIST WAITING... (${assistCountdown}s)`;
    
    // 대기 시간 카운트다운
    assistCountdownInterval = setInterval(() => {
        if (!gameOver) {
            assistCountdown--;
            assistStatus.textContent = `ASSIST WAITING... (${assistCountdown}s)`;
            
            // 대기 시간이 끝나면 어시스트 활성화
            if (assistCountdown <= 0) {
                clearInterval(assistCountdownInterval);
                activateAssist();
            }
        }
    }, 1000);
}

// 어시스트 활성화
function activateAssist() {
    assistActive = true;
    assistActiveCountdown = ASSIST_ACTIVE_TIME;
    assistStatus.textContent = `ASSIST ACTIVE... (${assistActiveCountdown}s)`;
    
    // 공을 자동으로 없애는 주기 시작
    assistClickInterval = setInterval(assistAutoClick, ASSIST_CLICK_INTERVAL * 1000);
    
    // 활성화 시간 카운트다운
    assistCountdownInterval = setInterval(() => {
        if (!gameOver) {
            assistActiveCountdown--;
            assistStatus.textContent = `ASSIST ACTIVE... (${assistActiveCountdown}s)`;
            
            // 활성화 시간이 끝나면 어시스트 비활성화
            if (assistActiveCountdown <= 0) {
                clearInterval(assistCountdownInterval);
                clearInterval(assistClickInterval);
                assistActive = false;
                
                // 다음 사이클 시작
                startAssistCycle();
            }
        }
    }, 1000);
}

// 어시스트 중지 함수
function stopAssist() {
    assistActive = false;
    assistCountdown = 0;
    assistActiveCountdown = 0;
    assistStatus.textContent = 'ASSIST DISABLED';
    assistStatus.style.display = 'none';
    
    // 캔버스 테두리를 원래 색상으로 되돌리기
    canvas.classList.remove('assist-active');
    
    // 모든 타이머 정리
    if (assistCountdownInterval) {
        clearInterval(assistCountdownInterval);
        assistCountdownInterval = null;
    }
    if (assistClickInterval) {
        clearInterval(assistClickInterval);
        assistClickInterval = null;
    }
    if (assistActiveTimer) {
        clearTimeout(assistActiveTimer);
        assistActiveTimer = null;
    }
}

// 게임 시작 함수
function startGame() {
    gameStarted = true;
    startButton.style.display = 'none';
    startButton.disabled = true;
    canvas.classList.remove('game-paused');
    
    // 어시스트 체크박스 숨김처리 (게임 시작 후에는 보이지 않음)
    document.getElementById('assistCheckboxContainer').style.display = 'none';
    
    if (assistCheckbox.checked) {
        startAssist();
    }
    
    updateGame();
}

// 게임 재시작 함수
function restartGame() {
    score = 0;
    missCount = 0;
    gameOver = false;
    gameStarted = false;
    
    scoreSpan.textContent = score;
    
    circle.x = Math.random() * 350 + 25;
    circle.y = 0;
    circle.speed = 3;
    
    crosshairX = 0;
    crosshairY = 0;
    
    const life3Url = getComputedStyle(document.documentElement).getPropertyValue('--life3-image').trim();
    const cleanUrl = life3Url.replace(/url\(['"]?([^'"]*)['"]?\)/, '$1');
    lifeImage.src = cleanUrl;
    lifeImage.style.display = 'block';
    
    assistCheckbox.checked = false;
    document.getElementById('assistCheckboxContainer').style.display = 'block'; // 어시스트 체크박스 다시 표시
    stopAssist();
    
    canvas.classList.add('game-paused');
    restartButton.style.display = 'none';
    startButton.style.display = 'block';
    startButton.disabled = false;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 게임 종료 화면 표시 함수
function showGameOver() {
    const gameoverBgUrl = getComputedStyle(document.documentElement).getPropertyValue('--gameover-bg').trim();
    
    if (gameoverBgUrl && gameoverBgUrl !== 'url("")' && gameoverBgUrl !== 'url(\'\')') {
        const bgImg = new Image();
        bgImg.onload = function() {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            drawGameOverText();
        };
        bgImg.onerror = function() {
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawGameOverText();
        };
        bgImg.src = gameoverBgUrl.replace('url(', '').replace(')', '').replace(/['"]/g, '');
    } else {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameOverText();
    }
    
    restartButton.style.display = 'block';
}

// 게임오버 텍스트 그리기 함수
function drawGameOverText() {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('3 MISSES GAME OVER!', canvas.width / 2, canvas.height / 2 + 30);
    
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('CLICK RESTART BUTTON', canvas.width / 2, canvas.height / 2 + 60);
}

// 게임 업데이트 함수
function updateGame() {
    if (!gameStarted || gameOver) {
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCircle();
    drawCrosshair();
    circle.y += circle.speed;

    if (circle.y - circle.r > canvas.height) {
        missCount++;
        console.log(`실패 횟수: ${missCount}/${MAX_MISSES}`);
        
        updateLifeImage();
        
        if (missCount >= MAX_MISSES) {
            gameOver = true;
            stopAssist();
            showGameOver();
        } else {
        resetCircle();
        }
    }

    if (assistActive) {
        canvas.classList.add('assist-active');
    } else {
        canvas.classList.remove('assist-active');
    }

    requestAnimationFrame(updateGame);
}

// 원 클릭 이벤트 함수
canvas.addEventListener('click', function(e) {
    if (gameOver) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx1 = mouseX - circle.x;
    const dy1 = mouseY - circle.y;
    const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = crosshairX - circle.x;
    const dy2 = crosshairY - circle.y;
    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (distance1 < circle.r || distance2 < circle.r) {
        score++;
        scoreSpan.textContent = score;
        if (score % IncreaseSpeedInterval === 0) {
            circle.speed += IncreaseSpeedAmount;
        }
        resetCircle();
    }
});

// 이미지 로딩
loadImages();

// 초기 상태 설정
canvas.classList.add('game-paused');
startButton.style.display = 'block';

// 이벤트 리스너
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// 마우스 이벤트 리스너
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    isMouseInCanvas = true;
});

canvas.addEventListener('mouseenter', function() {
    isMouseInCanvas = true;
});

canvas.addEventListener('mouseleave', function() {
    isMouseInCanvas = false;

});
