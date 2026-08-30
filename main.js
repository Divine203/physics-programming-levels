const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const w = 1000;
const h = 600;

c.width = w;
c.height = h;

ctx.fillStyle = '#131313';
ctx.fillRect(0, 0, c.width, c.height);


// ---------------------------
// Soft Body
// ---------------------------
const points = [];
const springs = [];

const cols = 10;
const rows = 6;

const spacing = 35;

const startX = 350;
const startY = 100;

const gravity = 0.35;
const damping = 0.98;
const stiffness = 0.15;


// Create particles
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

        points.push({
            x: startX + x * spacing,
            y: startY + y * spacing,

            oldX: startX + x * spacing,
            oldY: startY + y * spacing,

            pinned: false
        });

    }
}


// Create springs between neighboring particles
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

        const i = y * cols + x;

        // Horizontal
        if (x < cols - 1) {
            springs.push({
                a: i,
                b: i + 1,
                length: spacing
            });
        }

        // Vertical
        if (y < rows - 1) {
            springs.push({
                a: i,
                b: i + cols,
                length: spacing
            });
        }

        // Diagonal
        if (x < cols - 1 && y < rows - 1) {
            springs.push({
                a: i,
                b: i + cols + 1,
                length: Math.sqrt(spacing * spacing * 2)
            });

            springs.push({
                a: i + 1,
                b: i + cols,
                length: Math.sqrt(spacing * spacing * 2)
            });
        }
    }
}




// =============================
// Physics
// =============================

function update() {

    // Verlet integration
    for (const p of points) {

        if (p.pinned)
            continue;

        const vx = (p.x - p.oldX) * damping;
        const vy = (p.y - p.oldY) * damping;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx;
        p.y += vy;

        p.y += gravity;
    }


    // Spring constraints
    for (let iteration = 0; iteration < 5; iteration++) {

        for (const spring of springs) {

            const a = points[spring.a];
            const b = points[spring.b];

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0)
                continue;

            const difference =
                (distance - spring.length) / distance;

            const force = difference * stiffness;

            const offsetX = dx * force;
            const offsetY = dy * force;

            if (!a.pinned) {
                a.x += offsetX * 0.5;
                a.y += offsetY * 0.5;
            }

            if (!b.pinned) {
                b.x -= offsetX * 0.5;
                b.y -= offsetY * 0.5;
            }
        }
    }


    // Floor collision
    for (const p of points) {

        if (p.y > h - 30) {

            p.y = h - 30;

            const velocity = p.y - p.oldY;

            p.oldY = p.y + velocity * 0.3;
        }
    }
}


// =============================
// Drawing
// =============================

function draw() {

    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, h);


    // Floor
    ctx.fillStyle = '#3f3f3f';
    ctx.fillRect(0, h - 20, w, 20);


    // Draw springs
    ctx.strokeStyle = '#adadad';
    ctx.lineWidth = 2;

    for (const spring of springs) {

        const a = points[spring.a];
        const b = points[spring.b];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }


    // Fill soft body
    ctx.beginPath();

    for (let x = 0; x < cols; x++) {

        const p = points[x];

        if (x === 0)
            ctx.moveTo(p.x, p.y);
        else
            ctx.lineTo(p.x, p.y);
    }

    for (let y = 1; y < rows; y++) {

        const p = points[y * cols + cols - 1];

        ctx.lineTo(p.x, p.y);
    }

    for (let x = cols - 2; x >= 0; x--) {

        const p = points[(rows - 1) * cols + x];

        ctx.lineTo(p.x, p.y);
    }

    for (let y = rows - 2; y > 0; y--) {

        const p = points[y * cols];

        ctx.lineTo(p.x, p.y);
    }

    ctx.closePath();

    ctx.fillStyle = '#0679eb';
    ctx.fill();


    // Draw particles
    ctx.fillStyle = '#ffff';

    for (const p of points) {

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}


// =============================
// Interaction
// =============================

let mouse = {
    x: 0,
    y: 0,
    down: false
};

c.addEventListener('mousemove', e => {

    const rect = c.getBoundingClientRect();

    mouse.x = (e.clientX - rect.left) * (w / rect.width);
    mouse.y = (e.clientY - rect.top) * (h / rect.height);

    if (!mouse.down)
        return;

    let closest = null;
    let closestDistance = 80;

    for (const p of points) {

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = p;
        }
    }

    if (closest && !closest.pinned) {

        closest.x = mouse.x;
        closest.y = mouse.y;
    }
});

c.addEventListener('mousedown', () => {
    mouse.down = true;
});

c.addEventListener('mouseup', () => {
    mouse.down = false;
});

c.addEventListener('mouseleave', () => {
    mouse.down = false;
});


// =============================
// Game Loop
// =============================

const game = () => {

    requestAnimationFrame(game);

    update();
    draw();
};

game();