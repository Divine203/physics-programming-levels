const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 1000;
const restitution = 0.6;

const boxes = [
    {
        x: 300,
        y: 100,
        width: 120,
        height: 80,
        velocityX: 180,
        velocityY: 0,
        angle: 0.2,
        angularVelocity: 0,
        mass: 1
    },
    {
        x: 650,
        y: 150,
        width: 100,
        height: 100,
        velocityX: -100,
        velocityY: 0,
        angle: -0.3,
        angularVelocity: 0,
        mass: 1
    }
];

const floorY = h - 100;

let lastTime = performance.now();

const getMomentOfInertia = (box) => {
    return (
        box.mass *
        (box.width * box.width + box.height * box.height)
    ) / 12;
};

const rotatePoint = (x, y, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
};

const getCorners = (box) => {
    const halfWidth = box.width / 2;
    const halfHeight = box.height / 2;

    const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight }
    ];

    return corners.map(corner => {
        const rotated = rotatePoint(
            corner.x,
            corner.y,
            box.angle
        );

        return {
            x: box.x + box.width / 2 + rotated.x,
            y: box.y + box.height / 2 + rotated.y
        };
    });
};

const getAxes = (corners) => {
    const axes = [];

    for (let i = 0; i < corners.length; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];

        const edgeX = b.x - a.x;
        const edgeY = b.y - a.y;

        const length = Math.sqrt(
            edgeX * edgeX +
            edgeY * edgeY
        );

        axes.push({
            x: -edgeY / length,
            y: edgeX / length
        });
    }

    return axes;
};

const projectCorners = (corners, axis) => {
    let min = Infinity;
    let max = -Infinity;

    for (const corner of corners) {
        const projection =
            corner.x * axis.x +
            corner.y * axis.y;

        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }

    return { min, max };
};

const getCollision = (a, b) => {
    const cornersA = getCorners(a);
    const cornersB = getCorners(b);

    const axes = [
        ...getAxes(cornersA),
        ...getAxes(cornersB)
    ];

    let smallestOverlap = Infinity;
    let collisionNormal = null;

    for (const axis of axes) {
        const projectionA = projectCorners(
            cornersA,
            axis
        );

        const projectionB = projectCorners(
            cornersB,
            axis
        );

        const overlap =
            Math.min(
                projectionA.max,
                projectionB.max
            ) -
            Math.max(
                projectionA.min,
                projectionB.min
            );

        if (overlap <= 0) {
            return null;
        }

        if (overlap < smallestOverlap) {
            smallestOverlap = overlap;
            collisionNormal = axis;
        }
    }

    const centerA = {
        x: a.x + a.width / 2,
        y: a.y + a.height / 2
    };

    const centerB = {
        x: b.x + b.width / 2,
        y: b.y + b.height / 2
    };

    const direction = {
        x: centerB.x - centerA.x,
        y: centerB.y - centerA.y
    };

    if (
        direction.x * collisionNormal.x +
        direction.y * collisionNormal.y < 0
    ) {
        collisionNormal.x *= -1;
        collisionNormal.y *= -1;
    }

    return {
        normal: collisionNormal,
        penetration: smallestOverlap
    };
};

const cross = (a, b) => {
    return a.x * b.y - a.y * b.x;
};

const crossScalar = (s, v) => {
    return {
        x: -s * v.y,
        y: s * v.x
    };
};

const getVelocityAtPoint = (box, r) => {
    const rotationalVelocity = crossScalar(
        box.angularVelocity,
        r
    );

    return {
        x: box.velocityX + rotationalVelocity.x,
        y: box.velocityY + rotationalVelocity.y
    };
};

