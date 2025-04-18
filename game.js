const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// تنظیم ابعاد canvas (برای اطمینان از نمایش)
canvas.width = 288; // عرض استاندارد بازی Flappy Bird
canvas.height = 512; // ارتفاع استاندارد بازی Flappy Bird

// فوکوس روی canvas
canvas.setAttribute('tabindex', '0');
canvas.focus();

// بارگذاری منابع
const birdImg = new Image();
birdImg.src = 'sprites/pngwing.png'; // تصویر جدید پرنده که دانلود کردی

const pipeImg = new Image();
pipeImg.src = 'sprites/pipe-green.png';
const bgImg = new Image();
bgImg.src = 'sprites/background-day.png';
const groundImg = new Image();
groundImg.src = 'sprites/base.png';
const messageImg = new Image();
messageImg.src = 'sprites/message.png';
const gameOverImg = new Image();
gameOverImg.src = 'sprites/gameover.png';

const jumpSound = document.getElementById('jumpSound');
const hitSound = document.getElementById('hitSound');
const pointSound = document.getElementById('pointSound');
const swooshSound = document.getElementById('swooshSound');

// متغیرهای پرنده
let bird = {
    x: 100,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    gravity: 0.4,
    lift: -6, // پرش کمتر
    velocity: 0,
    rotation: 0
};

// متغیرهای بازی
let pipes = [];
let pipeWidth = 52;
let pipeGap = 150; // فاصله اولیه بین لوله‌ها (عمودی)
let pipeSpeed = 1.5; // سرعت اولیه لوله‌ها
let groundX = 0;
let frameCount = 0;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameState = 'start';
let isSpacePressed = false;
let lastPipeX = canvas.width; // موقعیت x آخرین لوله
let minPipeDistance = 150; // حداقل فاصله افقی بین لوله‌ها (به پیکسل)
let maxPipeDistance = 200; // حداکثر فاصله افقی بین لوله‌ها (به پیکسل)

// تابع پرش
function jump() {
    if (gameState === 'playing') {
        bird.velocity = bird.lift;
        jumpSound.play();
        bird.rotation = -0.5;
    }
}

// کنترل با ماوس
document.addEventListener('click', () => {
    if (gameState === 'start') {
        gameState = 'playing';
        swooshSound.play();
    } else if (gameState === 'playing') {
        jump();
    } else if (gameState === 'gameover') {
        resetGame();
        gameState = 'start';
        swooshSound.play();
    }
});

// کنترل با کیبورد
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        if (gameState === 'start') {
            gameState = 'playing';
            swooshSound.play();
        } else if (gameState === 'playing') {
            jump();
        } else if (gameState === 'gameover') {
            resetGame();
            gameState = 'start';
            swooshSound.play();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        isSpacePressed = false;
    }
});

// تولید لوله‌ها
function spawnPipe() {
    // اگه امتیاز به 1 رسید، فاصله عمودی و افقی بین لوله‌ها رو رندوم تغییر بده
    let currentPipeGap = pipeGap; // فاصله عمودی پیش‌فرض
    let currentPipeDistance = Math.floor(Math.random() * (maxPipeDistance - minPipeDistance)) + minPipeDistance; // فاصله افقی رندوم

    if (score >= 1) {
        currentPipeGap = Math.floor(Math.random() * (180 - 120)) + 90; 
        currentPipeDistance = Math.floor(Math.random() * (maxPipeDistance - minPipeDistance)) + minPipeDistance; // فاصله افقی رندوم بین 150 تا 200
    }

    if (score % 10 === 0 && score !== 0) { // شرط اصلاح‌شده برای جلوگیری از افزایش سرعت در امتیاز 0
        pipeSpeed += 0.5; // سرعت لوله‌ها رو هر 10 امتیاز افزایش می‌دیم
    }

    let minHeight = 100;
    let maxHeight = canvas.height - currentPipeGap - 150;
    let pipeHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: pipeHeight,
        bottomY: pipeHeight + currentPipeGap, // از فاصله عمودی رندوم استفاده می‌کنیم
        scored: false
    });

    // موقعیت x آخرین لوله رو آپدیت می‌کنیم
    lastPipeX = canvas.width - currentPipeDistance;
}

// ریست بازی
function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    pipeSpeed = 1.5; // سرعت اولیه
    pipeGap = 150; // فاصله عمودی اولیه
    lastPipeX = canvas.width; // موقعیت اولیه آخرین لوله
    frameCount = 0;
}

