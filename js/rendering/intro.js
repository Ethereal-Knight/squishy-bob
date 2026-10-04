import { introMessages, introMaxTimer } from "../state.js";

export function drawIntro(ctx, canvas, state) {
    ctx.fillStyle = "#03030b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let scanY = (state.introTimer * 8) % canvas.height;
    ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(canvas.width, scanY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 0, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 18px 'Courier New', monospace";
    ctx.textAlign = "left";
    for (let i = 0; i <= state.introTextIndex; i++) {
        ctx.fillText(introMessages[i], 100, 150 + (i * 42));
    }
    let progress = Math.min(1, state.introTimer / introMaxTimer);
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 350, 600, 26);
    ctx.fillStyle = "#ff00ff";
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 12;
    ctx.fillRect(104, 354, 592 * progress, 18);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`SYSTEM BOOT SEQUENCE: ${Math.floor(progress * 100)}%`, 400, 410);
}
