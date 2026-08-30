const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

const gravity = 1000;
const restitution = 0.4;
const friction = 0.7;

const boxes = [
    {
        x: 250,
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
        y: 100,
        width: 100,
        height: 100,
        velocityX: -80,
        velocityY: 0,
        angle: -0.3,
        angularVelocity: 0,
        mass: 1
    },
    {
        x: 450,
        y: 0,
        width: 100,
        height: 100,
        velocityX: 0,
        velocityY: 0,
        angle: 0,
        angularVelocity: 0,
        mass: 1
    }
];

const floorY = h - 100;

let lastTime = performance.now();

const getMomentOfInertia = (box) => {
    return (
        box.mass *
        (box.width * box.width +
            box.height * box.height)
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
    const hw = box.width / 2;
    const hh = box.height / 2;

    const corners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ];

    return corners.map(corner => {
        const rotated = rotatePoint(
            corner.x,
            corner.y,
            box.angle
        );

        return {
            x: box.x + hw + rotated.x,
            y: box.y + hh + rotated.y
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

        const length = Math.hypot(edgeX, edgeY);

        axes.push({
            x: -edgeY / length,
            y: edgeX / length
        });
    }

    return axes;
};

const project = (corners, axis) => {
    let min = Infinity;
    let max = -Infinity;

    for (const point of corners) {
        const value =
            point.x * axis.x +
            point.y * axis.y;

        min = Math.min(min, value);
        max = Math.max(max, value);
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
    let normal = null;

    for (const axis of axes) {
        const pA = project(cornersA, axis);
        const pB = project(cornersB, axis);

        const overlap =
            Math.min(pA.max, pB.max) -
            Math.max(pA.min, pB.min);

        if (overlap <= 0) {
            return null;
        }

        if (overlap < smallestOverlap) {
            smallestOverlap = overlap;
            normal = { ...axis };
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
        direction.x * normal.x +
        direction.y * normal.y < 0
    ) {
        normal.x *= -1;
        normal.y *= -1;
    }

    return {
        normal,
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
    const angularVelocity =
        crossScalar(box.angularVelocity, r);

    return {
        x: box.velocityX + angularVelocity.x,
        y: box.velocityY + angularVelocity.y
    };
};

const resolveCollision = (a, b, collision) => {
    const normal = collision.normal;

    // Position correction
    const inverseMassA = 1 / a.mass;
    const inverseMassB = 1 / b.mass;

    const totalInverseMass =
        inverseMassA + inverseMassB;

    const correction =
        collision.penetration /
        totalInverseMass;

    a.x -=
        normal.x *
        correction *
        inverseMassA;

    a.y -=
        normal.y *
        correction *
        inverseMassA;

    b.x +=
        normal.x *
        correction *
        inverseMassB;

    b.y +=
        normal.y *
        correction *
        inverseMassB;

    // Contact point
    const centerA = {
        x: a.x + a.width / 2,
        y: a.y + a.height / 2
    };

    const centerB = {
        x: b.x + b.width / 2,
        y: b.y + b.height / 2
    };

    const contact = {
        x: (centerA.x + centerB.x) / 2,
        y: (centerA.y + centerB.y) / 2
    };

    const rA = {
        x: contact.x - centerA.x,
        y: contact.y - centerA.y
    };

    const rB = {
        x: contact.x - centerB.x,
        y: contact.y - centerB.y
    };

    const velocityA =
        getVelocityAtPoint(a, rA);

    const velocityB =
        getVelocityAtPoint(b, rB);

    const relativeVelocity = {
        x: velocityB.x - velocityA.x,
        y: velocityB.y - velocityA.y
    };

    const velocityAlongNormal =
        relativeVelocity.x * normal.x +
        relativeVelocity.y * normal.y;

    // Already separating
    if (velocityAlongNormal > 0) {
        return;
    }

    const inertiaA = getMomentOfInertia(a);
    const inertiaB = getMomentOfInertia(b);

    const rACrossN = cross(rA, normal);
    const rBCrossN = cross(rB, normal);

    const normalDenominator =
        inverseMassA +
        inverseMassB +
        (rACrossN * rACrossN) / inertiaA +
        (rBCrossN * rBCrossN) / inertiaB;

    // Normal impulse
    const normalImpulse =
        -(1 + restitution) *
        velocityAlongNormal /
        normalDenominator;

    const impulseNormal = {
        x: normal.x * normalImpulse,
        y: normal.y * normalImpulse
    };

    a.velocityX -=
        impulseNormal.x * inverseMassA;

    a.velocityY -=
        impulseNormal.y * inverseMassA;

    b.velocityX +=
        impulseNormal.x * inverseMassB;

    b.velocityY +=
        impulseNormal.y * inverseMassB;

    a.angularVelocity -=
        cross(rA, impulseNormal) /
        inertiaA;

    b.angularVelocity +=
        cross(rB, impulseNormal) /
        inertiaB;

    // -----------------------------------------
    // FRICTION
    // -----------------------------------------

    // Tangent perpendicular to collision normal
    const tangent = {
        x: -normal.y,
        y: normal.x
    };

    // Recalculate velocities after normal impulse
    const newVelocityA =
        getVelocityAtPoint(a, rA);

    const newVelocityB =
        getVelocityAtPoint(b, rB);

    const newRelativeVelocity = {
        x: newVelocityB.x - newVelocityA.x,
        y: newVelocityB.y - newVelocityA.y
    };

    // Velocity along tangent
    const velocityAlongTangent =
        newRelativeVelocity.x * tangent.x +
        newRelativeVelocity.y * tangent.y;

    const rACrossT = cross(rA, tangent);
    const rBCrossT = cross(rB, tangent);

    const tangentDenominator =
        inverseMassA +
        inverseMassB +
        (rACrossT * rACrossT) / inertiaA +
        (rBCrossT * rBCrossT) / inertiaB;

    // Tangential impulse
    let frictionImpulse =
        -velocityAlongTangent /
        tangentDenominator;

    // Coulomb friction
    const maxFriction =
        normalImpulse * friction;

    frictionImpulse = Math.max(
        -maxFriction,
        Math.min(
            frictionImpulse,
            maxFriction
        )
    );

    const impulseTangent = {
        x: tangent.x * frictionImpulse,
        y: tangent.y * frictionImpulse
    };

    // Apply friction
    a.velocityX -=
        impulseTangent.x * inverseMassA;

    a.velocityY -=
        impulseTangent.y * inverseMassA;

    b.velocityX +=
        impulseTangent.x * inverseMassB;

    b.velocityY +=
        impulseTangent.y * inverseMassB;

    // Friction also creates torque
    a.angularVelocity -=
        cross(rA, impulseTangent) /
        inertiaA;

    b.angularVelocity +=
        cross(rB, impulseTangent) /
        inertiaB;
};

const resolveFloor = (box) => {
    const corners = getCorners(box);

    let lowestPoint = -Infinity;

    for (const corner of corners) {
        lowestPoint = Math.max(
            lowestPoint,
            corner.y
        );
    }

    if (lowestPoint <= floorY) {
        return;
    }

    // Push box out of floor
    box.y -= lowestPoint - floorY;

    const center = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
    };

    // Find the lowest corner as contact point
    let contact = corners[0];

    for (const corner of corners) {
        if (corner.y > contact.y) {
            contact = corner;
        }
    }

    const r = {
        x: contact.x - center.x,
        y: contact.y - center.y
    };

    const normal = {
        x: 0,
        y: -1
    };

    const velocity = getVelocityAtPoint(box, r);

    const velocityAlongNormal =
        velocity.x * normal.x +
        velocity.y * normal.y;

    // Normal impulse
    if (velocityAlongNormal < 0) {

        const inertia =
            getMomentOfInertia(box);

        const rCrossN =
            cross(r, normal);

        const denominator =
            1 / box.mass +
            (rCrossN * rCrossN) / inertia;

        const impulse =
            -(1 + restitution) *
            velocityAlongNormal /
            denominator;

        const impulseVector = {
            x: normal.x * impulse,
            y: normal.y * impulse
        };

        box.velocityX +=
            impulseVector.x / box.mass;

        box.velocityY +=
            impulseVector.y / box.mass;

        box.angularVelocity +=
            cross(r, impulseVector) /
            inertia;

        // FLOOR FRICTION

        const tangent = {
            x: 1,
            y: 0
        };

        const newVelocity =
            getVelocityAtPoint(box, r);

        const tangentVelocity =
            newVelocity.x;

        const rCrossT =
            cross(r, tangent);

        const tangentDenominator =
            1 / box.mass +
            (rCrossT * rCrossT) / inertia;

        let frictionImpulse =
            -tangentVelocity /
            tangentDenominator;

        const maxFriction =
            impulse * friction;

        frictionImpulse = Math.max(
            -maxFriction,
            Math.min(
                frictionImpulse,
                maxFriction
            )
        );

        const frictionVector = {
            x: frictionImpulse,
            y: 0
        };

        box.velocityX +=
            frictionVector.x / box.mass;

        box.angularVelocity +=
            cross(r, frictionVector) /
            inertia;
    }

    // Strong friction when resting
    if (Math.abs(box.velocityY) < 20) {
        box.velocityY = 0;

        box.velocityX *= 0.92;
        box.angularVelocity *= 0.9;
    }

    // Settle upright
    if (
        Math.abs(box.velocityX) < 3 &&
        Math.abs(box.velocityY) < 3 &&
        Math.abs(box.angularVelocity) < 0.15
    ) {
        box.velocityX = 0;
        box.velocityY = 0;
        box.angularVelocity = 0;

        const targetAngle =
            Math.round(
                box.angle / (Math.PI / 2)
            ) *
            (Math.PI / 2);

        let difference =
            targetAngle - box.angle;

        while (difference > Math.PI) {
            difference -= Math.PI * 2;
        }

        while (difference < -Math.PI) {
            difference += Math.PI * 2;
        }

        box.angle += difference * 0.2;

        if (Math.abs(difference) < 0.01) {
            box.angle = targetAngle;
        }
    }
};

const updateBox = (box, dt) => {

    // Gravity
    box.velocityY += gravity * dt;

    // Integration
    box.x += box.velocityX * dt;
    box.y += box.velocityY * dt;

    // Rotation
    box.angle += box.angularVelocity * dt;

    // Floor
    resolveFloor(box);

    // Walls
    if (box.x < 0) {
        box.x = 0;
        box.velocityX *= -restitution;
    }

    if (box.x + box.width > w) {
        box.x = w - box.width;
        box.velocityX *= -restitution;
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

    ctx.restore();
};

const game = (time) => {

    requestAnimationFrame(game);

    const dt = Math.min(
        (time - lastTime) / 1000,
        0.02
    );

    lastTime = time;

    // Update boxes
    for (const box of boxes) {
        updateBox(box, dt);
    }

    // Box collisions
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {

            const collision =
                getCollision(
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