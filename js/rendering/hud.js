import { levels } from "../levels/index.js";

export function drawHud(ctx, state) {
    if (state.gameState === "CAMPAIGN") {
        ctx.fillStyle = "rgba(0, 255, 255, 0.85)";
        ctx.textAlign = "center";
        ctx.font = "bold 24px 'Courier New', monospace";
        ctx.fillText(levels[state.currentLevel].t, 400, 40);
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(levels[state.currentLevel].m, 400, 68);
    } else if (state.gameState === "ENDLESS") {
        ctx.fillStyle = "rgba(255, 0, 255, 0.85)";
        ctx.textAlign = "center";
        ctx.font = "bold 32px 'Courier New', monospace";
        ctx.fillText(Math.floor(state.endlessDistance) + "m", 400, 50);
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillStyle = "#ffe600";
        ctx.fillText("BYTES: " + state.stats.bitsCollected, 400, 78);
    }
}

export function drawToasts(ctx, toasts) {
    toasts.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
        let toastX = 400 - 170;
        let toastY = 20 + t.animY;
        ctx.fillStyle = "rgba(10, 10, 22, 0.95)";
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 10;
        ctx.fillRect(toastX, toastY, 340, 40);
        ctx.strokeRect(toastX, toastY, 340, 40);
        ctx.fillStyle = "#ff00ff";
        ctx.font = "bold 14px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        ctx.fillText(t.text, 400, toastY + 25);
        ctx.restore();
    });
}
