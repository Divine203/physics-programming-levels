const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 1000;
const restitution = 0.8;

// OBJECTS

const boxes = [
    {
        type: 'box',
        x: 250,
        y: 100,
        width: 100,
        height: 100,
        velocityX: 200,
        velocityY: 0,
        mass: 1
    },
    {
        type: 'box',
        x: 650,
        y: 200,
        width: 100,
        height: 100,
        velocityX: -100,
        velocityY: 0,
        mass: 1
    }
];

const circles = [
    {
        type: 'circle',
        x: 500,
        y: 100,
        radius: 40,
        velocityX: 0,
        velocityY: 0,
        mass: 1
    },
    {
        type: 'circle',
        x: 800,
        y: 50,
        radius: 30,
        velocityX: -100,
        velocityY: 0,
        mass: 1
    }
];

const objects = [
    ...boxes,
    ...circles
];

const floorY = h - 100;

// BOX / BOX COLLISION


const checkBoxCollision = (a, b) => {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
};

const resolveBoxCollision = (a, b) => {

    if (!checkBoxCollision(a, b)) return;

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

    // Separate objects
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

    const velocityAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    // Already moving apart
    if (velocityAlongNormal > 0) return;

    // Impulse
    const impulse =
        -(1 + restitution) *
        velocityAlongNormal /
        (1 / a.mass + 1 / b.mass);

    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;

    a.velocityX -= impulseX / a.mass;
    a.velocityY -= impulseY / a.mass;

    b.velocityX += impulseX / b.mass;
    b.velocityY += impulseY / b.mass;
};

// CIRCLE / CIRCLE COLLISION

const resolveCircleCircleCollision = (a, b) => {

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const distanceSquared = dx * dx + dy * dy;

    const radiusSum = a.radius + b.radius;

    if (distanceSquared >= radiusSum * radiusSum) {
        return;
    }

    let distance = Math.sqrt(distanceSquared);

    // Prevent division by zero
    if (distance === 0) {
        distance = 0.0001;
    }

    // Collision normal
    const normalX = dx / distance;
    const normalY = dy / distance;

    // Penetration
    const penetration = radiusSum - distance;

    // Separate circles
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

    const velocityAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    // Already moving apart
    if (velocityAlongNormal > 0) return;

    // Impulse
    const impulse =
        -(1 + restitution) *
        velocityAlongNormal /
        (1 / a.mass + 1 / b.mass);

    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;

    a.velocityX -= impulseX / a.mass;
    a.velocityY -= impulseY / a.mass;

    b.velocityX += impulseX / b.mass;
    b.velocityY += impulseY / b.mass;
};

// CIRCLE / BOX COLLISION

const resolveCircleBoxCollision = (circle, box) => {

    // Find closest point on box to circle center

    const closestX = Math.max(
        box.x,
        Math.min(circle.x, box.x + box.width)
    );

    const closestY = Math.max(
        box.y,
        Math.min(circle.y, box.y + box.height)
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared >= circle.radius * circle.radius) {
        return;
    }

    let distance = Math.sqrt(distanceSquared);

    let normalX;
    let normalY;

    // Circle center is directly inside the box
    if (distance === 0) {

        const left = circle.x - box.x;
        const right = box.x + box.width - circle.x;
        const top = circle.y - box.y;
        const bottom = box.y + box.height - circle.y;

        const smallest = Math.min(
            left,
            right,
            top,
            bottom
        );

        if (smallest === left) {
            normalX = -1;
            normalY = 0;
        } else if (smallest === right) {
            normalX = 1;
            normalY = 0;
        } else if (smallest === top) {
            normalX = 0;
            normalY = -1;
        } else {
            normalX = 0;
            normalY = 1;
        }

        distance = 0;

    } else {

        normalX = dx / distance;
        normalY = dy / distance;
    }

    const penetration =
        circle.radius - distance;

    // Separate objects
    const totalMass = circle.mass + box.mass;

    circle.x +=
        normalX *
        penetration *
        (box.mass / totalMass);

    circle.y +=
        normalY *
        penetration *
        (box.mass / totalMass);

    box.x -=
        normalX *
        penetration *
        (circle.mass / totalMass);

    box.y -=
        normalY *
        penetration *
        (circle.mass / totalMass);

    // Relative velocity
    const relativeVelocityX =
        box.velocityX - circle.velocityX;

    const relativeVelocityY =
        box.velocityY - circle.velocityY;

    const velocityAlongNormal =
        relativeVelocityX * normalX +
        relativeVelocityY * normalY;

    // Already moving apart
    if (velocityAlongNormal > 0) return;

    // Bounce the ball off the box like a floor/wall, reducing energy by restitution
    const circleVelocityAlongNormal =
        circle.velocityX * normalX +
        circle.velocityY * normalY;

    if (circleVelocityAlongNormal < 0) {
        circle.velocityX -=
            (1 + restitution) *
            circleVelocityAlongNormal *
            normalX;

        circle.velocityY -=
            (1 + restitution) *
            circleVelocityAlongNormal *
            normalY;
    }
};

