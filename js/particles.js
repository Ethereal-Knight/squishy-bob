export function createBurst(particles, count, createParticle) {
    for (let i = 0; i < count; i++) particles.push(createParticle());
}

export function createDeathExplosion(state, x, y) {
    createBurst(state.particles, 30, () => ({
        x: x + state.player.w / 2,
        y: y + state.player.h / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        size: Math.random() * 7 + 3,
        color: Math.random() > 0.5 ? "#00f0ff" : "#ff00ff",
        alpha: 1
    }));
}

export function createJumpBurst(particles, x, y) {
    createBurst(particles, 12, () => ({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 5 + 2,
        color: "#00f0ff",
        alpha: 0.8
    }));
}

export function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) particles.splice(i, 1);
    }
}
