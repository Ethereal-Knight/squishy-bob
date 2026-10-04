import { drawIntro } from "./intro.js";
import { drawAchievements, drawGameOver } from "./screens.js";
import { drawWorld } from "./world.js";
import { drawHud, drawToasts } from "./hud.js";

export function draw(ctx, canvas, state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.gameState === "INTRO") {
        drawIntro(ctx, canvas, state);
        return;
    }
    if (state.gameState === "ACHIEVEMENTS") {
        drawAchievements(ctx, state);
        return;
    }
    drawWorld(ctx, state);
    drawHud(ctx, state);
    if (state.gameState === "CAMPAIGN_WIN" || state.gameState === "ENDLESS_OVER") {
        drawGameOver(ctx, canvas, state);
    }
    drawToasts(ctx, state.toasts);
}
