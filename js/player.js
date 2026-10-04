import { checkCollisionAt, checkCollisions } from "./collisions.js";
import { unlockAchievement } from "./achievements.js";
import { createJumpBurst } from "./particles.js";
import { updatePlayerAppearance } from "./player-appearance.js";

export function resetPlayer(player) {
    player.vx = 0;
    player.vy = 0;
    player.w = player.baseW;
    player.h = player.baseH;
    player.renderW = player.baseW;
    player.renderH = player.baseH;
    player.jumpsLeft = 2;
    player.isSquishingFlat = false;
    player.isFlipping = false;
    player.flipAngle = 0;
    player.coyoteTimer = 0;
    player.standingOn = null;
}

function updateSquish(state) {
    const { player, keys, stats } = state;
    let wantSquish = keys.s || keys.ArrowDown;
    if (wantSquish) {
        if (!player.isSquishingFlat) {
            player.isSquishingFlat = true;
            player.h = 13;
            player.w = 36;
            player.y += 13;
            stats.flatSquishes++;
            if (stats.flatSquishes >= 20) unlockAchievement(state, "pancake");
        }
    } else if (player.isSquishingFlat) {
        let testY = player.y - 13;
        if (!checkCollisionAt(state, player.x, testY, player.baseW, player.baseH)) {
            player.isSquishingFlat = false;
            player.w = player.baseW;
            player.h = player.baseH;
            player.y = testY;
        }
    }
}

function updateJump(state) {
    const { player, keys, stats } = state;
    if (player.grounded) {
        player.coyoteTimer = 8;
    } else {
        player.coyoteTimer--;
        player.standingOn = null;
    }
    let jumpRequested = (keys.space && !state.spaceWasPressed) ||
        ((keys.w || keys.ArrowUp) && !state.upWasPressed);
    state.spaceWasPressed = keys.space;
    state.upWasPressed = keys.w || keys.ArrowUp;
    if (jumpRequested) {
        if (player.grounded || player.coyoteTimer > 0) {
            player.vy = -player.jumpPower;
            player.grounded = false;
            player.standingOn = null;
            player.coyoteTimer = 0;
            player.jumpsLeft = 1;
        } else if (player.jumpsLeft > 0) {
            player.vy = -player.jumpPower * 0.95;
            player.jumpsLeft = 0;
            player.isFlipping = true;
            player.flipAngle = 0;
            stats.flips++;
            if (stats.flips >= 20) unlockAchievement(state, "flip");
            createJumpBurst(state.particles, player.x + player.w / 2, player.y + player.h / 2);
        }
    }
}

export function updatePlayer(state, onDeath) {
    const { player, keys } = state;
    if (keys.a || keys.ArrowLeft) player.vx -= 0.9;
    if (keys.d || keys.ArrowRight) player.vx += 0.9;
    player.vx *= player.friction;
    if (player.vx > player.speed) player.vx = player.speed;
    if (player.vx < -player.speed) player.vx = -player.speed;
    updateSquish(state);
    updateJump(state);
    player.vy += player.gravity;
    updatePlayerAppearance(player);
    player.x += player.vx;
    checkCollisions(state, "x", onDeath);
    player.y += player.vy;
    player.grounded = false;
    checkCollisions(state, "y", onDeath);
    if (player.y > 1600 || player.x < -100) onDeath();
}