// رندر و آپدیت بازی
function draw() {
    // رسم پس‌زمینه
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    if (gameState === 'start') {
        // صفحه شروع
        ctx.drawImage(messageImg, canvas.width / 2 - messageImg.width / 2, canvas.height / 2 - messageImg.height / 2);
    } else if (gameState === 'playing') {
        // آپدیت پرنده
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        bird.rotation += bird.velocity * 0.02;
        if (bird.rotation > 1.5) bird.rotation = 1.5;

        // تولید لوله با فاصله افقی متغیر
        if (pipes.length === 0 || (pipes[pipes.length - 1].x <= lastPipeX)) {
            spawnPipe();
        }
        frameCount++;

        // رسم پرنده با چرخش
        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation);
        ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height); // از تصویر تکی استفاده می‌کنیم
        ctx.restore();

        // رسم و آپدیت لوله‌ها
        for (let i = pipes.length - 1; i >= 0; i--) {
            let pipe = pipes[i];
            pipe.x -= pipeSpeed;

            // رسم لوله بالایی (برعکس)
            ctx.save();
            ctx.translate(pipe.x + pipeWidth / 2, pipe.topHeight);
            ctx.rotate(Math.PI);
            ctx.drawImage(pipeImg, -pipeWidth / 2, 0, pipeWidth, pipeImg.height);
            ctx.restore();

            // رسم لوله پایینی (عادی)
            ctx.drawImage(pipeImg, pipe.x, pipe.bottomY, pipeWidth, pipeImg.height);

            // بررسی برخورد
            if (
                bird.x + bird.width > pipe.x &&
                bird.x < pipe.x + pipeWidth &&
                (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
            ) {
                gameState = 'gameover';
                hitSound.play();
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem('bestScore', bestScore);
                }
            }

            // شمارش امتیاز
            if (bird.x > pipe.x + pipeWidth && !pipe.scored) {
                score++;
                pointSound.play();
                pipe.scored = true;
            }

            // حذف لوله‌های خارج از صفحه
            if (pipe.x + pipeWidth < 0) {
                pipes.splice(i, 1);
            }
        }

        // بررسی برخورد با زمین یا سقف
        if (bird.y + bird.height > canvas.height - groundImg.height || bird.y < 0) {
            gameState = 'gameover';
            hitSound.play();
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('bestScore', bestScore);
            }
        }

        // نمایش امتیاز
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`${score}`, canvas.width / 2, 50);
    } else if (gameState === 'gameover') {
        // صفحه Game Over
        ctx.drawImage(gameOverImg, canvas.width / 2 - gameOverImg.width / 2, canvas.height / 2 - gameOverImg.height);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`امتیاز: ${score}`, canvas.width / 2 - 40, canvas.height / 2 + 20);
        ctx.fillText(`بهترین: ${bestScore}`, canvas.width / 2 - 40, canvas.height / 2 + 50);
        ctx.fillText('کلیک یا Space برای شروع مجدد', canvas.width / 2 - 100, canvas.height / 2 + 100);
    }

    // رسم زمین متحرک
    ctx.drawImage(groundImg, groundX, canvas.height - groundImg.height, canvas.width, groundImg.height);
    ctx.drawImage(groundImg, groundX + canvas.width, canvas.height - groundImg.height, canvas.width, groundImg.height);
    if (gameState === 'playing') {
        groundX -= 1;
    }
    if (groundX <= -canvas.width) groundX = 0;

    requestAnimationFrame(draw);
}

// شروع بازی وقتی منابع بارگذاری بشن
birdImg.onload = () => {
    pipeImg.onload = () => {
        bgImg.onload = () => {
            groundImg.onload = () => {
                messageImg.onload = () => {
                    gameOverImg.onload = () => {
                        draw();
                    };
                };
            };
        };
    };
};

// اگه منابع بارگذاری نشن، خطا رو نمایش بده
birdImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر پرنده: sprites/pngwing.png");
};
pipeImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر لوله: sprites/pipe-green.png");
};
bgImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر پس‌زمینه: sprites/background-day.png");
};
groundImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر زمین: sprites/base.png");
};
messageImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر پیام شروع: sprites/message.png");
};
gameOverImg.onerror = () => {
    console.error("خطا در بارگذاری تصویر پایان بازی: sprites/gameover.png");
};