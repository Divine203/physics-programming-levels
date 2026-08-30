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

const head = new Point(500, 150, 28);
const neck = new Point(500, 185);

const leftShoulder = new Point(470, 195);
const rightShoulder = new Point(530, 195);

const leftElbow = new Point(430, 245);
const rightElbow = new Point(570, 245);

const leftHand = new Point(410, 300);
const rightHand = new Point(590, 300);

const chest = new Point(500, 230);
const waist = new Point(500, 290);

const leftHip = new Point(475, 295);
const rightHip = new Point(525, 295);

const leftKnee = new Point(460, 380);
const rightKnee = new Point(540, 380);

const leftFoot = new Point(445, 470);
const rightFoot = new Point(555, 470);


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
    new Stick(head, neck),
    new Stick(neck, chest),
    new Stick(chest, waist),
    new Stick(leftShoulder, rightShoulder),
    new Stick(leftShoulder, chest),
    new Stick(rightShoulder, chest),
    new Stick(leftShoulder, leftElbow),
    new Stick(leftElbow, leftHand),
    new Stick(rightShoulder, rightElbow),
    new Stick(rightElbow, rightHand),
    new Stick(leftHip, rightHip),
    new Stick(leftHip, waist),
    new Stick(rightHip, waist),
    new Stick(leftHip, leftKnee),
    new Stick(leftKnee, leftFoot),
    new Stick(rightHip, rightKnee),
    new Stick(rightKnee, rightFoot),
    new Stick(leftShoulder, leftHip),
    new Stick(rightShoulder, rightHip)
];


// CAR

const car = {
    x: -180,
    y: 470,
    width: 170,
    height: 60,
    speed: 35,
    stopped: false
};

const wheels = [
    { offsetX: 35, radius: 22 },
    { offsetX: 135, radius: 22 }
];

const getWheel = wheel => ({
    x: car.x + wheel.offsetX,
    y: car.y + car.height,
    radius: wheel.radius
});

const giveImpactVelocity = point => {
    const velocityX = car.speed * 1.2;

    point.oldX = point.x - velocityX;
    point.oldY = point.y;
};

const resolvePointAgainstRectangle = point => {
    const closestX = Math.max(
        car.x,
        Math.min(point.x, car.x + car.width)
    );
    const closestY = Math.max(
        car.y,
        Math.min(point.y, car.y + car.height)
    );

    let dx = point.x - closestX;
    let dy = point.y - closestY;
    let distance = Math.hypot(dx, dy);

    if (distance >= point.radius) return false;

    if (distance === 0) {
        dx = point.x < car.x + car.width / 2 ? -1 : 1;
        dy = 0;
        distance = 1;
    }

    const normalX = dx / distance;
    const normalY = dy / distance;
    const overlap = point.radius - distance;

    point.x += normalX * overlap;
    point.y += normalY * overlap;

    giveImpactVelocity(point);
    return true;
};

const resolvePointAgainstWheel = (point, wheel) => {
    const dx = point.x - wheel.x;
    const dy = point.y - wheel.y;
    const distance = Math.hypot(dx, dy);
    const radiusSum = point.radius + wheel.radius;

    if (distance >= radiusSum) return false;

    const safeDistance = distance || 0.0001;
    const normalX = dx / safeDistance;
    const normalY = dy / safeDistance;
    const overlap = radiusSum - safeDistance;

    point.x += normalX * overlap;
    point.y += normalY * overlap;

    giveImpactVelocity(point);
    return true;
};

const solveCarCollision = () => {
    if (car.stopped) return;

    let hasContact = false;

    for (const point of points) {
        const bodyContact = resolvePointAgainstRectangle(point);
        hasContact = bodyContact || hasContact;

        for (const wheel of wheels) {
            const wheelContact = resolvePointAgainstWheel(point, getWheel(wheel));
            hasContact = wheelContact || hasContact;
        }
    }

    if (hasContact) {
        car.stopped = true;
        car.speed = 0;
    }
};

const updateCar = () => {
    if (!car.stopped) {
        car.x += car.speed;
    }
};


// COLLISIONS

const solveCollisions = () => {
    for (const point of points) {
        if (point.y + point.radius > h - 20) {
            point.y = h - 20 - point.radius;

            const vx = point.x - point.oldX;
            const vy = point.y - point.oldY;

            point.oldX = point.x - vx * 0.8;
            point.oldY = point.y + vy * 0.3;
        }

        if (point.x - point.radius < 20) {
            point.x = 20 + point.radius;
        }

        if (point.x + point.radius > w - 20) {
            point.x = w - 20 - point.radius;
        }
    }
};


// DRAWING

const drawPoint = point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff';
    ctx.fill();
};

const drawGround = () => {
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, h - 20, w, 20);
};

const drawHead = () => {
    ctx.beginPath();
    ctx.arc(head.x, head.y, head.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#131313';
    ctx.fill();
    ctx.strokeStyle = '#ffff';
    ctx.lineWidth = 5;
    ctx.stroke();
};

const drawCar = () => {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(car.x, car.y, car.width, car.height);

    for (const wheel of wheels) {
        const currentWheel = getWheel(wheel);

        ctx.beginPath();
        ctx.arc(
            currentWheel.x,
            currentWheel.y,
            currentWheel.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#131313';
        ctx.fill();
        ctx.strokeStyle = '#ffff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
};


// GAME LOOP

const game = () => {
    requestAnimationFrame(game);

    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    updateCar();

    for (const point of points) {
        point.update();
    }

    for (let i = 0; i < iterations; i++) {
        for (const stick of sticks) {
            stick.solve();
        }

        solveCollisions();
        solveCarCollision();
    }

    drawGround();

    for (const stick of sticks) {
        stick.draw();
    }

    for (const point of points) {
        drawPoint(point);
    }

    drawHead();
    drawCar();
};


game();