// UPDATE OBJECT

const updateObject = (object, dt) => {

    // Gravity
    object.velocityY += gravity * dt;

    // Integration
    object.x += object.velocityX * dt;
    object.y += object.velocityY * dt;

    // ----------------------------------------------
    // BOX
    // ----------------------------------------------

    if (object.type === 'box') {

        // Floor
        if (object.y + object.height > floorY) {

            object.y = floorY - object.height;

            if (object.velocityY > 0) {
                object.velocityY *= -restitution;
            }

            if (Math.abs(object.velocityY) < 10) {
                object.velocityY = 0;
            }
        }

        // Left wall
        if (object.x < 0) {
            object.x = 0;
            object.velocityX *= -restitution;
        }

        // Right wall
        if (object.x + object.width > w) {
            object.x = w - object.width;
            object.velocityX *= -restitution;
        }
    }

    // ----------------------------------------------
    // CIRCLE
    // ----------------------------------------------

    if (object.type === 'circle') {

        // Floor
        if (object.y + object.radius > floorY) {

            object.y = floorY - object.radius;

            if (object.velocityY > 0) {
                object.velocityY *= -restitution;
            }

            if (Math.abs(object.velocityY) < 10) {
                object.velocityY = 0;
            }
        }

        // Left wall
        if (object.x - object.radius < 0) {

            object.x = object.radius;

            object.velocityX *= -restitution;
        }

        // Right wall
        if (object.x + object.radius > w) {

            object.x = w - object.radius;

            object.velocityX *= -restitution;
        }
    }
};

// DRAW

const drawObject = (object) => {

    ctx.strokeStyle = '#ffff';

    if (object.type === 'box') {

        ctx.strokeRect(
            object.x,
            object.y,
            object.width,
            object.height
        );

    } else if (object.type === 'circle') {

        ctx.beginPath();

        ctx.arc(
            object.x,
            object.y,
            object.radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
};

// GAME LOOP

let lastTime = performance.now();

const game = (time) => {

    requestAnimationFrame(game);

    const dt = Math.min(
        (time - lastTime) / 1000,
        0.02
    );

    lastTime = time;

    // Update physics
    for (const object of objects) {
        updateObject(object, dt);
    }

    // Collision detection
    for (let i = 0; i < objects.length; i++) {

        for (let j = i + 1; j < objects.length; j++) {

            const a = objects[i];
            const b = objects[j];

            // Box / Box
            if (
                a.type === 'box' &&
                b.type === 'box'
            ) {
                resolveBoxCollision(a, b);
            }

            // Circle / Circle
            else if (
                a.type === 'circle' &&
                b.type === 'circle'
            ) {
                resolveCircleCircleCollision(a, b);
            }

            // Circle / Box
            else if (
                a.type === 'circle' &&
                b.type === 'box'
            ) {
                resolveCircleBoxCollision(a, b);
            }

            // Box / Circle
            else if (
                a.type === 'box' &&
                b.type === 'circle'
            ) {
                resolveCircleBoxCollision(b, a);
            }
        }
    }

    // Clear screen
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, floorY, w, 2);

    // Objects
    for (const object of objects) {
        drawObject(object);
    }
};

requestAnimationFrame(game);

