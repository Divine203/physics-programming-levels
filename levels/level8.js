const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

// Cloth settings

const cols = 30;
const rows = 18;
const spacing = 20;

let gravity = 0.5;
let friction = 0.99;
let iterations = 5;
let windStrength = 0;
let windEnabled = false;

const clothWidth = (cols - 1) * spacing;
const startX = (w - clothWidth) / 2;
const startY = 80;

// State

const particles = [];
const constraints = [];
let dragParticle = null;
let pointer = { x: 0, y: 0 };

const gravityInput = document.querySelector('#gravity');
const frictionInput = document.querySelector('#friction');
const iterationsInput = document.querySelector('#iterations');
const windInput = document.querySelector('#wind');
const windToggle = document.querySelector('#windToggle');
const resetButton = document.querySelector('#reset');
const gravityValue = document.querySelector('#gravityValue');
const frictionValue = document.querySelector('#frictionValue');
const iterationsValue = document.querySelector('#iterationsValue');
const windValue = document.querySelector('#windValue');

// Particle

class Particle {
    constructor(x, y, pinned = false) {
        this.x = x;
        this.y = y;

        this.oldX = x;
        this.oldY = y;

        this.pinned = pinned;
    }

    update() {
        if (this.pinned || this === dragParticle) return;

        let vx = (this.x - this.oldX) * friction;
        let vy = (this.y - this.oldY) * friction;

        if (windEnabled) {
            vx += windStrength;
        }

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += vx;
        this.y += vy;
        this.y += gravity;

        if (this.y > h - 20) {
            this.y = h - 20;
            this.oldY = this.y;
        }

        if (this.x < 20) {
            this.x = 20;
            this.oldX = this.x;
        }

        if (this.x > w - 20) {
            this.x = w - 20;
            this.oldX = this.x;
        }
    }
}

// Constraint

class Constraint {
    constructor(a, b, length) {
        this.a = a;
        this.b = b;
        this.length = length;
    }

    solve() {
        const dx = this.b.x - this.a.x;
        const dy = this.b.y - this.a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        const difference = this.length - distance;
        const percent = difference / distance / 2;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        if (!this.a.pinned) {
            this.a.x -= offsetX;
            this.a.y -= offsetY;
        }

        if (!this.b.pinned) {
            this.b.x += offsetX;
            this.b.y += offsetY;
        }
    }
}

// Cloth creation

const createCloth = () => {
    particles.length = 0;
    constraints.length = 0;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const px = startX + x * spacing;
            const py = startY + y * spacing;
            const pinned = y === 0;
            particles.push(new Particle(px, py, pinned));
        }
    }

    const getParticle = (x, y) => particles[y * cols + x];

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const p = getParticle(x, y);

            if (x < cols - 1) {
                constraints.push(new Constraint(p, getParticle(x + 1, y), spacing));
            }

            if (y < rows - 1) {
                constraints.push(new Constraint(p, getParticle(x, y + 1), spacing));
            }
        }
    }

    const diagonalLength = Math.sqrt(spacing * spacing + spacing * spacing);

    for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
            constraints.push(new Constraint(getParticle(x, y), getParticle(x + 1, y + 1), diagonalLength));
            constraints.push(new Constraint(getParticle(x + 1, y), getParticle(x, y + 1), diagonalLength));
        }
    }
};

const getParticle = (x, y) => particles[y * cols + x];

const getClosestParticle = (x, y) => {
    let closest = null;
    let minDist = Infinity;

    for (const particle of particles) {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const dist = dx * dx + dy * dy;

        if (dist < minDist && dist < 30 * 30) {
            minDist = dist;
            closest = particle;
        }
    }

    return closest;
};

const resetCloth = () => {
    createCloth();
    dragParticle = null;
};

// Drawing helpers

const getStretchColor = (stretch) => {
    if (stretch > 1.02) return '#f04140';
    if (stretch < 0.98) return '#0679eb';
    return '#adadad';
};

const draw = () => {
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, h - 20, w, 20);

    ctx.fillStyle = '#212121';
    for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
            const p0 = getParticle(x, y);
            const p1 = getParticle(x + 1, y);
            const p2 = getParticle(x, y + 1);
            const p3 = getParticle(x + 1, y + 1);

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.fill();
        }
    }

    ctx.lineWidth = 1;
    for (const constraint of constraints) {
        const dx = constraint.b.x - constraint.a.x;
        const dy = constraint.b.y - constraint.a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const stretch = distance / constraint.length;

        ctx.strokeStyle = getStretchColor(stretch);
        ctx.beginPath();
        ctx.moveTo(constraint.a.x, constraint.a.y);
        ctx.lineTo(constraint.b.x, constraint.b.y);
        ctx.stroke();
    }

    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.pinned ? 3.6 : 2.4, 0, Math.PI * 2);
        ctx.fillStyle = particle.pinned ? '#b78024' : '#ffff';
        ctx.fill();
    }

    if (dragParticle) {
        ctx.beginPath();
        ctx.arc(dragParticle.x, dragParticle.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};

// Update

const update = () => {
    for (const particle of particles) {
        particle.update();
    }

    for (let i = 0; i < iterations; i++) {
        for (const constraint of constraints) {
            constraint.solve();
        }
    }
};

// Input

const pointerRect = () => c.getBoundingClientRect();

c.addEventListener('pointerdown', (event) => {
    const rect = pointerRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    dragParticle = getClosestParticle(pointer.x, pointer.y);

    if (dragParticle) {
        dragParticle.oldX = dragParticle.x;
        dragParticle.oldY = dragParticle.y;
    }
});

c.addEventListener('pointermove', (event) => {
    const rect = pointerRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;

    if (dragParticle) {
        dragParticle.x = pointer.x;
        dragParticle.y = pointer.y;
        dragParticle.oldX = pointer.x;
        dragParticle.oldY = pointer.y;
    }
});

window.addEventListener('pointerup', () => {
    dragParticle = null;
});

gravityInput.addEventListener('input', (event) => {
    gravity = parseFloat(event.target.value);
    gravityValue.textContent = gravity.toFixed(2);
});

frictionInput.addEventListener('input', (event) => {
    friction = parseFloat(event.target.value);
    frictionValue.textContent = friction.toFixed(3);
});

iterationsInput.addEventListener('input', (event) => {
    iterations = parseInt(event.target.value, 10);
    iterationsValue.textContent = iterations.toString();
});

windInput.addEventListener('input', (event) => {
    windStrength = parseFloat(event.target.value);
    windValue.textContent = windStrength.toFixed(2);
});

windToggle.addEventListener('change', (event) => {
    windEnabled = event.target.checked;
});

resetButton.addEventListener('click', resetCloth);

// Game loop

createCloth();

game();

function game() {
    requestAnimationFrame(game);
    update();
    draw();
}
