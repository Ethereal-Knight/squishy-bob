export function drawAchievements(ctx, state) {
    const { achievements, stats } = state;
    ctx.fillStyle = "#0ff";
    ctx.textAlign = "center";
    ctx.font = "bold 30px 'Courier New', monospace";
    ctx.shadowColor = "#0ff"; ctx.shadowBlur = 10;
    ctx.fillText("BOB'S TROPHY CABINET", 400, 55);
    ctx.shadowBlur = 0;
    ctx.font = "14px 'Courier New', monospace";
    let startY = 100;
    achievements.forEach((a, i) => {
        let col = i % 2 === 0 ? 260 : 540;
        let row = Math.floor(i / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = a.unlocked ? "#ff00ff" : "#444";
        let prefix = a.unlocked ? "▶ " : "🔒 ";
        ctx.fillText(prefix + a.name, col, startY + (row * 52));
        ctx.fillStyle = a.unlocked ? "#fff" : "#666";
        ctx.fillText(a.desc, col, startY + 18 + (row * 52));
    });
    ctx.fillStyle = "#0ff";
    ctx.fillText(`Deaths: ${stats.deaths} | Best Endless: ${Math.floor(stats.highEndless)}m | Energy Bytes: ${stats.bitsCollected}`, 400, 420);
    ctx.fillStyle = "#ff00ff";
    ctx.fillText("Press SPACE or [M] to Return to Menu", 400, 460);
}

export function drawGameOver(ctx, canvas, state) {
    ctx.fillStyle = "rgba(5, 5, 16, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    if (state.gameState === "CAMPAIGN_WIN") {
        ctx.fillStyle = "#0ff";
        ctx.shadowColor = "#0ff"; ctx.shadowBlur = 15;
        ctx.font = "bold 36px 'Courier New', monospace";
        ctx.fillText("CYBER MAZE CONQUERED!", 400, 210);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText("Bob navigated every maze and escaped system lockdown!", 400, 260);
    } else {
        ctx.fillStyle = "#ff0055";
        ctx.shadowColor = "#ff0055"; ctx.shadowBlur = 15;
        ctx.font = "bold 40px 'Courier New', monospace";
        ctx.fillText("SYSTEM CRASH!", 400, 190);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "18px 'Courier New', monospace";
        ctx.fillText(`Distance Survived: ${Math.floor(state.endlessDistance)}m`, 400, 240);
        ctx.fillText(`Energy Bytes Collected: ${state.stats.bitsCollected}`, 400, 275);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff00ff";
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillText("Press SPACE to Return to Menu", 400, 340);
}