const resolveCollision = (a, b, collision) => {
    const normal = collision.normal;

    // Move boxes apart
    const totalInverseMass =
        1 / a.mass +
        1 / b.mass;

    const correction =
        collision.penetration /
        totalInverseMass;

    a.x -= normal.x * correction / a.mass;
    a.y -= normal.y * correction / a.mass;

    b.x += normal.x * correction / b.mass;
    b.y += normal.y * correction / b.mass;

    // Use the midpoint of the overlapping region
    // as an approximate contact point
    const cornersA = getCorners(a);
    const cornersB = getCorners(b);

    let contactX = 0;
    let contactY = 0;
    let count = 0;

    for (const point of cornersA) {
        const dx =
            point.x - (b.x + b.width / 2);

        const dy =
            point.y - (b.y + b.height / 2);

        if (
            dx * normal.x +
            dy * normal.y > -collision.penetration
        ) {
            contactX += point.x;
            contactY += point.y;
            count++;
        }
    }

    for (const point of cornersB) {
        const dx =
            point.x - (a.x + a.width / 2);

        const dy =
            point.y - (a.y + a.height / 2);

        if (
            dx * normal.x +
            dy * normal.y < collision.penetration
        ) {
            contactX += point.x;
            contactY += point.y;
            count++;
        }
    }

    if (count === 0) {
        contactX =
            (a.x + a.width / 2 +
                b.x + b.width / 2) / 2;

        contactY =
            (a.y + a.height / 2 +
                b.y + b.height / 2) / 2;
    } else {
        contactX /= count;
        contactY /= count;
    }

    const centerA = {
        x: a.x + a.width / 2,
        y: a.y + a.height / 2
    };

    const centerB = {
        x: b.x + b.width / 2,
        y: b.y + b.height / 2
    };

    const rA = {
        x: contactX - centerA.x,
        y: contactY - centerA.y
    };

    const rB = {
        x: contactX - centerB.x,
        y: contactY - centerB.y
    };

    const velocityA = getVelocityAtPoint(a, rA);
    const velocityB = getVelocityAtPoint(b, rB);

    const relativeVelocity = {
        x: velocityB.x - velocityA.x,
        y: velocityB.y - velocityA.y
    };

    const velocityAlongNormal =
        relativeVelocity.x * normal.x +
        relativeVelocity.y * normal.y;

    if (velocityAlongNormal > 0) return;

    const inertiaA = getMomentOfInertia(a);
    const inertiaB = getMomentOfInertia(b);

    const rACrossN =
        cross(rA, normal);

    const rBCrossN =
        cross(rB, normal);

    const denominator =
        1 / a.mass +
        1 / b.mass +
        (rACrossN * rACrossN) / inertiaA +
        (rBCrossN * rBCrossN) / inertiaB;

    const impulse =
        -(1 + restitution) *
        velocityAlongNormal /
        denominator;

    const impulseX = impulse * normal.x;
    const impulseY = impulse * normal.y;

    // Linear impulse
    a.velocityX -= impulseX / a.mass;
    a.velocityY -= impulseY / a.mass;

    b.velocityX += impulseX / b.mass;
    b.velocityY += impulseY / b.mass;

    // Angular impulse / torque
    a.angularVelocity -=
        cross(rA, {
            x: impulseX,
            y: impulseY
        }) / inertiaA;

    b.angularVelocity +=
        cross(rB, {
            x: impulseX,
            y: impulseY
        }) / inertiaB;
};

const updateBox = (box, dt) => {

    // Gravity
    box.velocityY += gravity * dt;

    // Linear integration
    box.x += box.velocityX * dt;
    box.y += box.velocityY * dt;

    // Angular integration
    box.angle += box.angularVelocity * dt;

    // Floor collision
    const corners = getCorners(box);

    let lowestPoint = -Infinity;

    for (const corner of corners) {
        lowestPoint = Math.max(lowestPoint, corner.y);
    }

    if (lowestPoint > floorY) {

        // Push the entire box out of the floor
        box.y -= lowestPoint - floorY;

        // Bounce
        if (box.velocityY > 0) {
            box.velocityY *= -restitution;
        }

        // Floor friction
        box.velocityX *= 0.96;

        // Kill most of the spin when touching the floor
        box.angularVelocity *= 0.85;

        // If the box is almost settled, make it rest flat
        if (
            Math.abs(box.velocityY) < 25 &&
            Math.abs(box.angularVelocity) < 1.5
        ) {
            box.velocityY = 0;
            box.angularVelocity = 0;

            // Find the nearest multiple of 90 degrees
            const targetAngle =
                Math.round(box.angle / (Math.PI / 2)) *
                (Math.PI / 2);

            // Smoothly rotate toward it
            let angleDifference =
                targetAngle - box.angle;

            // Keep angle difference between -PI and PI
            while (angleDifference > Math.PI) {
                angleDifference -= Math.PI * 2;
            }

            while (angleDifference < -Math.PI) {
                angleDifference += Math.PI * 2;
            }

            box.angle += angleDifference * 0.2;

            // Snap completely when close enough
            if (Math.abs(angleDifference) < 0.01) {
                box.angle = targetAngle;
            }
        }
    }

    if (box.velocityY === 0) {
    box.angularVelocity *= 0.9;

    if (Math.abs(box.angularVelocity) < 0.05) {
        box.angularVelocity = 0;
    }
}
};

const drawBox = (box) => {

    ctx.save();

    ctx.translate(
        box.x + box.width / 2,
        box.y + box.height / 2
    );

    ctx.rotate(box.angle);

    ctx.fillStyle = '#ffff';

    ctx.fillRect(
        -box.width / 2,
        -box.height / 2,
        box.width,
        box.height
    );

    // Center point
    ctx.fillStyle = '#f04140';

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

const game = (time) => {

    requestAnimationFrame(game);

    const dt = Math.min(
        (time - lastTime) / 1000,
        0.02
    );

    lastTime = time;

    // Update
    for (const box of boxes) {
        updateBox(box, dt);
    }

    // Box collisions
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {

            const collision = getCollision(
                boxes[i],
                boxes[j]
            );

            if (collision) {
                resolveCollision(
                    boxes[i],
                    boxes[j],
                    collision
                );
            }
        }
    }

    // Clear
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(
        0,
        floorY,
        w,
        2
    );

    // Draw
    for (const box of boxes) {
        drawBox(box);
    }
};

requestAnimationFrame(game);