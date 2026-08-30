const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 1000;

const box1 = {
    x: 300,
    y: 100,
    width: 100,
    height: 100,
    velocityX: 150,
    velocityY: 0
};

const box2 = {
    x: 600,
    y: 50,
    width: 100,
    height: 100,
    velocityX: -100,
    velocityY: 0
};

let lastTime = performance.now();

const checkCollision = (a, b) => {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
};

const resolveCollision = (a, b) => {
    if (!checkCollision(a, b)) return;

    const overlapX =
        Math.min(a.x + a.width, b.x + b.width) -
        Math.max(a.x, b.x);

    const overlapY =
        Math.min(a.y + a.height, b.y + b.height) -
        Math.max(a.y, b.y);

    // Resolve along the axis with the smallest overlap
    if (overlapX < overlapY) {

        if (a.x < b.x) {
            a.x -= overlapX / 2;
            b.x += overlapX / 2;
        } else {
            a.x += overlapX / 2;
            b.x -= overlapX / 2;
        }

        // Exchange horizontal velocities
        const temp = a.velocityX;
        a.velocityX = b.velocityX;
        b.velocityX = temp;

    } else {

        if (a.y < b.y) {
            a.y -= overlapY / 2;
            b.y += overlapY / 2;
        } else {
            a.y += overlapY / 2;
            b.y -= overlapY / 2;
        }

        // Exchange vertical velocities
        const temp = a.velocityY;
        a.velocityY = b.velocityY;
        b.velocityY = temp;
    }
};

const updateBox = (box, dt) => {

    // Gravity
    box.velocityY += gravity * dt;

    // Integration
    box.x += box.velocityX * dt;
    box.y += box.velocityY * dt;

    // Floor
    const floorY = h - 100;

    if (box.y + box.height > floorY) {
        box.y = floorY - box.height;
        box.velocityY = 0;
    }

    // Walls
    if (box.x < 0) {
        box.x = 0;
        box.velocityX *= -1;
    }

    if (box.x + box.width > w) {
        box.x = w - box.width;
        box.velocityX *= -1;
    }
};

const drawBox = (box) => {
    ctx.strokeStyle = '#ffff';
    ctx.strokeRect(
        box.x,
        box.y,
        box.width,
        box.height
    );
};

const game = (time) => {
    requestAnimationFrame(game);

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    updateBox(box1, dt);
    updateBox(box2, dt);

    resolveCollision(box1, box2);

    // Clear screen
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    // Draw floor
    const floorY = h - 100;

    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, floorY, w, 2);

    // Draw boxes
    drawBox(box1);
    drawBox(box2);
};

requestAnimationFrame(game);