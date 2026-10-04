export function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y;
}

export function checkCollisionAt(state, x, y, w, h) {
    return state.platforms.concat(state.movingPlatforms).some(p => overlaps({ x, y, w, h }, p));
}

export function checkCollisions(state, axis, onDeath) {
    const { player } = state;
    let allP = state.platforms.concat(state.movingPlatforms);
    for (let p of allP) {
        if (overlaps(player, p)) {
            if (axis === "x") {
                if (player.vx > 0) player.x = p.x - player.w;
                else if (player.vx < 0) player.x = p.x + p.w;
                player.vx = 0;
            } else if (axis === "y") {
                if (player.vy > 0) {
                    player.y = p.y - player.h;
                    player.grounded = true;
                    player.standingOn = p;
                    player.jumpsLeft = 2;
                    player.isFlipping = false;
                } else if (player.vy < 0) {
                    player.y = p.y + p.h;
                }
                player.vy = 0;
            }
        }
    }
    for (let l of state.lavas) {
        if (overlaps(player, l)) {
            onDeath();
            return;
        }
    }
}
