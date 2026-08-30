const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 500;

const box = {
    x: 450,
    y: 100,
    width: 100,
    height: 100,
    velocityY: 0
};

let lastTime = performance.now();

const game = (time) => {
    requestAnimationFrame(game);

    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Gravity
    box.velocityY += gravity;

    // Integration
    box.y += box.velocityY * dt;

    // Floor collision
    const floorY = h - 100;

    if (box.y + box.height > floorY) {
        box.y = floorY - box.height;
        box.velocityY = 0;
    }

    // Clear screen
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    // Draw floor
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, floorY, w, 2);

    // Draw box
    ctx.strokeStyle = '#ffff';
    ctx.strokeRect(
        box.x,
        box.y,
        box.width,
        box.height
    );
};

requestAnimationFrame(game);