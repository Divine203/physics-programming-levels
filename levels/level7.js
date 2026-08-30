const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

// Physics settings
const gravity = 0.5;
const friction = 0.99;

// Higher = tighter connections
const constraintStrength = 0.8;

// Higher = more accurate/tighter constraints
const iterations = 22;


// POINT

class Point {
    constructor(x, y, radius = 10) {
        this.x = x;
        this.y = y;

        this.oldX = x;
        this.oldY = y;

        this.radius = radius;
    }

    update() {
        const vx = (this.x - this.oldX) * friction;
        const vy = (this.y - this.oldY) * friction;

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += vx;
        this.y += vy + gravity;
    }
}


// STICK / CONSTRAINT

class Stick {
    constructor(a, b, length = null) {
        this.a = a;
        this.b = b;

        this.length = length ?? Math.hypot(
            b.x - a.x,
            b.y - a.y
        );
    }

    solve() {
        const dx = this.b.x - this.a.x;
        const dy = this.b.y - this.a.y;

        const distance = Math.hypot(dx, dy);

        if (distance === 0) return;

        const difference = this.length - distance;

        const percent =
            (difference / distance / 2) *
            constraintStrength;

        const offsetX = dx * percent;
        const offsetY = dy * percent;

        this.a.x -= offsetX;
        this.a.y -= offsetY;

        this.b.x += offsetX;
        this.b.y += offsetY;
    }

    draw() {
        ctx.beginPath();

        ctx.moveTo(this.a.x, this.a.y);
        ctx.lineTo(this.b.x, this.b.y);

        ctx.strokeStyle = '#ffff';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';

        ctx.stroke();
    }
}


// BODY

// Head
const head = new Point(500, 150, 28);

// Neck
const neck = new Point(500, 185);

// Shoulders
const leftShoulder = new Point(470, 195);
const rightShoulder = new Point(530, 195);

// Arms
const leftElbow = new Point(430, 245);
const rightElbow = new Point(570, 245);

const leftHand = new Point(410, 300);
const rightHand = new Point(590, 300);

// Torso
const chest = new Point(500, 230);
const waist = new Point(500, 290);

// Hips
const leftHip = new Point(475, 295);
const rightHip = new Point(525, 295);

// Legs
const leftKnee = new Point(460, 380);
const rightKnee = new Point(540, 380);

const leftFoot = new Point(445, 470);
const rightFoot = new Point(555, 470);


// ALL POINTS

const points = [
    head,
    neck,

    leftShoulder,
    rightShoulder,

    leftElbow,
    rightElbow,

    leftHand,
    rightHand,

    chest,
    waist,

    leftHip,
    rightHip,

    leftKnee,
    rightKnee,

    leftFoot,
    rightFoot
];


// CONSTRAINTS

const sticks = [

    // Head
    new Stick(head, neck),

    // Spine
    new Stick(neck, chest),
    new Stick(chest, waist),

    // Shoulders
    new Stick(leftShoulder, rightShoulder),

    new Stick(leftShoulder, chest),
    new Stick(rightShoulder, chest),

    // Left arm
    new Stick(leftShoulder, leftElbow),
    new Stick(leftElbow, leftHand),

    // Right arm
    new Stick(rightShoulder, rightElbow),
    new Stick(rightElbow, rightHand),

    // Hips
    new Stick(leftHip, rightHip),

    new Stick(leftHip, waist),
    new Stick(rightHip, waist),

    // Left leg
    new Stick(leftHip, leftKnee),
    new Stick(leftKnee, leftFoot),

    // Right leg
    new Stick(rightHip, rightKnee),
    new Stick(rightKnee, rightFoot),

    // Torso sides
    new Stick(leftShoulder, leftHip),
    new Stick(rightShoulder, rightHip)
];


// COLLISIONS

const solveCollisions = () => {

    for (const p of points) {

        // Ground
        if (p.y + p.radius > h - 20) {

            p.y = h - 20 - p.radius;

            const vx = p.x - p.oldX;
            const vy = p.y - p.oldY;

            p.oldX = p.x - vx * 0.8;
            p.oldY = p.y + vy * 0.3;
        }

        // Left wall
        if (p.x - p.radius < 20) {
            p.x = 20 + p.radius;
        }

        // Right wall
        if (p.x + p.radius > w - 20) {
            p.x = w - 20 - p.radius;
        }
    }
};


// DRAW POINT

const drawPoint = (p) => {

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        p.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = '#ffff';

    ctx.fill();
};


// DRAW GROUND

const drawGround = () => {

    ctx.fillStyle = '#212121';

    ctx.fillRect(
        0,
        h - 20,
        w,
        20
    );
};


// DRAW HEAD

const drawHead = () => {

    ctx.beginPath();

    ctx.arc(
        head.x,
        head.y,
        head.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = '#131313';
    ctx.fill();

    ctx.strokeStyle = '#ffff';
    ctx.lineWidth = 5;

    ctx.stroke();
};


// GAME LOOP

const game = () => {

    requestAnimationFrame(game);

    // Clear screen
    ctx.fillStyle = '#131313';

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    // Update physics
    for (const p of points) {
        p.update();
    }


    // Solve constraints multiple times
    for (let i = 0; i < iterations; i++) {

        for (const stick of sticks) {
            stick.solve();
        }

        solveCollisions();
    }


    // Draw
    drawGround();


    for (const stick of sticks) {
        stick.draw();
    }


    for (const p of points) {
        drawPoint(p);
    }


    drawHead();
};


// Start
game();