import { overlaps } from "./collisions.js";

export function movePatrol(patrol) {
    patrol.x += patrol.vx;
    patrol.y += patrol.vy;
    if (patrol.vx > 0 && patrol.x >= patrol.maxX) patrol.vx *= -1;
    if (patrol.vx < 0 && patrol.x <= patrol.minX) patrol.vx *= -1;
    if (patrol.vy > 0 && patrol.y >= patrol.maxY) patrol.vy *= -1;
    if (patrol.vy < 0 && patrol.y <= patrol.minY) patrol.vy *= -1;
}

export function updateMovingPlatforms(state) {
    const { player } = state;
    for (let mp of state.movingPlatforms) {
        movePatrol(mp);
        if (player.grounded && player.standingOn === mp) {
            player.x += mp.vx;
            player.y += mp.vy;
        }
    }
}

export function updateEnemies(state, onDeath) {
    for (let e of state.enemies) {
        movePatrol(e);
        if (overlaps(state.player, e)) {
            onDeath();
            return true;
        }
    }
    return false;
}
