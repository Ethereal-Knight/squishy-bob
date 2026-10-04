import { drawPlatform, drawMovingPlatform } from "./platform.js";
import { drawGlitchEnemy } from "./enemy.js";
import { drawSquishyBob } from "./player.js";

export function drawWorld(ctx, state) {
    const { gameState, camera, goal } = state;
    ctx.save();
    if (gameState === "CAMPAIGN") {
        ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    }
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = -500; x < 2500; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, -500); ctx.lineTo(x, 2000); ctx.stroke();
    }
    for (let y = -500; y < 2000; y += 40) {
        ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(2500, y); ctx.stroke();
    }
    for (let p of state.platforms) drawPlatform(ctx, p);
    for (let mp of state.movingPlatforms) drawMovingPlatform(ctx, mp);
    let offset = Math.sin(Date.now() / 150) * 3;
    for (let l of state.lavas) {
        ctx.fillStyle = "#ff0055";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 12;
        ctx.fillRect(l.x, l.y + offset, l.w, l.h - offset);
        ctx.shadowBlur = 0;
    }
    for (let e of state.enemies) drawGlitchEnemy(ctx, e);
    for (let eb of state.energyBits) {
        ctx.fillStyle = "#ffe600";
        ctx.shadowColor = "#ffe600";
        ctx.shadowBlur = 10;
        ctx.fillRect(eb.x, eb.y, eb.w, eb.h);
        ctx.shadowBlur = 0;
    }
    if (gameState === "CAMPAIGN") {
        ctx.fillStyle = "#ff00ff";
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 15;
        ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
        ctx.shadowBlur = 0;
    }
    if (gameState === "CAMPAIGN" || gameState === "ENDLESS") {
        drawSquishyBob(ctx, state.player);
    }
    for (let pt of state.particles) {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();
}
