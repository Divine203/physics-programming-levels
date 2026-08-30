const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 1000;
const restitution = 0.8;

const boxes = [
    {
        x: 250,
        y: 100,
        width: 100,
        height: 100,
        velocityX: 200,
        velocityY: 0,
        mass: 1
    },
    {
        x: 650,
        y: 200,
        width: 100,
        height: 100,
        velocityX: -100,
        velocityY: 0,
        mass: 1
    }
];

const floorY = h - 100;

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

    let normalX = 0;
    let normalY = 0;
    let penetration = 0;

    // Find collision normal
    if (overlapX < overlapY) {
        penetration = overlapX;

        if (a.x < b.x) {
            normalX = 1;
        } else {
            normalX = -1;
        }
    } else {
        penetration = overlapY;

        if (a.y < b.y) {
            normalY = 1;
        } else {
            normalY = -1;
        }
    }

    // Separate the boxes
    const totalMass = a.mass + b.mass;

    a.x -= normalX * penetration * (b.mass / totalMass);
    a.y -= normalY * penetration * (b.mass / totalMass);

    b.x += normalX * penetration * (a.mass / totalMass);
    b.y += normalY * penetration * (a.mass / totalMass);

    // Relative velocity
    const relativeVelocityX =
        b.velocityX - a.velocityX;

    const relativeVelocityY =
        b.velocityY - a.velocityY;

    // Velocity along collision normal
    const velocityAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    // Already moving apart
    if (velocityAlongNormal > 0) return;

    // Impulse magnitude
    const impulse =
        -(1 + restitution) *
        velocityAlongNormal /
        (1 / a.mass + 1 / b.mass);

    // Apply impulse
    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;

    a.velocityX -= impulseX / a.mass;
    a.velocityY -= impulseY / a.mass;

    b.velocityX += impulseX / b.mass;
    b.velocityY += impulseY / b.mass;
};

const updateBox = (box, dt) => {

    // Gravity
    box.velocityY += gravity * dt;

    // Integration
    box.x += box.velocityX * dt;
    box.y += box.velocityY * dt;

    // Floor collision
    if (box.y + box.height > floorY) {

        box.y = floorY - box.height;

        // Bounce using restitution
        if (box.velocityY > 0) {
            box.velocityY *= -restitution;
        }

        // Stop tiny bouncing
        if (Math.abs(box.velocityY) < 10) {
            box.velocityY = 0;
        }
    }

    // Left wall
    if (box.x < 0) {
        box.x = 0;
        box.velocityX *= -restitution;
    }

    // Right wall
    if (box.x + box.width > w) {
        box.x = w - box.width;
        box.velocityX *= -restitution;
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

    const dt = Math.min(
        (time - lastTime) / 1000,
        0.02
    );

    lastTime = time;

    // Update physics
    for (const box of boxes) {
        updateBox(box, dt);
    }

    // Box collisions
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            resolveCollision(
                boxes[i],
                boxes[j]
            );
        }
    }

    // Clear screen
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    // Draw floor
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, floorY, w, 2);

    // Draw boxes
    for (const box of boxes) {
        drawBox(box);
    }
};

requestAnimationFrame(game);